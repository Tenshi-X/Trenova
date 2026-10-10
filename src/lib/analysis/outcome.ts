import type { AnalysisSetup, Candle } from './core';

export type SetupOutcome = 'uncertain' | 'stop_loss' | 'target_1' | 'open' | 'not_entered';

export function evaluateSetupOutcome(setup: AnalysisSetup, candles: Candle[]): SetupOutcome {
  let entered = false;
  for (const candle of candles) {
    const wasEntered = entered;
    if (!entered && candle.low <= setup.entryHigh && candle.high >= setup.entryLow) entered = true;
    if (!entered) continue;
    const hitStop = setup.direction === 'LONG' ? candle.low <= setup.stopLoss : candle.high >= setup.stopLoss;
    const hitTarget = setup.direction === 'LONG' ? candle.high >= setup.takeProfit1 : candle.low <= setup.takeProfit1;
    if (hitStop && hitTarget) return 'uncertain';
    if (!wasEntered && (hitStop || hitTarget) && (candle.open < setup.entryLow || candle.open > setup.entryHigh)) return 'uncertain';
    if (hitStop) return 'stop_loss';
    if (hitTarget) return 'target_1';
  }
  return entered ? 'open' : 'not_entered';
}
