import { calculateIndicators, higherTimeframeTrend, withHigherTimeframeLevels, TIMEFRAME_MILLIS,
  type AnalysisInput, type AnalysisSetup, type Candle, type MarketSnapshot, type Timeframe } from './core';
import { buildTechnicalAnalysis } from './report';

// Walk-forward test of the rule engine on historical candles. At every step the engine only sees candles that were
// already closed (no look-ahead), the plan is followed exactly as written (trigger -> retest -> entry -> SL/TP1),
// and the result is counted in R (1R = distance from entry to stop), minus an estimated round-trip fee.

export type BacktestOptions = {
  warmup?: number;       // candles needed before the first signal
  step?: number;         // evaluate every N candles so signals do not overlap
  maxWait?: number;      // candles a plan may wait for its trigger and entry
  maxHold?: number;      // candles a filled trade may stay open before it is closed at the market
  feePct?: number;       // estimated round-trip fee, percent of entry
};

export type TradeOutcome = 'TP1' | 'SL' | 'TIMEOUT' | 'CANCELLED' | 'NOT_TRIGGERED';

export type BacktestTrade = {
  symbol: string; at: string; direction: AnalysisSetup['direction']; entryType: string;
  score: number; grade: string; status: string; outcome: TradeOutcome; filled: boolean; r: number | null;
};

export type SymbolSeries = {
  symbol: string; timeframe: Timeframe; candles: Candle[]; daily: Candle[]; weekly: Candle[]; btc?: Candle[];
};

const DEFAULTS = { warmup: 60, step: 6, maxWait: 6, maxHold: 24, feePct: 0.1 } as const;

function changeOverDay(candles: Candle[], index: number, timeframe: Timeframe): number | null {
  const back = Math.round(86_400_000 / TIMEFRAME_MILLIS[timeframe]);
  if (index - back < 0) return null;
  return (candles[index].close / candles[index - back].close - 1) * 100;
}

// Follows one plan over the candles that came after the signal.
export function simulatePlan(setup: AnalysisSetup, future: Candle[], options: BacktestOptions = {}):
  { outcome: TradeOutcome; filled: boolean; r: number | null } {
  const { maxWait, maxHold, feePct } = { ...DEFAULTS, ...options };
  const long = setup.direction === 'LONG';
  const cancelAt = setup.cancelAt;
  const pullback = setup.entryType === 'PULLBACK';
  let state: 'test' | 'close' | 'retest' = pullback ? 'test' : 'close';
  let entryIndex = -1;
  for (let k = 0; k < Math.min(maxWait, future.length); k++) {
    const candle = future[k];
    if (cancelAt !== undefined && (long ? candle.close < cancelAt : candle.close > cancelAt)) {
      return { outcome: 'CANCELLED', filled: false, r: null };
    }
    // One step per candle, so a trigger and its retest never happen inside the same bar.
    if (state === 'retest') {
      if (long ? candle.low <= setup.entryHigh : candle.high >= setup.entryLow) { entryIndex = k; break; }
    } else if (state === 'test') {
      if (long ? candle.low <= setup.entryHigh : candle.high >= setup.entryLow) state = 'close';
    } else if (long ? candle.close > setup.entryHigh : candle.close < setup.entryLow) state = 'retest';
  }
  if (entryIndex < 0) return { outcome: 'NOT_TRIGGERED', filled: false, r: null };
  const entry = long ? setup.entryHigh : setup.entryLow;
  const risk = Math.abs(entry - setup.stopLoss);
  const costR = entry * feePct / 100 / risk;
  const tpR = Math.abs(setup.takeProfit1 - entry) / risk;
  for (let k = entryIndex; k < Math.min(future.length, entryIndex + maxHold + 1); k++) {
    const candle = future[k];
    const hitStop = long ? candle.low <= setup.stopLoss : candle.high >= setup.stopLoss;
    const hitTarget = k > entryIndex && (long ? candle.high >= setup.takeProfit1 : candle.low <= setup.takeProfit1);
    // When both levels sit inside one candle the order is unknown; assume the stop came first.
    if (hitStop) return { outcome: 'SL', filled: true, r: -1 - costR };
    if (hitTarget) return { outcome: 'TP1', filled: true, r: tpR - costR };
  }
  const last = future[Math.min(future.length, entryIndex + maxHold + 1) - 1];
  const open = (long ? 1 : -1) * (last.close - entry) / risk;
  return { outcome: 'TIMEOUT', filled: true, r: open - costR };
}

