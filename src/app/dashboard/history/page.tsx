'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AnalysisVisualizer from '@/components/AnalysisVisualizer';
import AnalysisResultV2 from '@/components/AnalysisResultV2';
import type { AnalysisV2 } from '@/lib/analysis/core';
import { checkHistoryOutcome, listHistory, reportHistory, saveHistoryNote, type HistoryRow } from './actions';

function legacyContent(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'analysis' in value) return String((value as { analysis: unknown }).analysis);
  return JSON.stringify(value);
}

function outcomeText(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('outcomes' in value) || !Array.isArray(value.outcomes)) return null;
  const labels: Record<string,string> = { uncertain: 'Tidak pasti', stop_loss: 'Stop loss tersentuh',
    target_1: 'Target 1 tersentuh', open: 'Entry tersentuh; target/stop belum', not_entered: 'Entry belum tersentuh' };
  const outcomes = value.outcomes.map((outcome,index) => `Setup ${index + 1}: ${labels[String(outcome)] || 'Tidak tersedia'}`).join(' · ');
  return `${outcomes}${'truncated' in value && value.truncated ? ' · Pemeriksaan dibatasi 1.000 candle; rentang setelahnya belum diperiksa.' : ''}`;
}

export default function HistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const result = await listHistory(page, query);
    setRows(result.rows); setTotal(result.total);
    if (result.error) setMessage(result.error);
  };
  useEffect(() => {
    listHistory(page, query).then((result) => {
      setRows(result.rows); setTotal(result.total);
      if (result.error) setMessage(result.error);
    });
  }, [page, query]);
  return <main className="max-w-5xl mx-auto p-4 pb-20 space-y-6 text-foreground">
    <Link href="/dashboard" className="text-neon text-sm">← Dashboard</Link>
    <h1 className="text-3xl font-black">Riwayat analisis</h1>
    <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(search); }}>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari koin atau catatan" className="flex-1 rounded-xl border bg-transparent p-3" />
      <button className="rounded-xl bg-neon px-5 font-bold text-white">Cari</button>
    </form>
    {message && <p role="status" className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">{message}</p>}
    <p className="text-sm text-slate-500">{total} hasil · halaman {page}</p>
    {rows.map((row) => {
      const raw = row.analysis_json;
      const v2 = raw && typeof raw === 'object' && (raw as AnalysisV2).version === 2 ? raw as AnalysisV2 : null;
      return <article key={row.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <button className="w-full text-left flex justify-between" onClick={() => setExpanded(expanded === row.id ? null : row.id)}>
          <div><strong>{row.coin_name || row.coin_symbol || 'Analisis lama'}</strong><p className="text-xs text-slate-500">{new Date(row.created_at).toLocaleString('id-ID')} · {v2?.verdict || 'Arsip'}</p></div>
          <span>{expanded === row.id ? 'Tutup' : 'Lihat'}</span>
        </button>
        {expanded === row.id && <div className="space-y-4 border-t pt-4">
          {v2 ? <AnalysisResultV2 result={v2} coinName={row.coin_name || row.coin_symbol || 'Crypto'} />
            : <AnalysisVisualizer markdown={legacyContent(raw)} coinName={row.coin_name || row.coin_symbol || 'Crypto'} instant />}
          <label className="block text-sm font-semibold">Catatan pribadi
            <textarea className="mt-1 w-full rounded-lg border bg-transparent p-2" maxLength={1000} defaultValue={row.user_note || ''} id={`note-${row.id}`} />
          </label>
          <div className="flex flex-wrap gap-2 text-sm">
            <button disabled={busy} className="rounded-lg border px-3 py-2" onClick={async () => {
              setBusy(true); const note = (document.getElementById(`note-${row.id}`) as HTMLTextAreaElement).value;
              const result = await saveHistoryNote(row.id, note); setMessage(result.error || 'Catatan tersimpan.'); await load(); setBusy(false);
            }}>Simpan catatan</button>
            {v2 && v2.verdict !== 'WAIT' && <button disabled={busy} className="rounded-lg border px-3 py-2" onClick={async () => {
              setBusy(true); const result = await checkHistoryOutcome(row.id);
              setMessage(result.error || 'Pemeriksaan selesai.'); await load(); setBusy(false);
            }}>Periksa target/stop</button>}
            <button disabled={busy} className="rounded-lg border px-3 py-2" onClick={async () => {
              const reason = window.prompt('Jelaskan kesalahan analisis (minimal 10 karakter):');
              if (reason === null) return;
              setBusy(true); const result = await reportHistory(row.id, reason);
              setMessage(result.error || 'Laporan dikirim ke admin.'); setBusy(false);
            }}>Laporkan hasil keliru</button>
          </div>
          {outcomeText(row.outcome_json) && <p className="text-sm rounded-lg bg-slate-100 dark:bg-slate-800 p-3">{outcomeText(row.outcome_json)}. Ini simulasi dari candle, dengan target utama TP1; urutan sentuhan dalam satu candle dapat tidak pasti.</p>}
        </div>}
      </article>;
    })}
    {!rows.length && <p className="text-slate-500">Belum ada riwayat untuk pencarian ini.</p>}
    <div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Sebelumnya</button>
      <button disabled={page * 10 >= total} onClick={() => setPage(page + 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Berikutnya</button></div>
  </main>;
}
