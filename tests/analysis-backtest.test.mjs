import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAnalysisInput } from '../src/lib/analysis/core.ts';
import { simulatePlan, runBacktest, summarize, groupSummary } from './fixtures/backtest.mjs';

const H4 = 4 * 3600000;
const c = (i, o, h, l, cl, step = H4) => ({ openTime: i * step, closeTime: (i + 1) * step - 1, open: o, high: h, low: l, close: cl, volume: 100 });
const long = { direction: 'LONG', entryLow: 99, entryHigh: 100, stopLoss: 95, takeProfit1: 110, takeProfit2: 115,
  entryType: 'BREAKOUT', cancelAt: 90, execution: 'CONDITIONAL' };
const short = { direction: 'SHORT', entryLow: 100, entryHigh: 101, stopLoss: 106, takeProfit1: 90, takeProfit2: 85,
  entryType: 'BREAKOUT', cancelAt: 112, execution: 'CONDITIONAL' };

test('breakout long: close above, retest, then TP1 is a win of reward/risk minus fees', () => {
  const result = simulatePlan(long, [c(0, 98, 101, 98, 101), c(1, 101, 102, 99.5, 101), c(2, 101, 111, 100.5, 110)], { feePct: 0 });
  assert.equal(result.outcome, 'TP1');
  assert.equal(result.filled, true);
  assert.ok(Math.abs(result.r - 2) < 1e-9); // risk 5, reward 10
});

test('a retest candle that also hits the stop counts as a loss; same-candle stop and target count as a loss', () => {
  const stopFirst = simulatePlan(long, [c(0, 98, 101, 98, 101), c(1, 101, 102, 94, 96)], { feePct: 0 });
  assert.equal(stopFirst.outcome, 'SL');
  assert.equal(stopFirst.r, -1);
  const both = simulatePlan(long, [c(0, 98, 101, 98, 101), c(1, 101, 102, 99.5, 101), c(2, 101, 112, 94, 100)], { feePct: 0 });
  assert.equal(both.outcome, 'SL');
});

test('plans are cancelled or never triggered exactly as written', () => {
  assert.equal(simulatePlan(long, [c(0, 98, 99, 89, 89)]).outcome, 'CANCELLED');
  assert.equal(simulatePlan(long, [c(0, 98, 99, 97, 98), c(1, 98, 99.5, 97, 99)]).outcome, 'NOT_TRIGGERED');
  // Trigger and retest inside one candle is not enough: one step per candle.
  assert.equal(simulatePlan(long, [c(0, 98, 103, 99.5, 101)], {}).outcome, 'NOT_TRIGGERED');
});

test('short mirror, pullback needs a zone test first, timeout closes at market', () => {
  const win = simulatePlan(short, [c(0, 102, 102, 99, 99), c(1, 99, 100.5, 98, 99), c(2, 99, 99.5, 89, 90)], { feePct: 0 });
  assert.equal(win.outcome, 'TP1');
  const pull = { ...long, entryType: 'PULLBACK', stopLoss: 95 };
  // Pullback long: test zone (low <= 100), close above 100, retest.
  const steps = simulatePlan(pull, [c(0, 103, 103, 99.5, 101), c(1, 101, 102, 101, 102), c(2, 102, 102, 99.5, 101), c(3, 101, 111, 101, 110)], { feePct: 0 });
  assert.equal(steps.outcome, 'TP1');
  const timeout = simulatePlan(long, [c(0, 98, 101, 98, 101), c(1, 101, 102, 99.5, 101), c(2, 101, 103, 100, 102)], { feePct: 0, maxHold: 1 });
  assert.equal(timeout.outcome, 'TIMEOUT');
  assert.ok(Math.abs(timeout.r - 0.4) < 1e-9); // (102-100)/5
});

test('summaries count wins, losses and expectancy', () => {
  const trades = [
    { filled: true, outcome: 'TP1', r: 2, score: 80, grade: 'HIGH', status: 'READY', direction: 'LONG' },
    { filled: true, outcome: 'SL', r: -1, score: 80, grade: 'HIGH', status: 'READY', direction: 'LONG' },
    { filled: true, outcome: 'SL', r: -1, score: 50, grade: 'MEDIUM', status: 'WATCH', direction: 'SHORT' },
    { filled: false, outcome: 'NOT_TRIGGERED', r: null, score: 50, grade: 'MEDIUM', status: 'WATCH', direction: 'SHORT' },
  ];
  const all = summarize(trades);
  assert.deepEqual([all.signals, all.filled, all.wins, all.losses], [4, 3, 1, 2]);
  assert.equal(all.winRate, 33.33);
  assert.equal(all.avgR, 0);
  assert.equal(all.profitFactor, 1);
  assert.equal(groupSummary(trades, t => t.grade).HIGH.winRate, 50);
});

const input = parseAnalysisInput({ requestKey: '11111111-1111-4111-8111-111111111111', symbol: 'TEST',
  language: 'id', tradingStyle: 'intraday', timeframe: '4h', riskTolerance: 'Medium Risk',
  strategyFocus: 'All-Round', indicatorPref: 'Default', targetRR: '1:2' });
const wave = (n, step, period) => Array.from({ length: n }, (_, i) => {
  const mid = 100 + 8 * Math.sin(i / period * Math.PI * 2) + i * 0.02;
  return c(i, mid, mid + 1.5, mid - 1.5, mid + 0.3, step);
});
const series = (n) => ({ symbol: 'TEST', timeframe: '4h', candles: wave(n, H4, 24),
  daily: wave(Math.ceil(n / 6), 86400000, 6), weekly: wave(Math.ceil(n / 42) + 40, 7 * 86400000, 10), btc: wave(n, H4, 30) });

test('walk-forward run produces graded trades and never uses candles after the signal for the score', () => {
  const full = runBacktest(series(500), input);
  assert.ok(full.length > 10);
  for (const trade of full) {
    assert.ok(trade.score >= 0 && trade.score <= 100);
    assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(trade.grade));
    assert.ok(['READY', 'WATCH', 'NO_TRADE'].includes(trade.status));
  }
  const cut = runBacktest(series(500), input).slice(0, 5);
  const early = runBacktest({ ...series(500), candles: series(500).candles.slice(0, 200) }, input).slice(0, 5);
  // Same signal times produce the same score and direction regardless of what happens later.
  early.forEach((trade, i) => {
    const same = cut.find(item => item.at === trade.at);
    assert.ok(same, 'signal time present in the longer run');
    assert.equal(same.score, trade.score);
    assert.equal(same.direction, trade.direction);
  });
});

test('summary reports a 95% interval and halves split by time', async () => {
  const { splitHalves } = await import('./fixtures/backtest.mjs');
  const trades = Array.from({ length: 40 }, (_, i) => ({ filled: true, outcome: i % 3 === 0 ? 'TP1' : 'SL', r: i % 3 === 0 ? 2 : -1,
    at: new Date(2026, 0, 1 + i).toISOString(), score: 80, grade: 'HIGH', status: 'READY', direction: 'LONG' }));
  const bucket = summarize(trades);
  assert.ok(bucket.ci95[0] < bucket.avgR && bucket.avgR < bucket.ci95[1]);
  assert.equal(summarize(trades.slice(0, 1)).ci95, null);
  const { first, second } = splitHalves(trades);
  assert.equal(first.length + second.length, 40);
  assert.ok(first.every(t => t.at < second[0].at));
});
