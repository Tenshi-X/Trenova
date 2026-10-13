'use client';

import type { AnalysisV2 } from '@/lib/analysis/core';
import { levelSourceLabel, setupTargetMetrics } from '@/lib/analysis/core';
import { useLanguage } from '@/context/LanguageContext';
import AnalysisStoryExport from '@/components/AnalysisStoryExport';
import AnalysisPlanMap from '@/components/AnalysisPlanMap';

export default function AnalysisResultV2({ result, coinName }: { result: AnalysisV2; coinName: string }) {
  const { language, t } = useLanguage();
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const price = (value: number) => value.toLocaleString('en-US', { maximumSignificantDigits: 8 }) + ' USDT';
  const setup = result.setups[0];
  const levelNote = (source?: { tf: 'D1' | 'W1' | 'local'; touches: number; weekly?: number }) => source ? levelSourceLabel(source, result.market.timeframe, language === 'id' ? 'id' : 'en') : '';
  const conditional = result.setups.length > 0 && (result.verdict === 'WAIT' || result.setups[0].execution === 'CONDITIONAL');
  const title = conditional ? copy('Rencana ' + result.setups[0].direction, result.setups[0].direction + ' plan') : result.verdict;
  const tone = result.verdict === 'LONG' ? 'text-emerald-500' : result.verdict === 'SHORT' ? 'text-rose-500' : 'text-amber-500';
  const insights = result.insights;
  const unavailable = copy('Tidak tersedia', 'Unavailable');
  const percent = (value: number | null | undefined) => value == null ? unavailable : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  const amount = (value: number | null | undefined) => value == null ? unavailable
    : value.toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { maximumFractionDigits: 2 }) + ' USDT';
  const market = result.market;
  const scorecard = [
    [copy('Harga saat analisis', 'Price at analysis'), price(market.price)],
    [copy('Perubahan harga 24 jam', '24h price change'), percent(market.change24h)],
    [copy('Volume 24 jam', '24h volume'), amount(market.volume24hUsd)],
    [copy('Volume relatif', 'Relative volume'), market.volumeRatio == null ? unavailable : `${market.volumeRatio.toFixed(2)}×`],
    ['RSI (14)', market.rsi.toFixed(1)], ['EMA20', price(market.ema20)],
    ['EMA50', market.ema50 == null ? unavailable : price(market.ema50)],
    ['ATR', price(market.atr)],
    ['Funding rate', market.fundingRate == null ? unavailable : `${(market.fundingRate * 100).toFixed(4)}%`],
    ['Open interest', amount(market.openInterestUsd)],
    [copy('Perubahan BTC 24 jam', 'BTC 24h change'), percent(market.btcChange24h)],
    ['Fear & Greed', market.fearGreed == null ? unavailable : `${market.fearGreed}/100`],
  ];
  return <div className="terminal-result space-y-5 text-foreground">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs text-slate-500">{coinName} · {result.market.timeframe} · {new Date(result.market.asOf).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { timeZone: 'Asia/Jakarta' })} WIB</p>
        <h2 className={'terminal-result-title mt-1 text-3xl font-black ' + tone}>{title}</h2>
        {conditional && <p className="mt-1 text-sm text-amber-600 dark:text-amber-300">{copy('Entry setelah pemicu terpenuhi', 'Enter after the trigger is confirmed')}
          {typeof setup?.distanceToEntryPct === 'number' && Math.abs(setup.distanceToEntryPct) >= 0.1
            && ` · ${copy('harga', 'price is')} ${Math.abs(setup.distanceToEntryPct).toFixed(1)}% ${setup.distanceToEntryPct > 0 ? copy('di atas zona entry', 'above the entry zone') : copy('di bawah zona entry', 'below the entry zone')}`}</p>}
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
    {setup?.quality && <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={'rounded-full px-3 py-1 text-xs font-bold ' + (setup.quality.status === 'READY' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
          : setup.quality.status === 'WATCH' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300' : 'bg-rose-500/15 text-rose-600 dark:text-rose-300')}>
          {setup.quality.status === 'READY' ? copy('SIAP · harga dekat zona entry', 'READY · price near the entry zone')
            : setup.quality.status === 'WATCH' ? copy('PANTAU · belum waktunya entry', 'WATCH · not time to enter yet')
              : copy('TIDAK ADA TRADE · skor rendah', 'NO TRADE · low score')}
        </span>
        <span className="text-sm font-bold tabular-nums">{copy('Skor konfluensi', 'Confluence score')} {setup.quality.score}/100
          <span className="ml-1 font-normal text-slate-500">({setup.quality.grade === 'HIGH' ? copy('tinggi', 'high') : setup.quality.grade === 'MEDIUM' ? copy('sedang', 'medium') : copy('rendah', 'low')})</span></span>
      </div>
      <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
        {setup.quality.factors.map(factor => <li key={factor.key} className="flex gap-2">
          <span aria-hidden className={factor.state === 'pass' ? 'text-emerald-500' : factor.state === 'fail' ? 'text-rose-500' : 'text-slate-400'}>{factor.state === 'pass' ? '✓' : factor.state === 'fail' ? '✕' : '–'}</span>
          <span><span className="font-semibold">{factor.label}</span> <span className="text-slate-500">· {factor.detail}</span></span>
        </li>)}
      </ul>
      <p className="text-xs text-slate-500">{setup.entryType && `${copy('Tipe entry', 'Entry type')}: ${setup.entryType === 'PULLBACK' ? 'Pullback' : 'Breakout'}. `}
        {result.expiresAt && `${copy('Rencana berlaku sampai', 'Plan valid until')} ${new Date(result.expiresAt).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })} WIB. `}
        {copy('Skor adalah penyaring aturan, bukan peluang menang.', 'The score is a rule-based filter, not a win probability.')}</p>
    </section>}
    <AnalysisPlanMap result={result} language={language} />
    <p className="leading-relaxed">{result.reason}</p>
    {result.parameters && <p className="text-xs text-slate-500">{t('ai_market_type')}: {result.parameters.marketType} · {t('ai_direction_label')}: {result.parameters.directionPreference === 'auto' ? t('ai_direction_auto') : result.parameters.directionPreference.toUpperCase()}</p>}
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3">
      <h3 className="font-bold">{copy('Scorecard data pasar', 'Market data scorecard')}</h3>
      <dl className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 text-sm">
        {scorecard.map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-slate-50 dark:bg-slate-950 p-3">
          <dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold tabular-nums">{value}</dd>
        </div>)}
      </dl>
      <p className="text-xs text-slate-500">{copy('Snapshot saat analisis; data yang tidak tersedia tidak digunakan sebagai sinyal.', 'Snapshot at analysis time; unavailable data is not treated as a signal.')}</p>
    </section>
    {result.verdict === 'WAIT' && result.wait_for && <div className="rounded-xl bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
      <strong>{copy('Langkah sebelum entry', 'Before entering')}</strong><p className="mt-1">{result.wait_for}</p>
    </div>}
    {result.setups.map((setup, index) => {
      const pending = setup.execution === 'CONDITIONAL' || result.verdict === 'WAIT';
      const metrics = setupTargetMetrics(setup);
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
        {metrics && <div className="space-y-2">
          <h4 className="text-sm font-semibold">{copy('Potensi hasil & R:R per target', 'Potential returns & R:R by target')}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-[360px]:text-sm tabular-nums">
              <caption className="sr-only">{copy('Perbandingan potensi hasil dan risiko setiap take profit', 'Potential returns and risk at each take profit')}</caption>
              <thead><tr className="border-b border-slate-200 dark:border-slate-800">
                {[copy('Target', 'Target'), copy('Potensi gain', 'Potential gain'), copy('Risiko SL', 'SL risk'), 'R:R'].map(label => <th key={label} scope="col" className="px-1 min-[360px]:px-2 py-2 text-right font-semibold first:text-left">{label}</th>)}
              </tr></thead>
              <tbody>{metrics.targets.map(target => <tr key={target.label} className="border-b border-slate-200 dark:border-slate-800">
                <th scope="row" className="px-1 min-[360px]:px-2 py-2 text-left font-semibold">{target.label}</th>
                <td className="px-1 min-[360px]:px-2 py-2 text-right text-emerald-600 dark:text-emerald-400">+{target.gainPct.toFixed(2)}%</td>
                <td className="px-1 min-[360px]:px-2 py-2 text-right text-rose-600 dark:text-rose-400">{metrics.lossPct.toFixed(2)}%</td>
                <td className="px-1 min-[360px]:px-2 py-2 text-right font-semibold">1:{target.riskReward.toFixed(2)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">{copy('Dihitung dari entry terburuk', 'Calculated from worst entry')} {price(metrics.entry)} · {copy('perubahan harga tanpa leverage, sebelum biaya/slippage; bukan prediksi hasil', 'price returns without leverage, before fees/slippage; not a return forecast')}</p>
        </div>}
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
      {[[copy('Support terdekat', 'Nearest support'), price(result.market.structure.support), levelNote(result.market.structure.supportSource)],
        [copy('Resistance terdekat', 'Nearest resistance'), price(result.market.structure.resistance), levelNote(result.market.structure.resistanceSource)],
        [copy('Range terendah', 'Range low'), price(result.market.structure.rangeLow), ''],
        [copy('Range tertinggi', 'Range high'), price(result.market.structure.rangeHigh), '']].map(([label, value, note]) => <div key={label} className="min-w-0"><p className="text-slate-500">{label}</p><p className="mt-1 break-words font-semibold">{value}</p>{note && <p className="mt-0.5 text-[11px] text-slate-500">{note}</p>}</div>)}
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
