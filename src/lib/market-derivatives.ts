// Real derivatives data (funding rate + open interest) and market caps for the altcoin screener.
// Everything here uses public, key-less endpoints and fails soft: a missing value becomes null and
// the table shows "—" instead of a made-up number.
//
// Exchange providers are queried in parallel because any single one can be geo-blocked from the
// deploy region (Binance and Bybit refuse many US data-center IPs). Whatever answers is combined into
// ONE row per coin: funding = mean across exchanges, open interest and volume = sum across exchanges.

export type DerivativeSource = 'okx' | 'bybit' | 'bitget' | 'gate' | 'mexc' | 'binance';

export interface ExchangeDerivative { funding: number | null; openInterestUsd: number | null }

export interface Derivative {
  /** Funding rate in PERCENT (0.01 means 0.01%): mean over the exchanges that report it. */
  fundingRate: number | null;
  /** Open interest in USD notional: SUM over the exchanges that report it. */
  openInterestUsd: number | null;
  /** 24h USD turnover summed over providers that report it (OKX's own volume comes from its tickers). */
  volumeUsd: number | null;
  /** How many exchanges have data for this coin. */
  exchanges: number;
  perExchange: Partial<Record<DerivativeSource, ExchangeDerivative>>;
}

export interface ProviderStat { source: DerivativeSource; funding: number; openInterest: number }

export interface DerivativeSnapshot {
  map: Map<string, Derivative>;
  providers: ProviderStat[];
  fetchedAt: number;
}

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export interface ProviderData {
  source: DerivativeSource;
  funding: Map<string, number>;
  openInterest: Map<string, number>;
  /** 24h USD turnover per coin (optional). */
  volume?: Map<string, number>;
}

const OKX = 'https://www.okx.com';
const BYBIT = 'https://api.bybit.com';
const BINANCE_FAPI = 'https://fapi.binance.com';
const COINGECKO = 'https://api.coingecko.com/api/v3';

const BITGET = 'https://api.bitget.com';
const GATE = 'https://api.gateio.ws/api/v4';
const MEXC = 'https://contract.mexc.com';

const PRIORITY: DerivativeSource[] = ['okx', 'bybit', 'bitget', 'gate', 'mexc', 'binance'];
const DERIVATIVES_TTL_MS = 30_000;
const DERIVATIVES_STALE_MS = 5 * 60_000;
const MARKET_CAP_TTL_MS = 10 * 60_000;
const MARKET_CAP_STALE_MS = 60 * 60_000;

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

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item))
    : [];
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

// ─── Parsers (exported so they can be unit-tested with sample responses) ──────
/** Contracts quoted per 1000 units (1000PEPE) are the same coin as PEPE; funding and USD open interest are scale-free. */
export function normalizeBase(base: string): string {
  return base.replace(/^(?:1000000|10000|1000)(?=[A-Z])/, '');
}

/** OKX: GET /api/v5/public/open-interest?instType=SWAP → oiUsd per swap. USDT-margined only. */
export function parseOkxOpenInterest(json: unknown): Map<string, number> {
  const out = new Map<string, number>();
  const root = asObject(json);
  if (!root || root.code !== '0') return out;
  for (const row of rows(root.data)) {
    const match = /^([A-Z0-9]+)-USDT-SWAP$/.exec(String(row.instId ?? ''));
    const usd = toNumber(row.oiUsd);
    if (match && usd !== null && usd >= 0) out.set(match[1], usd);
  }
  return out;
}

/** OKX: GET /api/v5/public/funding-rate?instId=ANY → fundingRate (decimal) → percent. */
export function parseOkxFunding(json: unknown): Map<string, number> {
  const out = new Map<string, number>();
  const root = asObject(json);
  if (!root || root.code !== '0') return out;
  for (const row of rows(root.data)) {
    const match = /^([A-Z0-9]+)-USDT-SWAP$/.exec(String(row.instId ?? ''));
    const rate = toNumber(row.fundingRate);
    if (match && rate !== null) out.set(match[1], rate * 100);
  }
  return out;
}

