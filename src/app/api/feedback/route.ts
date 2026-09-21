import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  FEEDBACK_ATTACHMENT_BUCKET,
  FEEDBACK_ERROR_MESSAGES,
  FEEDBACK_FIELD_ORDER,
  FEEDBACK_IMAGE_LIMITS,
  isFeedbackCategory,
  isValidImageType,
  validateFeedback,
  type FeedbackApiResponse,
  type FeedbackCategory,
} from '@/lib/feedback';

/**
 * POST /api/feedback
 *
 * Menyimpan feedback user ke database (public.feedback_submissions) — bukan email.
 * Lampiran gambar (opsional) diunggah ke Supabase Storage privat; browser sudah
 * mengompresnya lebih dulu. Hanya admin yang bisa membaca feedback (RLS tanpa policy).
 *
 * Request  : multipart/form-data (category, subject, email, attachmentLink, message, image?)
 *            atau application/json (bila tanpa lampiran gambar)
 * Response : { success: boolean, message: string }
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonResponse(body: FeedbackApiResponse, status: number) {
  return NextResponse.json<FeedbackApiResponse>(body, { status });
}

const invalidPayload = () =>
  jsonResponse({ success: false, message: 'Invalid request payload.' }, 400);

const unauthorized = () =>
  jsonResponse({ success: false, message: 'Unauthorized. Please sign in again.' }, 401);

export async function POST(req: Request) {
  try {
    const contentType = (req.headers.get('content-type') ?? '').toLowerCase();

    // ── 1) Baca payload (multipart bila ada lampiran, JSON bila teks saja) ──
    let rawFields: Record<string, unknown> = {};
    let image: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      let form: FormData;
      try {
        form = await req.formData();
      } catch {
        return invalidPayload();
      }

      const readField = (key: string) => {
        const value = form.get(key);
        return typeof value === 'string' ? value : '';
      };

      rawFields = {
        category: readField('category'),
        subject: readField('subject'),
        email: readField('email'),
        attachmentLink: readField('attachmentLink'),
        message: readField('message'),
      };

      const file = form.get('image');
      if (file instanceof File && file.size > 0) image = file;
    } else {
      try {
        const parsed: unknown = await req.json();
        rawFields = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
      } catch {
        return invalidPayload();
      }
    }

    // ── 2) Validasi (aturan identik dengan form) ──
    const { errors, data } = validateFeedback(rawFields);

    const firstInvalidField = FEEDBACK_FIELD_ORDER.find((field) => errors[field]);
    if (firstInvalidField) {
      const errorCode = errors[firstInvalidField]!;
      return jsonResponse({ success: false, message: FEEDBACK_ERROR_MESSAGES[errorCode] }, 400);
    }

    if (image) {
      const mime = (image.type || '').toLowerCase();
      if (!isValidImageType(mime)) {
        return jsonResponse(
          { success: false, message: FEEDBACK_ERROR_MESSAGES.attachment_image_type },
          400
        );
      }
      if (image.size > FEEDBACK_IMAGE_LIMITS.maxBytes) {
        return jsonResponse(
          { success: false, message: FEEDBACK_ERROR_MESSAGES.attachment_image_size },
          400
        );
      }
    }

    // ── 3) Wajib login (feedback adalah fitur Dashboard) ──
    let userId = '';
    let accountEmail = '';

    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return unauthorized();
      userId = user.id;
      accountEmail = user.email ?? '';
    } catch (authError) {
      console.error('Feedback auth check failed:', authError);
      return unauthorized();
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return jsonResponse(
        { success: false, message: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is not set.' },
        500
      );
    }

    // ── 4) Upload lampiran gambar (opsional) ──
    let attachmentPath: string | null = null;
    let attachmentMime: string | null = null;
    let attachmentSize: number | null = null;

    if (image) {
      const mime = image.type.toLowerCase();
      const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
      const path = `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
      const buffer = Buffer.from(await image.arrayBuffer());

      const { error: uploadError } = await admin.storage
        .from(FEEDBACK_ATTACHMENT_BUCKET)
        .upload(path, buffer, { contentType: mime, upsert: false, cacheControl: '3600' });

      if (uploadError) {
        console.error('Feedback attachment upload failed:', uploadError);
        return jsonResponse({ success: false, message: 'Failed to upload attachment' }, 502);
      }

      attachmentPath = path;
      attachmentMime = mime;
      attachmentSize = image.size;
    }

    // ── 5) Simpan feedback ke database ──
    const category: FeedbackCategory = isFeedbackCategory(data.category)
      ? data.category
      : 'General Feedback';

    const { error: insertError } = await admin.from('feedback_submissions').insert({
      user_id: userId,
      user_email: accountEmail || null,
      category,
      subject: data.subject.replace(/[\r\n]+/g, ' '),
      contact_email: data.email || null,
      message: data.message,
      attachment_link: data.attachmentLink || null,
      attachment_path: attachmentPath,
      attachment_mime: attachmentMime,
      attachment_size: attachmentSize,
      status: 'new',
    });

    if (insertError) {
      console.error('Feedback insert failed:', insertError);

      // Jangan tinggalkan file yatim kalau penyimpanan row gagal
      if (attachmentPath) {
        const { error: cleanupError } = await admin.storage
          .from(FEEDBACK_ATTACHMENT_BUCKET)
          .remove([attachmentPath]);
        if (cleanupError) console.error('Failed to roll back orphan attachment:', cleanupError);
      }

      return jsonResponse({ success: false, message: 'Failed to save feedback' }, 500);
    }

    return jsonResponse({ success: true, message: 'Feedback saved successfully' }, 200);
  } catch (error: unknown) {
    console.error('Feedback API error:', error);
    return jsonResponse({ success: false, message: 'Failed to save feedback' }, 500);
  }
}
