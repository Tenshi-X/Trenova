// Pure parsers for the free public data behind the macro panel (DefiLlama and Indodax).
// Each one returns null/[] for an unexpected shape, so a changed upstream shows "unavailable" instead of crashing.

export type SeriesPoint = { time: number; value: number };
export type StablecoinSeries = { points: SeriesPoint[]; latest: number; change7dPct: number | null; change30dPct: number | null };
export type IdrPremium = { symbol: string; idrPrice: number; usdtPrice: number; usdtIdr: number; premiumPct: number };

const finite = (value: unknown): number | null => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

function toSeries(points: SeriesPoint[]): StablecoinSeries | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.time - b.time);
  const latest = sorted[sorted.length - 1];
  const change = (days: number) => {
    const target = latest.time - days * 86_400_000;
    const past = [...sorted].reverse().find(point => point.time <= target);
    return past && past.value > 0 ? Math.round((latest.value / past.value - 1) * 10_000) / 100 : null;
  };
  return { points: sorted.slice(-120), latest: latest.value, change7dPct: change(7), change30dPct: change(30) };
}

/** stablecoins.llama.fi/stablecoincharts/all -> total USD stablecoin supply per day. */
export function parseStablecoinSupply(json: unknown): StablecoinSeries | null {
  if (!Array.isArray(json)) return null;
  const points: SeriesPoint[] = [];
  for (const item of json) {
    const row = item as { date?: unknown; totalCirculatingUSD?: { peggedUSD?: unknown } };
    const date = finite(row?.date); const value = finite(row?.totalCirculatingUSD?.peggedUSD);
    if (date !== null && value !== null && value > 0) points.push({ time: date * 1000, value });
  }
  return toSeries(points);
}

/** api.llama.fi/v2/historicalChainTvl -> total DeFi TVL per day. */
export function parseTvl(json: unknown): StablecoinSeries | null {
  if (!Array.isArray(json)) return null;
  const points: SeriesPoint[] = [];
  for (const item of json) {
    const row = item as { date?: unknown; tvl?: unknown };
    const date = finite(row?.date); const value = finite(row?.tvl);
    if (date !== null && value !== null && value > 0) points.push({ time: date * 1000, value });
  }
  return toSeries(points);
}

/** indodax.com/api/tickers -> last prices by pair ("btc_idr"). */
export function parseIndodaxTickers(json: unknown): Record<string, number> {
  const tickers = (json as { tickers?: Record<string, { last?: unknown }> } | null)?.tickers;
  if (!tickers || typeof tickers !== 'object') return {};
  const out: Record<string, number> = {};
  for (const [pair, ticker] of Object.entries(tickers)) {
    const last = finite(ticker?.last);
    if (last !== null && last > 0) out[pair] = last;
  }
  return out;
}

/**
 * Local price vs the global price converted at the same exchange's USDT/IDR rate.
 * Positive = the coin costs more on the local exchange than on Binance.
 */
export function idrPremium(symbol: string, tickers: Record<string, number>, usdtPrice: number): IdrPremium | null {
  const idrPrice = tickers[`${symbol.toLowerCase()}_idr`]; const usdtIdr = tickers.usdt_idr;
  if (!idrPrice || !usdtIdr || !(usdtPrice > 0)) return null;
  const premiumPct = (idrPrice / (usdtPrice * usdtIdr) - 1) * 100;
  return { symbol, idrPrice, usdtPrice, usdtIdr, premiumPct: Math.round(premiumPct * 100) / 100 };
}

export const MACRO_IMPORTANCE = [1, 2, 3] as const;
export type MacroEvent = { id: string; event_at: string; title: string; importance: number; region: string; note: string | null };
