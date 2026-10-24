import type { SupabaseClient } from '@supabase/supabase-js';
import { sendTrenovaEmail } from './email';
import { getSiteUrl } from './site-url';
import { refreshPlanTracking, type AnalysisRow } from './analysis/tracking-service';
import { alertDecision, buildExpiryEmail, buildLowQuotaEmail, buildPlanDigest, expiryDue, lowQuotaState, EXPIRY_WARNING_DAYS, type AlertRow } from './alerts';

// The scheduled alert job. Each run: (1) brings plan tracking up to date for recent analyses, (2) e-mails one digest
// per user for plans whose status moved on, (3) sends the expiry (H-7) and low-token reminders once each.
// Work that does not fit the time budget is left for the next run and reported in `remaining`.

const LOOKBACK_MS = 10 * 86_400_000;
export type AlertRunResult = { tracked: number; digests: number; reminders: number; failed: number; remaining: boolean };

type Settings = { user_id: string; email_alerts: boolean; expiry_alerts: boolean; expiry_notified_for: string | null; low_quota_notified_limit: number | null };
type Profile = { id: string; email: string | null; role: string | null; subscription_end_at: string | null; analysis_limit: number | null; current_analysis_count: number | null };

const ALERT_COLUMNS = 'analysis_id,setup_index,user_id,symbol,timeframe,direction,status,notified_status,r,triggered_at,filled_at,closed_at,created_at';

async function syncTracking(admin: SupabaseClient, deadline: number): Promise<{ tracked: number; more: boolean }> {
  const since = new Date(Date.now() - LOOKBACK_MS).toISOString();
  const { data: recent } = await admin.from('analysis_results').select('id').gte('created_at', since).not('coin_symbol', 'is', null).order('created_at', { ascending: false }).limit(300);
  const recentIds = (recent ?? []).map(row => (row as { id: string }).id);
  const known = recentIds.length ? await admin.from('plan_tracking').select('analysis_id').in('analysis_id', recentIds) : { data: [] };
  const knownIds = new Set((known.data ?? []).map(row => (row as { analysis_id: string }).analysis_id));
  const missing = recentIds.filter(id => !knownIds.has(id));
  const { data: open } = await admin.from('plan_tracking').select('analysis_id').eq('final', false).order('checked_at', { ascending: true }).limit(80);
  const ids = [...new Set([...missing, ...(open ?? []).map(row => (row as { analysis_id: string }).analysis_id)])].slice(0, 60);
  if (!ids.length) return { tracked: 0, more: false };
  const { data: rows } = await admin.from('analysis_results').select('id,user_id,coin_symbol,timeframe,created_at,analysis_json').in('id', ids);
  const result = await refreshPlanTracking(admin, (rows ?? []) as AnalysisRow[], { budgetMs: Math.max(1000, deadline - Date.now()), maxGroups: 12 });
  return { tracked: result.records.length, more: result.deferred > 0 || missing.length + (open ?? []).length > ids.length };
}

async function loadMap<T extends { id?: string; user_id?: string }>(admin: SupabaseClient, table: string, columns: string, key: 'id' | 'user_id', ids: string[]): Promise<Map<string, T>> {
  if (!ids.length) return new Map();
  const { data } = await admin.from(table).select(columns).in(key, ids);
  return new Map(((data ?? []) as unknown as T[]).map(row => [String(row[key]), row]));
}

