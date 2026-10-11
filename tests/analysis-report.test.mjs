import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAnalysisInput, STYLES, RISKS, STRATEGIES, TARGET_RRS, TIMEFRAMES } from '../src/lib/analysis/core.ts';
import { buildTechnicalAnalysis, enrichTechnicalAnalysis } from './fixtures/report.mjs';
import { technicalMarket, aiExplanation } from './fixtures/analysis.mjs';

const input = parseAnalysisInput({ requestKey: '11111111-1111-4111-8111-111111111111', symbol: 'BTC',
  language: 'id', tradingStyle: 'intraday', timeframe: '1h', riskTolerance: 'Medium Risk',
  strategyFocus: 'All-Round', indicatorPref: 'Default', targetRR: '1:2' });

test('technical reports maintain financial invariants across styles, risk, strategy, RR and price scales', () => {
  for (const tradingStyle of STYLES) for (const riskTolerance of RISKS) for (const strategyFocus of STRATEGIES)
    for (const targetRR of TARGET_RRS) for (const scale of [0.0000001, 1, 630]) {
      const market = { ...technicalMarket, price: 100 * scale, atr: 2 * scale, ema20: 98 * scale,
        structure: { ...technicalMarket.structure, support: 98 * scale, resistance: 102 * scale } };
      const report = buildTechnicalAnalysis({ ...input, tradingStyle, riskTolerance, strategyFocus, targetRR }, market);
      assert.equal(report.provenance.kind, 'technical');
      assert.equal(report.setups.length, 2);
      for (const setup of report.setups) {
        const long = setup.direction === 'LONG';
        const worst = long ? setup.entryHigh : setup.entryLow;
        const risk = Math.abs(worst - setup.stopLoss);
        const reward = Math.abs(setup.takeProfit1 - worst);
        assert.ok([setup.entryLow, setup.entryHigh, setup.stopLoss, setup.takeProfit1, setup.takeProfit2]
          .every(value => Number.isFinite(value) && value > 0));
        assert.ok(long ? setup.stopLoss < setup.entryLow && setup.takeProfit1 > setup.entryHigh && setup.takeProfit2 > setup.takeProfit1
          : setup.stopLoss > setup.entryHigh && setup.takeProfit1 < setup.entryLow && setup.takeProfit2 < setup.takeProfit1);
        assert.ok(reward / risk + 1e-6 >= Number(targetRR.slice(2)));
        assert.ok(Math.abs(setup.riskReward - reward / risk) < 1e-8);
        assert.equal(setup.execution, 'CONDITIONAL');
        assert.ok(/\d/.test(setup.trigger));
        assert.ok(setup.invalidation);
      }
    }
});

test('spot, direction and higher timeframe rules survive AI choice and local repairs', () => {
  for (const language of ['id', 'en']) for (const timeframe of TIMEFRAMES) {
    const confirmation = { timeframe: timeframe === '15m' ? '1h' : ['30m', '1h'].includes(timeframe) ? '4h' : timeframe === '4h' ? '1d' : '1w',
      asOf: technicalMarket.asOf, close: 100, ema20: 98, rsi: 60, trend: 'bullish' };
    for (const parameters of [{ marketType: 'spot', directionPreference: 'auto' },
      { marketType: 'futures', directionPreference: 'short' }]) {
      const market = { ...technicalMarket, timeframe, confirmation };
      const base = buildTechnicalAnalysis({ ...input, ...parameters, language, timeframe, higherTimeframeConfirmation: true }, market);
      assert.equal(base.setups.length, 1);
      const direction = parameters.marketType === 'spot' ? 'LONG' : 'SHORT';
      const report = enrichTechnicalAnalysis(aiExplanation({ preferredDirection: direction, reason: '', insights: {} }), base, market);
      assert.equal(report.provenance.kind, 'ai_adjusted');
      const withoutRationale = setup => Object.fromEntries(Object.entries(setup).filter(([key]) => key !== 'rationale'));
      assert.deepEqual(report.setups.map(withoutRationale), base.setups.map(withoutRationale));
      assert.equal(report.setups[0].direction, direction);
      assert.ok(report.wait_for.includes(confirmation.timeframe));
      assert.ok(report.wait_for.includes(direction === 'LONG' ? 'bullish' : 'bearish'));
      assert.throws(() => enrichTechnicalAnalysis(aiExplanation({ preferredDirection: direction === 'LONG' ? 'SHORT' : 'LONG' }), base, market));
    }
  }
});

test('AI cannot substitute trading prices, cancel triggers or force immediate entry through prose', () => {
  const base = buildTechnicalAnalysis(input, technicalMarket);
  const raw = aiExplanation({ reason: 'Entry pada 9000 memberi peluang bagus.',
    rationale: 'SL: 1 untuk rencana yang sangat aman.',
    insights: { ...aiExplanation().insights, actionPlan: 'Beli sekarang karena profit pasti.',
      bullCase: 'Jika harga menutup di atas 9000, ikuti peluang naik.',
      bearCase: 'Jika candle 1h tutup di bawah 1, ikuti peluang turun.' } });
  const report = enrichTechnicalAnalysis(raw, base, technicalMarket);
  assert.equal(report.provenance.kind, 'ai_adjusted');
  assert.ok(report.reason.includes('SHORT'));
  assert.ok(!report.reason.includes('LONG'));
  assert.ok(!report.reason.includes('9000'));
  assert.ok(!report.setups[0].rationale.includes('SL: 1'));
  assert.ok(!report.insights.actionPlan.includes('sekarang'));
  assert.equal(report.insights.bullCase, base.insights.bullCase);
  assert.equal(report.insights.bearCase, base.insights.bearCase);
  assert.equal(report.wait_for, report.setups[0].trigger);
});

test('unusable data or impossible targets cannot become a paid technical report', () => {
  for (const market of [{ ...technicalMarket, atr: NaN }, { ...technicalMarket, atr: 30 },
    { ...technicalMarket, rsi: 200 }, { ...technicalMarket, recentCandles: [] }]) {
    assert.throws(() => buildTechnicalAnalysis(input, market));
  }
  const base = buildTechnicalAnalysis(input, technicalMarket);
  assert.throws(() => enrichTechnicalAnalysis({ preferredDirection: 'LONG' }, base, technicalMarket), /empty_analysis/);
});
