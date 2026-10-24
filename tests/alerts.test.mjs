import test from 'node:test';
import assert from 'node:assert/strict';
import { alertDecision, expiryDue, lowQuotaState, buildPlanDigest, buildExpiryEmail, buildLowQuotaEmail } from '../src/lib/alerts.ts';

const base = { analysis_id: 'a', setup_index: 0, user_id: 'u', symbol: 'BTC', timeframe: '4h', direction: 'LONG', status: 'FILLED',
  notified_status: null, r: null, triggered_at: null, filled_at: '2026-10-24T10:00:00Z', closed_at: null, created_at: '2026-10-24T10:30:00Z' };

test('waiting plans never produce alerts', () => assert.equal(alertDecision({ ...base, status: 'WAITING_TRIGGER' }), 'skip'));
test('a fresh status change is sent', () => assert.equal(alertDecision(base), 'send'));
test('an already notified status is skipped', () => assert.equal(alertDecision({ ...base, notified_status: 'FILLED' }), 'skip'));
test('progress after a notification is sent, regress is not', () => {
  assert.equal(alertDecision({ ...base, status: 'TP1', notified_status: 'FILLED', closed_at: null, filled_at: '2026-10-24T10:00:00Z' }), 'send');
  assert.equal(alertDecision({ ...base, status: 'FILLED', notified_status: 'TP1' }), 'skip');
});
test('old news first seen long after the event is marked silently', () => {
  assert.equal(alertDecision({ ...base, filled_at: '2026-10-20T10:00:00Z', created_at: '2026-10-24T10:30:00Z' }), 'silent');
});
test('terminal states are sent once', () => {
  assert.equal(alertDecision({ ...base, status: 'SL', closed_at: '2026-10-24T11:00:00Z', notified_status: 'FILLED' }), 'send');
  assert.equal(alertDecision({ ...base, status: 'SL', closed_at: '2026-10-24T11:00:00Z', notified_status: 'SL' }), 'skip');
});
test('expiry reminder only inside 7 days, once per end date', () => {
  const now = Date.parse('2026-10-24T00:00:00Z');
  assert.equal(expiryDue('2026-10-30T00:00:00Z', null, now), true);
  assert.equal(expiryDue('2026-11-10T00:00:00Z', null, now), false);
  assert.equal(expiryDue('2026-10-20T00:00:00Z', null, now), false);
  assert.equal(expiryDue('2026-10-30T00:00:00Z', '2026-10-30T00:00:00Z', now), false);
  assert.equal(expiryDue('2026-10-30T00:00:00Z', '2026-09-30T00:00:00Z', now), true);
  assert.equal(expiryDue(null, null, now), false);
});
test('low quota: send once, reset when healthy', () => {
  assert.equal(lowQuotaState(10, 8, null), 'send');
  assert.equal(lowQuotaState(10, 8, 10), 'skip');
  assert.equal(lowQuotaState(10, 2, 10), 'reset');
  assert.equal(lowQuotaState(10, 2, null), 'skip');
  assert.equal(lowQuotaState(0, 0, null), 'skip');
  assert.equal(lowQuotaState(10, 12, null), 'skip');
  assert.equal(lowQuotaState(20, 18, 10), 'send');
});
test('digest escapes content and links to history', () => {
  const mail = buildPlanDigest([{ ...base, symbol: '<b>X', status: 'SL', closed_at: '2026-10-24T11:00:00Z' }], 'https://x.test');
  assert.ok(!mail.html.includes('<b>X'));
  assert.ok(mail.html.includes('https://x.test/dashboard/history'));
  assert.match(mail.subject, /status rencana berubah/);
  assert.match(buildPlanDigest([base, { ...base, setup_index: 1 }], 'https://x.test').subject, /2 rencana/);
});
test('reminder emails mention the numbers', () => {
  assert.match(buildExpiryEmail('2026-10-30T00:00:00Z', 'https://x.test', Date.parse('2026-10-27T00:00:00Z')).subject, /3 hari/);
  assert.match(buildLowQuotaEmail(2, 10, 'https://x.test').subject, /sisa 2/);
});
