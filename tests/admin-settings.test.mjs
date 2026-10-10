import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { fromJakartaDateTimeInput, toJakartaDateTimeInput } from '../src/lib/entitlements.ts';
import * as email from '../src/lib/account-email.ts';

const require = createRequire(import.meta.url);
const userId = '11111111-1111-4111-8111-111111111111';
const actorId = '22222222-2222-4222-8222-222222222222';
function load(path, overrides) {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const testModule = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => overrides[name] ?? require(name), testModule, testModule.exports);
  return testModule.exports;
}

test('Jakarta expiry round-trips independently of the host timezone and rejects impossible dates', () => {
  const utc = '2026-10-10T23:45:12.000Z';
  assert.equal(toJakartaDateTimeInput(utc), '2026-10-11T06:45:12');
  assert.equal(fromJakartaDateTimeInput('2026-10-11T06:45:12'), utc);
  assert.equal(fromJakartaDateTimeInput('2026-10-11T06:45'), '2026-10-10T23:45:00.000Z');
  assert.equal(fromJakartaDateTimeInput(''), null);
  for (const value of ['2026-02-30T12:00', '2026-01-01T24:00', 'invalid']) {
    assert.throws(() => fromJakartaDateTimeInput(value));
  }
});

test('admin sends replacement expiry and remaining tokens to the atomic operation, including zero', async () => {
  const calls = [];
  const actions = load('../src/app/admin/actions.ts', {
    '@/lib/authz': { getAdminContext: async () => ({ user: { id: actorId }, admin: {
      rpc: async (name, args) => { calls.push({ name, args }); return { error: null }; },
    } }) },
    'next/cache': { revalidatePath: () => {} },
    '@/lib/site-url': {}, '@/lib/email': {},
  });
  const expiry = '2026-12-01T12:00:00.000Z';
  assert.equal((await actions.setUserEntitlement(userId, 'user', expiry, 5)).success, true);
  assert.equal((await actions.setUserEntitlement(userId, 'user', null, 0)).success, true);
  assert.deepEqual(calls[0], { name: 'set_user_entitlement', args: {
    p_actor_id: actorId, p_user_id: userId, p_role: 'user', p_subscription_end_at: expiry, p_remaining_tokens: 5,
  } });
  for (const value of [-1, 1.5, 100001]) assert.equal((await actions.setUserEntitlement(userId, 'user', expiry, value)).success, false);
  assert.equal((await actions.setUserEntitlement(userId, 'user', 'invalid', 5)).success, false);
  assert.equal(calls.length, 2);
});

function emailActions(allowed = true, linkError = null) {
  const links = [], sent = [], audits = [];
  const actions = load('../src/app/admin/broadcast/actions.ts', {
    '@/lib/authz': { getAdminContext: async () => allowed ? { user: { id: userId }, admin: {
      auth: { admin: { generateLink: async options => {
        links.push(options); return { data: { properties: { hashed_token: 'one-time-hash' } }, error: linkError };
      } } },
      from: () => ({ insert: async value => { audits.push(value); return { error: null }; } }),
    } } : null },
    '@/lib/site-url': { getSiteUrl: () => 'https://trenova.example' },
    '@/lib/account-email': email,
    '@/lib/email': { getEmailCredentials: () => ({ user: 'sender@example.com' }),
      sendTrenovaEmail: async options => { sent.push(options); return { success: true }; } },
  });
  return { ...actions, links, sent, audits };
}

const message = { accountEmail: ' LOGIN@example.com ', recipientEmail: ' Buyer@example.com ',
  subject: 'Pesanan Anda', content: 'Akun: {{account_email}}\n{{reset_link}}\n<b>Terima kasih</b>' };

test('account recovery uses the login address while SMTP delivers the customized message to the buyer', async () => {
  const action = emailActions();
  assert.equal((await action.sendNewAccountEmail(message)).success, true);
  assert.deepEqual(action.links, [{ type: 'recovery', email: 'login@example.com' }]);
  assert.equal(action.sent[0].to, 'buyer@example.com');
  assert.equal(action.sent[0].subject, 'Pesanan Anda');
  assert.ok(action.sent[0].htmlContent.includes('login@example.com'));
  assert.ok(action.sent[0].htmlContent.includes('type=recovery&amp;token_hash=one-time-hash'));
  assert.ok(action.sent[0].htmlContent.includes('&lt;b&gt;Terima kasih&lt;/b&gt;'));
  assert.ok(!JSON.stringify(action.audits).includes('one-time-hash'));
});

test('invalid addresses, missing link placeholder, and non-admin cannot generate or send account links', async () => {
  const invalid = emailActions();
  for (const options of [{ ...message, recipientEmail: 'bad' }, { ...message, accountEmail: 'bad' },
    { ...message, content: 'No password link' }, { ...message, subject: 'Header\r\nInjected' }]) {
    assert.equal((await invalid.sendNewAccountEmail(options)).success, false);
  }
  const denied = emailActions(false);
  assert.equal((await denied.sendNewAccountEmail(message)).success, false);
  assert.deepEqual(invalid.links, []); assert.deepEqual(denied.links, []);
  const missing = emailActions(true, { message: 'User not found' });
  assert.equal((await missing.sendNewAccountEmail(message)).success, false);
  assert.deepEqual(missing.sent, []);
});
