import type { AnalysisSetup, Candle } from './core';

// Follows a saved trade plan over the candles that closed after the analysis, exactly as the plan is written:
// trigger (candle close) -> retest of the entry zone -> fill -> stop loss / take profit.
// It mirrors the rules of the backtest's simulatePlan so live results and backtest results mean the same thing.
// Pure and dependency-free so it can run in the browser, on the server and in tests.

export type PlanStatus = 'WAITING_TRIGGER' | 'WAITING_RETEST' | 'FILLED' | 'TP1' | 'TP2' | 'SL' | 'CANCELLED' | 'EXPIRED';
export const PLAN_STATUSES: readonly PlanStatus[] = ['WAITING_TRIGGER', 'WAITING_RETEST', 'FILLED', 'TP1', 'TP2', 'SL', 'CANCELLED', 'EXPIRED'];

export type Resolution = 'SL' | 'TP1';

export type PlanTrack = {
  status: PlanStatus;
  /** True once nothing later can change the result, so it never has to be recomputed. */
  final: boolean;
  triggeredAt: number | null;
  filledAt: number | null;
  closedAt: number | null;
  tp1At: number | null;
  tp2At: number | null;
  /** Result in R when the whole position exits at TP1 (-1 for a stop). Null while undecided or never filled. */
  r: number | null;
  /** The stop and TP1 sat inside one candle and the order was unknown (counted as a stop unless resolved). */
  ambiguous: boolean;
  /** Window of the first unresolved ambiguous candle, so a finer timeframe can settle it. */
  ambiguousWindow: { from: number; to: number } | null;
  /** Price went back through the stop after TP1 was reached. */
  stoppedAfterTp1: boolean;
  lastCandleTime: number | null;
  candlesChecked: number;
};

export type TrackOptions = {
  /** Candles a plan may wait for its trigger and entry (the plan's validity window). */
  waitCandles: number;
  /** Outcome of an ambiguous candle decided on a finer timeframe, keyed by the candle's openTime. */
  resolutions?: Record<number, Resolution>;
};

type TrackableSetup = Pick<AnalysisSetup, 'direction' | 'entryLow' | 'entryHigh' | 'stopLoss' | 'takeProfit1' | 'takeProfit2'>
  & Partial<Pick<AnalysisSetup, 'entryType' | 'cancelAt' | 'execution'>>;

export function trackPlan(setup: TrackableSetup, candles: Candle[], options: TrackOptions): PlanTrack {
  const long = setup.direction === 'LONG';
  const wait = Math.max(1, Math.floor(options.waitCandles));
  const result: PlanTrack = { status: 'WAITING_TRIGGER', final: false, triggeredAt: null, filledAt: null, closedAt: null,
    tp1At: null, tp2At: null, r: null, ambiguous: false, ambiguousWindow: null, stoppedAfterTp1: false,
    lastCandleTime: null, candlesChecked: 0 };
  const touchesZone = (candle: Candle) => long ? candle.low <= setup.entryHigh : candle.high >= setup.entryLow;
  const closedBeyondZone = (candle: Candle) => long ? candle.close > setup.entryHigh : candle.close < setup.entryLow;
  const hitsStop = (candle: Candle) => long ? candle.low <= setup.stopLoss : candle.high >= setup.stopLoss;
  const hitsTp = (candle: Candle, level: number) => long ? candle.high >= level : candle.low <= level;
  // Same state names as the backtest: PULLBACK tests the zone first, BREAKOUT waits for a close beyond it,
  // a plan that is already READY has no trigger and fills when the zone is touched.
  let state: 'test' | 'close' | 'retest' = setup.entryType === 'PULLBACK' ? 'test'
    : setup.execution === 'READY' ? 'retest' : 'close';
  const entry = long ? setup.entryHigh : setup.entryLow;
  const risk = Math.abs(entry - setup.stopLoss);
  const rr1 = risk > 0 ? Math.abs(setup.takeProfit1 - entry) / risk : null;
  let entryIndex = -1;

  const waitingStatus = (): PlanStatus => state === 'retest' ? 'WAITING_RETEST' : 'WAITING_TRIGGER';
  const finish = (status: PlanStatus, at: number, r: number | null = null) => {
    result.status = status; result.final = true; result.closedAt = at; result.r = r;
  };

  for (let k = 0; k < candles.length; k++) {
    const candle = candles[k];
    result.lastCandleTime = candle.closeTime;
    result.candlesChecked = k + 1;
    if (entryIndex < 0) {
      if (k >= wait) { finish('EXPIRED', candles[wait - 1].closeTime); return result; }
      if (setup.cancelAt !== undefined && (long ? candle.close < setup.cancelAt : candle.close > setup.cancelAt)) {
        finish('CANCELLED', candle.closeTime); return result;
      }
      // One step per candle, so a trigger and its retest never happen inside the same bar.
      if (state === 'retest') {
        if (touchesZone(candle)) { entryIndex = k; result.filledAt = candle.closeTime; }
      } else if (state === 'test') {
        if (touchesZone(candle)) state = 'close';
      } else if (closedBeyondZone(candle)) { state = 'retest'; result.triggeredAt = candle.closeTime; }
      if (entryIndex < 0) { result.status = waitingStatus(); continue; }
    }
    // Entry candle: only the stop is judged (a target in the same candle cannot be ordered against the entry).
    const stop = hitsStop(candle);
    if (result.tp1At === null) {
      const tp1 = k > entryIndex && hitsTp(candle, setup.takeProfit1);
      if (stop && tp1) {
        const resolved = options.resolutions?.[candle.openTime];
        if (resolved === 'TP1') {
          result.tp1At = candle.closeTime; result.status = 'TP1'; result.r = rr1;
          if (hitsTp(candle, setup.takeProfit2)) { result.tp2At = candle.closeTime; finish('TP2', candle.closeTime, rr1); return result; }
          continue;
        }
        // A finer timeframe that confirms the stop first settles the order; otherwise the stop is assumed (conservative).
        if (resolved !== 'SL') { result.ambiguous = true; result.ambiguousWindow = { from: candle.openTime, to: candle.closeTime }; }
        finish('SL', candle.closeTime, -1); return result;
      }
      if (stop) { finish('SL', candle.closeTime, -1); return result; }
      if (tp1) {
        result.tp1At = candle.closeTime; result.status = 'TP1'; result.r = rr1;
        if (hitsTp(candle, setup.takeProfit2)) { result.tp2At = candle.closeTime; finish('TP2', candle.closeTime, rr1); return result; }
        continue;
      }
      result.status = 'FILLED';
      continue;
    }
    // After TP1: keep watching for TP2 until price comes back through the stop.
    if (hitsTp(candle, setup.takeProfit2) && !stop) { result.tp2At = candle.closeTime; finish('TP2', candle.closeTime, rr1); return result; }
    if (stop) { result.stoppedAfterTp1 = true; result.final = true; result.closedAt = result.tp1At; return result; }
  }
  if (entryIndex < 0 && candles.length >= wait) finish('EXPIRED', candles[wait - 1].closeTime);
  return result;
}

