import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/app/auth/confirm/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function confirmRoute(error = null) {
  const verified = [];
  const localRequire = (name) => {
    if (name === '@/lib/site-url') return { getSiteUrl: () => 'https://trenova.example' };
    if (name === '@/lib/supabase/server') return { createSupabaseServerClient: async () => ({ auth: {
      verifyOtp: async (options) => { verified.push(options); return { error }; },
    } }) };
    return require(name);
  };
  const compiledModule = { exports: {} };
  new Function('require','module','exports',compiled)(localRequire,compiledModule,compiledModule.exports);
  return { handler:compiledModule.exports.GET,verified };
}

test('invite and recovery establish a server session before password setup', async () => {
  for (const type of ['invite','recovery']) {
    const { handler,verified } = confirmRoute();
    const response = await handler(new Request(`https://trenova.example/auth/confirm?type=${type}&token_hash=one-time-hash&next=https://other.example`));
    assert.equal(response.headers.get('location'),'https://trenova.example/reset-password');
    assert.deepEqual(verified,[{ type,token_hash:'one-time-hash' }]);
  }
});

test('invalid or expired password links return a usable error page', async () => {
  const invalid = confirmRoute();
  const response = await invalid.handler(new Request('https://trenova.example/auth/confirm?type=admin&token_hash=hash'));
  assert.equal(response.headers.get('location'),'https://trenova.example/auth/auth-code-error');
  assert.deepEqual(invalid.verified,[]);
  const expired = confirmRoute({ message:'expired' });
  const rejected = await expired.handler(new Request('https://trenova.example/auth/confirm?type=invite&token_hash=expired'));
  assert.equal(rejected.headers.get('location'),'https://trenova.example/auth/auth-code-error');
});