/** Bybit: GET /v5/market/tickers?category=linear → fundingRate + openInterestValue (USD) + turnover24h (USD). */
export function parseBybitTickers(json: unknown): { funding: Map<string, number>; openInterest: Map<string, number>; volume: Map<string, number> } {
  const funding = new Map<string, number>();
  const openInterest = new Map<string, number>();
  const volume = new Map<string, number>();
  const root = asObject(json);
  if (!root || root.retCode !== 0) return { funding, openInterest, volume };
  for (const row of rows(asObject(root.result)?.list)) {
    const match = /^([A-Z0-9]+)USDT$/.exec(String(row.symbol ?? ''));
    if (!match) continue;
    const base = normalizeBase(match[1]);
    const rate = toNumber(row.fundingRate);
    const usd = toNumber(row.openInterestValue);
    const turnover = toNumber(row.turnover24h);
    if (rate !== null && !funding.has(base)) funding.set(base, rate * 100);
    if (usd !== null && usd >= 0 && !openInterest.has(base)) openInterest.set(base, usd);
    if (turnover !== null && turnover >= 0 && !volume.has(base)) volume.set(base, turnover);
  }
  return { funding, openInterest, volume };
}

/** Bitget: GET /api/v2/mix/market/tickers?productType=USDT-FUTURES. OI (base units) x mark price = USD. */
export function parseBitgetTickers(json: unknown): { funding: Map<string, number>; openInterest: Map<string, number>; volume: Map<string, number> } {
  const funding = new Map<string, number>();
  const openInterest = new Map<string, number>();
  const volume = new Map<string, number>();
  const root = asObject(json);
  if (!root || root.code !== '00000') return { funding, openInterest, volume };
  for (const row of rows(root.data)) {
    const match = /^([A-Z0-9]+)USDT$/.exec(String(row.symbol ?? ''));
    if (!match) continue;
    const base = normalizeBase(match[1]);
    const rate = toNumber(row.fundingRate);
    const units = toNumber(row.holdingAmount);
    const mark = toNumber(row.markPrice) ?? toNumber(row.lastPr);
    const turnover = toNumber(row.usdtVolume);
    if (rate !== null && !funding.has(base)) funding.set(base, rate * 100);
    if (units !== null && units >= 0 && mark !== null && mark > 0 && !openInterest.has(base)) openInterest.set(base, units * mark);
    if (turnover !== null && turnover >= 0 && !volume.has(base)) volume.set(base, turnover);
  }
  return { funding, openInterest, volume };
}

/** Gate: GET /api/v4/futures/usdt/tickers. OI = contracts x quanto_multiplier (base per contract) x mark price. */
export function parseGateTickers(json: unknown): { funding: Map<string, number>; openInterest: Map<string, number>; volume: Map<string, number> } {
  const funding = new Map<string, number>();
  const openInterest = new Map<string, number>();
  const volume = new Map<string, number>();
  for (const row of rows(json)) {
    const match = /^([A-Z0-9]+)_USDT$/.exec(String(row.contract ?? ''));
    if (!match) continue;
    const base = normalizeBase(match[1]);
    const rate = toNumber(row.funding_rate);
    const contracts = toNumber(row.total_size);
    const multiplier = toNumber(row.quanto_multiplier);
    const mark = toNumber(row.mark_price) ?? toNumber(row.last);
    const turnover = toNumber(row.volume_24h_quote);
    if (rate !== null && !funding.has(base)) funding.set(base, rate * 100);
    if (contracts !== null && contracts >= 0 && multiplier !== null && multiplier > 0 && mark !== null && mark > 0 && !openInterest.has(base)) {
      openInterest.set(base, contracts * multiplier * mark);
    }
    if (turnover !== null && turnover >= 0 && !volume.has(base)) volume.set(base, turnover);
  }
  return { funding, openInterest, volume };
}

/** MEXC: GET /api/v1/contract/ticker → fundingRate + amount24 (USDT turnover). No OI: contract size is not in this response. */
export function parseMexcTickers(json: unknown): { funding: Map<string, number>; volume: Map<string, number> } {
  const funding = new Map<string, number>();
  const volume = new Map<string, number>();
  const root = asObject(json);
  if (!root || root.success !== true) return { funding, volume };
  for (const row of rows(root.data)) {
    const match = /^([A-Z0-9]+)_USDT$/.exec(String(row.symbol ?? ''));
    if (!match) continue;
    const base = normalizeBase(match[1]);
    const rate = toNumber(row.fundingRate);
    const turnover = toNumber(row.amount24);
    if (rate !== null && !funding.has(base)) funding.set(base, rate * 100);
    if (turnover !== null && turnover >= 0 && !volume.has(base)) volume.set(base, turnover);
  }
  return { funding, volume };
}

