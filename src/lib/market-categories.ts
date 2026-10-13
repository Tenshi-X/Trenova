// Coin categories (Memes, AI, DeFi, Layer 1/2, RWA, Gaming, ETH/SOL/BSC ecosystems) from CoinGecko's free
// /coins/markets?category=... endpoint. The grouping is CoinGecko's, a coin can belong to several groups, and a
// category that fails or comes back empty is simply left out (the UI hides it) - nothing is ever invented.

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export interface CategoryDef { id: string; label: string; coingecko: string }

export const CATEGORY_DEFS: CategoryDef[] = [
  { id: 'memes', label: 'Memes', coingecko: 'meme-token' },
  { id: 'ai', label: 'AI', coingecko: 'artificial-intelligence' },
  { id: 'defi', label: 'DeFi', coingecko: 'decentralized-finance-defi' },
  { id: 'layer1', label: 'Layer 1', coingecko: 'layer-1' },
  { id: 'layer2', label: 'Layer 2', coingecko: 'layer-2' },
  { id: 'rwa', label: 'RWA', coingecko: 'real-world-assets-rwa' },
  { id: 'gaming', label: 'Gaming', coingecko: 'gaming' },
  { id: 'eth', label: 'ETH', coingecko: 'ethereum-ecosystem' },
  { id: 'sol', label: 'SOL', coingecko: 'solana-ecosystem' },
  { id: 'bsc', label: 'BSC', coingecko: 'binance-smart-chain' },
];

const COINGECKO = 'https://api.coingecko.com/api/v3';
const CATEGORY_TTL_MS = 60 * 60_000;
const CATEGORY_STALE_MS = 24 * 60 * 60_000;
const RETRY_MS = 2 * 60_000;

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

/** CoinGecko GET /coins/markets → uppercase symbols (deduped, original order). */
export function parseCategorySymbols(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of json) {
    const symbol = String(asObject(item)?.symbol ?? '').toUpperCase();
    if (/^[A-Z0-9]{1,20}$/.test(symbol) && !seen.has(symbol)) { seen.add(symbol); out.push(symbol); }
  }
  return out;
}

const cache = new Map<string, { at: number; symbols: string[] }>();
const failures = new Map<string, number>();
let inflight: Promise<void> | null = null;

export function resetCategoryCache() { cache.clear(); failures.clear(); inflight = null; }

export interface CategoryOptions { budgetMs?: number; batchSize?: number; gapMs?: number }

/**
 * Category id -> symbols. Stale categories are refreshed a couple at a time inside a time budget (CoinGecko's free tier
 * is rate limited), so a cold start fills in over a few polls. Categories with no data are absent from the result.
 */
export async function getCategories(fetcher: Fetcher = fetch, options: CategoryOptions = {}): Promise<Record<string, string[]>> {
  const { budgetMs = 4000, batchSize = 2, gapMs = 1200 } = options;
  const now = Date.now();
  const due = CATEGORY_DEFS.filter((def) => {
    const cached = cache.get(def.id);
    const failedAt = failures.get(def.id);
    return (!cached || now - cached.at >= CATEGORY_TTL_MS) && (failedAt === undefined || now - failedAt >= RETRY_MS);
  });
  if (due.length && !inflight) {
    inflight = (async () => {
      const deadline = Date.now() + budgetMs;
      for (let i = 0; i < due.length && Date.now() < deadline; i += batchSize) {
        await Promise.all(due.slice(i, i + batchSize).map(async (def) => {
          const url = `${COINGECKO}/coins/markets?vs_currency=usd&category=${def.coingecko}&order=market_cap_desc&per_page=250&page=1&sparkline=false`;
          const symbols = parseCategorySymbols(await getJson(url, fetcher, 4000));
          if (symbols.length) { cache.set(def.id, { at: Date.now(), symbols }); failures.delete(def.id); }
          else failures.set(def.id, Date.now());
        }));
        if (gapMs > 0 && i + batchSize < due.length) await new Promise((resolve) => setTimeout(resolve, gapMs));
      }
    })().finally(() => { inflight = null; });
  }
  if (inflight) await inflight;
  const out: Record<string, string[]> = {};
  for (const def of CATEGORY_DEFS) {
    const cached = cache.get(def.id);
    if (cached && Date.now() - cached.at < CATEGORY_STALE_MS) out[def.id] = cached.symbols;
  }
  return out;
}

/** Keep only the symbols that are present in `available`; drop categories that end up empty. */
export function restrictCategories(categories: Record<string, string[]>, available: Iterable<string>): Record<string, string[]> {
  const have = new Set(available);
  const out: Record<string, string[]> = {};
  for (const [id, symbols] of Object.entries(categories)) {
    const kept = symbols.filter((symbol) => have.has(symbol));
    if (kept.length) out[id] = kept;
  }
  return out;
}
