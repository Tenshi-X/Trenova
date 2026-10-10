import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Use a disposable staging project. This suite never reads the production env names.
const url = process.env.TRENOVA_TEST_SUPABASE_URL;
const serviceKey = process.env.TRENOVA_TEST_SERVICE_ROLE_KEY;
const anonKey = process.env.TRENOVA_TEST_ANON_KEY;
test('database quota serialization, ownership RLS and fake admin rejection', {
  skip: !url || !serviceKey || !anonKey ? 'Requires a migrated disposable Supabase staging project.' : false,
}, async () => {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const users = [];
  const password = `${randomUUID()}Aa!`;
  const identities = [];
  try {
    for (let index = 0; index < 2; index++) {
      const email = `trenova-test-${randomUUID()}@example.com`;
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true,
        user_metadata: { role: 'admin', initial_plan_days: 9999 } });
      assert.ifError(error); users.push(data.user.id); identities.push(email);
      const result = await admin.from('user_profiles').upsert({ id: data.user.id, email, role: 'user',
        analysis_limit: 1, current_analysis_count: 0, subscription_end_at: new Date(Date.now() + 86400000).toISOString() });
      assert.ifError(result.error);
    }
    const results = await Promise.all([randomUUID(), randomUUID()].map((key) => admin.rpc('reserve_analysis', {
      p_user_id: users[0], p_request_key: key,
    })));
    results.forEach((result) => assert.ifError(result.error));
    assert.deepEqual(results.map((result) => result.data.status).sort(), ['quota', 'reserved']);
    const reserved = results.find((result) => result.data.status === 'reserved').data;
    const denied = await admin.rpc('activate_manual_order', { p_actor_id: users[0], p_user_id: users[1],
      p_plan_code: 'starter-50', p_order_reference: randomUUID(), p_paid_idr: 55000 });
    assert.ok(denied.error, 'Editable admin metadata cannot grant admin access');
    const row = await admin.from('analysis_results').insert({ user_id: users[0], analysis_json: { test: true } }).select('id').single();
    assert.ifError(row.error);
    const client = createClient(url, anonKey, { auth: { persistSession: false } });
    const anonymous = await client.from('analysis_results').select('id');
    assert.ok(anonymous.error || anonymous.data.length === 0);
    const login = await client.auth.signInWithPassword({ email: identities[1], password }); assert.ifError(login.error);
    const other = await client.from('analysis_results').select('id').eq('id', row.data.id);
    assert.ifError(other.error); assert.deepEqual(other.data, []);
    const ownLogin = await client.auth.signInWithPassword({ email: identities[0], password }); assert.ifError(ownLogin.error);
    const own = await client.from('analysis_results').select('id').eq('id', row.data.id);
    assert.ifError(own.error); assert.equal(own.data.length, 1);
    const rpcDenied = await client.rpc('reserve_analysis', { p_user_id: users[0], p_request_key: randomUUID() });
    assert.ok(rpcDenied.error, 'A browser cannot reserve credits directly');
    const refund = await admin.rpc('fail_analysis', { p_user_id: users[0], p_run_id: reserved.run_id, p_error_code: 'integration_test' });
    assert.ifError(refund.error);
    const profile = await admin.from('user_profiles').select('current_analysis_count').eq('id', users[0]).single();
    assert.equal(profile.data.current_analysis_count, 0);
  } finally {
    for (const id of users) {
      await admin.from('analysis_runs').delete().eq('user_id', id);
      await admin.from('analysis_results').delete().eq('user_id', id);
      await admin.from('user_profiles').delete().eq('id', id);
      await admin.auth.admin.deleteUser(id);
    }
  }
});
