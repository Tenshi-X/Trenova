import test from 'node:test';
import assert from 'node:assert/strict';
import { planItemsFor, refreshPlanTracking, trackItem } from './fixtures/tracking-service.mjs';

const H4 = 4 * 3600000;
const base = Math.floor((Date.now() - 10 * 86400000) / H4) * H4;
const candle = (i, o, h, l, cl, step = H4, origin = base) => ({ openTime: origin + i * step, closeTime: origin + (i + 1) * step - 1, open: o, high: h, low: l, close: cl, volume: 100 });
const row = (c) => [c.openTime, String(c.open), String(c.high), String(c.low), String(c.close), String(c.volume), c.closeTime, '0', 0, '0', '0', '0'];
const setup = { direction: 'LONG', entryLow: 99, entryHigh: 100, stopLoss: 95, takeProfit1: 110, takeProfit2: 115,
  entryType: 'BREAKOUT', cancelAt: 90, execution: 'CONDITIONAL' };
const asOf = base + 2 * H4 + 1000; // inside candle 2, so candle 3 is the first to close afterwards
const analysis = (overrides = {}) => ({ id: 'a1', user_id: 'u1', coin_symbol: 'BTC', timeframe: '4h', created_at: new Date(asOf).toISOString(),
  analysis_json: { version: 2, verdict: 'WAIT', setups: [setup], market: { asOf: new Date(asOf).toISOString() },
    expiresAt: new Date(asOf + 6 * H4).toISOString() }, ...overrides });

function fakeAdmin(existing = []) {
  const saved = [];
  return { saved, admin: { from() { return {
    select() { return { in: async () => ({ data: existing, error: null }) }; },
    upsert: async (payload) => { saved.push(...payload); return { error: null }; },
  }; } } };
}

function stubFetch(datasets, { fail = false } = {}) {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (fail) return { ok: false, json: async () => null };
    const u = new URL(String(url));
    const interval = u.searchParams.get('interval');
    const start = Number(u.searchParams.get('startTime'));
    const rows = (datasets[interval] ?? []).filter(c => c.openTime >= start).map(row);
    return { ok: true, json: async () => rows };
  };
  return calls;
}

test('plan items are built from saved analyses and invalid ones are ignored', () => {
  const items = planItemsFor(analysis());
  assert.equal(items.length, 1);
  assert.equal(items[0].waitCandles, 6);
  assert.equal(items[0].symbol, 'BTC');
  assert.deepEqual(planItemsFor(analysis({ coin_symbol: null })), []);
  assert.deepEqual(planItemsFor(analysis({ timeframe: '3h' })), []);
  assert.deepEqual(planItemsFor(analysis({ analysis_json: { version: 1, setups: [setup] } })), []);
  assert.deepEqual(planItemsFor(analysis({ analysis_json: { version: 2, setups: [{ ...setup, stopLoss: -1 }], market: {} } })), []);
  assert.deepEqual(planItemsFor(analysis({ analysis_json: { version: 2, setups: [{ ...setup, direction: 'UP' }], market: {} } })), []);
  const legacy = planItemsFor(analysis({ analysis_json: { version: 2, setups: [setup], market: { asOf: new Date(asOf).toISOString() } } }));
  assert.equal(legacy[0].waitCandles, 6); // no expiresAt on archived reports
});

test('refresh stores a waiting plan, then follows it to TP2 using only candles closed after the analysis', async () => {
  const candles = [candle(0, 98, 99, 97, 98), candle(1, 98, 99, 97, 98), candle(2, 98, 99, 97, 98),
    candle(3, 98, 101, 98, 101), candle(4, 101, 102, 99.5, 101), candle(5, 101, 111, 100.5, 110), candle(6, 110, 116, 109, 115)];
  stubFetch({ '4h': candles.slice(0, 3) });
  let fake = fakeAdmin();
  let out = await refreshPlanTracking(fake.admin, [analysis()]);
  assert.equal(out.records[0].status, 'WAITING_TRIGGER');
  assert.equal(out.records[0].final, false);
  assert.equal(fake.saved.length, 1);
  assert.ok(!('previous_status' in fake.saved[0]));
  assert.ok(!('notified_status' in fake.saved[0]));
  stubFetch({ '4h': candles });
  fake = fakeAdmin([{ analysis_id: 'a1', setup_index: 0, status: 'WAITING_TRIGGER', final: false, notified_status: null }]);
  out = await refreshPlanTracking(fake.admin, [analysis()]);
  assert.equal(out.records[0].status, 'TP2');
  assert.equal(out.records[0].final, true);
  assert.equal(out.records[0].previous_status, 'WAITING_TRIGGER');
  assert.equal(out.records[0].direction, 'LONG');
  assert.equal(out.records[0].r, 2);
});

test('final plans are not recomputed and provider failure keeps the stored result', async () => {
  const calls = stubFetch({ '4h': [] });
  let fake = fakeAdmin([{ analysis_id: 'a1', setup_index: 0, status: 'SL', final: true, notified_status: 'SL' }]);
  let out = await refreshPlanTracking(fake.admin, [analysis()]);
  assert.equal(out.records.length, 0);
  assert.equal(calls.length, 0);
  stubFetch({}, { fail: true });
  fake = fakeAdmin();
  out = await refreshPlanTracking(fake.admin, [analysis()]);
  assert.equal(out.unavailable, 1);
  assert.equal(out.records.length, 0);
  assert.equal(fake.saved.length, 0);
});

test('a candle holding both stop and TP1 is settled on a finer timeframe', async () => {
  const coarse = [candle(3, 98, 101, 98, 101), candle(4, 101, 102, 99.5, 101), candle(5, 101, 112, 94, 100)];
  const M15 = 900000;
  const fineStart = coarse[2].openTime;
  const fine = (target) => Array.from({ length: 16 }, (_, i) => candle(i, 101, 101.5, 100.5, 101, M15, fineStart))
    .map((c, i) => i === (target ? 3 : 6) ? { ...c, high: 111 } : i === (target ? 6 : 3) ? { ...c, low: 94 } : c);
  const item = planItemsFor(analysis())[0];
  stubFetch({ '4h': coarse, '15m': fine(true) });
  assert.equal((await trackItem(item, coarse)).status, 'TP1');
  stubFetch({ '4h': coarse, '15m': fine(false) });
  const stopFirst = await trackItem(item, coarse);
  assert.equal(stopFirst.status, 'SL');
  assert.equal(stopFirst.ambiguous, false);
  stubFetch({ '4h': coarse, '15m': [] });
  const unsettled = await trackItem(item, coarse);
  assert.equal(unsettled.status, 'SL');
  assert.equal(unsettled.ambiguous, true);
});

test('plans on the same coin and timeframe share one candle request', async () => {
  const candles = [candle(0, 98, 99, 97, 98), candle(1, 98, 99, 97, 98), candle(2, 98, 99, 97, 98), candle(3, 98, 99, 97, 98)];
  const calls = stubFetch({ '4h': candles });
  const fake = fakeAdmin();
  const out = await refreshPlanTracking(fake.admin, [analysis({ id: 'a1' }), analysis({ id: 'a2' })]);
  assert.equal(out.records.length, 2);
  assert.equal(calls.length, 1);
});
