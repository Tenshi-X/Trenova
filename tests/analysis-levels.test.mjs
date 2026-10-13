import test from 'node:test';
import assert from 'node:assert/strict';
import { withHigherTimeframeLevels, parseAnalysisInput } from '../src/lib/analysis/core.ts';
import { buildTechnicalAnalysis } from './fixtures/report.mjs';
import { technicalMarket } from './fixtures/analysis.mjs';

const DAY = 86400000;
const candle = (i, step, low, high) => ({ openTime: i * step, closeTime: (i + 1) * step - 1, open: (low + high) / 2,
  high, low, close: (low + high) / 2, volume: 100 });
// Zig-zag between ~90 and ~110 (within plan range of a price of 100) so both swing lows (~90) and swing highs (~110) repeat.
const zigzag = (count, step) => Array.from({ length: count }, (_, i) => {
  const phase = i % 8;
  const mid = 100 + 8 * Math.sin((phase / 8) * Math.PI * 2);
  return candle(i, step, mid - 2, mid + 2);
});
const structure = { support: 98, resistance: 102, rangeLow: 97, rangeHigh: 103, change5CandlesPct: 0, atrPct: 2, trend: 'neutral' };

test('higher timeframe levels replace local support/resistance and report their source', () => {
  const daily = zigzag(120, DAY);
  const result = withHigherTimeframeLevels(structure, 100, 2, daily, []);
  assert.ok(result.support < 100 && result.resistance > 100);
  assert.equal(result.supportSource.tf, 'D1');
  assert.ok(result.supportSource.touches >= 2);
  assert.equal(result.resistanceSource.tf, 'D1');
});

test('falls back to local levels when no daily/weekly data or the level is too far', () => {
  const none = withHigherTimeframeLevels(structure, 100, 2, [], []);
  assert.equal(none.support, 98);
  assert.equal(none.supportSource.tf, 'local');
  // Price far above every pivot: nothing is within plausible plan range.
  const far = withHigherTimeframeLevels(structure, 300, 2, zigzag(120, DAY), []);
  assert.equal(far.support, 98);
  assert.equal(far.supportSource.tf, 'local');
});

test('a single daily pivot is not enough, a weekly pivot is', () => {
  const flat = Array.from({ length: 40 }, (_, i) => candle(i, DAY, 99.5, 100.5));
  flat[20] = candle(20, DAY, 95, 100.5);
  const one = withHigherTimeframeLevels(structure, 100, 2, flat, []);
  assert.equal(one.supportSource.tf, 'local');
  const weekly = Array.from({ length: 20 }, (_, i) => candle(i, 7 * DAY, 99.5, 100.5));
  weekly[10] = candle(10, 7 * DAY, 95, 100.5);
  const withWeekly = withHigherTimeframeLevels(structure, 100, 2, flat, weekly);
  assert.equal(withWeekly.supportSource.tf, 'W1');
  assert.ok(Math.abs(withWeekly.support - 95) < 0.5);
});

test('breakout plans cancel on the opposite structure level, never on an already-true condition', () => {
  const input = parseAnalysisInput({ requestKey: '11111111-1111-4111-8111-111111111111', symbol: 'XPL',
    language: 'en', tradingStyle: 'intraday', timeframe: '4h', riskTolerance: 'High Risk',
    strategyFocus: 'Breakout', indicatorPref: 'Default', targetRR: '1:2' });
  const market = { ...technicalMarket, price: 100, atr: 2, ema20: 99, structure: { ...technicalMarket.structure, support: 98, resistance: 102 } };
  const report = buildTechnicalAnalysis(input, market);
  for (const setup of report.setups) {
    const long = setup.direction === 'LONG';
    const level = long ? 98 : 102;
    assert.ok(setup.invalidation.includes(String(level)), setup.invalidation);
    // The cancel level is on the far side of the current price.
    assert.ok(long ? level < market.price : level > market.price);
    assert.equal(typeof setup.distanceToEntryPct, 'number');
  }
});
