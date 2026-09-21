import type { TranslationKey } from './translations';

/**
 * Customer Feedback — aturan bersama untuk form (client), endpoint API,
 * dan panel admin. Feedback disimpan di tabel public.feedback_submissions
 * dan hanya bisa dibaca admin (lihat migration_feedback.sql).
 */

/** Nilai kategori kanonik — ini yang tersimpan di database. */
export const FEEDBACK_CATEGORIES = [
  'Bug Report',
  'Feature Request',
  'Improvement',
  'General Feedback',
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_LIMITS = {
  subjectMax: 100,
  messageMin: 20,
  messageMax: 2000,
  linkMax: 500,
} as const;

/** ── Lampiran (opsional: link dan/atau gambar) ── */
export const FEEDBACK_ATTACHMENT_BUCKET = 'feedback-attachments';

export const FEEDBACK_IMAGE_LIMITS = {
  /** Sisi terpanjang maksimal setelah kompresi (px). */
  maxDimension: 1600,
  quality: 0.75,
  /** Batas keras hasil kompresi (bytes) — harus <= file_size_limit bucket. */
  maxBytes: 1_000_000,
  /** Batas ukuran file asli sebelum dikompres (bytes). */
  maxSourceBytes: 10_000_000,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  /** Pass tambahan bila hasil kompresi masih melebihi maxBytes. */
  fallbackSteps: [
    { maxDimension: 1280, quality: 0.7 },
    { maxDimension: 1024, quality: 0.6 },
  ],
} as const;

export const FEEDBACK_IMAGE_MAX_MB = Math.round(FEEDBACK_IMAGE_LIMITS.maxBytes / 1_000_000);

/** ── Housekeeping (dibaca di src/lib/feedback-housekeeping.ts) ── */
/** Lampiran di Storage dihapus setelah N hari. */
export const FEEDBACK_ATTACHMENT_RETENTION_DAYS = 30;
/** Objek di bucket dianggap yatim (tanpa row DB) setelah N jam. */
export const FEEDBACK_ORPHAN_MIN_AGE_HOURS = 24;

/** ── Status penanganan oleh admin ── */
export const FEEDBACK_STATUSES = ['new', 'read', 'resolved'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

/** Baris tabel public.feedback_submissions. */
export type FeedbackSubmission = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  category: string;
  subject: string;
  contact_email: string | null;
  message: string;
  attachment_link: string | null;
  attachment_path: string | null;
  attachment_mime: string | null;
  attachment_size: number | null;
  attachment_purged_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type FeedbackInput = {
  category: string;
  subject: string;
  email: string;
  attachmentLink: string;
  message: string;
};

export type FeedbackField = 'category' | 'subject' | 'email' | 'attachmentLink' | 'message';

export type FeedbackErrorCode =
  | 'category_required'
  | 'category_invalid'
  | 'subject_required'
  | 'subject_max'
  | 'email_invalid'
  | 'attachment_link_invalid'
  | 'attachment_image_type'
  | 'attachment_image_size'
  | 'message_required'
  | 'message_min'
  | 'message_max';

export type FeedbackFieldErrors = Partial<Record<FeedbackField, FeedbackErrorCode>>;

/** Kontrak respons POST /api/feedback & aksi admin. */
export type FeedbackApiResponse = {
  success: boolean;
  message: string;
};

/** Urutan field untuk menentukan error pertama yang difokuskan. */
export const FEEDBACK_FIELD_ORDER: FeedbackField[] = [
  'category',
  'subject',
  'email',
  'attachmentLink',
  'message',
];

/** Label kategori yang bisa dilokalkan (value tetap kanonik/Inggris). */
export const FEEDBACK_CATEGORY_KEYS: Record<FeedbackCategory, TranslationKey> = {
  'Bug Report': 'feedback_cat_bug',
  'Feature Request': 'feedback_cat_feature',
  Improvement: 'feedback_cat_improvement',
  'General Feedback': 'feedback_cat_general',
};

/** Pesan (Inggris) untuk validasi sisi server. */
export const FEEDBACK_ERROR_MESSAGES: Record<FeedbackErrorCode, string> = {
  category_required: 'Category is required.',
  category_invalid: 'Category is not valid.',
  subject_required: 'Subject is required.',
  subject_max: `Subject must be ${FEEDBACK_LIMITS.subjectMax} characters or fewer.`,
  email_invalid: 'Please enter a valid email address.',
  attachment_link_invalid: 'Please enter a valid link (must start with http:// or https://).',
  attachment_image_type: 'Only JPG, PNG or WebP images are allowed.',
  attachment_image_size: `Image is too large. Maximum ${FEEDBACK_IMAGE_MAX_MB} MB after compression.`,
  message_required: 'Message is required.',
  message_min: `Message must be at least ${FEEDBACK_LIMITS.messageMin} characters.`,
  message_max: `Message must be ${FEEDBACK_LIMITS.messageMax} characters or fewer.`,
};

const FEEDBACK_ERROR_KEYS: Record<FeedbackErrorCode, TranslationKey> = {
  category_required: 'feedback_err_required',
  category_invalid: 'feedback_err_required',
  subject_required: 'feedback_err_required',
  subject_max: 'feedback_err_subject_max',
  email_invalid: 'feedback_err_email_invalid',
  attachment_link_invalid: 'feedback_err_link_invalid',
  attachment_image_type: 'feedback_err_image_type',
  attachment_image_size: 'feedback_err_image_size',
  message_required: 'feedback_err_required',
  message_min: 'feedback_err_message_min',
  message_max: 'feedback_err_message_max',
};

const FEEDBACK_ERROR_LIMITS: Partial<Record<FeedbackErrorCode, number>> = {
  subject_max: FEEDBACK_LIMITS.subjectMax,
  message_min: FEEDBACK_LIMITS.messageMin,
  message_max: FEEDBACK_LIMITS.messageMax,
  attachment_image_size: FEEDBACK_IMAGE_MAX_MB,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LINK_PATTERN = /^https?:\/\/[^\s]+$/i;

export function isFeedbackCategory(value: unknown): value is FeedbackCategory {
  return typeof value === 'string' && (FEEDBACK_CATEGORIES as readonly string[]).includes(value);
}

export function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return typeof value === 'string' && (FEEDBACK_STATUSES as readonly string[]).includes(value);
}

export function isValidImageType(mime: string): boolean {
  return (FEEDBACK_IMAGE_LIMITS.allowedMimeTypes as readonly string[]).includes(
    (mime || '').toLowerCase()
  );
}

/** Link lampiran harus kosong atau URL http(s) yang wajar. */
export function isValidAttachmentLink(value: string): boolean {
  if (!value) return true;
  if (value.length > FEEDBACK_LIMITS.linkMax) return false;
  return LINK_PATTERN.test(value);
}

/** Mengubah kode validasi menjadi teks siap tampil (dilokalkan). */
export function formatFeedbackError(
  code: FeedbackErrorCode,
  translate: (key: TranslationKey) => string
): string {
  const message = translate(FEEDBACK_ERROR_KEYS[code]);
  const limit = FEEDBACK_ERROR_LIMITS[code];
  return limit === undefined ? message : message.replace('{limit}', String(limit));
}

/**
 * Validasi input mentah (form atau JSON).
 * Selalu mengembalikan nilai yang sudah di-trim agar yang dikirim = yang divalidasi.
 */
export function validateFeedback(input: unknown): {
  errors: FeedbackFieldErrors;
  data: FeedbackInput;
} {
  const source = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const readText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

  const data: FeedbackInput = {
    category: readText(source.category),
    subject: readText(source.subject),
    email: readText(source.email),
    attachmentLink: readText(source.attachmentLink),
    message: readText(source.message),
  };

  const errors: FeedbackFieldErrors = {};

  if (!data.category) {
    errors.category = 'category_required';
  } else if (!isFeedbackCategory(data.category)) {
    errors.category = 'category_invalid';
  }

  if (!data.subject) {
    errors.subject = 'subject_required';
  } else if (data.subject.length > FEEDBACK_LIMITS.subjectMax) {
    errors.subject = 'subject_max';
  }

  if (data.email && !EMAIL_PATTERN.test(data.email)) {
    errors.email = 'email_invalid';
  }

  if (!isValidAttachmentLink(data.attachmentLink)) {
    errors.attachmentLink = 'attachment_link_invalid';
  }

  if (!data.message) {
    errors.message = 'message_required';
  } else if (data.message.length < FEEDBACK_LIMITS.messageMin) {
    errors.message = 'message_min';
  } else if (data.message.length > FEEDBACK_LIMITS.messageMax) {
    errors.message = 'message_max';
  }

  return { errors, data };
}

