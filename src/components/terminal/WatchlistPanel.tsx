'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, ScanSearch } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { isStablecoin, TIMEFRAMES } from '@/lib/analysis/core';
import { isScanRow, rankScan, type ScanItem, type ScanRow } from '@/lib/scan';
import { getActivePlans, type ActivePlan } from '@/app/dashboard/watchlist-actions';
import { planStatusLabel } from '@/components/PlanStatusBadge';
import { formatPrice } from './format';

type MarketCoin = { symbol: string; price: number; priceChangePercent: number; fundingRate: number | null; rsi?: number | null };
const CHUNK = 3;

function statusChip(status: ScanRow['status'], copy: (id: string, en: string) => string) {
  const label = status === 'READY' ? copy('SIAP', 'READY') : status === 'WATCH' ? copy('PANTAU', 'WATCH') : copy('TIDAK ADA TRADE', 'NO TRADE');
  const tone = status === 'READY' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : status === 'WATCH' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300' : 'bg-rose-500/15 text-rose-600 dark:text-rose-300';
  return <span className={'rounded-full px-2 py-0.5 text-[11px] font-bold ' + tone}>{label}</span>;
}

export default function WatchlistPanel({ watchlist, onAnalyze, onDepth }: { watchlist: string[]; onAnalyze: (symbol: string) => void; onDepth: (symbol: string) => void }) {
  const { language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'id';
  const copy = (id: string, en: string) => lang === 'id' ? id : en;
  const symbols = watchlist.filter(symbol => !isStablecoin(symbol));
  const [market, setMarket] = useState<Record<string, MarketCoin>>({});
  const [plans, setPlans] = useState<ActivePlan[]>([]);
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]>('4h');
  const [scan, setScan] = useState<ScanItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanError, setScanError] = useState('');
  const [scanned, setScanned] = useState<{ timeframe: string; at: number } | null>(null);

  const loadMarket = useCallback(async () => {
    try {
      const response = await fetch('/api/binance-market');
      if (!response.ok) return;
      const body = await response.json() as { coins?: MarketCoin[] };
      setMarket(Object.fromEntries((body.coins ?? []).map(coin => [coin.symbol.toUpperCase(), coin])));
    } catch { /* the board still works without prices */ }
  }, []);
  useEffect(() => {
    const first = setTimeout(() => { void loadMarket(); }, 0);
    const timer = setInterval(() => { void loadMarket(); }, 20_000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [loadMarket]);
  useEffect(() => {
    let active = true;
    getActivePlans().then(result => { if (active) setPlans(result.plans); });
    return () => { active = false; };
  }, []);

  const runScan = async () => {
    if (scanning || !symbols.length) return;
    setScanning(true); setScanError(''); setScan([]); setProgress(0);
    const collected: ScanItem[] = [];
    try {
      for (let i = 0; i < symbols.length; i += CHUNK) {
        const response = await fetch(`/api/dashboard/scan?symbols=${symbols.slice(i, i + CHUNK).join(',')}&tf=${timeframe}`);
        const body = await response.json().catch(() => ({})) as { results?: ScanItem[]; error?: string };
        if (!response.ok) { setScanError(body.error ?? copy('Pemindaian gagal.', 'Scan failed.')); break; }
        collected.push(...(body.results ?? []));
        setScan(rankScan(collected)); setProgress(Math.min(symbols.length, i + CHUNK));
      }
      setScanned({ timeframe, at: Date.now() });
    } catch { setScanError(copy('Pemindaian gagal. Periksa koneksi lalu coba lagi.', 'Scan failed. Check your connection and try again.')); }
    finally { setScanning(false); }
  };

  if (!symbols.length) return <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
    {copy('Watchlist masih kosong. Pilih koin di tab Analisis AI lalu tekan "Tambah favorit"; koin favorit muncul di sini.', 'Your watchlist is empty. Pick a coin in the AI Analysis tab and press "Add favorite"; favorites appear here.')}</div>;

  return <div className="space-y-4">
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
      <h3 className="font-bold">{copy('Papan watchlist', 'Watchlist board')} · {symbols.length}</h3>
      <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm tabular-nums">
        <thead><tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          {[copy('Koin', 'Coin'), copy('Harga', 'Price'), '24h', 'RSI', 'Funding', copy('Rencana aktif', 'Active plans'), ''].map((label, index) => <th key={index} scope="col" className={'px-2 py-2 font-semibold ' + (index === 0 || index === 5 ? 'text-left' : 'text-right')}>{label}</th>)}
        </tr></thead>
        <tbody>{symbols.map(symbol => {
          const coin = market[symbol];
          const mine = plans.filter(plan => plan.symbol === symbol);
          return <tr key={symbol} className="border-b border-slate-100 dark:border-slate-800">
            <th scope="row" className="px-2 py-2 text-left font-bold">{symbol}</th>
            <td className="px-2 py-2 text-right">{coin ? formatPrice(coin.price) : '–'}</td>
            <td className={'px-2 py-2 text-right ' + (coin ? (coin.priceChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500') : '')}>{coin ? `${coin.priceChangePercent >= 0 ? '+' : ''}${coin.priceChangePercent.toFixed(2)}%` : '–'}</td>
            <td className="px-2 py-2 text-right">{coin?.rsi != null ? coin.rsi.toFixed(0) : '–'}</td>
            <td className="px-2 py-2 text-right">{coin?.fundingRate != null ? `${coin.fundingRate.toFixed(4)}%` : '–'}</td>
            <td className="px-2 py-2 text-left text-xs">{mine.length ? mine.map(plan => <div key={`${plan.analysis_id}`}>{plan.direction} {plan.timeframe} · {planStatusLabel(plan.status, lang)}</div>) : <span className="text-slate-500">–</span>}</td>
            <td className="px-2 py-2 text-right whitespace-nowrap">
              <button type="button" onClick={() => onAnalyze(symbol)} className="rounded-lg border border-neon px-2.5 py-1 text-xs font-semibold text-neon">{copy('Analisis AI', 'AI analysis')}</button>{' '}
              <button type="button" onClick={() => onDepth(symbol)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-500">Order book</button>
            </td></tr>;
        })}</tbody>
      </table></div>
      <p className="text-[11px] text-slate-500">{copy('Harga dari daftar pasar teratas; koin di luar daftar itu menampilkan "–". Rencana aktif = rencana analisismu yang belum selesai.', 'Prices come from the top-market list; coins outside it show "–". Active plans = your analysis plans that have not finished yet.')}</p>
    </section>

    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h3 className="font-bold">{copy('Scanner watchlist (gratis)', 'Watchlist scanner (free)')}</h3>
          <p className="text-xs text-slate-500">{copy('Memakai mesin aturan yang sama dengan rencana teknikal. Tanpa AI, tanpa memakai token.', 'Uses the same rule engine as the technical plan. No AI, no tokens used.')}</p></div>
        <div className="flex items-center gap-2">
          <select aria-label="Timeframe" value={timeframe} onChange={event => setTimeframe(event.target.value as (typeof TIMEFRAMES)[number])} disabled={scanning}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1.5 text-sm">{TIMEFRAMES.map(item => <option key={item} value={item}>{item}</option>)}</select>
          <button type="button" onClick={runScan} disabled={scanning} className="inline-flex items-center gap-2 rounded-lg bg-neon px-4 py-1.5 text-sm font-bold disabled:opacity-60">
            {scanning ? <Loader2 size={15} className="animate-spin" /> : <ScanSearch size={15} />}{scanning ? `${progress}/${symbols.length}` : copy('Pindai', 'Scan')}</button>
        </div>
      </div>
      {scanError && <p role="alert" className="text-sm text-rose-500">{scanError}</p>}
      {scan.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm tabular-nums">
        <thead><tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          {[copy('Koin', 'Coin'), copy('Arah', 'Side'), copy('Skor', 'Score'), 'Status', copy('Jarak ke entry', 'To entry'), copy('Zona entry', 'Entry zone'), 'SL', 'R:R TP1', ''].map((label, index) => <th key={index} scope="col" className={'px-2 py-2 font-semibold ' + (index === 0 || index === 3 ? 'text-left' : 'text-right')}>{label}</th>)}
        </tr></thead>
        <tbody>{scan.map(item => isScanRow(item) ? <tr key={item.symbol} className="border-b border-slate-100 dark:border-slate-800">
          <th scope="row" className="px-2 py-2 text-left font-bold">{item.symbol}</th>
          <td className={'px-2 py-2 text-right font-semibold ' + (item.direction === 'LONG' ? 'text-emerald-500' : 'text-rose-500')}>{item.direction}</td>
          <td className="px-2 py-2 text-right font-bold">{item.score}</td>
          <td className="px-2 py-2 text-left">{statusChip(item.status, copy)}</td>
          <td className="px-2 py-2 text-right">{item.distanceToEntryPct == null ? '–' : `${Math.abs(item.distanceToEntryPct).toFixed(1)}%`}</td>
          <td className="px-2 py-2 text-right">{formatPrice(item.entryLow)} – {formatPrice(item.entryHigh)}</td>
          <td className="px-2 py-2 text-right">{formatPrice(item.stopLoss)}</td>
          <td className="px-2 py-2 text-right">{item.riskReward == null ? '–' : `1:${item.riskReward.toFixed(2)}`}</td>
          <td className="px-2 py-2 text-right"><button type="button" onClick={() => onAnalyze(item.symbol)} className="rounded-lg border border-neon px-2.5 py-1 text-xs font-semibold text-neon">{copy('Analisis AI', 'AI analysis')}</button></td>
        </tr> : <tr key={item.symbol} className="border-b border-slate-100 dark:border-slate-800">
          <th scope="row" className="px-2 py-2 text-left font-bold">{item.symbol}</th>
          <td colSpan={8} className="px-2 py-2 text-left text-xs text-slate-500">{item.error === 'no_data' ? copy('Data pasar belum tersedia untuk koin ini.', 'Market data is not available for this coin.') : copy('Belum ada rencana yang layak dihitung dari data saat ini.', 'No viable plan can be built from the current data.')}</td>
        </tr>)}</tbody>
      </table></div>}
      {scanned && <p className="text-[11px] text-slate-500">{copy(`Dipindai ${new Date(scanned.at).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB pada timeframe ${scanned.timeframe}. `, `Scanned ${new Date(scanned.at).toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta' })} WIB on ${scanned.timeframe}. `)}
        {copy('Skor adalah penyaring aturan (tren, momentum, level, funding), bukan peluang menang. Hasil bisa berbeda dari analisis AI, dan bukan saran investasi.', 'The score is a rule-based filter (trend, momentum, levels, funding), not a win probability. Results can differ from an AI analysis and are not investment advice.')}</p>}
    </section>
  </div>;
}
