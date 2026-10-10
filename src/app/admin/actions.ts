'use server';

import { revalidatePath } from 'next/cache';
import { getAdminContext } from '@/lib/authz';
import { getSiteUrl } from '@/lib/site-url';
import { getEmailCredentials, sendTrenovaEmail } from '@/lib/email';

export type AuthUser = { id: string; email?: string; created_at: string; last_sign_in_at?: string };
export type UserProfile = {
  id: string; email: string; role: string; subscription_end_at: string | null;
  created_at: string; analysis_limit?: number; current_analysis_count?: number;
  plan_code?: string | null; pending_plan_review?: boolean;
};

async function audit(actorId: string, action: string, target: string, details: Record<string, unknown>) {
  const context = await getAdminContext();
  if (!context) return;
  await context.admin.from('admin_audit_events').insert({ actor_id: actorId, action, target, details });
}

export async function getAuthUsers() {
  const context = await getAdminContext();
  if (!context) return { success: false, error: 'Akses admin diperlukan.' };
  const { data, error } = await context.admin.auth.admin.listUsers();
  return error ? { success: false, error: error.message }
    : { success: true, users: data.users as AuthUser[] };
}

export async function getUserProfiles() {
  const context = await getAdminContext();
  if (!context) return { success: false, error: 'Akses admin diperlukan.' };
  const { data, error } = await context.admin.from('user_profiles').select('*')
    .order('created_at', { ascending: false });
  return error ? { success: false, error: error.message }
    : { success: true, profiles: data as UserProfile[] };
}

export async function provisionUser(
  userId: string, _email: string, role: string, days: number,
  addAnalysisLimit: number, totalAnalysisLimit: number,
) {
  const context = await getAdminContext();
  if (!context) return { success: false, error: 'Akses admin diperlukan.' };
  if (!['user', 'admin'].includes(role) || !Number.isInteger(days) || days < 0 || days > 3650
    || !Number.isInteger(addAnalysisLimit) || addAnalysisLimit < 0
    || !Number.isInteger(totalAnalysisLimit) || totalAnalysisLimit < 0) {
    return { success: false, error: 'Peran, masa aktif, atau kuota tidak valid.' };
  }
  const { error } = await context.admin.rpc('provision_user_v2', {
    p_actor_id:context.user.id,p_user_id:userId,p_role:role,p_days:days,
    p_add_quota:addAnalysisLimit,p_total_quota:totalAnalysisLimit,
  });
  if (error) return { success:false,error:error.message };
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteUserProfile(userId: string) {
  const context = await getAdminContext();
  if (!context) return { success: false, error: 'Akses admin diperlukan.' };
  if (context.user.id === userId) return { success: false, error: 'Admin tidak dapat menonaktifkan akun sendiri.' };
  const { error } = await context.admin.rpc('deactivate_user_v2', {
    p_actor_id:context.user.id,p_user_id:userId,
  });
  if (error) return { success:false,error:error.message };
  revalidatePath('/admin');
  return { success: true };
}

export async function createAndProvisionUser(
  email: string, role: string, days: number, analysisLimit: number,
) {
  const context = await getAdminContext();
  if (!context) return { success: false, error: 'Akses admin diperlukan.' };
  const cleanEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || !['user', 'admin'].includes(role)
    || !Number.isInteger(days) || days < 1 || days > 3650
    || !Number.isInteger(analysisLimit) || analysisLimit < 0) {
    return { success: false, error: 'Data akun tidak valid.' };
  }
  if (!getEmailCredentials()) return { success:false,error:'Layanan email belum dikonfigurasi.' };
  const existing = await context.admin.from('user_profiles').select('id').eq('email',cleanEmail).maybeSingle();
  if (existing.error) return { success:false,error:'Data akun belum dapat diperiksa.' };
  if (existing.data) return { success:false,error:'Akun sudah ada. Gunakan aktivasi pesanan atau kirim tautan pengaturan kata sandi.' };
  const { data, error } = await context.admin.auth.admin.generateLink({
    type: 'invite', email: cleanEmail,
  });
  if (error || !data.user || !data.properties?.hashed_token) return { success: false, error: error?.message || 'Undangan gagal dibuat.' };
  const { error: profileError } = await context.admin.from('user_profiles').upsert({
    id: data.user.id, email: cleanEmail, role, subscription_end_at: null,
    analysis_limit: analysisLimit, current_analysis_count: 0,
    pending_plan_days: days, pending_plan_review: false,
  });
  if (profileError) return { success: false, error: profileError.message };
  await audit(context.user.id, 'invite_user', data.user.id, { role, days, analysis_limit: analysisLimit });
  const invitationUrl = `${getSiteUrl()}/auth/confirm?type=invite&token_hash=${encodeURIComponent(data.properties.hashed_token)}`;
  const invitation = await sendTrenovaEmail({ to:cleanEmail,subject:'Undangan Akun Trenova',
    htmlContent:`Akun Trenova Anda sudah disiapkan.<br/><br/><a href="${invitationUrl}">Terima undangan dan atur kata sandi</a>`,convertNewlines:false });
  if (!invitation.success) return { success:false,error:'Akun sudah dibuat, tetapi email gagal dikirim. Kirim tautan pengaturan kata sandi dari panel email.' };
  revalidatePath('/admin');
  return { success: true };
}
