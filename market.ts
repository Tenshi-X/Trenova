import { calculateIndicators, candlesAreFresh, parseCandle, withHigherTimeframeLevels, TIMEFRAME_MILLIS, type Candle, type MarketSnapshot, type Timeframe,
  type CandleTimeframe, type TrendConfirmation } from './core';
import { getDerivatives } from '../market-derivatives';

// Binance's dedicated public-data host also works when general API hosts are unreachable.
// Keep the fallback budget below 8 seconds so the single Gemini call fits the route deadline.
const SPOT_HOSTS = ['https://data-api.binance.vision', 'https://api.binance.com', 'https://api-gcp.binance.com'];

async function fetchJson(url: string, timeout = 5000): Promise<unknown | null> {
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(timeout) });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function spot(path: string): Promise<unknown | null> {
  for (const host of SPOT_HOSTS) {
    const data = await fetchJson(`${host}${path}`, 2500);
    if (data) return data;
  }
  return null;
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function numberOrNull(value: unknown): number | null {
  const number = Number(value);
  return value === null || value === undefined || !Number.isFinite(number) ? null : number;
}


// OKX spot as a fallback when Binance has no spot pair for the coin (e.g. LIT) or its hosts are unreachable.
// The shapes are converted to Binance's so the rest of the pipeline is unchanged.
const OKX_HOSTS = ['https://www.okx.com', 'https://aws.okx.com'];
const OKX_BAR: Record<CandleTimeframe, string> = { '15m': '15m', '30m': '30m', '1h': '1H', '4h': '4H', '1d': '1Dutc', '1w': '1Wutc' };

async function okx(path: string): Promise<unknown[] | null> {
  for (const host of OKX_HOSTS) {
    const body = object(await fetchJson(`${host}${path}`, 2500));
    if (body && body.code === '0' && Array.isArray(body.data) && body.data.length) return body.data;
  }
  return null;
}

async function okxTicker(symbol: string): Promise<Record<string, unknown> | null> {
  const row = object((await okx(`/api/v5/market/ticker?instId=${symbol}-USDT`))?.[0]);
  const last = numberOrNull(row?.last); const open = numberOrNull(row?.open24h); const ts = numberOrNull(row?.ts);
  if (!row || !last || !ts) return null;
  return { lastPrice: String(last), closeTime: ts,
    priceChangePercent: open ? String(((last - open) / open) * 100) : null,
    quoteVolume: row.volCcy24h ?? null };
}

async function okxKlines(symbol: string, timeframe: CandleTimeframe, limit: number): Promise<unknown[] | null> {
  const rows = await okx(`/api/v5/market/candles?instId=${symbol}-USDT&bar=${OKX_BAR[timeframe]}&limit=${limit}`);
  if (!rows) return null;
  const duration = TIMEFRAME_MILLIS[timeframe];
  // OKX rows are newest first: [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]; keep only closed candles.
  return rows.filter((row): row is unknown[] => Array.isArray(row) && row[8] === '1')
    .map(row => [Number(row[0]), row[1], row[2], row[3], row[4], row[5], Number(row[0]) + duration - 1])
    .sort((a, b) => Number(a[0]) - Number(b[0]));
}

async function okxSpotFallback(symbol: string, timeframe: Timeframe) {
  const [ticker, candles, daily, weekly, btc] = await Promise.all([
    okxTicker(symbol), okxKlines(symbol, timeframe, 61), okxKlines(symbol, '1d', 150), okxKlines(symbol, '1w', 80), okxTicker('BTC'),
  ]);
  return ticker && candles ? { ticker, candles, daily, weekly, btc } : null;
}

export async function getTrendConfirmation(symbol: string, timeframe: CandleTimeframe): Promise<TrendConfirmation | null> {
  const raw = await spot(`/api/v3/klines?symbol=${symbol}USDT&interval=${timeframe}&limit=60`);
  if (!Array.isArray(raw)) return null;
  const candles = raw.map(parseCandle).filter((item): item is Candle => item !== null && item.closeTime <= Date.now());
  if (!candlesAreFresh(candles, timeframe)) return null;
  const indicators = calculateIndicators(candles);
  if (!indicators) return null;
  const last = candles[candles.length - 1];
  return { timeframe, asOf: new Date(last.closeTime).toISOString(), close: last.close,
    ema20: indicators.ema20, rsi: indicators.rsi,
    trend: last.close > indicators.ema20 && indicators.rsi > 50 ? 'bullish'
      : last.close < indicators.ema20 && indicators.rsi < 50 ? 'bearish' : 'neutral' };
}

export async function getMarketSnapshot(symbol: string, timeframe: Timeframe): Promise<MarketSnapshot | null> {
  const pair = `${symbol}USDT`;
  const [binanceTicker, binanceCandles, binanceBtc, rawFunding, rawOi, rawSentiment, derivatives, binanceDaily, binanceWeekly] = await Promise.all([
    spot(`/api/v3/ticker/24hr?symbol=${pair}`),
    spot(`/api/v3/klines?symbol=${pair}&interval=${timeframe}&limit=60`),
    spot('/api/v3/ticker/24hr?symbol=BTCUSDT'),
    fetchJson(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${pair}`),
    fetchJson(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${pair}`),
    fetchJson('https://api.alternative.me/fng/?limit=1'),
    // Binance futures blocks many server regions; OKX/Bybit/Bitget/Gate/MEXC fill in funding and open interest.
    getDerivatives(fetch).catch(() => null),
    // Daily/weekly candles give support and resistance that more traders actually watch; fail-soft.
    spot(`/api/v3/klines?symbol=${pair}&interval=1d&limit=150`),
    spot(`/api/v3/klines?symbol=${pair}&interval=1w&limit=80`),
  ]);
  let rawTicker = binanceTicker, rawCandles = binanceCandles, rawBtc = binanceBtc, rawDaily = binanceDaily, rawWeekly = binanceWeekly;
  // Binance has no spot pair for some coins (or is unreachable from this region): use OKX spot instead.
  if (!object(rawTicker) || !Array.isArray(rawCandles)) {
    const fallback = await okxSpotFallback(symbol, timeframe);
    if (fallback) {
      rawTicker = fallback.ticker; rawCandles = fallback.candles;
      if (fallback.daily) rawDaily = fallback.daily;
      if (fallback.weekly) rawWeekly = fallback.weekly;
      if (fallback.btc) rawBtc = fallback.btc;
    }
  }
  const ticker = object(rawTicker);
  if (!ticker || !Array.isArray(rawCandles)) {
    console.warn('Analysis market data unavailable', { symbol, timeframe,
      tickerAvailable: !!ticker, candlesAvailable: Array.isArray(rawCandles) });
    return null;
  }
  const price = numberOrNull(ticker.lastPrice);
  const asOfMillis = numberOrNull(ticker.closeTime);
  if (!price || !asOfMillis || Date.now() - asOfMillis > 5 * 60_000 || asOfMillis > Date.now() + 60_000) return null;
  const candles = rawCandles.map(parseCandle).filter((candle): candle is Candle => candle !== null && candle.closeTime <= Date.now());
  if (!candlesAreFresh(candles,timeframe)) return null;
  const indicators = calculateIndicators(candles);
  if (!indicators) return null;
  const closed = (raw: unknown) => Array.isArray(raw)
    ? raw.map(parseCandle).filter((candle): candle is Candle => candle !== null && candle.closeTime <= Date.now()) : [];
  if (indicators.structure) {
    indicators.structure = withHigherTimeframeLevels(indicators.structure, price, indicators.atr, closed(rawDaily), closed(rawWeekly));
  }
  const recentObject = (raw: unknown, field: string, ttl = 300000, seconds = false) => {
    const data = object(raw); const timestamp = numberOrNull(data?.[field]);
    const millis = timestamp === null ? null : timestamp * (seconds ? 1000 : 1);
    return data && millis !== null && Date.now() - millis <= ttl && millis <= Date.now() + 60000 ? data : null;
  };
  const btc = recentObject(rawBtc,'closeTime');
  const funding = recentObject(rawFunding,'time');
  const oi = recentObject(rawOi,'time');
  const sentiment = object(rawSentiment);
  const sentimentArray = sentiment && Array.isArray(sentiment.data) ? sentiment.data : [];
  const sentimentItem = sentimentArray.length ? recentObject(sentimentArray[0],'timestamp',36 * 3600000,true) : null;
  const sentimentValue = numberOrNull(sentimentItem?.value);
  const markPrice = numberOrNull(funding?.markPrice) || price;
  const openInterestUnits = numberOrNull(oi?.openInterest);
  const combined = derivatives?.map.get(symbol) ?? null;
  const derivativesAt = derivatives ? new Date(derivatives.fetchedAt).toISOString() : null;
  // Binance first (unchanged behaviour); otherwise the multi-exchange figures. Funding there is in percent, here it is a decimal.
  const fundingRate = numberOrNull(funding?.lastFundingRate)
    ?? (combined?.fundingRate != null ? combined.fundingRate / 100 : null);
  const openInterestUsd = openInterestUnits !== null ? openInterestUnits * markPrice : (combined?.openInterestUsd ?? null);
  return {
    symbol, timeframe, asOf: new Date(asOfMillis).toISOString(), price,
    change24h: numberOrNull(ticker.priceChangePercent),
    volume24hUsd: numberOrNull(ticker.quoteVolume),
    btcChange24h: numberOrNull(btc?.priceChangePercent),
    fundingRate,
    openInterestUsd,
    fearGreed: sentimentValue,
    sourceTimes: { candles: new Date(candles[candles.length - 1].closeTime).toISOString(),
      btc: btc ? new Date(Number(btc.closeTime)).toISOString() : null,
      funding: funding ? new Date(Number(funding.time)).toISOString() : (fundingRate !== null ? derivativesAt : null),
      openInterest: oi ? new Date(Number(oi.time)).toISOString() : (openInterestUsd !== null ? derivativesAt : null),
      sentiment: sentimentItem ? new Date(Number(sentimentItem.timestamp) * 1000).toISOString() : null },
    ...indicators,
    recentCandles: candles.slice(-24),
  };
}
