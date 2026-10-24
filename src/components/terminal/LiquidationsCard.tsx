'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { parseForceOrder, pushBounded, unwrapStream, type Liquidation } from '@/lib/market-stream';
import { StatusDot, useLiveFeed } from './useLiveFeed';
import { formatClock, formatPrice, formatUsd } from './format';

export default function LiquidationsCard({ symbol }: { symbol: string }) {
  const { language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'id';
  const copy = (id: string, en: string) => lang === 'id' ? id : en;
  const [items, setItems] = useState<Liquidation[]>([]);
  const [totals, setTotals] = useState({ long: 0, short: 0 });
  const status = useLiveFeed({
    url: `wss://fstream.binance.com/stream?streams=${symbol.toLowerCase()}usdt@forceOrder`,
    onMessage: raw => {
      const frame = unwrapStream(raw); const event = frame ? parseForceOrder(frame.data) : null;
      if (!event) return;
      setItems(list => pushBounded(list, [event], 30));
      setTotals(sum => event.side === 'LONG' ? { ...sum, long: sum.long + event.usd } : { ...sum, short: sum.short + event.usd });
    },
  });
  return <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
    <div className="flex items-center justify-between gap-2"><h3 className="font-bold">{copy('Likuidasi futures', 'Futures liquidations')} · {symbol}USDT</h3><StatusDot status={status} language={lang} /></div>
    <p className="text-xs text-slate-500">{copy('Sejak panel ini dibuka', 'Since this panel was opened')}: <span className="text-rose-500 font-semibold">long {formatUsd(totals.long)}</span> · <span className="text-emerald-500 font-semibold">short {formatUsd(totals.short)}</span></p>
    {!items.length ? <p className="text-sm text-slate-500">{status === 'unavailable'
      ? copy('Stream likuidasi Binance Futures tidak dapat dijangkau dari jaringanmu.', 'The Binance Futures liquidation stream cannot be reached from your network.')
      : copy('Belum ada likuidasi tercatat. Likuidasi memang jarang pada koin yang sepi.', 'No liquidations yet. They are rare on quiet coins.')}</p>
      : <div className="max-h-56 overflow-y-auto text-xs tabular-nums" role="table" aria-label="Liquidations">
        {items.map(item => <div key={item.id} role="row" className="grid grid-cols-4 gap-2 py-0.5">
          <span className="text-slate-500">{formatClock(item.time)}</span>
          <span className={item.side === 'LONG' ? 'text-rose-500' : 'text-emerald-500'}>{item.side === 'LONG' ? 'Long' : 'Short'} {copy('terlikuidasi', 'liquidated')}</span>
          <span className="text-right">{formatPrice(item.price)}</span><span className="text-right font-semibold">{formatUsd(item.usd)}</span></div>)}
      </div>}
    <p className="text-[11px] text-slate-500">{copy('Hanya likuidasi di Binance Futures, bukan seluruh pasar. Tidak dipakai dalam skor atau laporan AI.', 'Binance Futures liquidations only, not the whole market. Not used in the score or the AI report.')}</p>
  </section>;
}
