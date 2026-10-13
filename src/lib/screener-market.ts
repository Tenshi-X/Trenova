// Live altcoin screener data from OKX public endpoints (key-less).
//  - the coin list: top USDT perpetual swaps by 24h USD volume, ONE row per base symbol (no duplicates)
//  - real technical indicators (RSI 14, MACD 12/26/9, EMA20, structure) from 1h candles
// Everything fails soft: a value that cannot be computed is null and the table shows "—".

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

const OKX = 'https://www.okx.com';
const STABLE_BASES = new Set(['USDC', 'USDT', 'DAI', 'TUSD', 'FDUSD', 'USDE', 'PYUSD', 'USDG', 'USDD', 'USDP', 'BUSD', 'EURC', 'EUR']);

// ─── Small safe helpers ───────────────────────────────────────────────────────
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
    const response = await fetcher(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'TrenovaBot/1.0' },
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

// ─── Coin list ────────────────────────────────────────────────────────────────
export interface ScreenerTicker {
  symbol: string;
  price: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  /** 24h volume in USD (base-currency volume x last price). */
  volume24h: number;
}

/** OKX: GET /api/v5/market/tickers?instType=SWAP. USDT-margined swaps only, stablecoins removed, top N by volume. */
export function parseOkxTickers(json: unknown, limit = 50, cryptoBases: ReadonlySet<string> | null = null): ScreenerTicker[] {
  const root = asObject(json);
  if (!root || root.code !== '0' || !Array.isArray(root.data)) return [];
  const bySymbol = new Map<string, ScreenerTicker>();
  for (const item of root.data) {
    const row = asObject(item);
    if (!row) continue;
    const match = /^([A-Z0-9]+)-USDT-SWAP$/.exec(String(row.instId ?? ''));
    if (!match || STABLE_BASES.has(match[1])) continue;
    if (cryptoBases && !cryptoBases.has(match[1])) continue; // tokenized stocks / ETFs / commodities
    const price = toNumber(row.last);
    const open = toNumber(row.open24h);
    const baseVolume = toNumber(row.volCcy24h);
    if (price === null || price <= 0 || baseVolume === null || baseVolume < 0) continue;
    const entry: ScreenerTicker = {
      symbol: match[1],
      price,
      priceChangePercent: open !== null && open > 0 ? ((price - open) / open) * 100 : 0,
      high24h: toNumber(row.high24h) ?? 0,
      low24h: toNumber(row.low24h) ?? 0,
      volume24h: baseVolume * price,
    };
    const existing = bySymbol.get(entry.symbol);
    if (!existing || entry.volume24h > existing.volume24h) bySymbol.set(entry.symbol, entry); // one row per symbol
  }
  return [...bySymbol.values()].sort((a, b) => b.volume24h - a.volume24h).slice(0, limit);
}

/**
 * OKX: GET /api/v5/public/instruments?instType=SWAP. instCategory "1" = crypto (others are tokenized stocks,
 * commodities, FX...). Returns the set of crypto base symbols, or null when unavailable (then nothing is filtered).
 */
export function parseOkxCryptoBases(json: unknown): Set<string> | null {
  const root = asObject(json);
  if (!root || root.code !== '0' || !Array.isArray(root.data)) return null;
  const bases = new Set<string>();
  for (const item of root.data) {
    const row = asObject(item);
    if (!row || String(row.instCategory ?? '') !== '1') continue;
    const match = /^([A-Z0-9]+)-USDT-SWAP$/.exec(String(row.instId ?? ''));
    if (match) bases.add(match[1]);
  }
  return bases.size >= 20 ? bases : null;
}

const BASES_TTL_MS = 6 * 60 * 60_000;
let basesCache: { at: number; value: Set<string> } | null = null;

