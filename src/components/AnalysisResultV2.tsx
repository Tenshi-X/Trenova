'use client';

import type { AnalysisV2 } from '@/lib/analysis/core';

export default function AnalysisResultV2({ result, coinName }: { result: AnalysisV2; coinName: string }) {
  const price = (value: number) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 8 })}`;
  const tone = result.verdict === 'LONG' ? 'text-emerald-500' : result.verdict === 'SHORT' ? 'text-rose-500' : 'text-amber-500';
  return <div className="space-y-5 text-foreground">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs text-slate-500">{coinName} · {result.market.timeframe} · {new Date(result.market.asOf).toLocaleString('id-ID')}</p>
        <h2 className={`text-3xl font-black ${tone}`}>{result.verdict}</h2>
      </div>
      {result.verdict !== 'WAIT' && <div className="text-right">
        <p className="text-xs text-slate-500">Kekuatan setup</p>
        <p className="text-2xl font-black">{result.signal_strength}/100</p>
        <p className="text-xs text-slate-500">Bukan peluang keberhasilan</p>
      </div>}
    </div>
    <p className="leading-relaxed">{result.reason}</p>
    {result.verdict === 'WAIT' && <p className="rounded-xl bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">Tunggu: {result.wait_for || 'Konfirmasi pasar yang lebih jelas.'}</p>}
    {result.setups.map((setup, index) => <div key={index} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
      <strong>{setup.direction} · Setup {index + 1}</strong>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div><p className="text-slate-500">Entry</p>{price(setup.entryLow)}–{price(setup.entryHigh)}</div>
        <div><p className="text-slate-500">Stop loss</p>{price(setup.stopLoss)}</div>
        <div><p className="text-slate-500">Target 1</p>{price(setup.takeProfit1)}</div>
        <div><p className="text-slate-500">Target 2</p>{price(setup.takeProfit2)}</div>
      </div>
    </div>)}
    {result.risk_reward !== null && <p className="text-sm">Rasio imbal hasil/risiko minimum: 1:{result.risk_reward.toFixed(2)}</p>}
    {result.warnings.map((warning, index) => <p key={index} className="text-xs text-amber-600">{warning}</p>)}
    <p className="text-xs text-slate-500">Data: {result.market.symbol}/USDT · harga {price(result.market.price)} · ATR {price(result.market.atr)} · RSI {result.market.rsi.toFixed(1)}</p>
  </div>;
}