/** Binance futures: GET /fapi/v1/premiumIndex → lastFundingRate (funding only; no bulk OI endpoint). */
export function parseBinancePremiumIndex(json: unknown): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of rows(json)) {
    const match = /^([A-Z0-9]+)USDT$/.exec(String(row.symbol ?? ''));
    const rate = toNumber(row.lastFundingRate);
    const base = match ? normalizeBase(match[1]) : null;
    if (base && rate !== null && !out.has(base)) out.set(base, rate * 100);
  }
  return out;
}

/** CoinGecko: GET /coins/markets → market cap by uppercase symbol (highest cap wins on a clash). */
export function parseCoinGeckoMarketCaps(json: unknown): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of rows(json)) {
    const symbol = String(row.symbol ?? '').toUpperCase();
    const cap = toNumber(row.market_cap);
    if (symbol && cap !== null && cap > 0 && !out.has(symbol)) out.set(symbol, cap);
  }
  return out;
}

// ─── Providers ────────────────────────────────────────────────────────────────
async function fromOkx(fetcher: Fetcher, timeoutMs: number): Promise<ProviderData | null> {
  const [oi, funding] = await Promise.all([
    getJson(`${OKX}/api/v5/public/open-interest?instType=SWAP`, fetcher, timeoutMs),
    getJson(`${OKX}/api/v5/public/funding-rate?instId=ANY`, fetcher, timeoutMs),
  ]);
  const data = { source: 'okx' as const, funding: parseOkxFunding(funding), openInterest: parseOkxOpenInterest(oi) };
  return data.funding.size || data.openInterest.size ? data : null;
}

async function fromBybit(fetcher: Fetcher, timeoutMs: number): Promise<ProviderData | null> {
  const json = await getJson(`${BYBIT}/v5/market/tickers?category=linear`, fetcher, timeoutMs);
  const parsed = parseBybitTickers(json);
  return parsed.funding.size || parsed.openInterest.size ? { source: 'bybit', ...parsed } : null;
}

async function fromBitget(fetcher: Fetcher, timeoutMs: number): Promise<ProviderData | null> {
  const parsed = parseBitgetTickers(await getJson(`${BITGET}/api/v2/mix/market/tickers?productType=USDT-FUTURES`, fetcher, timeoutMs));
  return parsed.funding.size || parsed.openInterest.size ? { source: 'bitget', ...parsed } : null;
}

async function fromGate(fetcher: Fetcher, timeoutMs: number): Promise<ProviderData | null> {
  const parsed = parseGateTickers(await getJson(`${GATE}/futures/usdt/tickers`, fetcher, timeoutMs));
  return parsed.funding.size || parsed.openInterest.size ? { source: 'gate', ...parsed } : null;
}

async function fromMexc(fetcher: Fetcher, timeoutMs: number): Promise<ProviderData | null> {
  const parsed = parseMexcTickers(await getJson(`${MEXC}/api/v1/contract/ticker`, fetcher, timeoutMs));
  return parsed.funding.size ? { source: 'mexc', funding: parsed.funding, openInterest: new Map(), volume: parsed.volume } : null;
}

async function fromBinance(fetcher: Fetcher, timeoutMs: number): Promise<ProviderData | null> {
  const funding = parseBinancePremiumIndex(await getJson(`${BINANCE_FAPI}/fapi/v1/premiumIndex`, fetcher, timeoutMs));
  return funding.size ? { source: 'binance', funding, openInterest: new Map() } : null;
}

/** Combine providers into one row per coin: funding = mean, open interest and volume = sum over exchanges. */
export function mergeProviders(parts: ProviderData[], now = Date.now()): DerivativeSnapshot | null {
  if (!parts.length) return null;
  const ordered = [...parts].sort((a, b) => PRIORITY.indexOf(a.source) - PRIORITY.indexOf(b.source));
  const symbols = new Set<string>();
  for (const part of ordered) {
    part.funding.forEach((_, symbol) => symbols.add(symbol));
    part.openInterest.forEach((_, symbol) => symbols.add(symbol));
    part.volume?.forEach((_, symbol) => symbols.add(symbol));
  }
  const map = new Map<string, Derivative>();
  symbols.forEach((symbol) => {
    const fundings: number[] = [];
    let openInterestUsd: number | null = null;
    let volumeUsd: number | null = null;
    const perExchange: Derivative['perExchange'] = {};
    for (const part of ordered) {
      const funding = part.funding.get(symbol) ?? null;
      const oi = part.openInterest.get(symbol) ?? null;
      const volume = part.volume?.get(symbol) ?? null;
      if (funding === null && oi === null && volume === null) continue;
      perExchange[part.source] = { funding, openInterestUsd: oi };
      if (funding !== null) fundings.push(funding);
      if (oi !== null) openInterestUsd = (openInterestUsd ?? 0) + oi;
      if (volume !== null) volumeUsd = (volumeUsd ?? 0) + volume;
    }
    const fundingRate = fundings.length ? fundings.reduce((sum, value) => sum + value, 0) / fundings.length : null;
    map.set(symbol, { fundingRate, openInterestUsd, volumeUsd, exchanges: Object.keys(perExchange).length, perExchange });
  });
  return {
    map,
    providers: ordered.map((part) => ({ source: part.source, funding: part.funding.size, openInterest: part.openInterest.size })),
    fetchedAt: now,
  };
}

