import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const srcRoot = fileURLToPath(new URL('../../src/', import.meta.url));

function resolveSource(from, name) {
  const base = name.startsWith('@/') ? path.join(srcRoot, name.slice(2)) : path.resolve(path.dirname(from), name);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    if (existsSync(candidate) && /\.(ts|tsx)$/.test(candidate)) return candidate;
  }
  return null;
}

/**
 * Loads a TypeScript source file for tests without a bundler. `overrides` replaces modules by import name
 * (e.g. '@/lib/authz'); `globals` are injected as free variables such as fetch. Other src imports are compiled recursively.
 */
export function loadTs(file, { overrides = {}, globals = {} } = {}) {
  const cache = new Map();
  const load = (filePath) => {
    if (cache.has(filePath)) return cache.get(filePath).exports;
    const source = readFileSync(filePath, 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const mod = { exports: {} };
    cache.set(filePath, mod);
    const names = Object.keys(globals);
    new Function('require', 'module', 'exports', ...names, compiled)((name) => {
      if (name in overrides) return overrides[name];
      if (name.startsWith('@/') || name.startsWith('.')) {
        const resolved = resolveSource(filePath, name);
        if (!resolved) throw new Error(`Cannot resolve ${name} from ${filePath}`);
        return load(resolved);
      }
      return require(name);
    }, mod, mod.exports, ...names.map(key => globals[key]));
    return mod.exports;
  };
  const resolved = file.startsWith('/') ? file : path.join(srcRoot, file);
  return load(resolved);
}
