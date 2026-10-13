import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/lib/market-global.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
new Function('exports', 'require', 'module', compiled)(mod.exports, require, mod);
const lib = mod.exports;

const cg = { data: { market_cap_percentage: { btc: 59.76, eth: 11.2, usdt: 6.1 }, total_market_cap: { usd: 2.9e12 }, market_cap_change_percentage_24h_usd: -1.4 } };
const ok = body => async () => ({ ok: true, status: 200, json: async () => body });

test('parseCoinGeckoGlobal reads dominance, rejects junk', () => {
  const g = lib.parseCoinGeckoGlobal(cg);
  assert.equal(g.btcDominance, 59.76);
  assert.equal(g.usdtDominance, 6.1);
  assert.equal(g.totalMarketCapUsd, 2.9e12);
  assert.equal(g.marketCapChange24h, -1.4);
  assert.equal(lib.parseCoinGeckoGlobal({ data: { market_cap_percentage: { btc: 150 } } }), null);
  assert.equal(lib.parseCoinGeckoGlobal(null), null);
  assert.equal(lib.parseCoinGeckoGlobal({ status: { error_code: 429 } }), null);
});

test('coinbase price + premium', () => {
  assert.equal(lib.parseCoinbasePrice({ price: '84010.5' }), 84010.5);
  assert.equal(lib.parseCoinbasePrice({}), null);
  assert.ok(Math.abs(lib.coinbasePremium(84100, 84000) - (100 / 84000) * 100) < 1e-9);
  assert.equal(lib.coinbasePremium(null, 84000), null);
  assert.equal(lib.coinbasePremium(84100, 0), null);
  assert.equal(lib.coinbasePremium(90000, 84000), null, 'a 7% gap is bad data, not a premium');
});

test('getGlobalMarket caches, serves stale on failure, null when never succeeded', async () => {
  lib.resetGlobalCache();
  let calls = 0;
  const fetcher = async (...a) => { calls++; return ok(cg)(...a); };
  assert.equal((await lib.getGlobalMarket(fetcher)).btcDominance, 59.76);
  await lib.getGlobalMarket(fetcher);
  assert.equal(calls, 1);
  const realNow = Date.now;
  try {
    Date.now = () => realNow() + 10 * 60_000;
    const failing = async () => { throw new Error('down'); };
    assert.equal((await lib.getGlobalMarket(failing)).btcDominance, 59.76);
    Date.now = () => realNow() + 2 * 3600_000;
    lib.resetGlobalCache();
    assert.equal(await lib.getGlobalMarket(failing), null);
  } finally { Date.now = realNow; lib.resetGlobalCache(); }
});
