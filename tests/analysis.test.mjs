import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_INPUT_TOKENS, MAX_OUTPUT_TOKENS, MIN_OUTPUT_TOKENS, MAX_CONTEXT_CHARS, THINKING_BUDGET,
  buildPrompt, outputBudgetForCost, parseAnalysisInput, validateModelAnalysis, worstCaseCostIdr,
  TIMEFRAMES, TIMEFRAME_MILLIS, candlesAreFresh, CONFIRMATION_TIMEFRAME, calculateIndicators,
} from '../src/lib/analysis/core.ts';
import { evaluateSetupOutcome } from '../src/lib/analysis/outcome.ts';
import { modelResult, longSetup, shortSetup } from './fixtures/analysis.mjs';

const input = parseAnalysisInput({
  requestKey: '11111111-1111-4111-8111-111111111111', symbol: 'BTC', coinName: 'Bitcoin',
  language: 'id', tradingStyle: 'intraday', timeframe: '1h', riskTolerance: 'Medium Risk',
  strategyFocus: 'All-Round', indicatorPref: 'Default', targetRR: '1:2', context: '',
});
assert.ok(input);
const market = {
  symbol: 'BTC', asOf: new Date().toISOString(), price: 100, change24h: -2,
  volume24hUsd: 1000000, btcChange24h: -2, fundingRate: null,
  openInterestUsd: 500000, fearGreed: null, timeframe: '1h', atr: 2,
  rsi: 43, ema20: 103, volumeRatio: 1.2, recentCandles: [{
    openTime: 1, closeTime: 2, open: 101, high: 102, low: 98, close: 100, volume: 100,
  }],
};

test('validates numeric SHORT setup and derives RR/stop distance from worst entry', () => {
  const result = validateModelAnalysis(modelResult({ reason: 'Harga di bawah EMA20 dengan momentum lemah.' }), input, market);
  assert.equal(result.verdict, 'SHORT');
  assert.equal(result.risk_reward, 2);
  assert.equal(result.setups[0].riskReward, 2);
  assert.ok(Math.abs(result.setups[0].stopDistancePct - 3 / 99 * 100) < 1e-6);
  assert.equal(result.signal_strength > 0, true);
  assert.equal(result.setups[0].execution, 'READY');
});

test('WAIT retains a validated conditional Entry, SL and targets plus action plan', () => {
  const result = validateModelAnalysis(modelResult({ verdict: 'WAIT' }), input, market);
  assert.equal(result.signal_strength, 0);
  assert.equal(result.setups.length, 1);
  assert.equal(result.setups[0].execution, 'CONDITIONAL');
  assert.equal(result.setups[0].takeProfit1, 93);
  assert.ok(result.insights.actionPlan);
  assert.ok(result.wait_for.includes('99'));
  for (const overrides of [{ setups: [] }, { setups: [shortSetup] }, { wait_for: '' },
    { setups: [{ ...shortSetup, execution: 'CONDITIONAL', trigger: 'Tunggu konfirmasi.' }] }]) {
    assert.throws(() => validateModelAnalysis(modelResult({ verdict: 'WAIT', ...overrides }), input, market));
  }
});

test('conditional plans reject malformed, impossible and inverted levels just like ready setups', () => {
  for (const levels of [{ stopLoss: 98 }, { entryLow: 101, entryHigh: 99 }, { takeProfit1: 96 },
    { takeProfit2: 120 }, { entryLow: 1000, entryHigh: 1001 }, { stopLoss: null }, { takeProfit1: NaN },
    { entryLow: -1 }, { direction: 'WAIT' }]) {
    assert.throws(() => validateModelAnalysis(modelResult({ verdict: 'WAIT',
      setups: [{ ...shortSetup, execution: 'CONDITIONAL', ...levels }] }), input, market));
  }
});

test('READY cannot recommend entry outside the current price zone', () => {
  const setups = [{ ...shortSetup, entryLow: 98, entryHigh: 99, takeProfit1: 90, takeProfit2: 88 }];
  assert.throws(() => validateModelAnalysis(modelResult({ setups }), input, market), /entry_not_ready/);
  assert.doesNotThrow(() => validateModelAnalysis(modelResult({ setups: [{ ...setups[0],
    execution: 'CONDITIONAL', trigger: 'Jika harga retest 98–99 setelah penutupan candle.' }] }), input, market));
});