async function getCryptoBases(fetcher: Fetcher): Promise<Set<string> | null> {
  if (basesCache && Date.now() - basesCache.at < BASES_TTL_MS) return basesCache.value;
  const value = parseOkxCryptoBases(await getJson(`${OKX}/api/v5/public/instruments?instType=SWAP`, fetcher, 5000));
  if (value) { basesCache = { at: Date.now(), value }; return value; }
  return basesCache?.value ?? null; // stale is better than unfiltered
}

export async function fetchOkxTickers(fetcher: Fetcher = fetch, limit = 50): Promise<ScreenerTicker[] | null> {
  const [json, bases] = await Promise.all([
    getJson(`${OKX}/api/v5/market/tickers?instType=SWAP`, fetcher, 5000),
    getCryptoBases(fetcher),
  ]);
  const tickers = parseOkxTickers(json, limit, bases);
  return tickers.length ? tickers : null;
}

// ─── Indicators ───────────────────────────────────────────────────────────────
export interface Candle { open: number; high: number; low: number; close: number }

export type Rating = 'STR BULL' | 'BULL' | 'NEUTRAL' | 'BEAR' | 'STR BEAR';
export type Structure = 'Breakout' | 'Breakdown' | 'Range';

export interface Indicators {
  rsi: number;
  macd: number;
  macdSignal: number;
  /** MACD histogram (macd - signal), in price units. */
  macdHist: number;
  ema20: number;
  structure: Structure;
  rating: Rating;
  /** Percent change of the 1h close versus 1h / 4h / 12h earlier (from the same candles). null when not enough candles. */
  change1h: number | null;
  change4h: number | null;
  change12h: number | null;
  /** 0-100, 50 = neutral. Derived from the three votes below, nothing else. */
  score: number;
}

/** OKX: GET /api/v5/market/candles → rows are [ts, o, h, l, c, ...], NEWEST first. Returned oldest first. */
export function parseOkxCandles(json: unknown): Candle[] {
  const root = asObject(json);
  if (!root || root.code !== '0' || !Array.isArray(root.data)) return [];
  const candles: Candle[] = [];
  for (const row of root.data) {
    if (!Array.isArray(row)) continue;
    const open = toNumber(row[1]); const high = toNumber(row[2]); const low = toNumber(row[3]); const close = toNumber(row[4]);
    if (open === null || high === null || low === null || close === null) continue;
    candles.push({ open, high, low, close });
  }
  return candles.reverse();
}

/** EMA seeded with the SMA of the first `period` values. Returns only the valid part (length - period + 1). */
function emaSeries(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  let current = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  const out = [current];
  for (let i = period; i < values.length; i++) {
    current = values[i] * k + current * (1 - k);
    out.push(current);
  }
  return out;
}

/** Wilder's RSI. */
function rsiWilder(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gain = 0; let loss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gain += change; else loss -= change;
  }
  let avgGain = gain / period; let avgLoss = loss / period;
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? -change : 0)) / period;
  }
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

