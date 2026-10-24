'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { bookMetrics, largeTradeThreshold, parseAggTrade, parseOrderBook, pushBounded, unwrapStream, type OrderBook, type Trade } from '@/lib/market-stream';
import { StatusDot, useLiveFeed } from './useLiveFeed';
import { formatClock, formatPrice, formatQty, formatUsd } from './format';

const SPOT_STREAM = 'wss://stream.binance.com:9443/stream?streams=';

export function OrderBookCard({ symbol }: { symbol: string }) {
  const { language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'id';
  const copy = (id: string, en: string) => lang === 'id' ? id : en;
  const [book, setBook] = useState<OrderBook | null>(null);
  const [missing, setMissing] = useState(false);
  const pair = symbol.toLowerCase();
  const status = useLiveFeed({
    url: `${SPOT_STREAM}${pair}usdt@depth20@1000ms`,
    onMessage: raw => { const frame = unwrapStream(raw); const next = frame ? parseOrderBook(frame.data) : null; if (next) setBook(next); },
    poll: async () => {
      const response = await fetch(`/api/market/depth?symbol=${symbol}`);
      if (response.status === 404) { setMissing(true); return; }
      if (!response.ok) return;
      const next = parseOrderBook(await response.json());
      if (next) { setMissing(false); setBook(next); }
    },
  });
  const metrics = useMemo(() => book ? bookMetrics(book, 12) : null, [book]);
  return <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
    <div className="flex items-center justify-between gap-2">
      <h3 className="font-bold">{copy('Order book', 'Order book')} · {symbol}/USDT</h3><StatusDot status={status} language={lang} />
    </div>
    {!metrics ? <p className="text-sm text-slate-500">{missing || status === 'unavailable'
      ? copy(`Order book ${symbol}/USDT tidak tersedia di Binance maupun OKX.`, `${symbol}/USDT order book is not available on Binance or OKX.`)
      : copy('Menunggu data order book…', 'Waiting for order book data…')}</p> : <>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2"><p className="text-slate-500">{copy('Harga tengah', 'Mid price')}</p><p className="mt-0.5 font-bold tabular-nums">{formatPrice(metrics.mid)}</p></div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2"><p className="text-slate-500">Spread</p><p className="mt-0.5 font-bold tabular-nums">{metrics.spreadPct.toFixed(3)}%</p></div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2"><p className="text-slate-500">{copy('Imbalance (12 level)', 'Imbalance (12 levels)')}</p>
          <p className={'mt-0.5 font-bold tabular-nums ' + (metrics.imbalancePct > 5 ? 'text-emerald-500' : metrics.imbalancePct < -5 ? 'text-rose-500' : '')}>{metrics.imbalancePct > 0 ? '+' : ''}{metrics.imbalancePct.toFixed(1)}%</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs tabular-nums" role="table" aria-label="Order book">
        <div role="rowgroup">
          <div className="mb-1 flex justify-between text-slate-500" role="row"><span>{copy('Harga beli (bid)', 'Bid price')}</span><span>{copy('Jumlah', 'Size')}</span></div>
          {metrics.bids.map(level => <div key={level.price} role="row" className="relative flex justify-between py-0.5">
            <span aria-hidden className="absolute inset-y-0 right-0 bg-emerald-500/15" style={{ width: `${level.cumulative / metrics.maxCumulative * 100}%` }} />
            <span className="relative text-emerald-500">{formatPrice(level.price)}</span><span className="relative">{formatQty(level.qty)}</span></div>)}
        </div>
        <div role="rowgroup">
          <div className="mb-1 flex justify-between text-slate-500" role="row"><span>{copy('Harga jual (ask)', 'Ask price')}</span><span>{copy('Jumlah', 'Size')}</span></div>
          {metrics.asks.map(level => <div key={level.price} role="row" className="relative flex justify-between py-0.5">
            <span aria-hidden className="absolute inset-y-0 left-0 bg-rose-500/15" style={{ width: `${level.cumulative / metrics.maxCumulative * 100}%` }} />
            <span className="relative text-rose-500">{formatPrice(level.price)}</span><span className="relative">{formatQty(level.qty)}</span></div>)}
        </div>
      </div>
      <p className="text-[11px] text-slate-500">{copy(
        `Dinding terbesar: beli ${formatPrice(metrics.bidWall.price)} (${formatQty(metrics.bidWall.qty)}), jual ${formatPrice(metrics.askWall.price)} (${formatQty(metrics.askWall.qty)}). Order di order book bisa ditarik kapan saja; ini konteks, bukan sinyal.`,
        `Largest walls: bid ${formatPrice(metrics.bidWall.price)} (${formatQty(metrics.bidWall.qty)}), ask ${formatPrice(metrics.askWall.price)} (${formatQty(metrics.askWall.qty)}). Resting orders can be pulled at any time; this is context, not a signal.`)}</p>
    </>}
  </section>;
}

export function TradesCard({ symbol }: { symbol: string }) {
  const { language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'id';
  const copy = (id: string, en: string) => lang === 'id' ? id : en;
  const [trades, setTrades] = useState<Trade[]>([]);
  const status = useLiveFeed({
    url: `${SPOT_STREAM}${symbol.toLowerCase()}usdt@aggTrade`,
    onMessage: raw => { const frame = unwrapStream(raw); const trade = frame ? parseAggTrade(frame.data) : null; if (trade) setTrades(list => pushBounded(list, [trade], 40)); },
    poll: async () => {
      const response = await fetch(`/api/market/trades?symbol=${symbol}`);
      if (!response.ok) return;
      const body = await response.json() as { trades?: unknown[] };
      const parsed = (body.trades ?? []).filter((row): row is Trade => !!row && typeof row === 'object' && 'id' in row && 'price' in row);
      setTrades(list => pushBounded(list, [...parsed].reverse(), 40));
    },
    pollMs: 4000,
  });
  const threshold = useMemo(() => largeTradeThreshold(trades), [trades]);
  const buyUsd = trades.filter(trade => trade.side === 'buy').reduce((sum, trade) => sum + trade.usd, 0);
  const sellUsd = trades.filter(trade => trade.side === 'sell').reduce((sum, trade) => sum + trade.usd, 0);
  return <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
    <div className="flex items-center justify-between gap-2"><h3 className="font-bold">{copy('Transaksi terbaru', 'Time & sales')} · {symbol}/USDT</h3><StatusDot status={status} language={lang} /></div>
    {!trades.length ? <p className="text-sm text-slate-500">{status === 'unavailable' ? copy('Data transaksi tidak tersedia.', 'Trade data is unavailable.') : copy('Menunggu transaksi…', 'Waiting for trades…')}</p> : <>
      <p className="text-xs text-slate-500">{copy('40 transaksi terakhir', 'Last 40 trades')}: <span className="text-emerald-500 font-semibold">{copy('beli', 'buy')} {formatUsd(buyUsd)}</span> · <span className="text-rose-500 font-semibold">{copy('jual', 'sell')} {formatUsd(sellUsd)}</span></p>
      <div className="max-h-72 overflow-y-auto text-xs tabular-nums" role="table" aria-label="Time and sales">
        <div className="sticky top-0 grid grid-cols-4 gap-2 bg-white dark:bg-slate-900 py-1 text-slate-500" role="row"><span>{copy('Waktu', 'Time')}</span><span>{copy('Harga', 'Price')}</span><span className="text-right">{copy('Jumlah', 'Size')}</span><span className="text-right">USD</span></div>
        {trades.map(trade => <div key={trade.id} role="row" className={'grid grid-cols-4 gap-2 py-0.5 ' + (trade.usd >= threshold ? 'font-bold bg-amber-500/10' : '')}>
          <span className="text-slate-500">{formatClock(trade.time)}</span>
          <span className={trade.side === 'buy' ? 'text-emerald-500' : 'text-rose-500'}>{formatPrice(trade.price)}</span>
          <span className="text-right">{formatQty(trade.qty)}</span><span className="text-right">{formatUsd(trade.usd)}</span></div>)}
      </div>
      <p className="text-[11px] text-slate-500">{copy(`Baris tebal = transaksi besar (≥ ${formatUsd(threshold)}). Hijau: pembeli agresif, merah: penjual agresif.`, `Bold rows = large trades (≥ ${formatUsd(threshold)}). Green: aggressive buyer, red: aggressive seller.`)}</p>
    </>}
  </section>;
}
