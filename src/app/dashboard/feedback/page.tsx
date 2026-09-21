'use client';

import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ImagePlus, Link2, Loader2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { useLanguage } from '@/context/LanguageContext';
import { compressImageFile } from '@/lib/image';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_KEYS,
  FEEDBACK_FIELD_ORDER,
  FEEDBACK_IMAGE_LIMITS,
  FEEDBACK_IMAGE_MAX_MB,
  FEEDBACK_LIMITS,
  formatFeedbackError,
  isValidImageType,
  validateFeedback,
  type FeedbackErrorCode,
  type FeedbackField,
  type FeedbackFieldErrors,
} from '@/lib/feedback';

const EMPTY_FORM = { category: '', subject: '', email: '', attachmentLink: '', message: '' };

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1000) return `${Math.round(bytes / 1000)} KB`;
  return `${bytes} B`;
}

export default function DashboardFeedbackPage() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FeedbackFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // ── Lampiran opsional (link dan/atau gambar) ──
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{ originalSize: number; size: number } | null>(null);
  const [imageError, setImageError] = useState<FeedbackErrorCode | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const updateField = (field: FeedbackField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Hapus error inline begitu user mulai memperbaiki field
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    if (isSent) setIsSent(false);
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    setImageInfo(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageSelect = async (file: File | null) => {
    if (!file) return;

    setImage(null);
    setImagePreview(null);
    setImageInfo(null);
    setImageError(null);

    if (!isValidImageType(file.type)) {
      setImageError('attachment_image_type');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > FEEDBACK_IMAGE_LIMITS.maxSourceBytes) {
      setImageError('attachment_image_size');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, {
        maxDimension: FEEDBACK_IMAGE_LIMITS.maxDimension,
        quality: FEEDBACK_IMAGE_LIMITS.quality,
        maxBytes: FEEDBACK_IMAGE_LIMITS.maxBytes,
        fallbackSteps: [...FEEDBACK_IMAGE_LIMITS.fallbackSteps],
      });

      if (compressed.size > FEEDBACK_IMAGE_LIMITS.maxBytes) {
        setImageError('attachment_image_size');
        return;
      }

      // Selalu dikirim sebagai JPEG hasil kompresi (hemat storage)
      setImage(new File([compressed.blob], 'feedback-image.jpg', { type: 'image/jpeg' }));
      setImagePreview(compressed.dataUrl);
      setImageInfo({ originalSize: compressed.originalSize, size: compressed.size });
    } catch (error) {
      console.error('Failed to compress feedback image:', error);
      setImageError('attachment_image_size');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Cegah double submit
    if (isSubmitting || isCompressing) return;

    const { errors: validationErrors, data } = validateFeedback(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstInvalid = FEEDBACK_FIELD_ORDER.find((field) => validationErrors[field]);
      if (firstInvalid) document.getElementById(`feedback-${firstInvalid}`)?.focus();
      return;
    }

    if (imageError) return;

    setErrors({});
    setIsSubmitting(true);
    setIsSent(false);

    try {
      const payload = new FormData();
      payload.append('category', data.category);
      payload.append('subject', data.subject);
      payload.append('email', data.email);
      payload.append('attachmentLink', data.attachmentLink);
      payload.append('message', data.message);
      if (image) payload.append('image', image);

      // Tanpa header Content-Type manual supaya boundary multipart dibuat browser
      const res = await fetch('/api/feedback', { method: 'POST', body: payload });
      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        // Input dipertahankan supaya user tidak kehilangan tulisannya
        toast.error(t('feedback_failed'));
        return;
      }

      toast.success(t('feedback_success'));
      setForm(EMPTY_FORM);
      setErrors({});
      clearImage();
      setIsSent(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error(t('feedback_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (hasError: boolean) =>
    clsx(
      'w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500',
      hasError
        ? 'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40'
        : 'border-slate-200 dark:border-slate-800 focus:border-neon focus:ring-neon/20'
    );

  const renderError = (field: FeedbackField) => {
    const code = errors[field];
    if (!code) return null;

    return (
      <p id={`feedback-${field}-error`} className="flex items-center gap-1.5 text-xs font-medium text-red-500">
        <AlertCircle size={13} /> {formatFeedbackError(code, t)}
      </p>
    );
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-8 px-4 md:px-0">
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
          <MessageSquare className="text-neon" /> {t('feedback_page_title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('feedback_page_desc')}</p>
      </div>

      {/* ── Form Card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
        {isSent && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t('feedback_success')}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="feedback-category" className="text-sm font-semibold text-foreground flex items-center gap-2">
              {t('feedback_category_label')} <span className="text-red-500">*</span>
            </label>
            <select
              id="feedback-category"
              name="category"
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              disabled={isSubmitting}
              aria-invalid={!!errors.category}
              aria-describedby={errors.category ? 'feedback-category-error' : undefined}
              className={clsx(fieldClass(!!errors.category), 'cursor-pointer')}
            >
              <option value="">{t('feedback_category_placeholder')}</option>
              {FEEDBACK_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {t(FEEDBACK_CATEGORY_KEYS[category])}
                </option>
              ))}
            </select>
            {renderError('category')}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label htmlFor="feedback-subject" className="text-sm font-semibold text-foreground flex items-center gap-2">
              {t('feedback_subject_label')} <span className="text-red-500">*</span>
            </label>
            <input
              id="feedback-subject"
              name="subject"
              type="text"
              value={form.subject}
              maxLength={FEEDBACK_LIMITS.subjectMax}
              onChange={(e) => updateField('subject', e.target.value)}
              placeholder={t('feedback_subject_placeholder')}
              disabled={isSubmitting}
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? 'feedback-subject-error' : undefined}
              className={fieldClass(!!errors.subject)}
            />
            <div className="flex items-center justify-between gap-3">
              {renderError('subject')}
              <span className="ml-auto text-[11px] text-slate-400">
                {form.subject.length}/{FEEDBACK_LIMITS.subjectMax}
              </span>
            </div>
          </div>

          {/* Email (optional) */}
          <div className="space-y-2">
            <label htmlFor="feedback-email" className="text-sm font-semibold text-foreground flex items-center gap-2">
              {t('feedback_email_label')}
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                {t('feedback_optional')}
              </span>
            </label>
            <input
              id="feedback-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder={t('feedback_email_placeholder')}
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'feedback-email-error' : undefined}
              className={fieldClass(!!errors.email)}
            />
            {renderError('email')}
          </div>

          {/* ── Lampiran (opsional) ── */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              {t('feedback_attachment_label')}
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                {t('feedback_optional')}
              </span>
            </div>

            {/* Link / URL */}
            <div className="space-y-2">
              <label
                htmlFor="feedback-attachmentLink"
                className="text-xs font-semibold text-slate-500 dark:text-slate-400"
              >
                {t('feedback_link_label')}
              </label>
              <div className="relative">
                <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="feedback-attachmentLink"
                  name="attachmentLink"
                  type="url"
                  value={form.attachmentLink}
                  maxLength={FEEDBACK_LIMITS.linkMax}
                  onChange={(e) => updateField('attachmentLink', e.target.value)}
                  placeholder={t('feedback_link_placeholder')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.attachmentLink}
                  aria-describedby={errors.attachmentLink ? 'feedback-attachmentLink-error' : undefined}
                  className={clsx(fieldClass(!!errors.attachmentLink), 'pl-9')}
                />
              </div>
              {renderError('attachmentLink')}
            </div>

            {/* Gambar */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t('feedback_image_label')}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept={FEEDBACK_IMAGE_LIMITS.allowedMimeTypes.join(',')}
                onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
                disabled={isSubmitting}
                className="hidden"
              />

              {image && imagePreview ? (
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  <div
                    className="w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-cover bg-center shrink-0"
                    style={{ backgroundImage: `url(${imagePreview})` }}
                    role="img"
                    aria-label={t('feedback_image_label')}
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-semibold text-foreground truncate">{image.name}</p>
                    {imageInfo && (
                      <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        {t('feedback_image_compressed')
                          .replace('{original}', formatBytes(imageInfo.originalSize))
                          .replace('{compressed}', formatBytes(imageInfo.size))}
                      </p>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                        className="text-[11px] font-bold text-neon hover:underline disabled:opacity-60"
                      >
                        {t('feedback_image_change')}
                      </button>
                      <button
                        type="button"
                        onClick={clearImage}
                        disabled={isSubmitting}
                        className="text-[11px] font-bold text-rose-500 hover:underline disabled:opacity-60"
                      >
                        {t('feedback_image_remove')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || isCompressing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-neon hover:text-neon transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isCompressing ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                  {isCompressing ? t('feedback_image_compressing') : t('feedback_image_choose')}
                </button>
              )}

              {imageError && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                  <AlertCircle size={13} /> {formatFeedbackError(imageError, t)}
                </p>
              )}

              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {t('feedback_attachment_hint').replace('{limit}', String(FEEDBACK_IMAGE_MAX_MB))}
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label htmlFor="feedback-message" className="text-sm font-semibold text-foreground flex items-center gap-2">
              {t('feedback_message_label')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="feedback-message"
              name="message"
              rows={6}
              value={form.message}
              maxLength={FEEDBACK_LIMITS.messageMax}
              onChange={(e) => updateField('message', e.target.value)}
              placeholder={t('feedback_message_placeholder')}
              disabled={isSubmitting}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'feedback-message-error' : undefined}
              className={clsx(fieldClass(!!errors.message), 'resize-y min-h-[140px]')}
            />
            <div className="flex items-center justify-between gap-3">
              {renderError('message')}
              <span className="ml-auto text-[11px] text-slate-400">
                {form.message.length}/{FEEDBACK_LIMITS.messageMax}
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="w-full sm:w-auto px-8 py-3.5 bg-neon text-white font-bold rounded-xl shadow-lg shadow-neon/20 hover:bg-neon-dim hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isSubmitting ? t('feedback_sending') : t('feedback_send_btn')}
            </button>
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('feedback_note')}</p>
          </div>
        </form>
      </div>
    </div>
  );
}
