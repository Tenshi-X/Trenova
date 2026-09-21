-- =====================================================================
-- Customer Feedback (disimpan di database) — menggantikan alur kirim email
-- Jalankan file ini di Supabase SQL Editor.
--
-- Kebijakan retensi (housekeeping bulanan otomatis):
--   * File gambar di Storage dihapus setelah 30 hari
--     (override env: FEEDBACK_ATTACHMENT_RETENTION_DAYS)
--   * Teks feedback disimpan permanen (tidak pernah dihapus otomatis)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.feedback_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    contact_email TEXT,
    message TEXT NOT NULL,
    attachment_link TEXT,
    attachment_path TEXT,
    attachment_mime TEXT,
    attachment_size INTEGER,
    attachment_purged_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_created_at
    ON public.feedback_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_status
    ON public.feedback_submissions (status);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_user_id
    ON public.feedback_submissions (user_id);

-- Dipakai housekeeping untuk mencari lampiran yang sudah lewat masa simpan
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_attachment
    ON public.feedback_submissions (created_at) WHERE attachment_path IS NOT NULL;

ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Sengaja TANPA policy apa pun:
-- anon & authenticated tidak bisa SELECT/INSERT/UPDATE/DELETE,
-- sehingga user biasa tidak mungkin membaca feedback siapa pun.
-- Semua akses lewat service role di server (endpoint submit + panel admin),
-- jadi hanya admin yang bisa melihat isi feedback.

-- Bucket privat untuk lampiran gambar (akses hanya via signed URL server-side)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'feedback-attachments',
    'feedback-attachments',
    false,
    1048576,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 1048576,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];
