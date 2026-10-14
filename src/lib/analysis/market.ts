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


// Fallback market data. The analysis was Binance-spot only, so any coin without a Binance spot pair failed, even though
// the coin list itself comes from OKX perpetual swaps. Sources are tried in this order, always converted to Binance's
// row shape so the rest of the pipeline is unchanged: OKX spot, OKX swap (every listed coin has one), Bybit linear/spot.
const OKX_HOSTS = ['https://www.okx.com', 'https://aws.okx.com'];
const OKX_BAR: Record<CandleTimeframe, string> = { '15m': '15m', '30m': '30m', '1h': '1H', '4h': '4H', '1d': '1Dutc', '1w': '1Wutc' };
const BYBIT_HOSTS = ['https://api.bybit.com', 'https://api.bytick.com'];
const BYBIT_INTERVAL: Record<CandleTimeframe, string> = { '15m': '15', '30m': '30', '1h': '60', '4h': '240', '1d': 'D', '1w': 'W' };

interface FallbackSource {
  name: string;
  ticker: () => Promise<Record<string, unknown> | null>;
  candles: (timeframe: CandleTimeframe, limit: number) => Promise<unknown[] | null>;
}

async function okx(path: string): Promise<unknown[] | null> {
  for (const host of OKX_HOSTS) {
    const body = object(await fetchJson(`${host}${path}`, 2500));
    if (body && body.code === '0' && Array.isArray(body.data) && body.data.length) return body.data;
  }
  return null;
}

function okxSource(symbol: string, swap: boolean): FallbackSource {
  const instId = swap ? `${symbol}-USDT-SWAP` : `${symbol}-USDT`;
  return {
    name: swap ? 'okx-swap' : 'okx-spot',
    async ticker() {
      const row = object((await okx(`/api/v5/market/ticker?instId=${instId}`))?.[0]);
      const last = numberOrNull(row?.last); const open = numberOrNull(row?.open24h); const ts = numberOrNull(row?.ts);
      if (!row || !last || !ts) return null;
      const volCcy = numberOrNull(row.volCcy24h);
      // Spot volCcy24h is in USDT; for swaps it is in coins, so convert with the last price.
      return { lastPrice: String(last), closeTime: ts,
        priceChangePercent: open ? String(((last - open) / open) * 100) : null,
        quoteVolume: volCcy === null ? null : String(swap ? volCcy * last : volCcy) };
    },
    async candles(timeframe, limit) {
      const rows = await okx(`/api/v5/market/candles?instId=${instId}&bar=${OKX_BAR[timeframe]}&limit=${limit}`);
      if (!rows) return null;
      const duration = TIMEFRAME_MILLIS[timeframe];
      // Newest first: [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]; keep only closed candles.
      return rows.filter((row): row is unknown[] => Array.isArray(row) && row[8] === '1')
        .map(row => [Number(row[0]), row[1], row[2], row[3], row[4], row[5], Number(row[0]) + duration - 1])
        .sort((a, b) => Number(a[0]) - Number(b[0]));
    },
  };
}

async function bybit(path: string): Promise<{ list: unknown[]; time: number | null } | null> {
  for (const host of BYBIT_HOSTS) {
    const body = object(await fetchJson(`${host}${path}`, 2500));
    const result = object(body?.result);
    if (body && Number(body.retCode) === 0 && result && Array.isArray(result.list) && result.list.length) {
      return { list: result.list, time: numberOrNull(body.time) };
    }
  }
  return null;
}

