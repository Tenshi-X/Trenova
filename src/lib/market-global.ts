// Market-wide numbers for the dashboard header cards, from free key-less endpoints:
//  - BTC / ETH / USDT dominance and total market cap (CoinGecko /global)
//  - Coinbase BTC-USD spot price, to compute the "Coinbase premium" against the perpetual price
// Everything fails soft: null means "not available", never an invented number.

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export interface GlobalMarket {
  btcDominance: number | null;
  ethDominance: number | null;
  usdtDominance: number | null;
  totalMarketCapUsd: number | null;
  marketCapChange24h: number | null;
}

const COINGECKO_GLOBAL = 'https://api.coingecko.com/api/v3/global';
const COINBASE_BTC = 'https://api.exchange.coinbase.com/products/BTC-USD/ticker';
const GLOBAL_TTL_MS = 5 * 60_000;
const GLOBAL_STALE_MS = 60 * 60_000;

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

async function getJson(url: string, fetcher: Fetcher, timeoutMs: number): Promise<unknown | null> {
  try {
    const response = await fetcher(url, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs), headers: { 'User-Agent': 'TrenovaBot/1.0' } });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

/** CoinGecko GET /global → data.market_cap_percentage.{btc,eth,usdt}, total_market_cap.usd. */
export function parseCoinGeckoGlobal(json: unknown): GlobalMarket | null {
  const data = asObject(asObject(json)?.data);
  const pct = asObject(data?.market_cap_percentage);
  if (!data || !pct) return null;
  const share = (key: string) => { const value = toNumber(pct[key]); return value !== null && value >= 0 && value <= 100 ? value : null; };
  const result: GlobalMarket = {
    btcDominance: share('btc'),
    ethDominance: share('eth'),
    usdtDominance: share('usdt'),
    totalMarketCapUsd: toNumber(asObject(data.total_market_cap)?.usd),
    marketCapChange24h: toNumber(data.market_cap_change_percentage_24h_usd),
  };
  return result.btcDominance === null && result.usdtDominance === null ? null : result;
}

/** Coinbase Exchange GET /products/BTC-USD/ticker → price. */
export function parseCoinbasePrice(json: unknown): number | null {
  const price = toNumber(asObject(json)?.price);
  return price !== null && price > 0 ? price : null;
}

/** Percent difference of the Coinbase spot price over the reference price; null when either is missing or implausible (> 5%, i.e. bad data). */
export function coinbasePremium(coinbasePrice: number | null, referencePrice: number | null): number | null {
  if (coinbasePrice === null || referencePrice === null || referencePrice <= 0) return null;
  const premium = ((coinbasePrice - referencePrice) / referencePrice) * 100;
  return Math.abs(premium) > 5 ? null : premium;
}

let globalCache: { at: number; value: GlobalMarket } | null = null;
let globalInflight: Promise<GlobalMarket | null> | null = null;

export function resetGlobalCache() { globalCache = null; globalInflight = null; }

export async function getGlobalMarket(fetcher: Fetcher = fetch): Promise<GlobalMarket | null> {
  if (globalCache && Date.now() - globalCache.at < GLOBAL_TTL_MS) return globalCache.value;
  if (!globalInflight) {
    globalInflight = (async () => {
      const value = parseCoinGeckoGlobal(await getJson(COINGECKO_GLOBAL, fetcher, 5000));
      if (value) { globalCache = { at: Date.now(), value }; return value; }
      return globalCache && Date.now() - globalCache.at < GLOBAL_STALE_MS ? globalCache.value : null;
    })().finally(() => { globalInflight = null; });
  }
  return globalInflight;
}

export async function getCoinbaseBtcPrice(fetcher: Fetcher = fetch): Promise<number | null> {
  return parseCoinbasePrice(await getJson(COINBASE_BTC, fetcher, 3000));
}
