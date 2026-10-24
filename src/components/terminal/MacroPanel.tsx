'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLanguage } from '@/context/LanguageContext';
import { listMacroEvents } from '@/app/dashboard/macro-actions';
import type { IdrPremium, MacroEvent, SeriesPoint } from '@/lib/macro';
import { formatUsd } from './format';

type SeriesState = { available: boolean; points?: SeriesPoint[]; latest?: number; change7dPct?: number | null; change30dPct?: number | null } | null;
type IdrState = { available: boolean; rows?: IdrPremium[]; usdtIdr?: number } | null;

async function load<T>(kind: string): Promise<T | { available: false }> {
  try { const response = await fetch(`/api/market/macro?kind=${kind}`); return response.ok ? await response.json() as T : { available: false }; }
  catch { return { available: false }; }
}

function SeriesCard({ title, note, state }: { title: string; note: string; state: SeriesState }) {
  const { language } = useLanguage();
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const change = (label: string, value: number | null | undefined) => value == null ? null :
    <span className={value >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{label} {value >= 0 ? '+' : ''}{value.toFixed(2)}%</span>;
  return <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
    <h3 className="font-bold">{title}</h3>
    {state === null ? <p className="text-sm text-slate-500">{copy('Memuat…', 'Loading…')}</p>
      : !state.available || !state.points ? <p className="text-sm text-slate-500">{copy('Data dari DefiLlama sedang tidak tersedia.', 'DefiLlama data is currently unavailable.')}</p>
      : <>
        <p className="text-2xl font-black tabular-nums">{formatUsd(state.latest ?? 0)}</p>
        <p className="flex gap-3 text-xs tabular-nums">{change('7d', state.change7dPct)}{change('30d', state.change30dPct)}</p>
        <div className="h-36"><ResponsiveContainer width="100%" height="100%"><AreaChart data={state.points}>
          <XAxis dataKey="time" hide /><YAxis hide domain={['auto', 'auto']} />
          <Tooltip formatter={(value) => formatUsd(Number(value))} labelFormatter={(label) => new Date(Number(label)).toLocaleDateString('id-ID')} />
          <Area type="monotone" dataKey="value" stroke="#22c55e" fill="#22c55e33" dot={false} isAnimationActive={false} />
        </AreaChart></ResponsiveContainer></div></>}
    <p className="text-[11px] text-slate-500">{note}</p>
  </section>;
}

export default function MacroPanel() {
  const { language } = useLanguage();
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const [events, setEvents] = useState<MacroEvent[] | null>(null);
  const [eventsError, setEventsError] = useState('');
  const [loadedAt, setLoadedAt] = useState(0);
  const [stable, setStable] = useState<SeriesState>(null);
  const [tvl, setTvl] = useState<SeriesState>(null);
  const [idr, setIdr] = useState<IdrState>(null);

  useEffect(() => {
    let active = true;
    listMacroEvents().then(result => { if (!active) return; setEvents(result.events); setEventsError(result.error ?? ''); setLoadedAt(Date.now()); });
    load<SeriesState>('stable').then(data => { if (active) setStable(data as SeriesState); });
    load<SeriesState>('tvl').then(data => { if (active) setTvl(data as SeriesState); });
    load<IdrState>('idr').then(data => { if (active) setIdr(data as IdrState); });
    return () => { active = false; };
  }, []);

  const locale = language === 'id' ? 'id-ID' : 'en-US';
  return <div className="space-y-4">
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
      <h3 className="font-bold">{copy('Kalender makro', 'Macro calendar')}</h3>
      {events === null ? <p className="text-sm text-slate-500">{copy('Memuat…', 'Loading…')}</p>
        : eventsError ? <p role="alert" className="text-sm text-rose-500">{eventsError}</p>
        : events.length === 0 ? <p className="text-sm text-slate-500">{copy('Belum ada agenda yang dimasukkan.', 'No events have been entered yet.')}</p>
        : <ul className="divide-y divide-slate-100 dark:divide-slate-800">{events.map(item => {
          const past = new Date(item.event_at).getTime() < loadedAt;
          return <li key={item.id} className={'flex items-start justify-between gap-3 py-2 text-sm ' + (past ? 'opacity-60' : '')}>
            <div><p className="font-semibold"><span aria-label={`${copy('Penting', 'Importance')} ${item.importance}/3`} className="text-amber-500">{'★'.repeat(item.importance)}</span> {item.title} <span className="text-xs font-normal text-slate-500">({item.region})</span></p>
              {item.note && <p className="text-xs text-slate-500">{item.note}</p>}</div>
            <p className="shrink-0 text-xs text-slate-500 tabular-nums">{new Date(item.event_at).toLocaleString(locale, { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })} WIB</p>
          </li>;
        })}</ul>}
      <p className="text-[11px] text-slate-500">{copy('Agenda dimasukkan manual oleh admin, jadi bisa belum lengkap. Volatilitas biasanya naik di sekitar rilis data penting.', 'Events are entered manually by an admin, so the list may be incomplete. Volatility usually rises around major releases.')}</p>
    </section>

    <div className="grid gap-4 lg:grid-cols-2">
      <SeriesCard title={copy('Suplai stablecoin (total)', 'Stablecoin supply (total)')} state={stable}
        note={copy('Suplai yang naik sering dibaca sebagai likuiditas yang masuk ke pasar; ini indikator konteks, bukan sinyal beli/jual.', 'Rising supply is often read as liquidity entering the market; it is context, not a buy/sell signal.')} />
      <SeriesCard title={copy('TVL DeFi (total)', 'DeFi TVL (total)')} state={tvl}
        note={copy('TVL ikut bergerak dengan harga aset, jadi naik-turunnya tidak selalu berarti dana masuk atau keluar.', 'TVL moves with asset prices, so its changes do not always mean funds flowing in or out.')} />
    </div>

    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
      <h3 className="font-bold">{copy('Premi harga IDR (Indodax vs Binance)', 'IDR price premium (Indodax vs Binance)')}</h3>
      {idr === null ? <p className="text-sm text-slate-500">{copy('Memuat…', 'Loading…')}</p>
        : !idr.available || !idr.rows ? <p className="text-sm text-slate-500">{copy('Data Indodax sedang tidak tersedia.', 'Indodax data is currently unavailable.')}</p>
        : <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-sm tabular-nums">
          <thead><tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            <th scope="col" className="px-2 py-2 text-left">{copy('Koin', 'Coin')}</th><th scope="col" className="px-2 py-2 text-right">Indodax (IDR)</th>
            <th scope="col" className="px-2 py-2 text-right">Binance (USDT)</th><th scope="col" className="px-2 py-2 text-right">{copy('Premi', 'Premium')}</th></tr></thead>
          <tbody>{idr.rows.map(row => <tr key={row.symbol} className="border-b border-slate-100 dark:border-slate-800">
            <th scope="row" className="px-2 py-2 text-left font-bold">{row.symbol}</th>
            <td className="px-2 py-2 text-right">Rp{row.idrPrice.toLocaleString('id-ID')}</td>
            <td className="px-2 py-2 text-right">{row.usdtPrice.toLocaleString('en-US', { maximumSignificantDigits: 7 })}</td>
            <td className={'px-2 py-2 text-right font-semibold ' + (row.premiumPct >= 0 ? 'text-amber-500' : 'text-sky-500')}>{row.premiumPct >= 0 ? '+' : ''}{row.premiumPct.toFixed(2)}%</td>
          </tr>)}</tbody></table></div>}
      <p className="text-[11px] text-slate-500">{copy('Premi = harga IDR dibanding harga Binance yang dikonversi dengan kurs USDT/IDR Indodax sendiri. Positif berarti lebih mahal di Indodax. Selisih kecil bisa berasal dari waktu pengambilan data yang berbeda.', 'Premium = the IDR price versus the Binance price converted at Indodax\'s own USDT/IDR rate. Positive means pricier on Indodax. Small gaps can come from the two prices being fetched at slightly different moments.')}</p>
    </section>
  </div>;
}
