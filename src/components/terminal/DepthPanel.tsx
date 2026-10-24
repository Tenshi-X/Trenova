'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { isStablecoin } from '@/lib/analysis/core';
import { STREAM_SYMBOL } from '@/lib/market-stream';
import { OrderBookCard, TradesCard } from './OrderBookPanel';
import DerivativesCard from './DerivativesCard';
import LiquidationsCard from './LiquidationsCard';

/** Market depth for one coin: order book, trades, derivatives history and liquidations (all public Binance data). */
export default function DepthPanel({ initialSymbol, favorites }: { initialSymbol: string; favorites: string[] }) {
  const { language } = useLanguage();
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const clean = (value: string) => value.toUpperCase().replace(/USDT$/, '').replace(/[^A-Z0-9]/g, '');
  const [symbol, setSymbol] = useState(() => STREAM_SYMBOL.test(clean(initialSymbol)) ? clean(initialSymbol) : 'BTC');
  const [input, setInput] = useState(symbol);
  const [error, setError] = useState('');
  const apply = (value: string) => {
    const next = clean(value);
    if (!STREAM_SYMBOL.test(next) || next === 'USDT') { setError(copy('Simbol tidak valid. Contoh: BTC, ETH, SOL.', 'Invalid symbol. Examples: BTC, ETH, SOL.')); return; }
    if (isStablecoin(next)) { setError(copy('Stablecoin tidak punya order book yang bermakna di sini.', 'Stablecoins have no meaningful order book here.')); return; }
    setError(''); setSymbol(next); setInput(next);
  };
  return <div className="space-y-4">
    <form className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
      onSubmit={event => { event.preventDefault(); apply(input); }}>
      <label className="text-sm font-semibold" htmlFor="depth-symbol">{copy('Koin', 'Coin')}</label>
      <input id="depth-symbol" value={input} onChange={event => setInput(event.target.value)} maxLength={20} autoComplete="off" spellCheck={false}
        className="w-28 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm uppercase" placeholder="BTC" />
      <button type="submit" className="rounded-lg bg-neon px-4 py-1.5 text-sm font-bold">{copy('Tampilkan', 'Show')}</button>
      {favorites.slice(0, 8).map(item => <button key={item} type="button" onClick={() => apply(item)} aria-pressed={item === symbol}
        className={'rounded-full border px-3 py-1 text-xs font-semibold ' + (item === symbol ? 'border-neon text-neon' : 'border-slate-200 dark:border-slate-700 text-slate-500')}>{item}</button>)}
      {error && <span role="alert" className="w-full text-xs text-rose-500">{error}</span>}
    </form>
    <div className="grid gap-4 lg:grid-cols-2">
      <OrderBookCard key={`book-${symbol}`} symbol={symbol} />
      <TradesCard key={`trades-${symbol}`} symbol={symbol} />
    </div>
    <DerivativesCard key={`deriv-${symbol}`} symbol={symbol} />
    <LiquidationsCard key={`liq-${symbol}`} symbol={symbol} />
    <p className="text-xs text-slate-500">{copy('Panel ini hanya menampilkan data pasar publik sebagai konteks. Bukan sinyal beli/jual dan bukan saran investasi.', 'This panel only shows public market data for context. It is not a buy/sell signal or investment advice.')}</p>
  </div>;
}