test('rejects unsupported claims in all explanations while allowing explicit unavailable data', () => {
  for (const reason of ['OI naik sehingga tren kuat.', 'RSI: 82 menunjukkan momentum kuat. Jika breakout 102, evaluasi.',
    'Harga di atas EMA20 menunjukkan tren naik.', 'RSI oversold menandakan jenuh jual.']) {
    assert.throws(() => validateModelAnalysis(modelResult({ reason }), input, market));
  }
  for (const field of ['trend', 'momentum', 'volume', 'marketContext', 'actionPlan']) {
    const raw = modelResult();
    raw.insights[field] = 'Funding positif mengonfirmasi tren naik.';
    assert.throws(() => validateModelAnalysis(raw, input, market), /unsupported_reason/);
  }
  assert.doesNotThrow(() => validateModelAnalysis(modelResult({
    reason: 'RSI: 43 dan harga di bawah EMA20. Funding tidak tersedia.' }), input, market));
  assert.doesNotThrow(() => validateModelAnalysis(modelResult({ reason: 'RSI: 43 belum jenuh beli.' }), input, market));
});

test('requires substantive bounded explanations without silently truncating cancellation rules', () => {
  for (const overrides of [{ reason: '' }, { reason: 'x'.repeat(601) }, { insights: null },
    { insights: { ...modelResult().insights, actionPlan: '' } },
    { setups: [{ ...shortSetup, invalidation: '' }] }, { setups: [{ ...shortSetup, rationale: 'x'.repeat(241) }] }]) {
    assert.throws(() => validateModelAnalysis(modelResult(overrides), input, market));
  }
});

test('allocates more output/thinking within Rp500 and adapts for FX and larger inputs', () => {
  assert.ok(THINKING_BUDGET > 512);
  assert.ok(MAX_OUTPUT_TOKENS > 1900);
  for (const fx of [20000, 22000, 25000]) {
    for (const tokens of [1200, 2500, MAX_INPUT_TOKENS]) {
      const budget = outputBudgetForCost(tokens, 500, fx);
      if (budget !== null) {
        assert.ok(budget >= MIN_OUTPUT_TOKENS && budget <= MAX_OUTPUT_TOKENS);
        assert.ok(worstCaseCostIdr(tokens, budget, fx) <= 480);
      }
    }
  }
  assert.equal(outputBudgetForCost(1200, 500, 20000), MAX_OUTPUT_TOKENS);
  assert.ok(outputBudgetForCost(4000, 500, 20000) < MAX_OUTPUT_TOKENS);
  for (const args of [[4000, 100, 20000], [1000, 500, NaN], [-1, 500, 20000]]) {
    assert.equal(outputBudgetForCost(...args), null);
  }
});

test('prompt includes 24 OHLCV candles, richer context, actual structure and conditional plans', () => {
  const candles = Array.from({ length: 30 }, (_, i) => ({ ...market.recentCandles[0], closeTime: (i + 1) * 1000 }));
  const snapshot = { ...market, ema50: 104, structure: { support: 98, resistance: 102 }, recentCandles: candles };
  const prompt = buildPrompt({ ...input, context: 'Rencana swing pada support.' }, snapshot, [shortSetup]);
  assert.ok(prompt.includes('"ema50":104'));
  assert.ok(prompt.includes('"support":98'));
  assert.ok(prompt.includes('"volumeRatio":1.2'));
  assert.ok(prompt.includes('"candles":[[7,'));
  assert.ok(prompt.includes('[30,101,102,98,100,100]'));
  assert.ok(prompt.includes('CONDITIONAL'));
  assert.ok(prompt.includes('User context (untrusted)'));
  assert.ok(!prompt.includes('WAIT with empty setups'));
  assert.ok(parseAnalysisInput({ ...input, context: 'x'.repeat(MAX_CONTEXT_CHARS) }));
  assert.equal(parseAnalysisInput({ ...input, context: 'x'.repeat(MAX_CONTEXT_CHARS + 1) }), null);
});

