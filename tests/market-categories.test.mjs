import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/lib/market-categories.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
new Function('exports', 'require', 'module', compiled)(mod.exports, require, mod);
const lib = mod.exports;

const rows = (...symbols) => symbols.map(symbol => ({ symbol }));
const router = (map) => {
  const calls = [];
  const fetcher = async url => {
    calls.push(url);
    const hit = Object.entries(map).find(([key]) => url.includes(`category=${key}&`));
    if (!hit || hit[1] === null) return { ok: false, status: 429, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => hit[1] };
  };
  return { fetcher, calls };
};

test('parseCategorySymbols uppercases, dedupes and ignores junk', () => {
  assert.deepEqual(lib.parseCategorySymbols(rows('doge', 'PEPE', 'doge', '', 'bad symbol')), ['DOGE', 'PEPE']);
  assert.deepEqual(lib.parseCategorySymbols({ status: { error_code: 429 } }), []);
  assert.deepEqual(lib.parseCategorySymbols(null), []);
});

test('getCategories fills what works, omits what fails, caches, and backs off after a failure', async () => {
  lib.resetCategoryCache();
  const r = router({ 'meme-token': rows('doge', 'pepe'), 'artificial-intelligence': rows('tao'), 'layer-1': null });
  const first = await lib.getCategories(r.fetcher, { gapMs: 0, budgetMs: 5000 });
  assert.deepEqual(first.memes, ['DOGE', 'PEPE']);
  assert.deepEqual(first.ai, ['TAO']);
  assert.equal(first.layer1, undefined, 'a failing category is left out');
  assert.equal(first.defi, undefined, 'a category without data is left out');
  const before = r.calls.length;
  await lib.getCategories(r.fetcher, { gapMs: 0 });
  assert.equal(r.calls.length, before, 'cached + failure backoff: no new requests');
});

test('restrictCategories keeps only listed coins and drops empty categories', () => {
  const out = lib.restrictCategories({ memes: ['DOGE', 'PEPE', 'WIF'], ai: ['TAO'], rwa: ['ONDO'] }, ['DOGE', 'PEPE', 'ONDO', 'BTC']);
  assert.deepEqual(out, { memes: ['DOGE', 'PEPE'], rwa: ['ONDO'] });
});
