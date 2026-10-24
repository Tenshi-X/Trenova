'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { adminListMacroEvents, createMacroEvent, deleteMacroEvent } from './actions';
import { fromJakartaDateTimeInput } from '@/lib/entitlements';
import type { MacroEvent } from '@/lib/macro';

const field = 'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm';

export default function AdminMacroPage() {
  const [events, setEvents] = useState<MacroEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ when: '', title: '', importance: 3, region: 'US', note: '' });

  const load = useCallback(async () => {
    const result = await adminListMacroEvents();
    if (!result.success) setMessage({ ok: false, text: result.error ?? 'Gagal memuat.' });
    setEvents(result.events); setLoading(false);
  }, []);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    let iso: string | null;
    try { iso = fromJakartaDateTimeInput(form.when); } catch { iso = null; }
    if (!iso) { setMessage({ ok: false, text: 'Isi tanggal dan jam (WIB) dengan benar.' }); return; }
    setBusy(true); setMessage(null);
    const result = await createMacroEvent({ eventAtIso: iso, title: form.title, importance: form.importance, region: form.region, note: form.note });
    setBusy(false);
    if (!result.success) { setMessage({ ok: false, text: result.error ?? 'Gagal menyimpan.' }); return; }
    setMessage({ ok: true, text: 'Agenda tersimpan.' }); setForm({ ...form, title: '', note: '' }); await load();
  };
  const remove = async (id: string) => {
    if (busy) return;
    setBusy(true);
    const result = await deleteMacroEvent(id);
    setBusy(false);
    setMessage(result.success ? { ok: true, text: 'Agenda dihapus.' } : { ok: false, text: result.error ?? 'Gagal menghapus.' });
    if (result.success) await load();
  };

  return <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
    <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-500"><ChevronLeft size={16} />Admin</Link>
    <h1 className="text-2xl font-black">Kalender makro</h1>
    <p className="text-sm text-slate-500">Isi manual agenda yang menggerakkan pasar (FOMC, CPI, NFP, dll). Jam diisi dalam WIB. Pengguna melihat agenda mulai 6 jam yang lalu ke depan.</p>
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:grid-cols-2">
      <label className="text-sm">Tanggal & jam (WIB)<input type="datetime-local" required value={form.when} onChange={e => setForm({ ...form, when: e.target.value })} className={field} /></label>
      <label className="text-sm">Judul<input required minLength={2} maxLength={140} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={field} placeholder="FOMC rate decision" /></label>
      <label className="text-sm">Tingkat penting
        <select value={form.importance} onChange={e => setForm({ ...form, importance: Number(e.target.value) })} className={field}>
          <option value={3}>3 – Tinggi</option><option value={2}>2 – Sedang</option><option value={1}>1 – Rendah</option></select></label>
      <label className="text-sm">Wilayah<input maxLength={20} value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} className={field} /></label>
      <label className="text-sm sm:col-span-2">Catatan (opsional)<textarea maxLength={400} rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={field} /></label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={busy} className="rounded-lg bg-neon px-5 py-2 text-sm font-bold disabled:opacity-60">Simpan agenda</button>
        {message && <p role={message.ok ? 'status' : 'alert'} className={'text-sm ' + (message.ok ? 'text-emerald-500' : 'text-rose-500')}>{message.text}</p>}
      </div>
    </form>
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <h2 className="mb-3 font-bold">Semua agenda ({events.length})</h2>
      {loading ? <p className="text-sm text-slate-500">Memuat…</p> : events.length === 0 ? <p className="text-sm text-slate-500">Belum ada agenda.</p> :
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">{events.map(item => <li key={item.id} className="flex items-start justify-between gap-3 py-2 text-sm">
          <div><p className="font-semibold">{'★'.repeat(item.importance)} {item.title} <span className="text-xs font-normal text-slate-500">({item.region})</span></p>
            <p className="text-xs text-slate-500">{new Date(item.event_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })} WIB{item.note ? ` · ${item.note}` : ''}</p></div>
          <button type="button" aria-label={`Hapus ${item.title}`} disabled={busy} onClick={() => remove(item.id)} className="rounded-lg border border-rose-300 p-2 text-rose-500 disabled:opacity-60"><Trash2 size={14} /></button>
        </li>)}</ul>}
    </section>
  </main>;
}