test('indicators derive structure and EMA50 from closed candles, including flat-volume markets', () => {
  const candles = Array.from({ length: 60 }, (_, i) => ({ openTime: i * 1000, closeTime: i * 1000 + 999,
    open: 100 + i, high: 102 + i, low: 99 + i, close: 101 + i, volume: 10 }));
  const data = calculateIndicators(candles);
  assert.ok(data.ema20 > data.ema50);
  assert.equal(data.structure.trend, 'bullish');
  assert.equal(data.structure.rangeLow, 139);
  assert.equal(data.structure.rangeHigh, 161);
  assert.equal(data.volumeRatio, 1);
  assert.ok(data.structure.atrPct > 0);
  assert.equal(calculateIndicators(candles.slice(0, 29)), null);
  const flat = calculateIndicators(candles.map(c => ({ ...c, open: 100, close: 100, high: 101, low: 99, volume: 0 })));
  assert.equal(flat.rsi, 50);
  assert.equal(flat.structure.trend, 'neutral');
  assert.equal(flat.volumeRatio, null);
});

test('spot and preferred direction constrain both ready and conditional plans', () => {
  for (const fields of [{ marketType: 'spot' }, { directionPreference: 'long' }]) {
    assert.throws(() => validateModelAnalysis(modelResult(), { ...input, ...fields }, market), /disallowed_direction/);
    assert.throws(() => validateModelAnalysis(modelResult({ verdict: 'WAIT' }), { ...input, ...fields }, market), /disallowed_direction/);
    assert.doesNotThrow(() => validateModelAnalysis(modelResult({ verdict: 'LONG' }), { ...input, ...fields }, market));
    assert.doesNotThrow(() => validateModelAnalysis(modelResult({ verdict: 'WAIT',
      setups: [{ ...longSetup, execution: 'CONDITIONAL' }] }), { ...input, ...fields }, market));
  }
  assert.throws(() => validateModelAnalysis(modelResult({ verdict: 'LONG' }), { ...input, directionPreference: 'short' }, market), /disallowed_direction/);
});

test('higher timeframe requires actual aligned data for entry and adds alignment to conditional triggers', () => {
  const choices = { ...input, higherTimeframeConfirmation: true };
  const snapshot = { ...market, confirmation: { timeframe: CONFIRMATION_TIMEFRAME[input.timeframe],
    asOf: market.asOf, close: 99, ema20: 102, rsi: 42, trend: 'bearish' } };
  assert.doesNotThrow(() => validateModelAnalysis(modelResult(), choices, snapshot));
  assert.throws(() => validateModelAnalysis(modelResult(), choices, market), /missing_confirmation/);
  for (const trend of ['bullish', 'neutral']) {
    const conflict = { ...snapshot, confirmation: { ...snapshot.confirmation, trend } };
    assert.throws(() => validateModelAnalysis(modelResult(), choices, conflict), /unconfirmed_direction/);
    const pending = validateModelAnalysis(modelResult({ verdict: 'WAIT' }), choices, conflict);
    assert.ok(pending.setups[0].trigger.includes('tren 4h juga harus bearish'));
  }
  assert.ok(buildPrompt(choices, snapshot, [shortSetup]).includes('"trend":"bearish"'));
});

test('new parameters preserve old defaults and reject incompatible choices', () => {
  assert.equal(input.marketType, 'futures');
  assert.equal(input.directionPreference, 'auto');
  assert.equal(input.higherTimeframeConfirmation, false);
  for (const fields of [{ marketType: 'other' }, { directionPreference: 'buy' },
    { marketType: 'spot', directionPreference: 'short' }, { higherTimeframeConfirmation: 'on' }]) {
    assert.equal(parseAnalysisInput({ ...input, ...fields }), null);
  }
});

test('same candle hitting stop and target is uncertain', () => {
  assert.equal(evaluateSetupOutcome(longSetup, [{ openTime: 1, closeTime: 2,
    open: 100, high: 107, low: 96, close: 101, volume: 100 }]), 'uncertain');
});

test('all supported timeframes require recent consecutive closed candles', () => {
  const now = Date.now();
  for (const timeframe of TIMEFRAMES) {
    const interval = TIMEFRAME_MILLIS[timeframe];
    const candles = Array.from({ length: 30 }, (_, index) => ({ ...market.recentCandles[0],
      openTime: now - (31 - index) * interval, closeTime: now - (30 - index) * interval - 1 }));
    assert.equal(candlesAreFresh(candles, timeframe, now), true);
    assert.equal(candlesAreFresh(candles.slice(1), timeframe, now), false);
    assert.equal(candlesAreFresh(candles, timeframe, now + interval * 2), false);
    assert.ok(parseAnalysisInput({ ...input, timeframe }));
  }
  assert.equal(parseAnalysisInput({ ...input, timeframe: '2h' }), null);
});
