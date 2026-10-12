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

test('richer explanations retain complete sentences and still repair contradictory later claims', () => {
  const base = buildTechnicalAnalysis(input, technicalMarket);
  const detail = 'Struktur pasar perlu dikonfirmasi oleh penutupan candle dan volume sebelum mengikuti rencana. ';
  const reason = detail.repeat(7).trim();
  const insight = detail.repeat(4).trim();
  const rationale = detail.repeat(3).trim();
  const raw = aiExplanation({ reason, rationale,
    insights: Object.fromEntries(Object.keys(base.insights).map(key => [key, insight])) });
  const report = enrichTechnicalAnalysis(raw, base, technicalMarket);
  assert.equal(report.provenance.kind, 'ai');
  assert.equal(report.reason, reason);
  assert.equal(report.insights.actionPlan, insight);
  assert.equal(report.setups[0].rationale, rationale);
  assert.deepEqual(report.setups[0].entryLow, base.setups.find(setup => setup.direction === 'SHORT').entryLow);

  const repaired = enrichTechnicalAnalysis({ ...raw,
    insights: { ...raw.insights, momentum: insight + ' RSI: 82 menunjukkan momentum kuat.' } }, base, technicalMarket);
  assert.equal(repaired.insights.momentum, base.insights.momentum);
  assert.ok(repaired.provenance.repairedFields.includes('insights.momentum'));
});

test('timeframes and explicit missing data are not mistaken for unsupported market claims', () => {
  const base = buildTechnicalAnalysis(input, technicalMarket);
  for (const timeframe of ['1h', '4h', '1 jam', '4 jam', '15 menit', '4 hours']) {
    const raw = aiExplanation({ reason: `Tunggu candle ${timeframe} tutup di bawah support 98 sebelum mengevaluasi retest.`,
      insights: { ...aiExplanation().insights,
        marketContext: 'Tidak ada data Funding Rate atau Open Interest. Fear & Greed bernilai null.' } });
    const report = enrichTechnicalAnalysis(raw, base, technicalMarket);
    assert.equal(report.reason, raw.reason);
    assert.equal(report.insights.marketContext, raw.insights.marketContext);
    assert.equal(report.provenance.kind, 'ai');
  }
  for (const reason of ['Jika candle 1h tutup di bawah 9000, evaluasi retest.',
    'Jika support 98.9 ditembus, evaluasi retest.', 'Jika price 9800 turun, evaluasi retest.']) {
    const report = enrichTechnicalAnalysis(aiExplanation({ reason }), base, technicalMarket);
    assert.ok(report.provenance.repairedFields.includes('reason'));
    assert.notEqual(report.reason, reason);
  }
  const report = enrichTechnicalAnalysis(aiExplanation({
    reason: 'Funding bernilai null. RSI: 95 menunjukkan momentum kuat.' }), base, technicalMarket);
  assert.ok(report.provenance.repairedFields.includes('reason'));
  const nearOversold = { ...technicalMarket, rsi: 31.48 };
  const reason = 'RSI mendekati area oversold sehingga risiko pantulan tetap perlu diperhatikan.';
  assert.equal(enrichTechnicalAnalysis(aiExplanation({ reason }), base, nearOversold).reason, reason);
  for (const marketContext of ['Tanpa data derivatif seperti funding rate dan open interest, konfirmasi terbatas.',
    'Ketiadaan metrik funding rate dan open interest membatasi konteks pasar.']) {
    const raw = aiExplanation({ insights: { ...aiExplanation().insights, marketContext } });
    assert.equal(enrichTechnicalAnalysis(raw, base, technicalMarket).insights.marketContext, marketContext);
  }
  const claimedOversold = enrichTechnicalAnalysis(aiExplanation({ reason: 'RSI oversold menunjukkan tekanan jual ekstrem.' }), base, nearOversold);
  assert.ok(claimedOversold.provenance.repairedFields.includes('reason'));
  const candleCount = 'Harga bertahan di atas support 20 candle di 98 sebelum konfirmasi lanjutan.';
  assert.equal(enrichTechnicalAnalysis(aiExplanation({ reason: candleCount }), base, technicalMarket).reason, candleCount);
});

test('contradictory EMA crossover claims are repaired while conditional scenarios remain possible', () => {
  const base = buildTechnicalAnalysis(input, technicalMarket);
  for (const reason of ['EMA20 telah memotong ke bawah EMA50, menandakan tren bearish.',
    'EMA20 dan EMA50 telah membentuk persilangan bearish.']) {
    const report = enrichTechnicalAnalysis(aiExplanation({ reason }), base, technicalMarket);
    assert.ok(report.provenance.repairedFields.includes('reason'));
  }
  const reason = 'Jika EMA20 memotong ke bawah EMA50, evaluasi ulang arah rencana.';
  assert.equal(enrichTechnicalAnalysis(aiExplanation({ reason }), base, technicalMarket).reason, reason);
});
