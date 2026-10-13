'use client';

import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { squarify } from '@/lib/treemap';

export interface OverviewCoin {
  symbol: string;
  price: number;
  chg24h: number;
  chg1h: number | null;
  chg4h: number | null;
  chg12h: number | null;
  vol24h: number;
  openInterestUsd: number | null;
}

interface MarketOverviewProps {
  coins: OverviewCoin[];
  language: string;
  onSelectSymbol?: (symbol: string) => void;
}

function fmtPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  const digits = value >= 1000 ? 2 : value >= 1 ? 3 : value >= 0.01 ? 4 : 6;
  return `$${value.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: digits })}`;
}

function fmtCompact(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2, style: 'currency', currency: 'USD' }).format(value);
}

function fmtPct(value: number | null): string {
  return value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

const tone = (value: number | null) => value === null ? 'text-slate-600' : value >= 0 ? 'text-emerald-400' : 'text-rose-400';

/** Cell colour from the 24h change: green for up, red for down, stronger the bigger the move (caps at +/-8%). */
function cellColor(change: number): string {
  const strength = Math.min(Math.abs(change) / 8, 1);
  const lightness = 22 + strength * 14;
  const saturation = 35 + strength * 30;
  return `hsl(${change >= 0 ? 150 : 355} ${saturation}% ${lightness}%)`;
}

type Pick = 'volume' | 'gainers' | 'losers';
type Metric = 'volume' | 'change' | 'oi';

export default function MarketOverview({ coins, language, onSelectSymbol }: MarketOverviewProps) {
  const id = language === 'id';
  const [pick, setPick] = useState<Pick>('volume');
  const [metric, setMetric] = useState<Metric>('volume');

  const featured = useMemo(() => {
    const list = [...coins];
    if (pick === 'gainers') list.sort((a, b) => b.chg24h - a.chg24h);
    else if (pick === 'losers') list.sort((a, b) => a.chg24h - b.chg24h);
    else list.sort((a, b) => b.vol24h - a.vol24h);
    return list.slice(0, 8);
  }, [coins, pick]);

  const cells = useMemo(() => {
    const valueOf = (coin: OverviewCoin) => metric === 'oi' ? (coin.openInterestUsd ?? 0) : coin.vol24h;
    const rects = squarify(coins.map((coin) => ({ id: coin.symbol, value: valueOf(coin) })), 1600, 900);
    const bySymbol = new Map(coins.map((coin) => [coin.symbol, coin]));
    return rects.flatMap((rect) => { const coin = bySymbol.get(rect.id); return coin ? [{ rect, coin }] : []; });
  }, [coins, metric]);

  const tabClass = (active: boolean) => clsx(
    'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-400',
    active ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-200',
  );

  if (!coins.length) return null;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* ── Gainers & Losers ── */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4" aria-label="Gainers & Losers">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h2 className="text-base font-semibold text-slate-100">Gainers &amp; Losers</h2>
          <div className="flex gap-1 rounded-full bg-slate-900 p-1" role="tablist">
            {([['volume', id ? 'Volume Terbesar' : 'Top Volume'], ['gainers', 'Top Gainer'], ['losers', 'Top Loser']] as const).map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={pick === key} onClick={() => setPick(key)} className={tabClass(pick === key)}>{label}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {featured.map((coin) => (
            <button
              key={coin.symbol}
              type="button"
              onClick={() => onSelectSymbol?.(`${coin.symbol}USDT`)}
              aria-label={`${coin.symbol}: ${id ? 'buka chart' : 'open chart'}`}
              className="text-left rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 hover:border-slate-600 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-400"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-200">{coin.symbol.slice(0, 2)}</span>
                  <span className="text-sm font-semibold text-slate-100 truncate">{coin.symbol}</span>
                </div>
                <span className="text-sm font-semibold text-slate-100 tabular-nums">{fmtPrice(coin.price)}</span>
              </div>
              <dl className="grid grid-cols-4 gap-2 text-center">
                {([['24j', coin.chg24h], ['1j', coin.chg1h], ['4j', coin.chg4h], ['12j', coin.chg12h]] as const).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] text-slate-500">{label}</dt>
                    <dd className={clsx('text-[13px] font-semibold tabular-nums', tone(value))}>{fmtPct(value)}</dd>
                  </div>
                ))}
              </dl>
            </button>
          ))}
        </div>
      </section>

      {/* ── Heatmap ── */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4" aria-label="Heatmap">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h2 className="text-base font-semibold text-slate-100">Heatmap <span className="text-slate-500 font-normal">(24 {id ? 'jam' : 'hour'})</span></h2>
          <div className="flex gap-1 rounded-full bg-slate-900 p-1" role="tablist">
            {([['volume', 'Volume'], ['change', 'Chg%'], ['oi', 'Open Interest']] as const).map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={metric === key} onClick={() => setMetric(key)} className={tabClass(metric === key)}>{label}</button>
            ))}
          </div>
        </div>
        <div className="relative w-full aspect-[16/9] min-h-[240px] overflow-hidden rounded-xl bg-slate-900">
          {cells.map(({ rect, coin }) => {
            const wPct = (rect.w / 1600) * 100;
            const hPct = (rect.h / 900) * 100;
            const big = wPct > 9 && hPct > 12;
            const medium = wPct > 5 && hPct > 8;
            return (
              <button
                key={coin.symbol}
                type="button"
                onClick={() => onSelectSymbol?.(`${coin.symbol}USDT`)}
                title={`${coin.symbol} · ${fmtPct(coin.chg24h)} · ${metric === 'oi' ? 'OI' : 'Vol'} ${fmtCompact(metric === 'oi' ? (coin.openInterestUsd ?? 0) : coin.vol24h)}`}
                className="absolute flex flex-col items-start justify-start p-1.5 text-left overflow-hidden border border-slate-950 text-white/95 cursor-pointer hover:brightness-125 transition-[filter] focus-visible:outline-2 focus-visible:outline-teal-300"
                style={{ left: `${(rect.x / 1600) * 100}%`, top: `${(rect.y / 900) * 100}%`, width: `${wPct}%`, height: `${hPct}%`, background: cellColor(coin.chg24h) }}
              >
                {medium && (
                  <>
                    <span className={clsx('font-semibold leading-tight', big ? 'text-lg sm:text-xl' : 'text-xs')}>{coin.symbol}</span>
                    <span className={clsx('tabular-nums text-white/80 leading-tight', big ? 'text-sm' : 'text-[10px]')}>
                      {metric === 'change' ? fmtPct(coin.chg24h) : fmtCompact(metric === 'oi' ? (coin.openInterestUsd ?? 0) : coin.vol24h)}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          {id ? 'Ukuran kotak = ' : 'Box size = '}{metric === 'oi' ? 'open interest' : (id ? 'volume 24 jam' : '24h volume')}{id ? '. Warna = perubahan harga 24 jam (hijau naik, merah turun).' : '. Colour = 24h price change (green up, red down).'}
        </p>
      </section>
    </div>
  );
}
