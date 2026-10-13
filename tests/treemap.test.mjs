import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/lib/treemap.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
new Function('exports', 'require', 'module', compiled)(mod.exports, require, mod);
const { squarify } = mod.exports;

test('rectangles fill the box exactly, stay inside it, never overlap and match their share', () => {
  const items = [60, 45, 9, 8, 4, 4, 3, 2, 1, 0.5].map((value, i) => ({ id: `c${i}`, value }));
  const rects = squarify(items, 1000, 500);
  assert.equal(rects.length, items.length);
  const area = rects.reduce((sum, r) => sum + r.w * r.h, 0);
  assert.ok(Math.abs(area - 500000) < 1e-6);
  const total = items.reduce((s, i) => s + i.value, 0);
  for (const r of rects) {
    assert.ok(r.x >= -1e-9 && r.y >= -1e-9 && r.x + r.w <= 1000 + 1e-9 && r.y + r.h <= 500 + 1e-9);
    const share = items.find(i => i.id === r.id).value / total;
    assert.ok(Math.abs((r.w * r.h) / 500000 - share) < 1e-9);
  }
  for (let a = 0; a < rects.length; a++) for (let b = a + 1; b < rects.length; b++) {
    const A = rects[a], B = rects[b];
    const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
    const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
    assert.ok(!(ox > 1e-6 && oy > 1e-6), `${A.id} overlaps ${B.id}`);
  }
});

test('drops non-positive values and handles empty input', () => {
  assert.deepEqual(squarify([], 100, 100), []);
  assert.deepEqual(squarify([{ id: 'a', value: 0 }, { id: 'b', value: NaN }], 100, 100), []);
  assert.equal(squarify([{ id: 'a', value: 5 }, { id: 'b', value: -1 }], 100, 50).length, 1);
});
