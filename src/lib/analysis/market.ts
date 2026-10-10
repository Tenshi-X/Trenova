import { calculateIndicators, candlesAreFresh, parseCandle, type Candle, type MarketSnapshot, type Timeframe } from './core';

const SPOT_HOSTS = ['https://api.binance.com', 'https://api1.binance.com', 'https://api2.binance.com'];

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function spot(path: string): Promise<unknown | null> {
  for (const host of SPOT_HOSTS) {
    const data = await fetchJson(`${host}${path}`);
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

export async function getMarketSnapshot(symbol: string, timeframe: Timeframe): Promise<MarketSnapshot | null> {
  const pair = `${symbol}USDT`;
  const [rawTicker, rawCandles, rawBtc, rawFunding, rawOi, rawSentiment] = await Promise.all([
    spot(`/api/v3/ticker/24hr?symbol=${pair}`),
    spot(`/api/v3/klines?symbol=${pair}&interval=${timeframe}&limit=60`),
    spot('/api/v3/ticker/24hr?symbol=BTCUSDT'),
    fetchJson(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${pair}`),
    fetchJson(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${pair}`),
    fetchJson('https://api.alternative.me/fng/?limit=1'),
  ]);
  const ticker = object(rawTicker);
  if (!ticker || !Array.isArray(rawCandles)) return null;
  const price = numberOrNull(ticker.lastPrice);
  const asOfMillis = numberOrNull(ticker.closeTime);
  if (!price || !asOfMillis || Date.now() - asOfMillis > 5 * 60_000 || asOfMillis > Date.now() + 60_000) return null;
  const candles = rawCandles.map(parseCandle).filter((candle): candle is Candle => candle !== null && candle.closeTime <= Date.now());
  if (!candlesAreFresh(candles,timeframe)) return null;
  const indicators = calculateIndicators(candles);
  if (!indicators) return null;
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
  return {
    symbol, timeframe, asOf: new Date(asOfMillis).toISOString(), price,
    change24h: numberOrNull(ticker.priceChangePercent),
    volume24hUsd: numberOrNull(ticker.quoteVolume),
    btcChange24h: numberOrNull(btc?.priceChangePercent),
    fundingRate: numberOrNull(funding?.lastFundingRate),
    openInterestUsd: openInterestUnits === null ? null : openInterestUnits * markPrice,
    fearGreed: sentimentValue,
    sourceTimes: { candles: new Date(candles[candles.length - 1].closeTime).toISOString(),
      btc: btc ? new Date(Number(btc.closeTime)).toISOString() : null,
      funding: funding ? new Date(Number(funding.time)).toISOString() : null,
      openInterest: oi ? new Date(Number(oi.time)).toISOString() : null,
      sentiment: sentimentItem ? new Date(Number(sentimentItem.timestamp) * 1000).toISOString() : null },
    ...indicators,
    recentCandles: candles.slice(-4),
  };
}
