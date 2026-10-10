import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { NextRequest } from 'next/server.js';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const userId = '11111111-1111-4111-8111-111111111111';

function loadModule(path, overrides) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const compiledModule = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    name => overrides[name] ?? require(name), compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

function proxyModule({ role = 'user', loggedIn = true, refreshCookie = false } = {}) {
  return loadModule('../src/proxy.ts', {
    '@supabase/ssr': { createServerClient: (_url, _key, options) => ({
      auth: { getUser: async () => {
        if (refreshCookie) options.cookies.setAll([{ name: 'refreshed-session', value: 'fresh', options: { httpOnly: true } }]);
        return { data: { user: loggedIn ? { id: userId, user_metadata: { role: 'admin' } } : null } };
      } },
      from: () => {
        const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: role ? { role } : null }) };
        return chain;
      },
    }) },
  });
}

async function withProxyConfig(action) {
  const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const previous = keys.map(key => process.env[key]);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.example';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
  try { await action(); }
  finally { keys.forEach((key, index) => {
    if (previous[index] === undefined) delete process.env[key]; else process.env[key] = previous[index];
  }); }
}

test('signed-in admins go straight to admin and keep refreshed session cookies', () => withProxyConfig(async () => {
  const { proxy } = proxyModule({ role: 'admin', refreshCookie: true });
  for (const path of ['/login', '/sign-in']) {
    const response = await proxy(new NextRequest(`https://trenova.example${path}`));
    assert.equal(response.headers.get('location'), 'https://trenova.example/admin');
    assert.equal(response.cookies.get('refreshed-session')?.value, 'fresh');
  }
}));

test('editable admin metadata never grants admin routing or access', () => withProxyConfig(async () => {
  for (const role of ['user', null]) {
    const { proxy } = proxyModule({ role });
    for (const path of ['/sign-in', '/admin/insights']) {
      const response = await proxy(new NextRequest(`https://trenova.example${path}`));
      assert.equal(response.headers.get('location'), 'https://trenova.example/dashboard');
    }
  }
  const { proxy } = proxyModule({ loggedIn: false });
  const response = await proxy(new NextRequest('https://trenova.example/admin'));
  assert.equal(response.headers.get('location'), 'https://trenova.example/sign-in');
}));

function controlModule({ adminAccess = true } = {}) {
  const updates = [];
  const audit = [];
  const admin = { from: table => ({
    update: values => { updates.push({ table, values }); return { eq: async () => ({ error: null }) }; },
    insert: async values => { audit.push({ table, values }); return { error: null }; },
  }) };
  return { updates, audit, ...loadModule('../src/app/admin/insights/actions.ts', {
    '@/lib/authz': { getAdminContext: async () => adminAccess ? { user: { id: userId }, admin } : null },
  }) };
}

test('admin can open 100% access without claiming quality evaluation is complete', async () => {
  const control = controlModule();
  assert.deepEqual(await control.updateAnalysisControl(true, 100, [], false), { success: true });
  assert.equal(control.updates[0].table, 'analysis_control');
  assert.equal(control.updates[0].values.enabled, true);
  assert.equal(control.updates[0].values.rollout_percent, 100);
  assert.equal(control.updates[0].values.quality_approved_at, null);
  assert.equal(control.audit[0].values.details.qualityApproved, false);
});

test('non-admin cannot open access and invalid rollout settings cannot be saved', async () => {
  const denied = controlModule({ adminAccess: false });
  assert.ok((await denied.updateAnalysisControl(true, 100, [], false)).error);
  assert.deepEqual(denied.updates, []);
  const invalid = controlModule();
  for (const [percent, evaluators] of [[101, []], [-1, []], [50, ['not-a-uuid']]]) {
    assert.ok((await invalid.updateAnalysisControl(true, percent, evaluators, false)).error);
  }
  assert.deepEqual(invalid.updates, []);
});

test('admin can still pause analyses after opening access', async () => {
  const control = controlModule();
  assert.deepEqual(await control.updateAnalysisControl(false, 100, [], false), { success: true });
  assert.equal(control.updates[0].values.enabled, false);
  assert.equal(control.updates[0].values.disabled_reason, 'Dijeda admin');
});