export function runBacktest(series: SymbolSeries, input: AnalysisInput, options: BacktestOptions = {}): BacktestTrade[] {
  const { warmup, step, maxWait, maxHold } = { ...DEFAULTS, ...options };
  const { candles, daily, weekly, btc, timeframe, symbol } = series;
  const btcByClose = new Map((btc ?? []).map((candle, index) => [candle.closeTime, index]));
  const trades: BacktestTrade[] = [];
  for (let i = warmup; i < candles.length - 2; i += step) {
    const window = candles.slice(i - 59, i + 1);
    const now = candles[i].closeTime;
    const indicators = calculateIndicators(window);
    if (!indicators?.structure) continue;
    const dailyNow = daily.filter(candle => candle.closeTime <= now).slice(-150);
    const weeklyNow = weekly.filter(candle => candle.closeTime <= now).slice(-80);
    const price = candles[i].close;
    const btcIndex = btcByClose.get(now);
    const market: MarketSnapshot = { symbol, asOf: new Date(now).toISOString(), price,
      change24h: changeOverDay(candles, i, timeframe), volume24hUsd: null,
      btcChange24h: btc && btcIndex !== undefined ? changeOverDay(btc, btcIndex, timeframe) : null,
      fundingRate: null, openInterestUsd: null, fearGreed: null, timeframe,
      ...indicators,
      structure: withHigherTimeframeLevels(indicators.structure, price, indicators.atr, dailyNow, weeklyNow),
      higherTrend: higherTimeframeTrend(timeframe, dailyNow, weeklyNow),
      recentCandles: window.slice(-24) };
    let lead: AnalysisSetup | undefined;
    try { lead = buildTechnicalAnalysis({ ...input, symbol, timeframe }, market).setups[0]; } catch { continue; }
    if (!lead?.quality) continue;
    const result = simulatePlan(lead, candles.slice(i + 1), { maxWait, maxHold, feePct: options.feePct });
    trades.push({ symbol, at: market.asOf, direction: lead.direction, entryType: lead.entryType ?? 'BREAKOUT',
      score: lead.quality.score, grade: lead.quality.grade, status: lead.quality.status, ...result });
  }
  return trades;
}

export type Bucket = { signals: number; filled: number; fillRate: number; wins: number; losses: number; timeouts: number;
  winRate: number | null; avgR: number | null; profitFactor: number | null;
  // 95% interval of the average R. If it contains 0 the result cannot be told apart from luck.
  ci95: [number, number] | null };

export function summarize(trades: BacktestTrade[]): Bucket {
  const filled = trades.filter(trade => trade.filled && trade.r !== null);
  const wins = filled.filter(trade => trade.outcome === 'TP1').length;
  const losses = filled.filter(trade => trade.outcome === 'SL').length;
  const gains = filled.reduce((sum, trade) => sum + Math.max(0, trade.r!), 0);
  const drawdowns = filled.reduce((sum, trade) => sum + Math.max(0, -trade.r!), 0);
  const round = (value: number) => Math.round(value * 100) / 100;
  return { signals: trades.length, filled: filled.length, fillRate: trades.length ? round(filled.length / trades.length * 100) : 0,
    wins, losses, timeouts: filled.length - wins - losses,
    winRate: filled.length ? round(wins / filled.length * 100) : null,
    avgR: filled.length ? round(filled.reduce((sum, trade) => sum + trade.r!, 0) / filled.length) : null,
    profitFactor: drawdowns > 0 ? round(gains / drawdowns) : null,
    ci95: filled.length >= 2 ? (() => {
      const mean = filled.reduce((sum, trade) => sum + trade.r!, 0) / filled.length;
      const variance = filled.reduce((sum, trade) => sum + (trade.r! - mean) ** 2, 0) / (filled.length - 1);
      const margin = 1.96 * Math.sqrt(variance / filled.length);
      return [round(mean - margin), round(mean + margin)] as [number, number];
    })() : null };
}

// Splits trades at the median signal time, to check that a result holds in both halves of the data.
export function splitHalves(trades: BacktestTrade[]): { first: BacktestTrade[]; second: BacktestTrade[] } {
  const times = trades.map(trade => trade.at).sort();
  const middle = times[Math.floor(times.length / 2)];
  return { first: trades.filter(trade => trade.at < middle), second: trades.filter(trade => trade.at >= middle) };
}

export function groupSummary(trades: BacktestTrade[], key: (trade: BacktestTrade) => string): Record<string, Bucket> {
  const groups = new Map<string, BacktestTrade[]>();
  for (const trade of trades) groups.set(key(trade), [...(groups.get(key(trade)) ?? []), trade]);
  return Object.fromEntries([...groups.entries()].sort().map(([name, items]) => [name, summarize(items)]));
}
