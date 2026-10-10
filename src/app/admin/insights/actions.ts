'use server';

import { getAdminContext } from '@/lib/authz';

export async function getInsights() {
  const context = await getAdminContext();
  if (!context) return { error: 'Akses admin diperlukan.' };
  const [summary, reports, audit, control] = await Promise.all([
    context.admin.rpc('get_admin_insights', { p_actor_id: context.user.id }),
    context.admin.from('analysis_reports').select('id,analysis_id,user_id,reason,status,created_at')
      .order('created_at', { ascending: false }).limit(50),
    context.admin.from('admin_audit_events').select('id,actor_id,action,target,created_at')
      .order('created_at', { ascending: false }).limit(50),
    context.admin.from('analysis_control').select('*').eq('singleton', true).single(),
  ]);
  if (summary.error) return { error: summary.error.message };
  return { summary: summary.data as Record<string, number>, reports: reports.data ?? [], audit: audit.data ?? [], control: control.data };
}

export async function updateAnalysisControl(enabled: boolean, rolloutPercent: number, evaluationIds: string[], qualityApproved: boolean) {
  const context = await getAdminContext();
  if (!context) return { error: 'Akses admin diperlukan.' };
  if (!Number.isInteger(rolloutPercent) || rolloutPercent < 0 || rolloutPercent > 100
    || evaluationIds.length > 50 || evaluationIds.some((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    || (enabled && rolloutPercent > 0 && !qualityApproved)) return { error: 'Setujui evaluasi kualitas sebelum membuka rilis pengguna.' };
  const { error } = await context.admin.from('analysis_control').update({
    enabled, rollout_percent: rolloutPercent, evaluation_user_ids: evaluationIds,
    quality_approved_at: qualityApproved ? new Date().toISOString() : null,
    disabled_reason: enabled ? null : 'Dijeda admin', updated_at: new Date().toISOString(),
  }).eq('singleton', true);
  if (!error) await context.admin.from('admin_audit_events').insert({ actor_id: context.user.id,
    action: 'analysis_rollout', target: 'analysis_control', details: { enabled, rolloutPercent, evaluationIds, qualityApproved } });
  return error ? { error: error.message } : { success: true };
}

export async function setReportStatus(id: string, status: 'reviewed' | 'resolved') {
  const context = await getAdminContext();
  if (!context) return { error: 'Akses admin diperlukan.' };
  const { error } = await context.admin.from('analysis_reports').update({ status }).eq('id', id);
  if (!error) await context.admin.from('admin_audit_events').insert({ actor_id: context.user.id,
    action: 'report_status', target: id, details: { status } });
  return error ? { error: error.message } : { success: true };
}
