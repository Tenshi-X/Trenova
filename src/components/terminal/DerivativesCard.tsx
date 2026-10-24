'use client';

import { useCallback, useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLanguage } from '@/context/LanguageContext';
import type { LongShortPoint, SeriesPoint } from '@/lib/derivs-history';
import { formatUsd } from './format';

type Derivs = { period: string; asOf: number; funding: SeriesPoint[]; fundingSource: string | null; openInterest: SeriesPoint[];
  longShort: LongShortPoint[]; taker: SeriesPoint[]; available: Record<string, boolean> };

const PERIODS = ['15m', '1h', '4h', '1d'] as const;
const GOLD = '#d4a843';

function MiniChart({ title, note, data, color, format, baseline }: { title: string; note: string; data: Array<{ time: number; value: number }>;
  color: string; format: (value: number) => string; baseline?: number }) {
  const last = data[data.length - 1];
  return <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3">
    <div className="flex items-baseline justify-between gap-2"><h4 className="text-sm font-semibold">{title}</h4>{last && <span className="text-sm font-bold tabular-nums">{format(last.value)}</span>}</div>
    <div className="mt-2 h-28" role="img" aria-label={`${title}: ${last ? format(last.value) : '–'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" hide /><YAxis hide domain={['auto', 'auto']} />
          {baseline !== undefined && <ReferenceLine y={baseline} stroke="#666" strokeDasharray="4 4" />}
          <Tooltip contentStyle={{ background: '#111', border: '1px solid #2a2a2a', fontSize: 12 }} labelFormatter={value => new Date(Number(value)).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            formatter={value => [format(Number(value)), title]} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <p className="mt-1 text-[11px] text-slate-500">{note}</p>
  </div>;
}

export default function DerivativesCard({ symbol }: { symbol: string }) {
  const { language } = useLanguage();
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('1h');
  const [data, setData] = useState<Derivs | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/market/derivs?symbol=${symbol}&period=${period}`);
      if (!response.ok) throw new Error(String(response.status));
      setData(await response.json() as Derivs); setState('ready');
    } catch { setState('error'); }
  }, [symbol, period]);
  useEffect(() => {
    const first = setTimeout(() => { void load(); }, 0);
    const timer = setInterval(() => { void load(); }, 60_000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [load]);
  const available = data ? Object.values(data.available).some(Boolean) : false;
  return <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-bold">{copy('Derivatif', 'Derivatives')} · {symbol}USDT</h3>
      <div className="flex gap-1" role="group" aria-label={copy('Periode', 'Period')}>{PERIODS.map(item => <button key={item} type="button" aria-pressed={period === item}
        onClick={() => { setPeriod(item); setState('loading'); }}
        className={'rounded-lg border px-2.5 py-1 text-xs font-semibold ' + (period === item ? 'border-neon text-neon' : 'border-slate-200 dark:border-slate-700 text-slate-500')}>{item}</button>)}</div>
    </div>
    {state === 'loading' && !data && <p className="text-sm text-slate-500">{copy('Memuat data derivatif…', 'Loading derivatives data…')}</p>}
    {state === 'error' && !data && <p className="text-sm text-slate-500">{copy('Data derivatif belum dapat dimuat. Coba lagi sebentar lagi.', 'Derivatives data could not be loaded. Try again shortly.')}</p>}
    {data && !available && <p className="text-sm text-slate-500">{copy(`Tidak ada data futures untuk ${symbol}USDT, atau Binance Futures tidak dapat dijangkau dari server.`, `No futures data for ${symbol}USDT, or Binance Futures cannot be reached from the server.`)}</p>}
    {data && available && <div className="grid gap-3 sm:grid-cols-2">
      {data.available.funding && <MiniChart title="Funding rate" color={GOLD} data={data.funding} format={value => `${value.toFixed(4)}%`} baseline={0}
        note={copy(`Per periode funding${data.fundingSource === 'okx' ? ' (OKX)' : ''}. Positif: long membayar short.`, `Per funding interval${data.fundingSource === 'okx' ? ' (OKX)' : ''}. Positive: longs pay shorts.`)} />}
      {data.available.openInterest && <MiniChart title="Open interest" color="#38bdf8" data={data.openInterest} format={formatUsd}
        note={copy('Nilai kontrak terbuka. Naik bersama harga biasanya menandakan posisi baru masuk.', 'Value of open contracts. Rising with price usually means new positions are opening.')} />}
      {data.available.longShort && <MiniChart title="Long/short ratio" color="#a78bfa" data={data.longShort.map(point => ({ time: point.time, value: point.ratio }))} format={value => value.toFixed(2)} baseline={1}
        note={copy('Rasio akun long dibanding short. Di atas 1: lebih banyak akun long. Bersifat kontrarian, bukan sinyal.', 'Ratio of long to short accounts. Above 1: more long accounts. Often read as a contrarian gauge, not a signal.')} />}
      {data.available.taker && <MiniChart title="Taker buy/sell" color="#34d399" data={data.taker} format={value => value.toFixed(2)} baseline={1}
        note={copy('Volume beli agresif dibanding jual agresif. Di atas 1: pembeli lebih dominan.', 'Aggressive buy volume vs aggressive sell volume. Above 1: buyers dominate.')} />}
    </div>}
    <p className="text-[11px] text-slate-500">{copy('Data Binance Futures (funding bisa dari OKX bila Binance tidak terjangkau). Diperbarui tiap menit. Tidak dipakai dalam skor atau laporan AI.', 'Binance Futures data (funding may come from OKX if Binance is unreachable). Refreshed every minute. Not used in the score or the AI report.')}</p>
  </section>;
}
