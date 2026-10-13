import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/lib/screener-market.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
new Function('exports', 'require', 'module', compiled)(mod.exports, require, mod);
const lib = mod.exports;

// OKX candles: newest first, [ts, o, h, l, c]
function candlesJson(closes) {
  const rows = closes.map((c, i) => [String(i), String(c), String(c * 1.01), String(c * 0.99), String(c)]).reverse();
  return { code: '0', data: rows };
}
const asResponse = body => ({ ok: true, status: 200, json: async () => body });

test('parseOkxTickers: one row per symbol, no stablecoins, USD volume, sorted', () => {
  const json = { code: '0', data: [
    { instId: 'BTC-USDT-SWAP', last: '100', open24h: '90', high24h: '110', low24h: '85', volCcy24h: '10' },
    { instId: 'BTC-USD-SWAP', last: '100', open24h: '90', high24h: '110', low24h: '85', volCcy24h: '999' },
    { instId: 'USDC-USDT-SWAP', last: '1', open24h: '1', high24h: '1', low24h: '1', volCcy24h: '99999' },
    { instId: 'ETH-USDT-SWAP', last: '10', open24h: '10', high24h: '11', low24h: '9', volCcy24h: '500' },
    { instId: 'BAD-USDT-SWAP', last: '', open24h: '1', volCcy24h: '1' },
  ] };
  const out = lib.parseOkxTickers(json);
  assert.deepEqual(out.map(c => c.symbol), ['ETH', 'BTC']);
  assert.equal(out[1].volume24h, 1000);
  assert.ok(Math.abs(out[1].priceChangePercent - (100 / 9)) < 1e-9);
  assert.equal(lib.parseOkxTickers(json, 1).length, 1);
  assert.deepEqual(lib.parseOkxTickers({ code: '1' }), []);
});

test('parseOkxCandles returns oldest first', () => {
  const c = lib.parseOkxCandles(candlesJson([1, 2, 3]));
  assert.deepEqual(c.map(x => x.close), [1, 2, 3]);
  assert.deepEqual(lib.parseOkxCandles(null), []);
});

test('computeIndicators: uptrend is bullish, downtrend bearish, short history null', () => {
  // accelerating moves, so the MACD histogram is clearly non-zero (a perfectly straight line gives ~0)
  const up = Array.from({ length: 100 }, (_, i) => 100 * Math.pow(1.01, i));
  const down = Array.from({ length: 100 }, (_, i) => 200 - 0.02 * i * i);
  const a = lib.computeIndicators(lib.parseOkxCandles(candlesJson(up)));
  const b = lib.computeIndicators(lib.parseOkxCandles(candlesJson(down)));
  assert.equal(a.rating, 'STR BULL');
  assert.equal(a.structure, 'Breakout');
  assert.equal(a.score, 100);
  assert.ok(a.rsi > 50);
  assert.equal(b.rating, 'STR BEAR');
  assert.equal(b.structure, 'Breakdown');
  assert.equal(b.score, 0);
  assert.equal(lib.computeIndicators(lib.parseOkxCandles(candlesJson([1, 2, 3]))), null);
});

test('getIndicators: caches, and backs off after failure', async () => {
  lib.resetScreenerCache();
  const up = Array.from({ length: 100 }, (_, i) => 100 + i);
  let calls = 0;
  const fetcher = async url => {
    calls++;
    if (url.includes('BAD-USDT')) return { ok: false, status: 500, json: async () => ({}) };
    return asResponse(candlesJson(up));
  };
  const opts = { gapMs: 0 };
  const first = await lib.getIndicators(['BTC', 'BAD'], fetcher, opts);
  assert.ok(first.has('BTC'));
  assert.ok(!first.has('BAD'));
  const before = calls;
  const second = await lib.getIndicators(['BTC', 'BAD'], fetcher, opts);
  assert.ok(second.has('BTC'));
  assert.equal(calls, before, 'cached + failure backoff: no new requests');
});