/** Decides an ambiguous candle from finer candles inside it. A stop and target in one fine candle still counts as a stop. */
export function resolveWithFinerCandles(setup: TrackableSetup, fine: Candle[]): Resolution | null {
  const long = setup.direction === 'LONG';
  for (const candle of [...fine].sort((a, b) => a.openTime - b.openTime)) {
    const stop = long ? candle.low <= setup.stopLoss : candle.high >= setup.stopLoss;
    const target = long ? candle.high >= setup.takeProfit1 : candle.low <= setup.takeProfit1;
    if (stop) return 'SL';
    if (target) return 'TP1';
  }
  return null;
}

export const FINER_TIMEFRAME: Record<string, string> = { '15m': '1m', '30m': '5m', '1h': '5m', '4h': '15m', '1d': '1h' };

/** What the browser needs to show a plan's status (a subset of the stored row). */
export type TrackingView = {
  analysis_id: string; setup_index: number; direction: 'LONG' | 'SHORT'; status: PlanStatus; final: boolean;
  triggered_at: string | null; filled_at: string | null; closed_at: string | null;
  tp1_at: string | null; tp2_at: string | null; r: number | null; ambiguous: boolean;
  stopped_after_tp1: boolean; checked_at: string;
};

export type TrackRow = {
  status: PlanStatus; r: number | null; direction: 'LONG' | 'SHORT'; timeframe?: string | null;
};

export type TrackStats = {
  plans: number; waiting: number; filled: number; open: number; closed: number; wins: number; losses: number;
  tp2: number; cancelled: number; expired: number;
  fillRatePct: number | null; winRatePct: number | null; avgR: number | null; tp2RatePct: number | null;
  byDirection: Record<'LONG' | 'SHORT', { closed: number; wins: number; winRatePct: number | null }>;
};

const pct = (part: number, whole: number) => whole > 0 ? Math.round(part / whole * 1000) / 10 : null;

/** Win = TP1 or TP2 reached before the stop. avgR assumes the whole position exits at TP1. */
export function summarizeTracks(rows: TrackRow[]): TrackStats {
  const count = (statuses: PlanStatus[]) => rows.filter(row => statuses.includes(row.status)).length;
  const wins = count(['TP1', 'TP2']);
  const losses = count(['SL']);
  const closed = wins + losses;
  const open = count(['FILLED']);
  const filled = closed + open;
  const decided = rows.filter(row => ['TP1', 'TP2', 'SL'].includes(row.status) && row.r !== null);
  const avgR = decided.length ? Math.round(decided.reduce((sum, row) => sum + (row.r as number), 0) / decided.length * 100) / 100 : null;
  const side = (direction: 'LONG' | 'SHORT') => {
    const mine = rows.filter(row => row.direction === direction);
    const w = mine.filter(row => row.status === 'TP1' || row.status === 'TP2').length;
    const c = w + mine.filter(row => row.status === 'SL').length;
    return { closed: c, wins: w, winRatePct: pct(w, c) };
  };
  const tp2 = count(['TP2']);
  return { plans: rows.length, waiting: count(['WAITING_TRIGGER', 'WAITING_RETEST']), filled, open, closed, wins, losses, tp2,
    cancelled: count(['CANCELLED']), expired: count(['EXPIRED']),
    fillRatePct: pct(filled, rows.length - count(['WAITING_TRIGGER', 'WAITING_RETEST'])),
    winRatePct: pct(wins, closed), avgR, tp2RatePct: pct(tp2, wins), byDirection: { LONG: side('LONG'), SHORT: side('SHORT') } };
}
