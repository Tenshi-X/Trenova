import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { modelResult } from './fixtures/analysis.mjs';
import { parseAnalysisInput, validateModelAnalysis } from '../src/lib/analysis/core.ts';
import { translations } from '../src/lib/translations.ts';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/components/AnalysisResultV2.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
const componentCache = new Map();
function requireComponent(name, language) {
  if (name === '@/context/LanguageContext') return { useLanguage: () => ({ language, t: key => translations[language][key] }) };
  if (!name.startsWith('@/')) return require(name);
  const key = `${name}-${language}`;
  if (componentCache.has(key)) return componentCache.get(key);
  const extension = name.startsWith('@/components/') ? '.tsx' : '.ts';
  const source = readFileSync(new URL(`../src/${name.slice(2)}${extension}`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2017,
  } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(dependency => requireComponent(dependency, language), mod, mod.exports);
  componentCache.set(key, mod.exports);
  return mod.exports;
}
const input = parseAnalysisInput({ requestKey: '11111111-1111-4111-8111-111111111111', symbol: 'BTC',
  language: 'id', tradingStyle: 'intraday', timeframe: '1h', riskTolerance: 'Medium Risk',
  strategyFocus: 'All-Round', indicatorPref: 'Default', targetRR: '1:2' });
const market = { symbol: 'BTC', asOf: '2026-10-11T00:00:00Z', price: 100, change24h: -2,
  volume24hUsd: 1000000, btcChange24h: -2, fundingRate: null, openInterestUsd: null, fearGreed: null,
  timeframe: '1h', atr: 2, rsi: 43, ema20: 103, volumeRatio: 1.2, recentCandles: [] };

export function renderAnalysis(result, language = 'id') {
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => requireComponent(name, language), mod, mod.exports);
  return renderToStaticMarkup(React.createElement(mod.exports.default, { result, coinName: 'Bitcoin' }));
}

test('conditional result shows numeric plan, trigger and reasoning instead of a bare WAIT heading', () => {
  const result = validateModelAnalysis(modelResult({ verdict: 'WAIT' }), input, market);
  const html = renderAnalysis(result);
  for (const label of ['Rencana SHORT', 'Zona Entry', 'SL · Stop Loss', 'TP1 · Take Profit', 'TP2 · Take Profit',
    'Pemicu masuk:', 'Batalkan rencana jika:', 'Skenario naik', 'Skenario turun', 'Pertimbangan analisis', '93 USDT', 'R:R TP1 1:2.00']) {
    assert.ok(html.includes(label), label);
  }
  assert.ok(!html.includes('>WAIT</h2>'));
  assert.ok(html.includes('Bersyarat'));
  assert.ok(!html.includes('Setup siap'));
});

test('English users receive translated result labels and conditional state', () => {
  const result = validateModelAnalysis(modelResult({ verdict: 'WAIT' }), input, market);
  const html = renderAnalysis(result, 'en');
  for (const label of ['SHORT plan', 'Conditional', 'Entry zone', 'Entry trigger:', 'Cancel the plan if:',
    'Bullish case', 'Bearish case', 'Analysis considerations']) assert.ok(html.includes(label), label);
});

test('archived v2 WAIT and trade results still render without new fields or invented plans', () => {
  const result = validateModelAnalysis(modelResult(), input, market);
  delete result.insights;
  result.setups = result.setups.map(({ direction, entryLow, entryHigh, stopLoss, takeProfit1, takeProfit2 }) =>
    ({ direction, entryLow, entryHigh, stopLoss, takeProfit1, takeProfit2 }));
  assert.ok(renderAnalysis(result).includes('93 USDT'));
  assert.ok(!renderAnalysis(result).includes('Pertimbangan analisis'));
  const html = renderAnalysis({ ...result, verdict: 'WAIT', setups: [], risk_reward: null, wait_for: 'Tunggu candle.' });
  assert.ok(html.includes('>WAIT</h2>'));
  assert.ok(!html.includes('Zona Entry'));
});

test('saved report source and one-credit policy are clear in both languages and preserved in history rendering', () => {
  const result = validateModelAnalysis(modelResult({ verdict: 'WAIT' }), input, market);
  for (const [kind, id, en] of [['technical', 'Rencana teknikal otomatis', 'Automatic technical plan'],
    ['ai_adjusted', 'Analisis AI dengan penyesuaian', 'AI analysis with adjustments'], ['ai', 'Analisis AI', 'AI analysis']]) {
    const report = { ...result, provenance: { kind, levels: 'technical' } };
    const idHtml = renderAnalysis(report);
    const enHtml = renderAnalysis(report, 'en');
    assert.ok(idHtml.includes(id));
    assert.ok(enHtml.includes(en));
    assert.ok(idHtml.includes('1 kuota'));
    assert.ok(enHtml.includes('1 credit'));
    assert.ok(idHtml.includes('Entry, SL, TP, R:R, dan pemicu dihitung sistem.'));
    if (kind === 'technical') assert.ok(idHtml.includes('Penjelasan AI tidak tersedia.'));
  }
});
