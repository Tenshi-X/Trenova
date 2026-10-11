'use client';

import type { AnalysisV2 } from '@/lib/analysis/core';
import { useLanguage } from '@/context/LanguageContext';
import AnalysisStoryExport from '@/components/AnalysisStoryExport';
import AnalysisPlanMap from '@/components/AnalysisPlanMap';

export default function AnalysisResultV2({ result, coinName }: { result: AnalysisV2; coinName: string }) {
  const { language, t } = useLanguage();
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const price = (value: number) => value.toLocaleString('en-US', { maximumSignificantDigits: 8 }) + ' USDT';
  const conditional = result.setups.length > 0 && (result.verdict === 'WAIT' || result.setups[0].execution === 'CONDITIONAL');
  const title = conditional ? copy('Rencana ' + result.setups[0].direction, result.setups[0].direction + ' plan') : result.verdict;
  const tone = result.verdict === 'LONG' ? 'text-emerald-500' : result.verdict === 'SHORT' ? 'text-rose-500' : 'text-amber-500';
  const insights = result.insights;
  return <div className="terminal-result space-y-5 text-foreground">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs text-slate-500">{coinName} · {result.market.timeframe} · {new Date(result.market.asOf).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { timeZone: 'Asia/Jakarta' })} WIB</p>
        <h2 className={'terminal-result-title mt-1 text-3xl font-black ' + tone}>{title}</h2>
        {conditional && <p className="mt-1 text-sm text-amber-600 dark:text-amber-300">{copy('Entry setelah pemicu terpenuhi', 'Enter after the trigger is confirmed')}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4">
      {result.verdict !== 'WAIT' && !conditional && <div className="text-right">
        <p className="text-xs text-slate-500">{copy('Kekuatan setup', 'Setup strength')}</p>
        <p className="text-2xl font-black">{result.signal_strength}/100</p>
        <p className="text-xs text-slate-500">{copy('Bukan peluang keberhasilan', 'Not a success probability')}</p>
      </div>}
      <AnalysisStoryExport result={result} />
      </div>
    </div>
    <AnalysisPlanMap result={result} language={language} />
    <p className="leading-relaxed">{result.reason}</p>
    {result.parameters && <p className="text-xs text-slate-500">{t('ai_market_type')}: {result.parameters.marketType} · {t('ai_direction_label')}: {result.parameters.directionPreference === 'auto' ? t('ai_direction_auto') : result.parameters.directionPreference.toUpperCase()}</p>}
    {result.verdict === 'WAIT' && result.wait_for && <div className="rounded-xl bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
      <strong>{copy('Langkah sebelum entry', 'Before entering')}</strong><p className="mt-1">{result.wait_for}</p>
    </div>}
    {result.setups.map((setup, index) => {
      const pending = setup.execution === 'CONDITIONAL' || result.verdict === 'WAIT';
      return <section key={index} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold">{setup.direction} · {index === 0 ? copy('Rencana utama', 'Primary plan') : copy('Alternatif', 'Alternative')}</h3>
          <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + (pending ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300')}>
            {pending ? copy('Bersyarat', 'Conditional') : copy('Setup siap', 'Setup ready')}
          </span>
        </div>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
          {[[copy('Zona Entry', 'Entry zone'), setup.entryLow.toLocaleString('en-US', { maximumSignificantDigits: 8 }) + ' – ' + price(setup.entryHigh)],
            ['SL · Stop Loss', price(setup.stopLoss)], ['TP1 · Take Profit', price(setup.takeProfit1)],
            ['TP2 · Take Profit', price(setup.takeProfit2)]].map(([label, value]) => <div key={label} className="terminal-level min-w-0 rounded-xl bg-slate-50 dark:bg-slate-950 p-3">
              <p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words font-bold tabular-nums">{value}</p>
            </div>)}
        </div>
        {setup.riskReward != null && <p className="text-xs text-slate-500">R:R TP1 1:{setup.riskReward.toFixed(2)} · {copy('Jarak SL', 'SL distance')} {setup.stopDistancePct?.toFixed(2)}% · {copy('dihitung dari entry terburuk, sebelum biaya/slippage', 'from worst entry, before fees/slippage')}</p>}
        <div className="space-y-2 text-sm leading-relaxed">
          {setup.trigger && <p><strong>{copy('Pemicu masuk:', 'Entry trigger:')}</strong> {setup.trigger}</p>}
          {setup.invalidation && <p><strong>{copy('Batalkan rencana jika:', 'Cancel the plan if:')}</strong> {setup.invalidation}</p>}
          {setup.rationale && <p className="text-slate-600 dark:text-slate-400">{setup.rationale}</p>}
        </div>
      </section>;
    })}
    {insights && <>
      <section className="rounded-xl border border-neon/30 bg-neon/5 p-4 text-sm leading-relaxed">
        <h3 className="font-bold">{copy('Tindakan & pengelolaan posisi', 'Actions & position management')}</h3><p className="mt-2">{insights.actionPlan}</p>
      </section>
      <div className="grid sm:grid-cols-2 gap-3 text-sm leading-relaxed">
        {[[copy('Skenario naik', 'Bullish case'), insights.bullCase], [copy('Skenario turun', 'Bearish case'), insights.bearCase]].map(([label, value]) => <section key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="font-bold">{label}</h3><p className="mt-2">{value}</p>
        </section>)}
      </div>
      <section className="space-y-3 text-sm leading-relaxed">
        <h3 className="font-bold">{copy('Pertimbangan analisis', 'Analysis considerations')}</h3>
        {[[copy('Tren & struktur', 'Trend & structure'), insights.trend], ['Momentum', insights.momentum],
          ['Volume', insights.volume], [copy('Konteks pasar', 'Market context'), insights.marketContext]].map(([label, value]) => <div key={label} className="border-l-2 border-slate-200 dark:border-slate-700 pl-3">
            <h4 className="font-semibold">{label}</h4><p className="text-slate-600 dark:text-slate-400">{value}</p>
          </div>)}
      </section>
    </>}
    {result.market.structure && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 dark:bg-slate-950 p-4 text-xs">
      {[[copy('Support terdekat', 'Nearest support'), price(result.market.structure.support)],
        [copy('Resistance terdekat', 'Nearest resistance'), price(result.market.structure.resistance)],
        [copy('ATR / harga', 'ATR / price'), result.market.structure.atrPct.toFixed(2) + '%'],
        [copy('Volume relatif', 'Relative volume'), result.market.volumeRatio === null ? '—' : result.market.volumeRatio.toFixed(2) + '×']].map(([label, value]) => <div key={label} className="min-w-0"><p className="text-slate-500">{label}</p><p className="mt-1 break-words font-semibold">{value}</p></div>)}
    </div>}
    {result.market.confirmation && <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm">
      <strong>{t('ai_confirmation_label')} · {result.market.confirmation.timeframe}</strong>
      <p>{result.market.confirmation.trend === 'bullish' ? t('ai_trend_bullish') : result.market.confirmation.trend === 'bearish' ? t('ai_trend_bearish') : t('ai_trend_neutral')} · RSI {result.market.confirmation.rsi.toFixed(1)} · EMA20 {price(result.market.confirmation.ema20)}</p>
      <p className="text-xs text-slate-500">{new Date(result.market.confirmation.asOf).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { timeZone: 'Asia/Jakarta' })} WIB</p>
    </div>}
    {result.risk_reward !== null && !insights && <p className="text-sm">{copy('Rasio imbal hasil/risiko minimum', 'Minimum reward/risk ratio')}: 1:{result.risk_reward.toFixed(2)}</p>}
    {result.warnings.map((warning, index) => <p key={index} className="text-xs text-amber-600">{warning}</p>)}
    <p className="text-xs text-slate-500">{copy('Data', 'Data')}: {result.market.symbol}/USDT · {copy('harga', 'price')} {price(result.market.price)} · ATR {price(result.market.atr)} · RSI {result.market.rsi.toFixed(1)}</p>
  </div>;
}
