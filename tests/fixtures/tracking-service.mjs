import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as core from '../../src/lib/analysis/core.ts';
import * as tracking from '../../src/lib/analysis/tracking.ts';

const source = readFileSync(new URL('../../src/lib/analysis/tracking-service.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
const mod = { exports: {} };
new Function('require', 'module', 'exports', compiled)(name => {
  if (name === './core') return core;
  if (name === './tracking') return tracking;
  throw new Error(`Unexpected tracking-service import: ${name}`);
}, mod, mod.exports);
export const { planItemsFor, refreshPlanTracking, trackItem, fetchCandlesSince, toRecord } = mod.exports;
