import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  FEEDBACK_ATTACHMENT_BUCKET,
  FEEDBACK_ATTACHMENT_RETENTION_DAYS,
  FEEDBACK_ORPHAN_MIN_AGE_HOURS,
} from '@/lib/feedback';

/**
 * Housekeeping Feedback.
 *
 * Kebijakan yang disepakati:
 *  - Lampiran gambar di Storage dihapus setelah masa simpan (default 30 hari),
 *    kolom attachment_* di-NULL-kan dan attachment_purged_at diisi.
 *  - TEKS feedback TIDAK pernah dihapus otomatis (riwayat masukan tetap utuh).
 *  - Objek "yatim" (ada di bucket tapi tidak punya row DB, umur > 24 jam) dihapus
 *    untuk membuang sisa upload yang gagal di tengah jalan.
 *
 * Dipanggil oleh: POST /api/cron/feedback-housekeeping (jadwal bulanan)
 * dan tombol manual di panel admin.
 */

export type HousekeepingResult = {
  retentionDays: number;
  /** Jumlah row yang lampirannya dibersihkan. */
  purgedAttachments: number;
  /** Jumlah file yang benar-benar terhapus dari Storage. */
  deletedFiles: number;
  /** Jumlah file yatim yang dibersihkan. */
  orphansRemoved: number;
  /** Jumlah file yang gagal dihapus. */
  failedFiles: number;
};

export type HousekeepingResponse = {
  success: boolean;
  error?: string;
  result?: HousekeepingResult;
};

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function getAttachmentRetentionDays(): number {
  return readPositiveInt(process.env.FEEDBACK_ATTACHMENT_RETENTION_DAYS, FEEDBACK_ATTACHMENT_RETENTION_DAYS);
}

export function getOrphanMinAgeHours(): number {
  return readPositiveInt(process.env.FEEDBACK_ORPHAN_MIN_AGE_HOURS, FEEDBACK_ORPHAN_MIN_AGE_HOURS);
}

export async function runFeedbackHousekeeping(): Promise<HousekeepingResponse> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { success: false, error: 'Service Role Key missing' };

  const retentionDays = getAttachmentRetentionDays();
  const cutoffIso = new Date(Date.now() - retentionDays * 86_400_000).toISOString();
  const bucket = admin.storage.from(FEEDBACK_ATTACHMENT_BUCKET);

  try {
    // ── 1) Lampiran yang sudah lewat masa simpan ──
    const { data: expiredRows, error: fetchError } = await admin
      .from('feedback_submissions')
      .select('id, attachment_path')
      .not('attachment_path', 'is', null)
      .lt('created_at', cutoffIso)
      .limit(500);

    if (fetchError) return { success: false, error: fetchError.message };

    const rows = expiredRows ?? [];
    const paths = rows
      .map((row) => row.attachment_path as string | null)
      .filter((path): path is string => !!path);

    let deletedFiles = 0;
    let failedFiles = 0;

    if (paths.length > 0) {
      const { data: removed, error: removeError } = await bucket.remove(paths);

      if (removeError) {
        failedFiles = paths.length;
        console.error('Feedback housekeeping: failed to remove attachments:', removeError);
      } else {
        deletedFiles = removed?.length ?? paths.length;
      }

      // Row tetap ada (teks disimpan permanen) — hanya kolom lampiran yang dikosongkan.
      const nowIso = new Date().toISOString();
      const { error: updateError } = await admin
        .from('feedback_submissions')
        .update({
          attachment_path: null,
          attachment_mime: null,
          attachment_size: null,
          attachment_purged_at: nowIso,
          updated_at: nowIso,
        })
        .in('id', rows.map((row) => row.id));

      if (updateError) {
        console.error('Feedback housekeeping: failed to clear attachment columns:', updateError);
      }
    }

    // ── 2) Orphan sweep (file tanpa row DB) ──
    let orphansRemoved = 0;
    const orphanCutoff = Date.now() - getOrphanMinAgeHours() * 3_600_000;

    const { data: folders } = await bucket.list('', { limit: 100 });
    for (const folder of folders ?? []) {
      if (!folder.name) continue;

      const { data: files } = await bucket.list(folder.name, { limit: 100 });
      const candidates = (files ?? []).filter(
        (file) => file.created_at && new Date(file.created_at).getTime() < orphanCutoff
      );
      if (candidates.length === 0) continue;

      const candidatePaths = candidates.map((file) => `${folder.name}/${file.name}`);
      const { data: knownRows } = await admin
        .from('feedback_submissions')
        .select('attachment_path')
        .in('attachment_path', candidatePaths);

      const knownPaths = new Set(
        (knownRows ?? []).map((row) => row.attachment_path as string | null).filter(Boolean) as string[]
      );
      const orphanPaths = candidatePaths.filter((path) => !knownPaths.has(path));

      if (orphanPaths.length > 0) {
        const { data: removedOrphans, error: orphanError } = await bucket.remove(orphanPaths);
        if (orphanError) {
          console.error('Feedback housekeeping: failed to remove orphan files:', orphanError);
        } else {
          orphansRemoved += removedOrphans?.length ?? orphanPaths.length;
        }
      }
    }

    return {
      success: true,
      result: {
        retentionDays,
        purgedAttachments: rows.length,
        deletedFiles,
        orphansRemoved,
        failedFiles,
      },
    };
  } catch (error: unknown) {
    console.error('Feedback housekeeping error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Housekeeping failed' };
  }
}
