'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ClipboardList, Loader2, RefreshCw, Save, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getInsights, setReportStatus, updateAnalysisControl } from './actions';

type InsightData = Awaited<ReturnType<typeof getInsights>>;
type ReportStatus = 'new' | 'reviewed' | 'resolved';
const statusLabels: Record<ReportStatus, string> = { new: 'Baru', reviewed: 'Ditinjau', resolved: 'Selesai' };
const metrics = [
  ['total_runs', 'Analisis'], ['failed_runs', 'Gagal'], ['total_cost_idr', 'Biaya Gemini tercatat (Rp)'],
  ['unknown_cost_runs', 'Biaya belum diketahui'], ['total_quota_remaining', 'Sisa kuota aktif'],
  ['total_input_tokens', 'Token masuk'], ['total_output_tokens', 'Token keluar'], ['open_reports', 'Laporan baru'],
] as const;

export default function InsightsPage() {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busyReports, setBusyReports] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | ReportStatus>('all');
  const saveLock = useRef(false);
  const reportLocks = useRef(new Set<string>());
  const loadId = useRef(0);

  const load = useCallback(async () => {
    const id = ++loadId.current;
    setLoading(true);
    setLoadError('');
    try {
      const result = await getInsights();
      if (id !== loadId.current) return;
      if ('error' in result) throw new Error(result.error);
      setData(result);
    } catch (error) {
      if (id === loadId.current) setLoadError(error instanceof Error ? error.message : 'Data gagal dimuat. Silakan coba lagi.');
    } finally {
      if (id === loadId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const requestSequence = loadId;
    void load();
    return () => { requestSequence.current++; };
  }, [load]);

  const saveControl = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saveLock.current) return;
    const form = new FormData(event.currentTarget);
    saveLock.current = true;
    setSaving(true);
    setNotice(null);
    try {
      const result = await updateAnalysisControl(form.get('enabled') === 'on', Number(form.get('rollout')),
        String(form.get('evaluators')).split(/[\s,]+/).filter(Boolean), form.get('quality') === 'on');
      if (result.error) throw new Error(result.error);
      setDirty(false);
      setNotice({ text: 'Pengaturan rilis berhasil disimpan.', error: false });
      toast.success('Pengaturan rilis berhasil disimpan.');
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pengaturan gagal disimpan. Silakan coba lagi.';
      setNotice({ text: message, error: true });
      toast.error(message);
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };

  const changeStatus = async (id: string, status: 'reviewed' | 'resolved') => {
    if (reportLocks.current.has(id)) return;
    reportLocks.current.add(id);
    setBusyReports(previous => ({ ...previous, [id]: status }));
    setNotice(null);
    try {
      const result = await setReportStatus(id, status);
      if (result.error) throw new Error(result.error);
      setNotice({ text: `Status laporan diperbarui menjadi ${statusLabels[status].toLowerCase()}.`, error: false });
      toast.success(`Status laporan diperbarui menjadi ${statusLabels[status].toLowerCase()}.`);
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Status gagal diperbarui. Silakan coba lagi.';
      setNotice({ text: message, error: true });
      toast.error(message);
    } finally {
      reportLocks.current.delete(id);
      setBusyReports(previous => { const next = { ...previous }; delete next[id]; return next; });
    }
  };

  const summary = data && 'summary' in data ? data.summary : null;
  const reports = data && 'reports' in data ? data.reports ?? [] : [];
  const visibleReports = reports.filter(report => filter === 'all' || report.status === filter);
  const audit = data && 'audit' in data ? data.audit ?? [] : [];
  const control = data && 'control' in data ? data.control : null;

  return <main className="ux-panel max-w-6xl mx-auto p-4 sm:p-6 space-y-6 text-foreground">
    <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-neon text-sm hover:bg-neon/10"><ArrowLeft size={16} />Panel admin</Link>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl sm:text-3xl font-black">Biaya & laporan</h1><p className="mt-1 text-sm text-slate-500">Pantau pemakaian, atur rilis analisis, dan tindak lanjuti laporan pengguna.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading || saving || Object.keys(busyReports).length > 0}
        className="ux-button inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold" aria-busy={loading}>
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />{loading ? 'Memuat…' : 'Perbarui data'}
      </button>
    </div>
    {notice && <div role={notice.error ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${notice.error ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
      {notice.error ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}<p className="flex-1">{notice.text}</p>
      <button type="button" onClick={() => setNotice(null)} aria-label="Tutup pemberitahuan" className="rounded px-1 hover:bg-black/10">×</button>
    </div>}
    {loadError && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
      <p>{loadError}{data ? ' Data terakhir masih ditampilkan.' : ''}</p>
      <button type="button" onClick={() => void load()} disabled={loading} className="ux-button mt-3 rounded-lg border border-rose-500/30 px-3 py-2">Coba lagi</button>
    </div>}
    {loading && !data && <div role="status" aria-label="Memuat biaya dan laporan" className="space-y-6">
      <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" />Memuat biaya dan laporan…</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{metrics.map(([key]) => <div key={key} className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />)}</div>
      <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>}
    {summary && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-busy={loading}>
      {metrics.map(([key, label]) => <div key={key} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <p className="text-sm text-slate-500">{label}</p><strong className="mt-2 block text-2xl">{Number(summary[key] || 0).toLocaleString('id-ID')}</strong>
      </div>)}
    </div>}
    {control && <form key={control.updated_at} onSubmit={saveControl} onChange={() => setDirty(true)} aria-busy={saving}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2"><ShieldCheck size={22} className="text-neon" /><h2 className="text-xl font-bold">Rilis analisis bertahap</h2></div>
      <p className="text-sm text-slate-500">Gunakan 100% untuk membuka analisis bagi semua pengguna aktif. Persentase lebih kecil membatasi rilis; akun evaluasi selalu disertakan saat analisis aktif.</p>
      <p className="rounded-lg bg-slate-50 dark:bg-slate-950 p-3 text-sm">{control.disabled_reason || 'Analisis aktif'} · batas Rp500, kurs pengaman minimal Rp20.000/US$</p>
      <fieldset disabled={saving} className="space-y-4 disabled:opacity-60">
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-neon transition-colors"><input name="enabled" type="checkbox" defaultChecked={control.enabled} className="h-4 w-4 accent-teal-600" />Aktifkan analisis</label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm font-medium">Persentase pengguna (0–100)
            <input name="rollout" type="number" required min="0" max="100" step="1" defaultValue={control.rollout_percent} className="mt-2 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3" />
          </label>
          <label className="block text-sm font-medium">ID akun evaluasi
            <textarea name="evaluators" rows={3} defaultValue={(control.evaluation_user_ids ?? []).join('\n')} placeholder="Pisahkan ID akun dengan koma atau baris baru" className="mt-2 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-sm" />
          </label>
        </div>
        <label className="flex items-start gap-3 text-sm"><input name="quality" type="checkbox" defaultChecked={!!control.quality_approved_at} className="mt-0.5 h-4 w-4 accent-teal-600" />Catat evaluasi kualitas dan biaya sudah selesai (opsional)</label>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
        <button type="submit" disabled={saving || loading} className="inline-flex items-center gap-2 rounded-xl bg-neon px-5 py-2.5 font-bold text-white dark:text-slate-950 shadow-sm hover:bg-neon-dim hover:shadow-md">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{saving ? 'Menyimpan…' : 'Simpan rilis'}
        </button>
        {dirty && !saving && <span className="text-xs text-amber-600 dark:text-amber-400">Ada perubahan belum disimpan</span>}
      </div>
    </form>}
    {data && <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Laporan pengguna <span className="text-sm font-normal text-slate-500">({reports.length})</span></h2>
        <div className="flex flex-wrap gap-1" aria-label="Filter status laporan">{(['all', 'new', 'reviewed', 'resolved'] as const).map(status => <button type="button" key={status} onClick={() => setFilter(status)} aria-pressed={filter === status}
          className={`ux-button rounded-lg border px-3 py-1.5 text-xs font-semibold ${filter === status ? 'border-neon bg-neon/10 text-neon' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>{status === 'all' ? 'Semua' : statusLabels[status]}</button>)}</div>
      </div>
      {!visibleReports.length && <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-10 text-center text-slate-500"><ClipboardList size={28} className="mx-auto mb-3 opacity-50" /><p className="text-sm">{reports.length ? 'Tidak ada laporan dengan status ini.' : 'Belum ada laporan pengguna.'}</p></div>}
      <div className="space-y-3">{visibleReports.map(report => <div key={report.id} aria-busy={!!busyReports[report.id]} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-start justify-between gap-4 text-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${report.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : report.status === 'reviewed' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>{statusLabels[report.status as ReportStatus] ?? report.status}</span><span className="text-xs text-slate-500">{new Date(report.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</span></div>
          <p className="mt-3 break-words whitespace-pre-wrap">{report.reason}</p><p className="mt-2 text-xs text-slate-500 break-all">Analisis {report.analysis_id}</p>
        </div>
        <div className="flex flex-wrap shrink-0 gap-2">{(['reviewed', 'resolved'] as const).map(status => <button type="button" key={status} onClick={() => void changeStatus(report.id, status)}
          disabled={!!busyReports[report.id] || report.status === status || loading} className="ux-button inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold">
          {busyReports[report.id] === status ? <Loader2 size={14} className="animate-spin" /> : report.status === status ? <CheckCircle2 size={14} /> : null}
          {busyReports[report.id] === status ? 'Menyimpan…' : status === 'reviewed' ? 'Tandai ditinjau' : 'Tandai selesai'}
        </button>)}</div>
      </div>)}</div>
    </section>}
    {data && <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
      <h2 className="text-xl font-bold mb-4">Perubahan admin terbaru</h2>
      {!audit.length ? <p className="py-4 text-sm text-slate-500">Belum ada perubahan admin yang tercatat.</p> : <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">{audit.map(event => <div key={event.id} className="py-3 space-y-1">
        <p className="font-medium break-words">{event.action} · {event.target}</p><p className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>
      </div>)}</div>}
    </section>}
  </main>;
}
