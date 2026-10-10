import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_INPUT_TOKENS, MAX_OUTPUT_TOKENS, buildPrompt, estimateInputUpperBound,
  parseAnalysisInput, validateModelAnalysis, worstCaseCostIdr,
  TIMEFRAMES, TIMEFRAME_MILLIS, candlesAreFresh,
  CONFIRMATION_TIMEFRAME,
} from '../src/lib/analysis/core.ts';
import { evaluateSetupOutcome } from '../src/lib/analysis/outcome.ts';

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

test('validates a numeric SHORT setup and minimum risk reward', () => {
  const raw = { verdict: 'SHORT', reason: 'Harga di bawah EMA20 dengan momentum lemah.', wait_for: '',
    setups: [{ direction: 'SHORT', entryLow: 99, entryHigh: 100, stopLoss: 102,
      takeProfit1: 93, takeProfit2: 90 }] };
  const result = validateModelAnalysis(raw, input, market);
  assert.equal(result.verdict, 'SHORT');
  assert.ok(result.risk_reward >= 2);
  assert.equal(result.signal_strength > 0, true);
  assert.equal(result.setups.length, 1);
});

test('WAIT never emits a trade setup', () => {
  const result = validateModelAnalysis({ verdict: 'WAIT', reason: 'Belum ada konfirmasi tren.',
    wait_for: 'Tunggu candle penutupan berikutnya.', setups: [{ direction: 'LONG' }] }, input, market);
  assert.deepEqual(result.setups, []);
  assert.equal(result.signal_strength, 0);
});

test('rejects upside down levels and unsupported open-interest trend claims', () => {
  const setup = { direction: 'LONG', entryLow: 99, entryHigh: 100, stopLoss: 101,
    takeProfit1: 105, takeProfit2: 108 };
  assert.throws(() => validateModelAnalysis({ verdict: 'LONG', reason: 'Tren mulai menguat.', wait_for: '', setups: [setup] }, input, market));
  assert.throws(() => validateModelAnalysis({ verdict: 'WAIT', reason: 'OI naik sehingga tren kuat.', wait_for: 'Tunggu.', setups: [] }, input, market));
});

test('conservative budget stays under Rp500 and image can push input over limit', () => {
  const prompt = buildPrompt(input, market);
  assert.ok(estimateInputUpperBound(prompt, false) < MAX_INPUT_TOKENS);
  assert.equal(worstCaseCostIdr(MAX_INPUT_TOKENS, MAX_OUTPUT_TOKENS, 20000), 480);
  assert.ok(estimateInputUpperBound(prompt, true) > estimateInputUpperBound(prompt, false));
});

test('rejects explicit indicator facts that contradict the captured snapshot', () => {
  for (const reason of ['RSI: 82 menunjukkan momentum kuat.', 'Harga di atas EMA20 menunjukkan tren naik.', 'RSI oversold menandakan jenuh jual.']) {
    assert.throws(() => validateModelAnalysis({ verdict:'WAIT',reason,wait_for:'Tunggu konfirmasi.',setups:[] },input,market));
  }
  assert.doesNotThrow(() => validateModelAnalysis({ verdict:'WAIT',reason:'RSI: 43 dan harga di bawah EMA20.',wait_for:'Tunggu konfirmasi.',setups:[] },input,market));
});

test('same candle hitting stop and target is uncertain', () => {
  const setup = { direction: 'LONG', entryLow: 99, entryHigh: 100, stopLoss: 97,
    takeProfit1: 106, takeProfit2: 110 };
  assert.equal(evaluateSetupOutcome(setup, [{ openTime: 1, closeTime: 2,
    open: 100, high: 107, low: 96, close: 101, volume: 100 }]), 'uncertain');
});

test('all supported timeframes require recent, consecutive closed candles', () => {
  const now = Date.now();
  for (const timeframe of TIMEFRAMES) {
    const interval = TIMEFRAME_MILLIS[timeframe];
    const candles = Array.from({ length: 30 }, (_, index) => ({ ...market.recentCandles[0],
      openTime: now - (31 - index) * interval, closeTime: now - (30 - index) * interval - 1 }));
    assert.equal(candlesAreFresh(candles,timeframe,now),true);
    assert.equal(candlesAreFresh(candles.slice(1),timeframe,now),false);
    assert.equal(candlesAreFresh(candles,timeframe,now + interval * 2),false);
    assert.ok(parseAnalysisInput({ ...input, timeframe }));
  }
  assert.equal(parseAnalysisInput({ ...input, timeframe: '2h' }),null);
});

