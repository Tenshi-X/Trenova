'use server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  FEEDBACK_ATTACHMENT_BUCKET,
  FEEDBACK_STATUSES,
  type FeedbackStatus,
  type FeedbackSubmission,
} from '@/lib/feedback';
import { runFeedbackHousekeeping, type HousekeepingResult } from '@/lib/feedback-housekeeping';

/**
 * Server actions panel admin untuk Feedback.
 * Semua aksi diawali guard admin (proxy.ts sudah menjaga /admin, ini lapisan kedua)
 * dan memakai service role supaya bisa membaca tabel yang RLS-nya tanpa policy.
 */

const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 menit

type AdminCheck = { ok: boolean; error?: string; email?: string };

export type FeedbackCounts = { total: number; new: number; last30: number };

export type FeedbackListResult = {
  success: boolean;
  error?: string;
  submissions?: FeedbackSubmission[];
  total?: number;
  counts?: FeedbackCounts;
  /** feedback id -> signed URL lampiran (berlaku 10 menit). */
  attachments?: Record<string, string>;
};

async function assertAdmin(): Promise<AdminCheck> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Sesi tidak ditemukan. Silakan login ulang.' };
  if (user.user_metadata?.role === 'admin') return { ok: true, email: user.email ?? '' };

  // Fallback: cek role di tabel user_profiles
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, error: 'Akun Anda tidak memiliki akses admin.' };

  const { data: profile } = await admin
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { ok: false, error: 'Akun Anda tidak memiliki akses admin.' };

  return { ok: true, email: user.email ?? '' };
}

export async function getFeedbackSubmissions(
  params: { page?: number; pageSize?: number; status?: string; search?: string } = {}
): Promise<FeedbackListResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createSupabaseAdminClient();
  if (!admin) return { success: false, error: 'Service Role Key missing' };

  const page = Math.max(1, Math.floor(params.page ?? 1));
  const pageSize = Math.min(100, Math.max(5, Math.floor(params.pageSize ?? 10)));
  const from = (page - 1) * pageSize;

  let query = admin
    .from('feedback_submissions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  const status = params.status?.trim();
  if (status && (FEEDBACK_STATUSES as readonly string[]).includes(status)) {
    query = query.eq('status', status);
  }

  const search = params.search?.trim();
  if (search) {
    const term = search.replace(/[%(),]/g, ' ').trim();
    if (term) {
      query = query.or(
        `subject.ilike.%${term}%,message.ilike.%${term}%,contact_email.ilike.%${term}%,user_email.ilike.%${term}%`
      );
    }
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Fetch feedback error:', error);
    return { success: false, error: error.message };
  }

  const rows = (data ?? []) as FeedbackSubmission[];

  const last30Iso = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [totalRes, newRes, last30Res] = await Promise.all([
    admin.from('feedback_submissions').select('id', { count: 'exact', head: true }),
    admin.from('feedback_submissions').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    admin.from('feedback_submissions').select('id', { count: 'exact', head: true }).gte('created_at', last30Iso),
  ]);

  // Signed URL (bucket privat) untuk lampiran gambar di halaman ini
  const attachments: Record<string, string> = {};
  const paths = rows
    .map((row) => row.attachment_path)
    .filter((path): path is string => !!path);

  if (paths.length > 0) {
    const { data: signed, error: signedError } = await admin.storage
      .from(FEEDBACK_ATTACHMENT_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

    if (signedError) {
      console.error('Failed to sign feedback attachments:', signedError);
    } else {
      for (const row of rows) {
        if (!row.attachment_path) continue;
        const match = (signed ?? []).find((item) => item.path === row.attachment_path);
        if (match?.signedUrl) attachments[row.id] = match.signedUrl;
      }
    }
  }

  return {
    success: true,
    submissions: rows,
    total: count ?? 0,
    counts: {
      total: totalRes.count ?? 0,
      new: newRes.count ?? 0,
      last30: last30Res.count ?? 0,
    },
    attachments,
  };
}

export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!id || !(FEEDBACK_STATUSES as readonly string[]).includes(status)) {
    return { success: false, error: 'Status tidak valid.' };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return { success: false, error: 'Service Role Key missing' };

  const { error } = await admin
    .from('feedback_submissions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Update feedback status error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteFeedbackSubmission(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!id) return { success: false, error: 'ID feedback tidak valid.' };

  const admin = createSupabaseAdminClient();
  if (!admin) return { success: false, error: 'Service Role Key missing' };

  const { data: row, error: fetchError } = await admin
    .from('feedback_submissions')
    .select('attachment_path')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Fetch feedback before delete error:', fetchError);
    return { success: false, error: fetchError.message };
  }

  // Hapus file lampiran lebih dulu supaya tidak ada objek yatim
  if (row?.attachment_path) {
    const { error: removeError } = await admin.storage
      .from(FEEDBACK_ATTACHMENT_BUCKET)
      .remove([row.attachment_path]);

    if (removeError) {
      console.error('Failed to remove feedback attachment:', removeError);
    }
  }

  const { error: deleteError } = await admin.from('feedback_submissions').delete().eq('id', id);

  if (deleteError) {
    console.error('Delete feedback error:', deleteError);
    return { success: false, error: deleteError.message };
  }

  return { success: true };
}

/** Menjalankan housekeeping manual dari panel admin (lampiran > 30 hari + file yatim). */
export async function runFeedbackHousekeepingNow(): Promise<{
  success: boolean;
  error?: string;
  result?: HousekeepingResult;
}> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  return runFeedbackHousekeeping();
}

