'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageOff,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '@/context/LanguageContext';
import { FEEDBACK_STATUSES, type FeedbackStatus, type FeedbackSubmission } from '@/lib/feedback';
import {
  deleteFeedbackSubmission,
  getFeedbackSubmissions,
  runFeedbackHousekeepingNow,
  updateFeedbackStatus,
  type FeedbackCounts,
} from './actions';

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  new: 'Baru',
  read: 'Dibaca',
  resolved: 'Selesai',
};

const STATUS_BADGE: Record<FeedbackStatus, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  read: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
};

const CATEGORY_BADGE =
  'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1000) return `${Math.round(bytes / 1000)} KB`;
  return `${bytes} B`;
}

function isStatus(value: string): value is FeedbackStatus {
  return (FEEDBACK_STATUSES as readonly string[]).includes(value);
}

export default function AdminFeedbackPage() {
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [attachments, setAttachments] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<FeedbackCounts>({ total: 0, new: 0, last30: 0 });
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'' | FeedbackStatus>('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isHousekeeping, setIsHousekeeping] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getFeedbackSubmissions({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter,
        search: searchTerm,
      });

      if (!res.success) throw new Error(res.error || 'Gagal memuat feedback.');

      setSubmissions(res.submissions ?? []);
      setAttachments(res.attachments ?? {});
      setTotal(res.total ?? 0);
      if (res.counts) setCounts(res.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleStatus = async (id: string, status: FeedbackStatus) => {
    setBusyId(id);
    setNotice(null);

    try {
      const res = await updateFeedbackStatus(id, status);
      if (!res.success) throw new Error(res.error);

      setSubmissions((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
      setNotice({ type: 'ok', text: `Status diubah menjadi "${STATUS_LABEL[status]}".` });
    } catch (err) {
      setNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal mengubah status feedback.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setNotice(null);

    try {
      const res = await deleteFeedbackSubmission(id);
      if (!res.success) throw new Error(res.error);

      setConfirmDeleteId(null);
      setNotice({ type: 'ok', text: 'Feedback berhasil dihapus.' });
      await load();
    } catch (err) {
      setNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal menghapus feedback.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleHousekeeping = async () => {
    setIsHousekeeping(true);
    setNotice(null);

    try {
      const res = await runFeedbackHousekeepingNow();
      if (!res.success) throw new Error(res.error);

      const result = res.result;
      setNotice({
        type: 'ok',
        text: result
          ? `Housekeeping selesai — lampiran dibersihkan: ${result.purgedAttachments}, file terhapus: ${result.deletedFiles}, file yatim: ${result.orphansRemoved}, gagal: ${result.failedFiles} (retensi ${result.retentionDays} hari).`
          : 'Housekeeping selesai.',
      });
      await load();
    } catch (err) {
      setNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Housekeeping gagal dijalankan.',
      });
    } finally {
      setIsHousekeeping(false);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-20 p-6 md:p-8 pt-10">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <MessageSquare className="text-neon" /> Feedback User
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Masukan dari user Dashboard — halaman ini hanya bisa diakses admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Muat ulang
          </button>
          <button
            onClick={handleHousekeeping}
            disabled={isHousekeeping}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon text-white font-bold text-sm shadow-md shadow-neon/20 hover:bg-neon-dim transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isHousekeeping ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {isHousekeeping ? 'Membersihkan...' : 'Jalankan Housekeeping'}
          </button>
        </div>
      </div>

      {/* ── Notifikasi aksi ── */}
      {notice && (
        <div
          className={clsx(
            'flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium',
            notice.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          )}
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span className="flex-1">{notice.text}</span>
          <button onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100" aria-label="Tutup">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Statistik ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Feedback', value: counts.total },
          { label: 'Belum Dibaca', value: counts.new },
          { label: '30 Hari Terakhir', value: counts.last30 },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className="text-2xl font-black text-foreground mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filter & pencarian ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(isStatus(e.target.value) ? e.target.value : '');
            setPage(1);
          }}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neon/30"
        >
          <option value="">Semua status</option>
          {FEEDBACK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>

        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchTerm(searchInput);
                setPage(1);
              }
            }}
            placeholder="Cari subjek, pesan, atau email..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neon/30"
          />
        </div>

        <button
          onClick={() => {
            setSearchTerm(searchInput);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          Cari
        </button>

        {(searchTerm || statusFilter) && (
          <button
            onClick={() => {
              setSearchInput('');
              setSearchTerm('');
              setStatusFilter('');
              setPage(1);
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
          >
            Reset
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4 text-sm font-medium text-rose-700 dark:text-rose-300">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Daftar feedback ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 size={40} className="animate-spin mb-4 text-neon" />
          <p className="text-sm">Memuat feedback...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <MessageSquare size={44} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Belum ada feedback</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {searchTerm || statusFilter
              ? 'Tidak ada hasil untuk filter ini.'
              : 'Feedback dari user Dashboard akan muncul di sini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((row) => {
            const createdAt = new Date(row.created_at);
            const isExpanded = expandedId === row.id;
            const signedUrl = attachments[row.id];
            const status = isStatus(row.status) ? row.status : 'new';

            return (
              <div
                key={row.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : row.id)}
                  className="w-full text-left p-4 md:p-5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider',
                          CATEGORY_BADGE
                        )}
                      >
                        {row.category}
                      </span>
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider',
                          STATUS_BADGE[status]
                        )}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                      {(row.attachment_path || row.attachment_link) && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <Link2 size={12} /> Lampiran
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm md:text-base font-bold text-foreground truncate">{row.subject}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{row.message}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {row.contact_email || row.user_email || 'Tanpa email'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {createdAt.toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <ChevronDown
                    size={18}
                    className={clsx(
                      'text-slate-300 dark:text-slate-600 shrink-0 transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 p-4 md:p-5 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                          Akun Pengirim
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 break-all">{row.user_email || '-'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                          Email Kontak
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 break-all">
                          {row.contact_email || 'Tidak diberikan'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Pesan</p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{row.message}</p>
                    </div>

                    {row.attachment_path ? (
                      signedUrl ? (
                        <div className="space-y-2">
                          <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                            Lampiran Gambar ({formatBytes(row.attachment_size)})
                          </p>
                          <a href={signedUrl} target="_blank" rel="noreferrer" className="block w-fit">
                            <div
                              className="w-40 h-40 rounded-xl border border-slate-200 dark:border-slate-800 bg-cover bg-center hover:opacity-90 transition-opacity"
                              style={{ backgroundImage: `url(${signedUrl})` }}
                              role="img"
                              aria-label="Lampiran feedback"
                            />
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Gagal membuat link lampiran.</p>
                      )
                    ) : row.attachment_purged_at ? (
                      <p className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <ImageOff size={14} /> Lampiran sudah dibersihkan otomatis oleh housekeeping.
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">Tanpa lampiran gambar.</p>
                    )}

                    {row.attachment_link && (
                      <div>
                        <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                          Link Lampiran
                        </p>
                        <a
                          href={row.attachment_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-neon hover:underline break-all"
                        >
                          <Link2 size={14} /> {row.attachment_link}
                        </a>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleStatus(row.id, 'read')}
                        disabled={busyId === row.id || status === 'read'}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        {busyId === row.id ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}{' '}
                        Tandai Dibaca
                      </button>
                      <button
                        onClick={() => handleStatus(row.id, 'resolved')}
                        disabled={busyId === row.id || status === 'resolved'}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all disabled:opacity-50"
                      >
                        <CheckCheck size={14} /> Tandai Selesai
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(row.id)}
                        disabled={busyId === row.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 text-xs font-bold text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all disabled:opacity-50 ml-auto"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 px-4">
                Halaman {page} dari {totalPages} • {total} feedback
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Modal konfirmasi hapus ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-foreground">Hapus feedback ini?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Row dan lampiran gambarnya akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>
            <div className="p-6 flex gap-3 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={busyId === confirmDeleteId}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-60"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={busyId === confirmDeleteId}
                className="flex-1 px-4 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {busyId === confirmDeleteId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