test('full timestamped snapshot plus one image fits the compact default prompt', () => {
  const snapshot = { ...market, recentCandles: Array(4).fill(market.recentCandles[0]),
    sourceTimes: Object.fromEntries(['candles','btc','funding','openInterest','sentiment'].map((key) => [key,market.asOf])) };
  assert.ok(estimateInputUpperBound(buildPrompt(input,snapshot),true) <= MAX_INPUT_TOKENS);
});

test('new parameters preserve old defaults and reject incompatible or malformed choices', () => {
  assert.equal(input.marketType, 'futures'); assert.equal(input.directionPreference, 'auto');
  assert.equal(input.higherTimeframeConfirmation, false);
  for (const fields of [{ marketType: 'other' }, { directionPreference: 'buy' },
    { marketType: 'spot', directionPreference: 'short' }, { higherTimeframeConfirmation: 'on' }]) {
    assert.equal(parseAnalysisInput({ ...input, ...fields }), null);
  }
});

test('spot and direction preferences restrict validated setups while WAIT remains valid', () => {
  const short = { verdict: 'SHORT', reason: 'Momentum lemah pada snapshot.', wait_for: '', setups: [
    { direction: 'SHORT', entryLow: 99, entryHigh: 100, stopLoss: 102, takeProfit1: 93, takeProfit2: 90 },
  ] };
  const long = { verdict: 'LONG', reason: 'Ada peluang pantulan teknikal.', wait_for: '', setups: [
    { direction: 'LONG', entryLow: 99, entryHigh: 100, stopLoss: 97, takeProfit1: 106, takeProfit2: 110 },
  ] };
  for (const fields of [{ marketType: 'spot' }, { directionPreference: 'long' }]) {
    assert.throws(() => validateModelAnalysis(short, { ...input, ...fields }, market), /disallowed_direction/);
    assert.doesNotThrow(() => validateModelAnalysis(long, { ...input, ...fields }, market));
  }
  assert.throws(() => validateModelAnalysis(long, { ...input, directionPreference: 'short' }, market), /disallowed_direction/);
  assert.doesNotThrow(() => validateModelAnalysis({ verdict: 'WAIT', reason: 'Belum ada konfirmasi.',
    wait_for: 'Tunggu candle.', setups: [] }, { ...input, marketType: 'spot', directionPreference: 'long' }, market));
});

test('higher timeframe confirmation requires actual aligned trend data and still fits the image budget', () => {
  const choices = { ...input, higherTimeframeConfirmation: true };
  const raw = { verdict: 'SHORT', reason: 'Momentum lemah pada snapshot.', wait_for: '', setups: [
    { direction: 'SHORT', entryLow: 99, entryHigh: 100, stopLoss: 102, takeProfit1: 93, takeProfit2: 90 },
  ] };
  const snapshot = { ...market, confirmation: { timeframe: CONFIRMATION_TIMEFRAME[input.timeframe],
    asOf: market.asOf, close: 99, ema20: 102, rsi: 42, trend: 'bearish' },
    recentCandles: Array(4).fill(market.recentCandles[0]),
    sourceTimes: Object.fromEntries(['candles','btc','funding','openInterest','sentiment'].map((key) => [key,market.asOf])) };
  assert.doesNotThrow(() => validateModelAnalysis(raw, choices, snapshot));
  assert.throws(() => validateModelAnalysis(raw, choices, market), /missing_confirmation/);
  for (const trend of ['bullish', 'neutral']) {
    assert.throws(() => validateModelAnalysis(raw, choices, { ...snapshot,
      confirmation: { ...snapshot.confirmation, trend } }), /unconfirmed_direction/);
  }
  const prompt = buildPrompt(choices, snapshot);
  assert.ok(prompt.includes('"trend":"bearish"'));
  assert.ok(estimateInputUpperBound(prompt, true) <= MAX_INPUT_TOKENS);
});
