'use client';

import type { AnalysisV2 } from '@/lib/analysis/core';
import { useLanguage } from '@/context/LanguageContext';

export default function AnalysisResultV2({ result, coinName }: { result: AnalysisV2; coinName: string }) {
  const { t } = useLanguage();
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
    {result.parameters && <p className="text-xs text-slate-500">{t('ai_market_type')}: {result.parameters.marketType} · {t('ai_direction_label')}: {result.parameters.directionPreference === 'auto' ? t('ai_direction_auto') : result.parameters.directionPreference.toUpperCase()}</p>}
    {result.market.confirmation && <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm">
      <strong>{t('ai_confirmation_label')} · {result.market.confirmation.timeframe}</strong>
      <p>{result.market.confirmation.trend === 'bullish' ? t('ai_trend_bullish') : result.market.confirmation.trend === 'bearish' ? t('ai_trend_bearish') : t('ai_trend_neutral')} · RSI {result.market.confirmation.rsi.toFixed(1)} · EMA20 {price(result.market.confirmation.ema20)}</p>
      <p className="text-xs text-slate-500">{new Date(result.market.confirmation.asOf).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>
    </div>}
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