function bybitSource(symbol: string, category: 'linear' | 'spot'): FallbackSource {
  const pair = `${symbol}USDT`;
  return {
    name: `bybit-${category}`,
    async ticker() {
      const data = await bybit(`/v5/market/tickers?category=${category}&symbol=${pair}`);
      const row = object(data?.list[0]);
      const last = numberOrNull(row?.lastPrice); const change = numberOrNull(row?.price24hPcnt);
      if (!data || !row || !last || !data.time) return null;
      return { lastPrice: String(last), closeTime: data.time,
        priceChangePercent: change === null ? null : String(change * 100), quoteVolume: row.turnover24h ?? null };
    },
    async candles(timeframe, limit) {
      const data = await bybit(`/v5/market/kline?category=${category}&symbol=${pair}&interval=${BYBIT_INTERVAL[timeframe]}&limit=${limit}`);
      if (!data) return null;
      const duration = TIMEFRAME_MILLIS[timeframe];
      // Newest first: [start, o, h, l, c, volume, turnover]; no "closed" flag, so drop the candle still in progress.
      return data.list.filter((row): row is unknown[] => Array.isArray(row) && Number(row[0]) + duration - 1 <= Date.now())
        .map(row => [Number(row[0]), row[1], row[2], row[3], row[4], row[5], Number(row[0]) + duration - 1])
        .sort((a, b) => Number(a[0]) - Number(b[0]));
    },
  };
}

function fallbackSources(symbol: string): FallbackSource[] {
  return [okxSource(symbol, false), okxSource(symbol, true), bybitSource(symbol, 'linear'), bybitSource(symbol, 'spot')];
}

interface SpotData { ticker: unknown; candles: unknown; daily: unknown; weekly: unknown; btc: unknown }

// Checks one source end to end; null when the price is stale, candles have gaps or indicators cannot be computed.
function validateSpot(data: SpotData, timeframe: Timeframe) {
  const ticker = object(data.ticker);
  if (!ticker || !Array.isArray(data.candles)) return null;
  const price = numberOrNull(ticker.lastPrice);
  const asOfMillis = numberOrNull(ticker.closeTime);
  if (!price || !asOfMillis || Date.now() - asOfMillis > 5 * 60_000 || asOfMillis > Date.now() + 60_000) return null;
  const candles = data.candles.map(parseCandle).filter((candle): candle is Candle => candle !== null && candle.closeTime <= Date.now());
  if (!candlesAreFresh(candles, timeframe)) return null;
  const indicators = calculateIndicators(candles);
  if (!indicators) return null;
  return { data, ticker, price, asOfMillis, candles, indicators };
}

function buildConfirmation(raw: unknown, timeframe: CandleTimeframe): TrendConfirmation | null {
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

export async function getTrendConfirmation(symbol: string, timeframe: CandleTimeframe): Promise<TrendConfirmation | null> {
  const primary = buildConfirmation(await spot(`/api/v3/klines?symbol=${symbol}USDT&interval=${timeframe}&limit=60`), timeframe);
  if (primary) return primary;
  const others = await Promise.all(fallbackSources(symbol).map(source => source.candles(timeframe, 61)));
  for (const rows of others) {
    const confirmation = buildConfirmation(rows, timeframe);
    if (confirmation) return confirmation;
  }
  return null;
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
  const fromBinance: SpotData = { ticker: binanceTicker, candles: binanceCandles, daily: binanceDaily, weekly: binanceWeekly, btc: binanceBtc };
  let chosen = validateSpot(fromBinance, timeframe);
  const attempts: SpotData[] = [fromBinance];
  // Binance has no usable spot data (no pair, delisted, stale or unreachable): take the first valid fallback source.
  if (!chosen) {
    const btcSource = okxSource('BTC', false);
    const [btcTicker, ...results] = await Promise.all([btcSource.ticker(), ...fallbackSources(symbol).map(async source => {
      const [ticker, candles, daily, weekly] = await Promise.all([
        source.ticker(), source.candles(timeframe, 61), source.candles('1d', 150), source.candles('1w', 80)]);
      return { ticker, candles, daily, weekly, btc: null } satisfies SpotData;
    })]);
    for (const result of results) {
      attempts.push(result);
      if (!chosen) {
        const valid = validateSpot({ ...result, btc: btcTicker ?? binanceBtc }, timeframe);
        if (valid) chosen = valid;
      }
    }
  }
  if (!chosen) {
    console.warn('Analysis market data unavailable', { symbol, timeframe,
      tickerAvailable: attempts.some(item => !!object(item.ticker)), candlesAvailable: attempts.some(item => Array.isArray(item.candles)) });
    return null;
  }
  const { ticker, price, asOfMillis, candles, indicators } = chosen;
  const rawDaily = chosen.data.daily, rawWeekly = chosen.data.weekly, rawBtc = chosen.data.btc ?? binanceBtc;
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
