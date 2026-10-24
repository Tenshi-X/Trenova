import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFundingHistory, parseOpenInterestHistory, parseLongShort, parseTakerRatio } from '../src/lib/derivs-history.ts';

test('funding history is converted to percent, sorted, and bad rows dropped', () => {
  const out = parseFundingHistory([
    { fundingRate: '0.0001', fundingTime: 2000 }, { fundingRate: '-0.00025', fundingTime: 1000 },
    { fundingRate: 'x', fundingTime: 3000 }, { fundingTime: 4000 }, null, 'row']);
  assert.deepEqual(out.map(p => p.time), [1000, 2000]);
  assert.ok(Math.abs(out[0].value + 0.025) < 1e-9);
  assert.ok(Math.abs(out[1].value - 0.01) < 1e-9);
  assert.deepEqual(parseFundingHistory(undefined), []);
});

test('open interest, long/short and taker series parse and validate', () => {
  assert.deepEqual(parseOpenInterestHistory([{ sumOpenInterestValue: '1500.5', timestamp: 5 }, { sumOpenInterestValue: '0', timestamp: 6 }]), [{ time: 5, value: 1500.5 }]);
  assert.deepEqual(parseLongShort([{ longShortRatio: '1.25', longAccount: '0.5556', shortAccount: '0.4444', timestamp: 9 }, { longShortRatio: '0', longAccount: '1', shortAccount: '0', timestamp: 10 }]),
    [{ time: 9, ratio: 1.25, long: 0.5556, short: 0.4444 }]);
  assert.deepEqual(parseTakerRatio([{ buySellRatio: '0.8', timestamp: 3 }, { buySellRatio: 'n/a', timestamp: 4 }]), [{ time: 3, value: 0.8 }]);
});