export async function runPlanAlerts(admin: SupabaseClient, options: { budgetMs?: number; maxEmails?: number } = {}): Promise<AlertRunResult> {
  const started = Date.now();
  const deadline = started + (options.budgetMs ?? 20_000);
  const maxEmails = options.maxEmails ?? 20;
  const siteUrl = getSiteUrl();
  const result: AlertRunResult = { tracked: 0, digests: 0, reminders: 0, failed: 0, remaining: false };
  let sent = 0;

  const synced = await syncTracking(admin, started + Math.floor((deadline - started) * 0.6));
  result.tracked = synced.tracked; result.remaining = synced.more;

  // 1. Plan status digests.
  const since = new Date(Date.now() - LOOKBACK_MS).toISOString();
  const { data: candidates } = await admin.from('plan_tracking').select(ALERT_COLUMNS).neq('status', 'WAITING_TRIGGER').gte('created_at', since).order('created_at', { ascending: true }).limit(500);
  const toSend = new Map<string, AlertRow[]>(); const silent: AlertRow[] = [];
  for (const row of (candidates ?? []) as AlertRow[]) {
    const decision = alertDecision(row);
    if (decision === 'send') toSend.set(row.user_id, [...(toSend.get(row.user_id) ?? []), row]);
    else if (decision === 'silent') silent.push(row);
  }
  const mark = async (rows: AlertRow[]) => {
    await Promise.all(rows.map(row => admin.from('plan_tracking').update({ notified_status: row.status }).eq('analysis_id', row.analysis_id).eq('setup_index', row.setup_index)));
  };
  await mark(silent);

  const userIds = [...toSend.keys()];
  const [settings, profiles] = await Promise.all([
    loadMap<Settings>(admin, 'user_alert_settings', 'user_id,email_alerts,expiry_alerts,expiry_notified_for,low_quota_notified_limit', 'user_id', userIds),
    loadMap<Profile>(admin, 'user_profiles', 'id,email,role,subscription_end_at,analysis_limit,current_analysis_count', 'id', userIds)]);
  for (const [userId, rows] of toSend) {
    const optedOut = settings.get(userId)?.email_alerts === false; const email = profiles.get(userId)?.email;
    if (optedOut || !email) { await mark(rows); continue; }
    if (sent >= maxEmails || Date.now() > deadline) { result.remaining = true; continue; }
    sent++;
    const digest = buildPlanDigest(rows, siteUrl);
    const outcome = await sendTrenovaEmail({ to: email, subject: digest.subject, htmlContent: digest.html, convertNewlines: false });
    if (outcome.success) { result.digests++; await mark(rows); } else { result.failed++; result.remaining = true; }
  }

  // 2. Reminders: plan expiry (H-7) and low tokens, each sent once per period.
  if (Date.now() < deadline) {
    const horizon = new Date(Date.now() + EXPIRY_WARNING_DAYS * 86_400_000).toISOString();
    const { data: soon } = await admin.from('user_profiles').select('id,email,role,subscription_end_at,analysis_limit,current_analysis_count')
      .gt('subscription_end_at', new Date().toISOString()).lte('subscription_end_at', horizon).limit(200);
    const { data: lowQuota } = await admin.from('user_profiles').select('id,email,role,subscription_end_at,analysis_limit,current_analysis_count')
      .gt('subscription_end_at', new Date().toISOString()).gt('analysis_limit', 0).limit(1000);
    const lowCandidates = ((lowQuota ?? []) as Profile[]).filter(profile => (profile.analysis_limit ?? 0) - (profile.current_analysis_count ?? 0) <= 10);
    const bySoon = new Map(((soon ?? []) as Profile[]).map(profile => [profile.id, profile]));
    const all = new Map([...bySoon, ...lowCandidates.map(profile => [profile.id, profile] as const)]);
    // Users whose quota recovered may carry an old marker, so those are looked up as well.
    const { data: markers } = await admin.from('user_alert_settings').select('user_id,email_alerts,expiry_alerts,expiry_notified_for,low_quota_notified_limit').not('low_quota_notified_limit', 'is', null).limit(500);
    const markerMap = new Map(((markers ?? []) as Settings[]).map(row => [row.user_id, row]));
    const recovering = [...markerMap.keys()].filter(id => !all.has(id));
    const recoveringProfiles = await loadMap<Profile>(admin, 'user_profiles', 'id,email,role,subscription_end_at,analysis_limit,current_analysis_count', 'id', recovering);
    for (const [id, profile] of recoveringProfiles) all.set(id, profile);
    const extraSettings = await loadMap<Settings>(admin, 'user_alert_settings', 'user_id,email_alerts,expiry_alerts,expiry_notified_for,low_quota_notified_limit', 'user_id', [...all.keys()].filter(id => !markerMap.has(id)));
    const settingsOf = (id: string) => markerMap.get(id) ?? extraSettings.get(id);
    const save = (userId: string, patch: Partial<Settings>) => admin.from('user_alert_settings').upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

    for (const [id, profile] of all) {
      if (profile.role === 'admin') continue;
      const setting = settingsOf(id);
      const optedOut = setting?.email_alerts === false; const expiryOff = setting?.expiry_alerts === false;
      if (expiryDue(profile.subscription_end_at, setting?.expiry_notified_for ?? null)) {
        if (optedOut || expiryOff || !profile.email) { await save(id, { expiry_notified_for: profile.subscription_end_at }); }
        else if (sent < maxEmails && Date.now() < deadline) {
          sent++;
          const mail = buildExpiryEmail(profile.subscription_end_at as string, siteUrl);
          const outcome = await sendTrenovaEmail({ to: profile.email, subject: mail.subject, htmlContent: mail.html, convertNewlines: false });
          if (outcome.success) { result.reminders++; await save(id, { expiry_notified_for: profile.subscription_end_at }); } else { result.failed++; result.remaining = true; }
        } else result.remaining = true;
      }
      const quota = lowQuotaState(profile.analysis_limit, profile.current_analysis_count, setting?.low_quota_notified_limit ?? null);
      if (quota === 'reset') await save(id, { low_quota_notified_limit: null });
      else if (quota === 'send') {
        if (optedOut || !profile.email) { await save(id, { low_quota_notified_limit: profile.analysis_limit }); }
        else if (sent < maxEmails && Date.now() < deadline) {
          sent++;
          const limit = profile.analysis_limit as number;
          const mail = buildLowQuotaEmail(limit - (profile.current_analysis_count ?? 0), limit, siteUrl);
          const outcome = await sendTrenovaEmail({ to: profile.email, subject: mail.subject, htmlContent: mail.html, convertNewlines: false });
          if (outcome.success) { result.reminders++; await save(id, { low_quota_notified_limit: limit }); } else { result.failed++; result.remaining = true; }
        } else result.remaining = true;
      }
    }
  }
  return result;
}
