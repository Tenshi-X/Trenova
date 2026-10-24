'use client';

import type { TrackStats } from '@/lib/analysis/tracking';
import { useLanguage } from '@/context/LanguageContext';

const MIN_SAMPLE = 20;

/** Totals over the user's own tracked plans, with an honest warning while the sample is small. */
export default function PlanStatsCard({ stats, ambiguous }: { stats: TrackStats; ambiguous: number }) {
  const { language } = useLanguage();
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const dash = '–';
  const pct = (value: number | null) => value === null ? dash : `${value}%`;
  const cells: Array<[string, string]> = [
    [copy('Rencana terlacak', 'Plans tracked'), String(stats.plans)],
    [copy('Masih menunggu', 'Still waiting'), String(stats.waiting)],
    [copy('Entry terisi', 'Entries filled'), `${stats.filled} (${pct(stats.fillRatePct)})`],
    [copy('Kena TP / SL', 'Hit TP / SL'), `${stats.wins} / ${stats.losses}`],
    [copy('Win rate (TP vs SL)', 'Win rate (TP vs SL)'), pct(stats.winRatePct)],
    [copy('Rata-rata R', 'Average R'), stats.avgR === null ? dash : `${stats.avgR > 0 ? '+' : ''}${stats.avgR}R`],
    [copy('TP2 dari yang menang', 'TP2 among wins'), pct(stats.tp2RatePct)],
    [copy('Batal / kedaluwarsa', 'Cancelled / expired'), `${stats.cancelled} / ${stats.expired}`],
  ];
  return <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
    <h2 className="font-bold">{copy('Statistik rencana kamu', 'Your plan statistics')}</h2>
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
      {cells.map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3">
        <dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-bold tabular-nums">{value}</dd>
      </div>)}
    </dl>
    {stats.closed < MIN_SAMPLE && <p className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
      {copy(`Baru ${stats.closed} rencana yang selesai (TP atau SL). Sampel sekecil ini belum bisa menyimpulkan kualitas analisis; angka akan berubah banyak.`,
        `Only ${stats.closed} plans have finished (TP or SL). A sample this small cannot tell you how good the analysis is; the numbers will move a lot.`)}</p>}
    <p className="text-xs text-slate-500">{copy(
      `Dihitung otomatis dari candle yang sudah tutup setelah analisis. Rata-rata R mengasumsikan seluruh posisi keluar di TP1. Jika SL dan TP1 ada dalam satu candle, dihitung SL${ambiguous ? ` (${ambiguous} kasus belum bisa dipastikan urutannya)` : ''}. Belum termasuk biaya dan slippage; bukan jaminan hasil.`,
      `Calculated automatically from candles that closed after each analysis. Average R assumes the whole position exits at TP1. When the SL and TP1 sit in one candle it counts as an SL${ambiguous ? ` (${ambiguous} cases could not be ordered)` : ''}. Fees and slippage are not included; not a guarantee of results.`)}</p>
  </section>;
}
