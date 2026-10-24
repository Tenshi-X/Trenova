'use client';

import type { TrackingView } from '@/lib/analysis/tracking';
import { useLanguage } from '@/context/LanguageContext';

const TONE: Record<string, string> = {
  WAITING_TRIGGER: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  WAITING_RETEST: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  FILLED: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  TP1: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  TP2: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  SL: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  CANCELLED: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  EXPIRED: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
};

export function planStatusLabel(status: string, language: 'id' | 'en'): string {
  const id = language === 'id';
  switch (status) {
    case 'WAITING_TRIGGER': return id ? 'Menunggu pemicu' : 'Waiting for trigger';
    case 'WAITING_RETEST': return id ? 'Pemicu terpenuhi · menunggu retest' : 'Trigger met · waiting for retest';
    case 'FILLED': return id ? 'FILLED · posisi berjalan' : 'FILLED · position open';
    case 'TP1': return id ? 'TP1 tercapai' : 'TP1 reached';
    case 'TP2': return id ? 'TP2 tercapai' : 'TP2 reached';
    case 'SL': return id ? 'Kena stop loss' : 'Stopped out';
    case 'CANCELLED': return id ? 'Dibatalkan sebelum entry' : 'Cancelled before entry';
    case 'EXPIRED': return id ? 'Kedaluwarsa · tidak pernah entry' : 'Expired · never entered';
    default: return status;
  }
}

/** Status of one trade plan, with the time of the latest step in WIB. */
export default function PlanStatusBadge({ track }: { track: TrackingView }) {
  const { language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'id';
  const at = track.closed_at ?? track.tp1_at ?? track.filled_at ?? track.triggered_at;
  const time = at ? new Date(at).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US',
    { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' WIB' : null;
  const notes: string[] = [];
  if (track.ambiguous) notes.push(lang === 'id' ? 'SL dan TP1 dalam satu candle; dihitung SL' : 'SL and TP1 in one candle; counted as SL');
  if (track.stopped_after_tp1) notes.push(lang === 'id' ? 'harga kembali ke SL setelah TP1' : 'price returned to the SL after TP1');
  return <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
    <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + (TONE[track.status] ?? TONE.WAITING_TRIGGER)}>{planStatusLabel(track.status, lang)}</span>
    {time && <span className="text-xs text-slate-500">{time}</span>}
    {notes.length > 0 && <span className="text-[11px] text-slate-500">({notes.join('; ')})</span>}
  </span>;
}
