import test from 'node:test';
import assert from 'node:assert/strict';
import { trackPlan, resolveWithFinerCandles, summarizeTracks } from '../src/lib/analysis/tracking.ts';
import { simulatePlan } from './fixtures/backtest.mjs';

const H4 = 4 * 3600000;
const c = (i, o, h, l, cl, step = H4) => ({ openTime: i * step, closeTime: (i + 1) * step - 1, open: o, high: h, low: l, close: cl, volume: 100 });
const long = { direction: 'LONG', entryLow: 99, entryHigh: 100, stopLoss: 95, takeProfit1: 110, takeProfit2: 115,
  entryType: 'BREAKOUT', cancelAt: 90, execution: 'CONDITIONAL' };
const short = { direction: 'SHORT', entryLow: 100, entryHigh: 101, stopLoss: 106, takeProfit1: 90, takeProfit2: 85,
  entryType: 'BREAKOUT', cancelAt: 112, execution: 'CONDITIONAL' };

test('a plan walks through trigger, retest, fill and TP1/TP2 with timestamps', () => {
  const candles = [c(0, 98, 99, 97, 98), c(1, 98, 101, 98, 101), c(2, 101, 102, 99.5, 101), c(3, 101, 111, 100.5, 110), c(4, 110, 116, 109, 115)];
  assert.equal(trackPlan(long, candles.slice(0, 1), { waitCandles: 6 }).status, 'WAITING_TRIGGER');
  const triggered = trackPlan(long, candles.slice(0, 2), { waitCandles: 6 });
  assert.equal(triggered.status, 'WAITING_RETEST');
  assert.equal(triggered.triggeredAt, candles[1].closeTime);
  const filled = trackPlan(long, candles.slice(0, 3), { waitCandles: 6 });
  assert.equal(filled.status, 'FILLED');
  assert.equal(filled.final, false);
  assert.equal(filled.filledAt, candles[2].closeTime);
  const tp1 = trackPlan(long, candles.slice(0, 4), { waitCandles: 6 });
  assert.equal(tp1.status, 'TP1');
  assert.equal(tp1.final, false);
  assert.ok(Math.abs(tp1.r - 2) < 1e-9);
  const tp2 = trackPlan(long, candles, { waitCandles: 6 });
  assert.equal(tp2.status, 'TP2');
  assert.equal(tp2.final, true);
  assert.equal(tp2.tp2At, candles[4].closeTime);
});

test('stop loss, cancellation and expiry are final', () => {
  const sl = trackPlan(long, [c(0, 98, 101, 98, 101), c(1, 101, 102, 94, 96)], { waitCandles: 6 });
  assert.equal(sl.status, 'SL'); assert.equal(sl.final, true); assert.equal(sl.r, -1);
  assert.equal(trackPlan(long, [c(0, 98, 99, 89, 89)], { waitCandles: 6 }).status, 'CANCELLED');
  const none = Array.from({ length: 6 }, (_, i) => c(i, 98, 99, 97, 98));
  const expired = trackPlan(long, none, { waitCandles: 6 });
  assert.equal(expired.status, 'EXPIRED'); assert.equal(expired.final, true);
  // The wait window is judged by candles, so an entry after it never counts.
  const late = [...none, c(6, 98, 101, 98, 101), c(7, 101, 102, 99.5, 101)];
  assert.equal(trackPlan(long, late, { waitCandles: 6 }).status, 'EXPIRED');
});

test('trigger and retest never happen in the same candle; SHORT mirrors LONG', () => {
  assert.equal(trackPlan(long, [c(0, 98, 103, 99.5, 101)], { waitCandles: 6 }).status, 'WAITING_RETEST');
  const win = trackPlan(short, [c(0, 102, 102, 99, 99), c(1, 99, 100.5, 98, 99), c(2, 99, 99.5, 89, 90)], { waitCandles: 6 });
  assert.equal(win.status, 'TP1');
});

test('same-candle stop and target is a stop until a finer timeframe says otherwise', () => {
  const candles = [c(0, 98, 101, 98, 101), c(1, 101, 102, 99.5, 101), c(2, 101, 112, 94, 100)];
  const plain = trackPlan(long, candles, { waitCandles: 6 });
  assert.equal(plain.status, 'SL');
  assert.equal(plain.ambiguous, true);
  assert.deepEqual(plain.ambiguousWindow, { from: candles[2].openTime, to: candles[2].closeTime });
  const fine = [c(0, 101, 111, 101, 110, 900000), c(1, 110, 110, 94, 95, 900000)].map((x, i) => ({ ...x, openTime: candles[2].openTime + i * 900000, closeTime: candles[2].openTime + (i + 1) * 900000 - 1 }));
  assert.equal(resolveWithFinerCandles(long, fine), 'TP1');
  const settled = trackPlan(long, candles, { waitCandles: 6, resolutions: { [candles[2].openTime]: 'TP1' } });
  assert.equal(settled.status, 'TP1');
  assert.equal(settled.ambiguous, false);
  const stopFirst = trackPlan(long, candles, { waitCandles: 6, resolutions: { [candles[2].openTime]: 'SL' } });
  assert.equal(stopFirst.status, 'SL');
  assert.equal(stopFirst.ambiguous, false);
  assert.equal(resolveWithFinerCandles(long, [fine[1], fine[0]]), 'TP1');
  assert.equal(resolveWithFinerCandles(long, [c(0, 101, 102, 100, 101, 900000)]), null);
});

