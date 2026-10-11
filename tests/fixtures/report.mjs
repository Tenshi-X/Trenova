import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as core from '../../src/lib/analysis/core.ts';

const source = readFileSync(new URL('../../src/lib/analysis/report.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
const mod = { exports: {} };
new Function('require', 'module', 'exports', compiled)(name => {
  if (name === './core') return core;
  throw new Error(`Unexpected report import: ${name}`);
}, mod, mod.exports);
export const { buildTechnicalAnalysis, enrichTechnicalAnalysis, technicalFallback } = mod.exports;
