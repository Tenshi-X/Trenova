import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as core from '../../src/lib/analysis/core.ts';
import * as report from './report.mjs';

const source = readFileSync(new URL('../../src/lib/analysis/backtest.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
const mod = { exports: {} };
new Function('require', 'module', 'exports', compiled)(name => {
  if (name === './core') return core;
  if (name === './report') return report;
  throw new Error(`Unexpected backtest import: ${name}`);
}, mod, mod.exports);
export const { simulatePlan, runBacktest, summarize, groupSummary, splitHalves, riskProfile } = mod.exports;