export function computeIndicators(candles: Candle[]): Indicators | null {
  if (candles.length < 50) return null;
  const closes = candles.map((candle) => candle.close);
  const last = candles[candles.length - 1];
  const rsi = rsiWilder(closes, 14);
  const ema12 = emaSeries(closes, 12);
  const ema26 = emaSeries(closes, 26);
  const ema20 = emaSeries(closes, 20);
  if (rsi === null || !ema12.length || !ema26.length || !ema20.length) return null;
  // ema12[j] and ema26[i] describe closes[j + 11] and closes[i + 25], so ema12 index = i + 14.
  const macdLine = ema26.map((value, i) => ema12[i + 14] - value);
  const signalLine = emaSeries(macdLine, 9);
  if (!signalLine.length) return null;
  const macd = macdLine[macdLine.length - 1];
  const macdSignal = signalLine[signalLine.length - 1];
  const macdHist = macd - macdSignal;
  const ema20Last = ema20[ema20.length - 1];

  const prior = candles.slice(-21, -1);
  const priorHigh = Math.max(...prior.map((candle) => candle.high));
  const priorLow = Math.min(...prior.map((candle) => candle.low));
  const structure: Structure = last.close > priorHigh ? 'Breakout' : last.close < priorLow ? 'Breakdown' : 'Range';

  // Transparent rating: three votes, +1 bullish / -1 bearish / 0 neutral.
  const vote = (positive: boolean, negative: boolean) => (positive ? 1 : negative ? -1 : 0);
  const votes = vote(rsi > 50, rsi < 50) + vote(macdHist > 0, macdHist < 0) + vote(last.close > ema20Last, last.close < ema20Last);
  const rating: Rating = votes === 3 ? 'STR BULL' : votes === 2 ? 'BULL' : votes === -3 ? 'STR BEAR' : votes === -2 ? 'BEAR' : 'NEUTRAL';
  const score = Math.round(50 + (votes * 50) / 3);
  const changeOver = (hours: number) => {
    const earlier = closes[closes.length - 1 - hours];
    return earlier !== undefined && earlier > 0 ? ((last.close - earlier) / earlier) * 100 : null;
  };
  return { rsi, macd, macdSignal, macdHist, ema20: ema20Last, structure, rating,
    change1h: changeOver(1), change4h: changeOver(4), change12h: changeOver(12), score };
}

// ─── Cached, rate-limit-friendly candle fetching ──────────────────────────────
const INDICATOR_TTL_MS = 5 * 60_000;
const INDICATOR_STALE_MS = 30 * 60_000;
const INDICATOR_RETRY_MS = 60_000;
const indicatorCache = new Map<string, { at: number; value: Indicators }>();
const indicatorFailures = new Map<string, number>();
let indicatorJob: Promise<void> | null = null;

export function resetScreenerCache() {
  indicatorCache.clear(); indicatorFailures.clear(); indicatorJob = null; basesCache = null;
}

export interface IndicatorOptions { budgetMs?: number; batchSize?: number; gapMs?: number }

/**
 * Indicators for the given base symbols (already ordered by importance). Candles are fetched in small
 * batches inside a time budget and cached for 5 minutes, so a cold start fills in progressively over a
 * few polls instead of hitting OKX's rate limit. Coins without data are simply absent from the result.
 */
export async function getIndicators(symbols: string[], fetcher: Fetcher = fetch, options: IndicatorOptions = {}): Promise<Map<string, Indicators>> {
  const { budgetMs = 3500, batchSize = 8, gapMs = 400 } = options;
  const now = Date.now();
  const missing = symbols.filter((symbol) => {
    const cached = indicatorCache.get(symbol);
    const failedAt = indicatorFailures.get(symbol);
    return (!cached || now - cached.at >= INDICATOR_TTL_MS) && (failedAt === undefined || now - failedAt >= INDICATOR_RETRY_MS);
  });
  if (missing.length && !indicatorJob) {
    indicatorJob = (async () => {
      const deadline = Date.now() + budgetMs;
      for (let i = 0; i < missing.length && Date.now() < deadline; i += batchSize) {
        await Promise.all(missing.slice(i, i + batchSize).map(async (symbol) => {
          const json = await getJson(`${OKX}/api/v5/market/candles?instId=${symbol}-USDT-SWAP&bar=1H&limit=100`, fetcher, 3000);
          const value = computeIndicators(parseOkxCandles(json));
          if (value) { indicatorCache.set(symbol, { at: Date.now(), value }); indicatorFailures.delete(symbol); }
          else indicatorFailures.set(symbol, Date.now());
        }));
        if (gapMs > 0 && i + batchSize < missing.length) await new Promise((resolve) => setTimeout(resolve, gapMs));
      }
    })().finally(() => { indicatorJob = null; });
  }
  if (indicatorJob) await indicatorJob;
  const out = new Map<string, Indicators>();
  for (const symbol of symbols) {
    const cached = indicatorCache.get(symbol);
    if (cached && Date.now() - cached.at < INDICATOR_STALE_MS) out.set(symbol, cached.value);
  }
  return out;
}
