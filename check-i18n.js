/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src');

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}

const tr = fs.readFileSync(path.join(src, 'lib', 'translations.ts'), 'utf8');
// Union keys: lines like  | 'key'
const unionKeys = new Set([...tr.matchAll(/^\s*\|\s*'([a-z0-9_]+)'/gm)].map(m => m[1]));
// Read each top-level language block by its known marker. This avoids a fragile
// regular expression that breaks on the current dictionary formatting.
const dictKeys = {};
for (const lang of ['en', 'id']) {
  const start = tr.indexOf(`  ${lang}: {`);
  const end = lang === 'en' ? tr.indexOf('  id: {', start + 1) : tr.lastIndexOf('\n};');
  if (start === -1 || end === -1) {
    throw new Error(`Unable to read the ${lang} translation block.`);
  }
  const block = tr.slice(start, end);
  dictKeys[lang] = new Set([...block.matchAll(/^\s{4}([a-z0-9_]+):/gm)].map(x => x[1]));
}

const used = new Set();
for (const f of walk(src)) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/(?<![A-Za-z0-9_$])t\(\s*'([a-z0-9_]+)'\s*\)/g)) used.add(m[1]);
}

const usedNotInUnion = [...used].filter(k => !unionKeys.has(k)).sort();
const unionMissingEn = [...unionKeys].filter(k => !dictKeys.en.has(k)).sort();
const unionMissingId = [...unionKeys].filter(k => !dictKeys.id.has(k)).sort();

console.log('used_literal_keys=' + used.size);
console.log('union_keys=' + unionKeys.size);
console.log('used_not_in_union=' + JSON.stringify(usedNotInUnion));
console.log('union_missing_en=' + JSON.stringify(unionMissingEn));
console.log('union_missing_id=' + JSON.stringify(unionMissingId));
