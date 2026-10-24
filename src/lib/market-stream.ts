// Pure parsers and metrics for Binance public market streams (order book, trades, liquidations).
// Everything fails soft: malformed input becomes null / empty so a bad frame can never crash the panel.

export type BookLevel = { price: number; qty: number };
export type OrderBook = { bids: BookLevel[]; asks: BookLevel[] };
export type Trade = { id: string; price: number; qty: number; usd: number; time: number; side: 'buy' | 'sell' };
export type Liquidation = { id: string; time: number; symbol: string; price: number; qty: number; usd: number;
  /** LONG = a long position was force-closed (sell order); SHORT = a short was force-closed (buy order). */
  side: 'LONG' | 'SHORT' };

const positive = (value: unknown): number | null => {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(number) && number > 0 ? number : null;
};

export function parseBookLevels(raw: unknown, limit = 50): BookLevel[] {
  if (!Array.isArray(raw)) return [];
  const levels: BookLevel[] = [];
  for (const row of raw) {
    if (!Array.isArray(row)) continue;
    const price = positive(row[0]); const qty = positive(row[1]);
    if (price !== null && qty !== null) levels.push({ price, qty });
    if (levels.length >= limit) break;
  }
  return levels;
}

/** Accepts Binance partial depth ({bids, asks}) and the REST shape. Bids are sorted high to low, asks low to high. */
export function parseOrderBook(data: unknown): OrderBook | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as Record<string, unknown>;
  const bids = parseBookLevels(raw.bids ?? raw.b).sort((a, b) => b.price - a.price);
  const asks = parseBookLevels(raw.asks ?? raw.a).sort((a, b) => a.price - b.price);
  if (!bids.length || !asks.length) return null;
  // A crossed book is a corrupted frame, not a market.
  if (bids[0].price >= asks[0].price) return null;
  return { bids, asks };
}

export type BookMetrics = {
  bestBid: number; bestAsk: number; mid: number; spread: number; spreadPct: number;
  bidVolume: number; askVolume: number;
  /** (bids - asks) / (bids + asks) in percent over the visible depth: + means more resting buy size. */
  imbalancePct: number;
  bids: Array<BookLevel & { cumulative: number }>; asks: Array<BookLevel & { cumulative: number }>;
  maxCumulative: number;
  /** The biggest single resting level on each side, as context only (walls can be pulled at any time). */
  bidWall: BookLevel; askWall: BookLevel;
};

export function bookMetrics(book: OrderBook, depth = 12): BookMetrics {
  const bids = book.bids.slice(0, depth); const asks = book.asks.slice(0, depth);
  const accumulate = (levels: BookLevel[]) => { let sum = 0; return levels.map(level => ({ ...level, cumulative: sum += level.qty })); };
  const bidRows = accumulate(bids); const askRows = accumulate(asks);
  const bidVolume = bidRows[bidRows.length - 1].cumulative; const askVolume = askRows[askRows.length - 1].cumulative;
  const bestBid = bids[0].price; const bestAsk = asks[0].price; const mid = (bestBid + bestAsk) / 2;
  const biggest = (levels: BookLevel[]) => levels.reduce((best, level) => level.qty > best.qty ? level : best, levels[0]);
  return { bestBid, bestAsk, mid, spread: bestAsk - bestBid, spreadPct: (bestAsk - bestBid) / mid * 100, bidVolume, askVolume,
    imbalancePct: (bidVolume - askVolume) / (bidVolume + askVolume) * 100, bids: bidRows, asks: askRows,
    maxCumulative: Math.max(bidVolume, askVolume), bidWall: biggest(bids), askWall: biggest(asks) };
}

/** Binance combined-stream frames look like {"stream": "...", "data": {...}}. */
export function unwrapStream(message: unknown): { stream: string; data: unknown } | null {
  try {
    const parsed: unknown = typeof message === 'string' ? JSON.parse(message) : message;
    if (!parsed || typeof parsed !== 'object') return null;
    const frame = parsed as Record<string, unknown>;
    return typeof frame.stream === 'string' && 'data' in frame ? { stream: frame.stream, data: frame.data } : null;
  } catch { return null; }
}

/** aggTrade stream/REST row. `m` (buyer is the maker) means the aggressor sold. */
export function parseAggTrade(data: unknown): Trade | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as Record<string, unknown>;
  const price = positive(row.p); const qty = positive(row.q); const time = positive(row.T);
  const id = row.a ?? row.t;
  if (price === null || qty === null || time === null || (typeof id !== 'number' && typeof id !== 'string')) return null;
  return { id: String(id), price, qty, usd: price * qty, time, side: row.m === true ? 'sell' : 'buy' };
}

/** Trades at or above this USD size count as "large" (top decile of the buffer, never below the floor). */
export function largeTradeThreshold(trades: Trade[], floorUsd = 10_000): number {
  if (trades.length < 10) return floorUsd;
  const sorted = trades.map(trade => trade.usd).sort((a, b) => a - b);
  return Math.max(floorUsd, sorted[Math.floor(sorted.length * 0.9)]);
}

/** Futures forceOrder stream. S = side of the liquidation order: SELL closes a long, BUY closes a short. */
export function parseForceOrder(data: unknown): Liquidation | null {
  if (!data || typeof data !== 'object') return null;
  const order = (data as Record<string, unknown>).o;
  if (!order || typeof order !== 'object') return null;
  const row = order as Record<string, unknown>;
  const price = positive(row.ap) ?? positive(row.p);
  const qty = positive(row.z) ?? positive(row.q);
  const time = positive(row.T);
  if (price === null || qty === null || time === null || typeof row.s !== 'string' || (row.S !== 'SELL' && row.S !== 'BUY')) return null;
  return { id: `${row.s}-${time}-${price}-${qty}`, time, symbol: row.s, price, qty, usd: price * qty, side: row.S === 'SELL' ? 'LONG' : 'SHORT' };
}

/** Adds items to the front of a bounded list without duplicating ids. */
export function pushBounded<T extends { id: string }>(list: T[], items: T[], max: number): T[] {
  const known = new Set(list.map(item => item.id));
  const fresh = items.filter(item => !known.has(item.id));
  return fresh.length ? [...fresh.reverse(), ...list].slice(0, max) : list;
}

export const STREAM_SYMBOL = /^[A-Z0-9]{2,15}$/;