test('after TP1 a return to the stop ends tracking but keeps the TP1 win', () => {
  const candles = [c(0, 98, 101, 98, 101), c(1, 101, 102, 99.5, 101), c(2, 101, 111, 100.5, 110), c(3, 110, 111, 94, 95)];
  const out = trackPlan(long, candles, { waitCandles: 6 });
  assert.equal(out.status, 'TP1');
  assert.equal(out.stoppedAfterTp1, true);
  assert.equal(out.final, true);
});

test('pullback plans need a zone test, then a close beyond, then a retest; READY plans fill on touch', () => {
  const pull = { ...long, entryType: 'PULLBACK' };
  const steps = [c(0, 103, 103, 99.5, 101), c(1, 101, 102, 101, 102), c(2, 102, 102, 99.5, 101)];
  assert.equal(trackPlan(pull, steps.slice(0, 1), { waitCandles: 6 }).status, 'WAITING_TRIGGER');
  assert.equal(trackPlan(pull, steps.slice(0, 2), { waitCandles: 6 }).status, 'WAITING_RETEST');
  assert.equal(trackPlan(pull, steps, { waitCandles: 6 }).status, 'FILLED');
  const ready = { ...long, execution: 'READY', entryType: undefined };
  assert.equal(trackPlan(ready, [c(0, 101, 102, 99.5, 101)], { waitCandles: 6 }).status, 'FILLED');
});

// The live tracker must agree with the backtest simulator on random walks, otherwise the two numbers would not be comparable.
test('agrees with the backtest simulator on random price paths', () => {
  let seed = 7;
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  let compared = 0;
  for (let run = 0; run < 400; run++) {
    const isLong = rand() < 0.5;
    const setup = isLong ? { ...long, entryType: rand() < 0.5 ? 'BREAKOUT' : 'PULLBACK' } : { ...short, entryType: rand() < 0.5 ? 'BREAKOUT' : 'PULLBACK' };
    let price = 100 + (rand() - 0.5) * 6;
    const candles = [];
    for (let i = 0; i < 24; i++) {
      const open = price; const close = open + (rand() - 0.5) * 6;
      candles.push(c(i, open, Math.max(open, close) + rand() * 2, Math.min(open, close) - rand() * 2, close)); price = close;
    }
    const sim = simulatePlan(setup, candles, { maxWait: 6, maxHold: 200, feePct: 0 });
    const live = trackPlan(setup, candles, { waitCandles: 6 });
    compared++;
    if (sim.outcome === 'TP1') assert.ok(live.status === 'TP1' || live.status === 'TP2', `run ${run}`);
    else if (sim.outcome === 'SL') assert.equal(live.status, 'SL', `run ${run}`);
    else if (sim.outcome === 'CANCELLED') assert.equal(live.status, 'CANCELLED', `run ${run}`);
    else if (sim.outcome === 'NOT_TRIGGERED') assert.ok(live.status === 'EXPIRED', `run ${run} ${live.status}`);
    else if (sim.outcome === 'TIMEOUT') assert.equal(live.status, 'FILLED', `run ${run}`);
    if (sim.r !== null && sim.outcome === 'SL') assert.equal(live.r, -1);
  }
  assert.equal(compared, 400);
});

test('summary counts wins, losses, fill rate and average R without dividing by zero', () => {
  const empty = summarizeTracks([]);
  assert.equal(empty.winRatePct, null); assert.equal(empty.avgR, null); assert.equal(empty.fillRatePct, null);
  const stats = summarizeTracks([
    { status: 'TP1', r: 2, direction: 'LONG' }, { status: 'TP2', r: 2, direction: 'LONG' }, { status: 'SL', r: -1, direction: 'SHORT' },
    { status: 'FILLED', r: null, direction: 'SHORT' }, { status: 'EXPIRED', r: null, direction: 'LONG' },
    { status: 'CANCELLED', r: null, direction: 'SHORT' }, { status: 'WAITING_TRIGGER', r: null, direction: 'LONG' },
  ]);
  assert.equal(stats.plans, 7); assert.equal(stats.closed, 3); assert.equal(stats.wins, 2); assert.equal(stats.losses, 1);
  assert.equal(stats.winRatePct, 66.7); assert.equal(stats.avgR, 1); assert.equal(stats.waiting, 1);
  assert.equal(stats.filled, 4); assert.equal(stats.fillRatePct, 66.7); assert.equal(stats.tp2RatePct, 50);
  assert.deepEqual(stats.byDirection.SHORT, { closed: 1, wins: 0, winRatePct: 0 });
});
