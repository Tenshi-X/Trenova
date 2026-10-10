import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import sharp from 'sharp';
import * as core from '../src/lib/analysis/core.ts';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/app/api/dashboard/analyze/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
const userId = '11111111-1111-4111-8111-111111111111';
const input = { requestKey: userId, symbol: 'BTC', coinName: 'Bitcoin', language: 'id', tradingStyle: 'intraday',
  timeframe: '1h', riskTolerance: 'Medium Risk', strategyFocus: 'All-Round', indicatorPref: 'Default', targetRR: '1:2', context: '' };
const market = { symbol: 'BTC', asOf: new Date().toISOString(), price: 100, change24h: 2, volume24hUsd: 1000000,
  btcChange24h: 2, fundingRate: null, openInterestUsd: null, fearGreed: null, timeframe: '1h',
  atr: 2, rsi: 60, ema20: 98, volumeRatio: 1.2, recentCandles: [] };

function route({ loggedIn = true, active = true, existingRun = null, snapshot = market,
  providerUsage = { promptTokenCount: 500, candidatesTokenCount: 200, thoughtsTokenCount: 512 },
  output = JSON.stringify({ verdict: 'WAIT', reason: 'Belum ada konfirmasi entry.', wait_for: 'Tunggu breakout.', setups: [] }) } = {}) {
  const calls = [];
  const providerBodies = [];
  const admin = {
    from(table) {
      const chain = {
        select() { return chain; }, eq() { return chain; }, gte() { return chain; },
        update() { if (table === 'analysis_control') calls.push('pause_analysis'); return chain; },
        single: async () => ({ data: table === 'analysis_results'
          ? { id: userId, analysis_json: { verdict: 'WAIT', cached: true } }
          : { enabled: true, rollout_percent: 100, max_cost_idr: 500, fx_safety_rate: 20000 } }),
        maybeSingle: async () => ({ data: existingRun }),
        then(resolve) { resolve(table === 'analysis_runs' ? { count: 0 } : { data: null }); },
      };
      return chain;
    },
    async rpc(name) { calls.push(name); return { data: name === 'reserve_analysis'
      ? { status: 'reserved', run_id: userId, existing: false } : userId }; },
  };
  const context = loggedIn ? { user: { id: userId }, profile: { role: 'user',
    subscription_end_at: new Date(Date.now() + (active ? 86400000 : -86400000)).toISOString() }, admin } : null;
  const localRequire = (name) => {
    if (name === '@/lib/authz') return { getSessionProfile: async () => context, isActiveSubscriber: (profile) => new Date(profile.subscription_end_at) > new Date() };
    if (name === '@/lib/analysis/core') return core;
    if (name === '@/lib/analysis/market') return { getMarketSnapshot: async () => snapshot };
    return require(name);
  };
  const mockFetch = async (_url, options) => {
    calls.push('gemini');
    providerBodies.push(JSON.parse(options.body));
    return Response.json({ candidates: [{ content: { parts: [{ text: output }] } }],
      usageMetadata: providerUsage });
  };
  const compiledModule = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', compiled)(localRequire, compiledModule, compiledModule.exports, mockFetch);
  return { handler: compiledModule.exports.POST, calls, providerBodies };
}

const request = (body = input) => new Request('http://localhost/api/dashboard/analyze', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('rejects no session and expired accounts before provider call', async () => {
  for (const [options, status] of [[{ loggedIn: false }, 401], [{ active: false }, 403]]) {
    const { handler, calls } = route(options);
    assert.equal((await handler(request())).status, status);
    assert.deepEqual(calls, []);
  }
});

test('malformed model JSON becomes WAIT without a second paid call', async () => {
  const priorKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'unit-test-key';
  try {
    const { handler, calls } = route({ output: '{broken' });
    const response = await handler(request());
    const payload = await response.json();
    assert.equal(payload.result.verdict, 'WAIT');
    assert.equal(payload.charged, false);
    assert.deepEqual(calls, ['reserve_analysis', 'gemini', 'fail_analysis']);
  } finally { if (priorKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = priorKey; }
});

test('oversized image is rejected before reserve or Gemini', async () => {
  const { handler, calls } = route();
  const image = `data:image/jpeg;base64,${Buffer.alloc(2100000).toString('base64')}`;
  assert.equal((await handler(request({ ...input, image }))).status, 400);
  assert.deepEqual(calls, []);
});

async function withProviderKey(action) {
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'unit-test-key';
  try { await action(); }
  finally { if (previous === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previous; }
}

test('valid WAIT is persisted using one provider call', () => withProviderKey(async () => {
  const { handler, calls } = route();
  const response = await handler(request());
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.charged, true);
  assert.equal(payload.result.verdict, 'WAIT');
  assert.deepEqual(payload.result.setups, []);
  assert.deepEqual(calls, ['reserve_analysis', 'gemini', 'finish_analysis']);
}));

test('completed idempotency key reuses result without reserving or calling Gemini', async () => {
  const { handler, calls } = route({ existingRun: { status: 'completed', result_id: userId } });
  const payload = await (await handler(request())).json();
  assert.equal(payload.reused, true);
  assert.equal(payload.result.cached, true);
  assert.deepEqual(calls, []);
});

test('unavailable market is rejected before reserving or calling Gemini', async () => {
  const { handler, calls } = route({ snapshot: null });
  assert.equal((await handler(request())).status, 422);
  assert.deepEqual(calls, []);
});

test('actual token overrun pauses future analyses and refunds without retry', () => withProviderKey(async () => {
  const { handler, calls } = route({ providerUsage: {
    promptTokenCount: 4001, candidatesTokenCount: 200, thoughtsTokenCount: 512,
  } });
  assert.equal((await handler(request())).status, 503);
  assert.deepEqual(calls, ['reserve_analysis', 'gemini', 'pause_analysis', 'fail_analysis']);
}));

test('very wide charts are padded to a square before provider token accounting', () => withProviderKey(async () => {
  const image = await sharp({ create: { width: 768, height: 20, channels: 3, background: '#222222' } }).jpeg().toBuffer();
  const { handler, calls, providerBodies } = route();
  assert.equal((await handler(request({ ...input, image: `data:image/jpeg;base64,${image.toString('base64')}` }))).status, 200);
  const encoded = providerBodies[0].contents[0].parts[1].inlineData.data;
  const metadata = await sharp(Buffer.from(encoded, 'base64')).metadata();
  assert.equal(metadata.width, 768);
  assert.equal(metadata.height, 768);
  assert.equal(calls.filter((call) => call === 'gemini').length, 1);
}));
