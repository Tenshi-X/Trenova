import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import sharp from 'sharp';
import * as core from '../src/lib/analysis/core.ts';
import { aiExplanation, technicalMarket } from './fixtures/analysis.mjs';
import * as report from './fixtures/report.mjs';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/app/api/dashboard/analyze/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
const userId = '11111111-1111-4111-8111-111111111111';
const input = { requestKey: userId, symbol: 'BTC', coinName: 'Bitcoin', language: 'id', tradingStyle: 'intraday',
  timeframe: '1h', riskTolerance: 'Medium Risk', strategyFocus: 'All-Round', indicatorPref: 'Default', targetRR: '1:2', context: '' };
const market = technicalMarket;

function route({ loggedIn = true, active = true, existingRun = null, snapshot = market, confirmation = null, providerStatus = 200,
  countStatus = 200, countedInput = 1000, maxCost = 500, fxRate = 20000, finishReason = 'STOP',
  providerUsage = { promptTokenCount: 500, candidatesTokenCount: 200, thoughtsTokenCount: 512 },
  generationThrows = false, finishFails = false, committedDespiteError = false,
  output = JSON.stringify(aiExplanation()) } = {}) {
  const calls = [];
  const providerBodies = [];
  const tokenBodies = [];
  const rpcArgs = [];
  let saved = null;
  const admin = {
    from(table) {
      const chain = {
        select() { return chain; }, eq() { return chain; }, gte() { return chain; },
        update() { if (table === 'analysis_control') calls.push('pause_analysis'); return chain; },
        single: async () => ({ data: table === 'analysis_results'
          ? { id: userId, analysis_json: saved ?? { verdict: 'WAIT', cached: true } }
          : { enabled: true, rollout_percent: 100, max_cost_idr: maxCost, fx_safety_rate: fxRate } }),
        maybeSingle: async () => ({ data: saved ? { status: 'completed', result_id: userId } : existingRun }),
        then(resolve) { resolve(table === 'analysis_runs' ? { count: 0 } : { data: null }); },
      };
      return chain;
    },
    async rpc(name, args) {
      calls.push(name); rpcArgs.push({ name, args });
      if (name === 'finish_analysis') {
        if (!finishFails || committedDespiteError) saved = args.p_analysis;
        if (finishFails) return { data: null, error: new Error('simulated_save_failure') };
      }
      return { data: name === 'reserve_analysis' ? { status: 'reserved', run_id: userId, existing: false } : userId };
    },
  };
  const context = loggedIn ? { user: { id: userId }, profile: { role: 'user',
    subscription_end_at: new Date(Date.now() + (active ? 86400000 : -86400000)).toISOString() }, admin } : null;
  const localRequire = (name) => {
    if (name === '@/lib/authz') return { getSessionProfile: async () => context, isActiveSubscriber: (profile) => new Date(profile.subscription_end_at) > new Date() };
    if (name === '@/lib/analysis/core') return core;
    if (name === '@/lib/analysis/report') return report;
    if (name === '@/lib/analysis/market') return { getMarketSnapshot: async () => snapshot ? { ...snapshot } : null,
      getTrendConfirmation: async () => confirmation };
    return require(name);
  };
  const mockFetch = async (url, options) => {
    if (url.endsWith(':countTokens')) {
      calls.push('count_tokens'); tokenBodies.push(JSON.parse(options.body));
      return Response.json({ totalTokens: countedInput }, { status: countStatus });
    }
    calls.push('gemini');
    providerBodies.push(JSON.parse(options.body));
    if (generationThrows) throw new Error('simulated_provider_timeout');
    return Response.json({ candidates: [{ finishReason, content: { parts: [{ text: output }] } }],
      usageMetadata: providerUsage }, { status: providerStatus });
  };
  const compiledModule = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', compiled)(localRequire, compiledModule, compiledModule.exports, mockFetch);
  return { handler: compiledModule.exports.POST, calls, providerBodies, tokenBodies, rpcArgs };
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

test('malformed model JSON delivers a saved technical report without a second paid call', async () => {
  const priorKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'unit-test-key';
  try {
    const { handler, calls } = route({ output: '{broken' });
    const response = await handler(request());
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.charged, true);
    assert.equal(payload.result.provenance.kind, 'technical');
    assert.ok(payload.result.setups[0].takeProfit1 > 0);
    assert.deepEqual(calls, ['count_tokens', 'reserve_analysis', 'gemini', 'finish_analysis']);
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

test('conditional plan is persisted with levels and insights using one generation call', () => withProviderKey(async () => {
  const { handler, calls } = route();
  const response = await handler(request());
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.charged, true);
  assert.equal(payload.result.verdict, 'WAIT');
  assert.equal(payload.result.setups[0].execution, 'CONDITIONAL');
  assert.equal(payload.result.setups[0].direction, 'SHORT');
  assert.equal(payload.result.provenance.kind, 'ai');
  assert.ok(payload.result.setups[0].takeProfit1 < payload.result.setups[0].entryLow);
  assert.ok(payload.result.insights.actionPlan);
  assert.deepEqual(calls, ['count_tokens', 'reserve_analysis', 'gemini', 'finish_analysis']);
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

test('missing higher timeframe data and spot/short conflict are rejected without consuming a credit', async () => {
  const missing = route();
  assert.equal((await missing.handler(request({ ...input, higherTimeframeConfirmation: true }))).status, 422);
  assert.deepEqual(missing.calls, []);
  const invalid = route();
  assert.equal((await invalid.handler(request({ ...input, marketType: 'spot', directionPreference: 'short' }))).status, 400);
  assert.deepEqual(invalid.calls, []);
});

test('confirmation comes from the market provider and is persisted in a validated result', () => withProviderKey(async () => {
  const confirmation = { timeframe: '4h', asOf: market.asOf, close: 100, ema20: 98, rsi: 60, trend: 'bullish' };
  const { handler, calls, providerBodies } = route({ confirmation });
  const payload = await (await handler(request({ ...input, higherTimeframeConfirmation: true }))).json();
  assert.equal(payload.charged, true); assert.deepEqual(payload.result.market.confirmation, confirmation);
  assert.ok(providerBodies[0].contents[0].parts[0].text.includes('"trend":"bullish"'));
  assert.deepEqual(calls, ['count_tokens', 'reserve_analysis', 'gemini', 'finish_analysis']);
}));

test('provider HTTP failure and timeout deliver a technical report with one credit', () => withProviderKey(async () => {
  for (const options of [{ providerStatus: 503 }, { generationThrows: true }]) {
    const { handler, calls } = route(options);
    const response = await handler(request());
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.charged, true);
    assert.equal(payload.result.provenance.fallbackReason, 'provider_unavailable');
    assert.deepEqual(calls, ['count_tokens', 'reserve_analysis', 'gemini', 'finish_analysis']);
  }
}));

test('a forbidden AI direction is replaced with a technical plan respecting the user selection', () => withProviderKey(async () => {
  for (const options of [{ marketType: 'spot' }, { directionPreference: 'long' }]) {
    const { handler, calls } = route({ output: JSON.stringify(aiExplanation()) });
    const response = await handler(request({ ...input, ...options }));
    const payload = await response.json();
    assert.equal(response.status, 200); assert.equal(payload.result.provenance.kind, 'technical');
    assert.ok(payload.result.setups.every(setup => setup.direction === 'LONG'));
    assert.deepEqual(calls, ['count_tokens', 'reserve_analysis', 'gemini', 'finish_analysis']);
  }
}));

test('actual token overrun pauses future analyses while delivering the current technical report', () => withProviderKey(async () => {
  const { handler, calls } = route({ providerUsage: {
    promptTokenCount: 4001, candidatesTokenCount: 200, thoughtsTokenCount: 512,
  } });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).result.provenance.fallbackReason, 'cost_guard');
  assert.deepEqual(calls, ['count_tokens', 'reserve_analysis', 'gemini', 'pause_analysis', 'finish_analysis']);
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

test('token counting failure or oversized input never reserves quota or generates analysis', () => withProviderKey(async () => {
  for (const [options, expected] of [[{ countStatus: 503 }, 503], [{ countedInput: null }, 503],
    [{ countedInput: '1000' }, 503], [{ countedInput: 0 }, 503], [{ countedInput: 4001 }, 413]]) {
    const { handler, calls } = route(options);
    assert.equal((await handler(request())).status, expected);
    assert.deepEqual(calls, ['count_tokens']);
  }
}));

test('full schema/image request is counted and output allocation fits the configured cost', () => withProviderKey(async () => {
  for (const [countedInput, fxRate] of [[1000, 20000], [3500, 20000], [2500, 22000]]) {
    const { handler, calls, providerBodies, tokenBodies, rpcArgs } = route({ countedInput, fxRate });
    assert.equal((await handler(request({ ...input, context: 'x'.repeat(1200) }))).status, 200);
    const counted = tokenBodies[0].generateContentRequest;
    assert.equal(counted.model, 'models/gemini-2.5-pro');
    assert.deepEqual(counted.contents, providerBodies[0].contents);
    assert.deepEqual(counted.generationConfig.responseSchema, providerBodies[0].generationConfig.responseSchema);
    const budget = providerBodies[0].generationConfig.maxOutputTokens;
    assert.equal(budget, core.outputBudgetForCost(countedInput + 256, 500, fxRate));
    assert.ok(core.worstCaseCostIdr(countedInput + 256, budget, fxRate) <= 480);
    assert.equal(providerBodies[0].generationConfig.thinkingConfig.thinkingBudget, 768);
    assert.equal(calls.filter(call => call === 'gemini').length, 1);
    assert.equal(rpcArgs.find(call => call.name === 'finish_analysis').args.p_analysis.setups.length, 2);
  }
}));

test('configured budget too small rejects before quota or a paid generation', () => withProviderKey(async () => {
  const { handler, calls } = route({ maxCost: 100 });
  assert.equal((await handler(request())).status, 413);
  assert.deepEqual(calls, ['count_tokens']);
}));

test('empty and truncated AI responses produce labelled technical reports with complete levels', () => withProviderKey(async () => {
  for (const options of [{ output: '{}' },
    { finishReason: 'MAX_TOKENS' }, { finishReason: 'SAFETY' }]) {
    const { handler, calls } = route(options);
    const response = await handler(request());
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.result.provenance.kind, 'technical');
    assert.ok(payload.result.setups.length > 0);
    assert.ok(payload.result.insights.actionPlan);
    assert.deepEqual(calls, ['count_tokens', 'reserve_analysis', 'gemini', 'finish_analysis']);
  }
}));

test('provider output overrun pauses analyses and records actual costs on the saved report', () => withProviderKey(async () => {
  const { handler, calls, rpcArgs } = route({ countedInput: 3500,
    providerUsage: { promptTokenCount: 3500, candidatesTokenCount: 1500, thoughtsTokenCount: 768 } });
  assert.equal((await handler(request())).status, 200);
  assert.deepEqual(calls, ['count_tokens', 'reserve_analysis', 'gemini', 'pause_analysis', 'finish_analysis']);
  const finished = rpcArgs.find(call => call.name === 'finish_analysis').args;
  assert.equal(finished.p_output_tokens, 2268);
  assert.equal(finished.p_thinking_tokens, 768);
  assert.ok(finished.p_cost_idr > 500);
}));

test('unknown provider costs remain unknown, pause future generation and save the technical report', () => withProviderKey(async () => {
  const { handler, calls, rpcArgs } = route({ providerUsage: null });
  const payload = await (await handler(request())).json();
  assert.equal(payload.charged, true);
  assert.equal(payload.result.provenance.fallbackReason, 'cost_guard');
  assert.equal(rpcArgs.find(call => call.name === 'finish_analysis').args.p_cost_idr, null);
  assert.deepEqual(calls, ['count_tokens', 'reserve_analysis', 'gemini', 'pause_analysis', 'finish_analysis']);
}));

test('minor explanation errors are repaired locally and server levels cannot be overwritten', () => withProviderKey(async () => {
  const output = aiExplanation({ reason: 'Penjelasan singkat yang masih lengkap. '.repeat(30),
    insights: { ...aiExplanation().insights, actionPlan: '', momentum: 'RSI: 95 menandakan jenuh beli.' },
    setups: [{ entryLow: -100, stopLoss: 5000, takeProfit1: null }], risk_reward: 999 });
  const { handler, calls } = route({ output: JSON.stringify(output) });
  const payload = await (await handler(request())).json();
  assert.equal(payload.result.provenance.kind, 'ai_adjusted');
  assert.ok(payload.result.reason.length <= 600);
  assert.ok(payload.result.insights.actionPlan);
  assert.ok(!payload.result.insights.momentum.includes('95'));
  assert.ok(payload.result.setups.every(setup => setup.entryLow > 0 && setup.stopLoss < 5000));
  assert.equal(calls.filter(call => call === 'gemini').length, 1);
  assert.ok(!calls.includes('fail_analysis'));
}));

test('reopening a saved fallback reuses that report without quota or AI calls', () => withProviderKey(async () => {
  const { handler, calls } = route({ output: '{broken' });
  const first = await (await handler(request())).json();
  const second = await (await handler(request())).json();
  assert.equal(second.reused, true);
  assert.deepEqual(second.result, first.result);
  assert.deepEqual(calls, ['count_tokens', 'reserve_analysis', 'gemini', 'finish_analysis']);
}));

test('failure to save any report returns the reserved credit', () => withProviderKey(async () => {
  const { handler, calls, rpcArgs } = route({ finishFails: true, output: '{broken' });
  const response = await handler(request());
  const payload = await response.json();
  assert.equal(response.status, 502);
  assert.ok(payload.error.includes('Kuota Anda dikembalikan'));
  assert.equal(payload.result, undefined);
  assert.equal(rpcArgs.find(call => call.name === 'fail_analysis').args.p_error_code, 'report_save_failed');
  assert.deepEqual(calls, ['count_tokens', 'reserve_analysis', 'gemini', 'finish_analysis', 'fail_analysis']);
}));

test('an uncertain save response recovers the committed report without refunding or generating twice', () => withProviderKey(async () => {
  const { handler, calls } = route({ finishFails: true, committedDespiteError: true, output: '{broken' });
  const response = await handler(request());
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.charged, true);
  assert.equal(payload.reused, true);
  assert.equal(payload.result.provenance.kind, 'technical');
  assert.deepEqual(calls, ['count_tokens', 'reserve_analysis', 'gemini', 'finish_analysis']);
}));

test('unusable technical data fails before counting, quota reservation or generation', () => withProviderKey(async () => {
  for (const snapshot of [{ ...market, recentCandles: [] }, { ...market, atr: 0 }, { ...market, structure: undefined }]) {
    const { handler, calls } = route({ snapshot });
    assert.equal((await handler(request())).status, 422);
    assert.deepEqual(calls, []);
  }
}));
