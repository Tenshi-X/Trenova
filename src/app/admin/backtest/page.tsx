'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { runAdminBacktest, type BacktestReport } from './actions';
import { TIMEFRAMES } from '@/lib/analysis/core';
import type { Bucket } from '@/lib/analysis/backtest';

const cell = 'px-2 py-1.5 text-right tabular-nums';
function BucketTable({ title, rows }: { title: string; rows: Record<string, Bucket> | [string, Bucket][] }) {
  const entries = Array.isArray(rows) ? rows : Object.entries(rows);
  return <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
    <h2 className="mb-2 font-bold">{title}</h2>
    <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
      <thead><tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        {['', 'Sinyal', 'Terisi', 'Fill %', 'Menang', 'Kalah', 'Win rate %', 'Rata-rata R', 'PF', 'CI95 R'].map((label, i) => <th key={i} scope="col" className={'px-2 py-1.5 font-semibold ' + (i === 0 ? 'text-left' : 'text-right')}>{label}</th>)}
      </tr></thead>
      <tbody>{entries.map(([name, b]) => <tr key={name} className="border-b border-slate-100 dark:border-slate-800">
        <th scope="row" className="px-2 py-1.5 text-left font-semibold">{name}</th>
        <td className={cell}>{b.signals}</td><td className={cell}>{b.filled}</td><td className={cell}>{b.fillRate}</td><td className={cell}>{b.wins}</td><td className={cell}>{b.losses}</td>
        <td className={cell}>{b.winRate ?? '–'}</td><td className={cell}>{b.avgR ?? '–'}</td><td className={cell}>{b.profitFactor ?? '–'}</td>
        <td className={cell}>{b.ci95 ? `${b.ci95[0]} … ${b.ci95[1]}` : '–'}</td></tr>)}</tbody>
    </table></div>
  </section>;
}

export default function AdminBacktestPage() {
  const [symbols, setSymbols] = useState('BTC, ETH, SOL');
  const [timeframe, setTimeframe] = useState<string>('4h');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<BacktestReport | null>(null);

  const run = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setReport(null);
    try { setReport(await runAdminBacktest(symbols, timeframe)); }
    catch { setReport({ success: false, error: 'Proses terputus (kemungkinan melewati batas waktu server). Coba 1–2 koin atau timeframe lain.' }); }
    finally { setBusy(false); }
  };

  return <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
    <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-500"><ChevronLeft size={16} />Admin</Link>
    <h1 className="text-2xl font-black">Backtest mesin aturan</h1>
    <p className="text-sm text-slate-500">Menguji mesin rencana teknikal (tanpa AI) pada ±1000 candle terakhir. Setiap sinyal hanya melihat candle yang sudah tutup, rencana diikuti persis seperti tertulis, hasil dalam R setelah estimasi biaya. Ini menguji aturan, bukan jaminan hasil ke depan.</p>
    <form onSubmit={run} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <label className="text-sm">Koin (maks. 3, pisahkan koma)<input value={symbols} onChange={e => setSymbols(e.target.value)} className="mt-1 block w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2" /></label>
      <label className="text-sm">Timeframe<select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="mt-1 block rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2">{TIMEFRAMES.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
      <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-neon px-5 py-2 text-sm font-bold disabled:opacity-60">{busy && <Loader2 size={14} className="animate-spin" />}{busy ? 'Menghitung…' : 'Jalankan'}</button>
    </form>
    {report && !report.success && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-500">{report.error}</p>}
    {report?.success && report.overall && <div className="space-y-4">
      <p className="text-sm text-slate-500">{report.symbols?.join(', ')} · {report.timeframe} · {report.from?.slice(0, 10)} s/d {report.to?.slice(0, 10)}{report.skipped?.length ? ` · dilewati: ${report.skipped.join(', ')}` : ''}</p>
      <BucketTable title="Keseluruhan" rows={[['Semua', report.overall], ['Paruh awal', report.firstHalf!], ['Paruh akhir', report.secondHalf!]]} />
      {report.byDirection && <BucketTable title="Per arah" rows={report.byDirection} />}
      {report.byGrade && <BucketTable title="Per grade kualitas" rows={report.byGrade} />}
      {report.byEntryType && <BucketTable title="Per tipe entry" rows={report.byEntryType} />}
      {report.risk && <p className="text-sm text-slate-500">Rentetan kalah terpanjang: median {report.risk.longestLosingStreak.median}, terburuk {report.risk.longestLosingStreak.worst}. Drawdown maksimum: median {report.risk.maxDrawdownR.median}R, terburuk {report.risk.maxDrawdownR.worst}R.</p>}
      <p className="text-xs text-slate-500">Jika rentang CI95 rata-rata R mencakup 0, hasilnya belum bisa dibedakan dari keberuntungan. Jika paruh awal dan akhir sangat berbeda, hasil tidak stabil.</p>
    </div>}
  </main>;
}
