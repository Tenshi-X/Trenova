import type { AnalysisV2, MarketSnapshot } from './analysis/core';

// Free, rule-based scan of a watchlist: the server's own technical plan and confluence score per coin, with no AI
// call and no credit. It ranks coins by how ready their plan is; it does not say a trade will win.

export type ScanRow = {
  symbol: string; price: number; change24h: number | null; rsi: number; trend: 'bullish' | 'bearish' | 'neutral' | null;
  direction: 'LONG' | 'SHORT'; entryType: 'PULLBACK' | 'BREAKOUT' | null;
  score: number; grade: 'HIGH' | 'MEDIUM' | 'LOW'; status: 'READY' | 'WATCH' | 'NO_TRADE';
  entryLow: number; entryHigh: number; stopLoss: number; takeProfit1: number; riskReward: number | null;
  distanceToEntryPct: number | null;
};
export type ScanFailure = { symbol: string; error: 'no_data' | 'no_plan' };
export type ScanItem = ScanRow | ScanFailure;

export const isScanRow = (item: ScanItem): item is ScanRow => !('error' in item);

/** Reduces a technical report and its market snapshot to one table row, or null when there is no scored plan. */
export function toScanRow(report: AnalysisV2, market: MarketSnapshot): ScanRow | null {
  const lead = report.setups[0];
  if (!lead?.quality) return null;
  const entry = lead.direction === 'LONG' ? lead.entryHigh : lead.entryLow;
  const risk = Math.abs(entry - lead.stopLoss);
  return { symbol: market.symbol, price: market.price, change24h: market.change24h, rsi: market.rsi,
    trend: market.structure?.trend ?? null, direction: lead.direction, entryType: lead.entryType ?? null,
    score: lead.quality.score, grade: lead.quality.grade, status: lead.quality.status,
    entryLow: lead.entryLow, entryHigh: lead.entryHigh, stopLoss: lead.stopLoss, takeProfit1: lead.takeProfit1,
    riskReward: risk > 0 ? Math.round(Math.abs(lead.takeProfit1 - entry) / risk * 100) / 100 : null,
    distanceToEntryPct: typeof lead.distanceToEntryPct === 'number' ? lead.distanceToEntryPct : null };
}

const STATUS_ORDER = { READY: 0, WATCH: 1, NO_TRADE: 2 } as const;

/** READY first, then by score, then the nearer entry; failures go last. Does not mutate the input. */
export function rankScan(items: ScanItem[]): ScanItem[] {
  return [...items].sort((a, b) => {
    if (!isScanRow(a) || !isScanRow(b)) return Number(isScanRow(b)) - Number(isScanRow(a));
    return STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.score - a.score
      || Math.abs(a.distanceToEntryPct ?? 99) - Math.abs(b.distanceToEntryPct ?? 99) || a.symbol.localeCompare(b.symbol);
  });
}
