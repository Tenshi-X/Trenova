import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './fixtures/load-ts.mjs';

// Minimal in-memory stand-in for the Supabase query builder (only what the alert job uses).
function fakeDb(tables) {
  const from = (name) => {
    const state = { filters: [], mode: 'select', patch: null, limitN: Infinity };
    const rows = () => (tables[name] ??= []);
    const apply = () => rows().filter(row => state.filters.every(f => f(row)));
    const builder = {
      select() { return builder; },
      eq(col, val) { state.filters.push(r => r[col] === val); return builder; },
      neq(col, val) { state.filters.push(r => r[col] !== val); return builder; },
      gt(col, val) { state.filters.push(r => r[col] > val); return builder; },
      gte(col, val) { state.filters.push(r => r[col] >= val); return builder; },
      lte(col, val) { state.filters.push(r => r[col] <= val); return builder; },
      in(col, vals) { state.filters.push(r => vals.includes(r[col])); return builder; },
      not(col, op, val) { if (op === 'is' && val === null) state.filters.push(r => r[col] !== null && r[col] !== undefined); return builder; },
      order() { return builder; },
      limit(n) { state.limitN = n; return builder; },
      update(patch) { state.mode = 'update'; state.patch = patch; return builder; },
      upsert(payload, opts) {
        const key = opts?.onConflict ?? 'id';
        for (const item of [].concat(payload)) {
          const existing = rows().find(r => key.split(',').every(k => r[k] === item[k]));
          if (existing) Object.assign(existing, item); else rows().push({ ...item });
        }
        return Promise.resolve({ error: null });
      },
      then(resolve) {
        if (state.mode === 'update') { for (const r of apply()) Object.assign(r, state.patch); return resolve({ data: null, error: null }); }
        return resolve({ data: apply().slice(0, state.limitN).map(r => ({ ...r })), error: null });
      },
    };
    return builder;
  };
  return { from };
}

function load(sent, { fail = false } = {}) {
  const { runPlanAlerts } = loadTs('lib/alerts-service.ts', { overrides: {
    './email': { sendTrenovaEmail: async (mail) => { sent.push(mail); return { success: !fail, message: '' }; } },
    './site-url': { getSiteUrl: () => 'https://x.test' },
    './analysis/tracking-service': { refreshPlanTracking: async () => ({ records: [], unavailable: 0, deferred: 0 }) },
  } });
  return runPlanAlerts;
}

const now = Date.now();
const iso = (offsetMs) => new Date(now + offsetMs).toISOString();
const track = (over = {}) => ({ analysis_id: 'a1', setup_index: 0, user_id: 'u1', symbol: 'ETH', timeframe: '1h', direction: 'SHORT', status: 'SL', final: true,
  notified_status: null, r: -1, triggered_at: null, filled_at: iso(-3600_000), closed_at: iso(-1800_000), created_at: iso(-900_000), ...over });

test('a status change produces one digest and is marked as notified', async () => {
  const sent = []; const tables = { plan_tracking: [track()], analysis_results: [], user_alert_settings: [],
    user_profiles: [{ id: 'u1', email: 'a@x.test', role: 'user', subscription_end_at: iso(30 * 86400_000), analysis_limit: 50, current_analysis_count: 1 }] };
  const result = await load(sent)(fakeDb(tables), { budgetMs: 5000 });
  assert.equal(result.digests, 1); assert.equal(sent.length, 1); assert.equal(sent[0].to, 'a@x.test');
  assert.equal(tables.plan_tracking[0].notified_status, 'SL');
  const again = await load([])(fakeDb(tables), { budgetMs: 5000 });
  assert.equal(again.digests, 0);
});

test('opted-out users get no e-mail but the status is still marked', async () => {
  const sent = []; const tables = { plan_tracking: [track()], analysis_results: [],
    user_alert_settings: [{ user_id: 'u1', email_alerts: false, expiry_alerts: true, expiry_notified_for: null, low_quota_notified_limit: null }],
    user_profiles: [{ id: 'u1', email: 'a@x.test', role: 'user', subscription_end_at: iso(30 * 86400_000), analysis_limit: 50, current_analysis_count: 1 }] };
  const result = await load(sent)(fakeDb(tables), { budgetMs: 5000 });
  assert.equal(sent.length, 0); assert.equal(result.digests, 0); assert.equal(tables.plan_tracking[0].notified_status, 'SL');
});

test('failed sends are retried on the next run and reported as remaining', async () => {
  const tables = { plan_tracking: [track()], analysis_results: [], user_alert_settings: [],
    user_profiles: [{ id: 'u1', email: 'a@x.test', role: 'user', subscription_end_at: iso(30 * 86400_000), analysis_limit: 50, current_analysis_count: 1 }] };
  const result = await load([], { fail: true })(fakeDb(tables), { budgetMs: 5000 });
  assert.equal(result.failed, 1); assert.equal(result.remaining, true); assert.equal(tables.plan_tracking[0].notified_status, null);
});

test('old backlog is marked silently with no e-mail', async () => {
  const sent = []; const tables = { plan_tracking: [track({ created_at: iso(-60_000), filled_at: iso(-5 * 86400_000), closed_at: iso(-5 * 86400_000) })],
    analysis_results: [], user_alert_settings: [], user_profiles: [{ id: 'u1', email: 'a@x.test', role: 'user', subscription_end_at: iso(30 * 86400_000), analysis_limit: 50, current_analysis_count: 1 }] };
  await load(sent)(fakeDb(tables), { budgetMs: 5000 });
  assert.equal(sent.length, 0); assert.equal(tables.plan_tracking[0].notified_status, 'SL');
});

test('expiry and low-token reminders are sent once; admins are skipped', async () => {
  const sent = []; const tables = { plan_tracking: [], analysis_results: [], user_alert_settings: [], user_profiles: [
    { id: 'u2', email: 'b@x.test', role: 'user', subscription_end_at: iso(3 * 86400_000), analysis_limit: 10, current_analysis_count: 9 },
    { id: 'u3', email: 'admin@x.test', role: 'admin', subscription_end_at: iso(2 * 86400_000), analysis_limit: 10, current_analysis_count: 10 }] };
  const first = await load(sent)(fakeDb(tables), { budgetMs: 5000 });
  assert.equal(first.reminders, 2); assert.deepEqual(sent.map(m => m.to), ['b@x.test', 'b@x.test']);
  const second = await load([])(fakeDb(tables), { budgetMs: 5000 });
  assert.equal(second.reminders, 0);
  tables.user_profiles[0].current_analysis_count = 1; // topped up: marker resets
  await load([])(fakeDb(tables), { budgetMs: 5000 });
  assert.equal(tables.user_alert_settings.find(r => r.user_id === 'u2').low_quota_notified_limit, null);
});

test('the e-mail cap defers extra users to the next run', async () => {
  const sent = []; const tables = { plan_tracking: [track(), track({ analysis_id: 'a2', user_id: 'u2' })], analysis_results: [], user_alert_settings: [], user_profiles: [
    { id: 'u1', email: 'a@x.test', role: 'user', subscription_end_at: iso(30 * 86400_000), analysis_limit: 50, current_analysis_count: 1 },
    { id: 'u2', email: 'b@x.test', role: 'user', subscription_end_at: iso(30 * 86400_000), analysis_limit: 50, current_analysis_count: 1 }] };
  const result = await load(sent)(fakeDb(tables), { budgetMs: 5000, maxEmails: 1 });
  assert.equal(sent.length, 1); assert.equal(result.remaining, true);
});