export async function fetchDerivatives(fetcher: Fetcher = fetch, timeoutMs = 4000): Promise<DerivativeSnapshot | null> {
  const settled = await Promise.allSettled([
    fromOkx(fetcher, timeoutMs), fromBybit(fetcher, timeoutMs), fromBitget(fetcher, timeoutMs),
    fromGate(fetcher, timeoutMs), fromMexc(fetcher, timeoutMs), fromBinance(fetcher, timeoutMs),
  ]);
  const parts = settled.flatMap((result) => (result.status === 'fulfilled' && result.value ? [result.value] : []));
  return mergeProviders(parts);
}

// ─── Cached entry points (the screener polls every few seconds) ───────────────
let derivativesCache: { at: number; snapshot: DerivativeSnapshot } | null = null;
let derivativesInflight: Promise<DerivativeSnapshot | null> | null = null;
let marketCapCache: { at: number; caps: Map<string, number> } | null = null;
let marketCapInflight: Promise<Map<string, number> | null> | null = null;

export function resetMarketDerivativesCache() {
  derivativesCache = null; derivativesInflight = null; marketCapCache = null; marketCapInflight = null;
}

export async function getDerivatives(fetcher: Fetcher = fetch): Promise<DerivativeSnapshot | null> {
  if (derivativesCache && Date.now() - derivativesCache.at < DERIVATIVES_TTL_MS) return derivativesCache.snapshot;
  if (!derivativesInflight) {
    derivativesInflight = fetchDerivatives(fetcher).then((snapshot) => {
      if (snapshot) { derivativesCache = { at: Date.now(), snapshot }; return snapshot; }
      // Providers failed: reuse the last good snapshot for a few minutes rather than blanking the columns.
      return derivativesCache && Date.now() - derivativesCache.at < DERIVATIVES_STALE_MS ? derivativesCache.snapshot : null;
    }).finally(() => { derivativesInflight = null; });
  }
  return derivativesInflight;
}

export async function getMarketCaps(fetcher: Fetcher = fetch): Promise<Map<string, number> | null> {
  if (marketCapCache && Date.now() - marketCapCache.at < MARKET_CAP_TTL_MS) return marketCapCache.caps;
  if (!marketCapInflight) {
    marketCapInflight = (async () => {
      const json = await getJson(
        `${COINGECKO}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`,
        fetcher, 6000);
      const caps = parseCoinGeckoMarketCaps(json);
      if (caps.size) { marketCapCache = { at: Date.now(), caps }; return caps; }
      return marketCapCache && Date.now() - marketCapCache.at < MARKET_CAP_STALE_MS ? marketCapCache.caps : null;
    })().finally(() => { marketCapInflight = null; });
  }
  return marketCapInflight;
}

// ─── Apply onto the screener's coin list ──────────────────────────────────────
export interface Enrichable {
  symbol: string;
  fundingRate: number | null;
  openInterestUsd?: number | null;
  marketCap?: number;
  /** Number of exchanges that contributed derivatives data. */
  exchanges?: number;
}

export function applyDerivatives(coins: Enrichable[], snapshot: DerivativeSnapshot | null) {
  for (const coin of coins) {
    const derivative = snapshot?.map.get(coin.symbol.toUpperCase());
    if (coin.openInterestUsd === undefined) coin.openInterestUsd = null;
    if (!derivative) continue;
    if (coin.fundingRate === null) coin.fundingRate = derivative.fundingRate;
    if (derivative.openInterestUsd !== null) coin.openInterestUsd = derivative.openInterestUsd;
    coin.exchanges = derivative.exchanges;
  }
}

export function applyMarketCaps(coins: Enrichable[], caps: Map<string, number> | null) {
  if (!caps) return;
  for (const coin of coins) {
    const cap = caps.get(coin.symbol.toUpperCase());
    if (cap !== undefined && !coin.marketCap) coin.marketCap = cap;
  }
}
