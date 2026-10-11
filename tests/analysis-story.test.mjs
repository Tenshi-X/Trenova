import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAnalysisStory, analysisPlanLevels } from '../src/lib/analysis/story.ts';
import { technicalMarket, longSetup, shortSetup } from './fixtures/analysis.mjs';

const report = (overrides = {}) => ({ version: 2, verdict: 'LONG', signal_strength: 80,
  reason: 'Periksa struktur pasar sebelum entry.', wait_for: '', setups: [{ ...longSetup, riskReward: 2 }],
  risk_reward: 2, market: technicalMarket, warnings: [], provenance: { kind: 'ai', levels: 'technical' }, ...overrides });

test('story preserves primary prices, tiny coin precision, conditional status and technical provenance', () => {
  const result = report({ verdict: 'WAIT', setups: [{ ...shortSetup, execution: 'CONDITIONAL',
    entryLow: 0.00000123, entryHigh: 0.00000124, stopLoss: 0.0000013,
    takeProfit1: 0.0000011, takeProfit2: 0.000001, riskReward: 2.33 }], provenance: { kind: 'technical', levels: 'technical' } });
  const story = buildAnalysisStory(result, 'id');
  assert.equal(story.title, 'RENCANA SHORT');
  assert.equal(story.status, 'BERSYARAT');
  assert.equal(story.source, 'TEKNIKAL OTOMATIS');
  assert.deepEqual(story.rows.map(row => row.value), ['0.00000123 – 0.00000124', '0.0000013', '0.0000011', '0.000001', '1:2.33']);
  assert.equal(story.trigger, result.setups[0].trigger);
  assert.equal(story.invalidation, result.setups[0].invalidation);
});

test('mixed plans use the primary execution status, and WAIT never becomes a ready entry', () => {
  const setups = [{ ...longSetup, execution: 'CONDITIONAL' }, { ...shortSetup, execution: 'READY' }];
  assert.equal(buildAnalysisStory(report({ setups }), 'en').status, 'CONDITIONAL');
  assert.equal(buildAnalysisStory(report({ verdict: 'WAIT' }), 'en').status, 'CONDITIONAL');
  assert.equal(buildAnalysisStory(report(), 'en').status, 'SETUP READY');
});

test('WAIT without a setup and archived reports do not invent levels, market type or AI provenance', () => {
  const empty = buildAnalysisStory(report({ verdict: 'WAIT', setups: [], wait_for: 'Tunggu candle.' }), 'id');
  assert.equal(empty.title, 'WAIT'); assert.deepEqual(empty.rows, []); assert.equal(empty.trigger, 'Tunggu candle.');
  assert.deepEqual(analysisPlanLevels(report({ setups: [] })), []);
  const archive = { ...longSetup };
  for (const key of ['execution', 'trigger', 'invalidation', 'riskReward']) delete archive[key];
  const saved = buildAnalysisStory(report({ setups: [archive], provenance: undefined }), 'en');
  assert.equal(saved.source, 'SAVED REPORT'); assert.equal(saved.status, 'SAVED REPORT');
  assert.equal(saved.marketType, ''); assert.equal(saved.rows.length, 4);
});

test('story uses the report time in WIB and excludes account details, notes, quotas and outcomes', () => {
  const result = report({ user_email: 'private@example.com', user_note: 'secret-note', analysis_limit: 100,
    outcome_json: { profit: 99 }, market: { ...technicalMarket, symbol: 'BTCUSDT', asOf: '2026-10-10T19:30:00Z' } });
  const story = buildAnalysisStory(result, 'en');
  assert.equal(story.symbol, 'BTC / USDT'); assert.match(story.asOf, /11 Oct 2026.*02:30 WIB/);
  assert.equal(story.filename, 'trenova-btc-1h-2026-10-10-story.png');
  for (const secret of ['private@example.com', 'secret-note', 'analysis_limit', 'outcome_json']) assert.ok(!JSON.stringify(story).includes(secret));
});

test('level diagram preserves both LONG and SHORT ordering without simulated candles', () => {
  assert.deepEqual(analysisPlanLevels(report()).map(level => level.label), ['TP2', 'TP1', 'ENTRY HIGH', 'ENTRY LOW', 'SL']);
  assert.deepEqual(analysisPlanLevels(report({ setups: [shortSetup] })).map(level => level.label), ['SL', 'ENTRY HIGH', 'ENTRY LOW', 'TP1', 'TP2']);
});
