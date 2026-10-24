'use client';

import type { AnalysisV2 } from '@/lib/analysis/core';
import { setupTargetMetrics } from '@/lib/analysis/core';
import { useLanguage } from '@/context/LanguageContext';

// Short in-app lesson on how to follow a trade plan. It is generated from the plan's own numbers so the
// explanation matches what the user is looking at, and it is collapsed by default so it never crowds the result.
const EXAMPLE_RISK_IDR = 100_000;

export default function PlanGuide({ result }: { result: AnalysisV2 }) {
  const { language } = useLanguage();
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const setup = result.setups[0];
  if (!setup) return null;
  const metrics = setupTargetMetrics(setup);
  const long = setup.direction === 'LONG';
  const timeframe = result.market.timeframe;
  const price = (value: number) => value.toLocaleString('en-US', { maximumSignificantDigits: 8 }) + ' USDT';
  const conditional = setup.execution === 'CONDITIONAL' || result.verdict === 'WAIT';
  const lossPct = metrics ? Math.abs(metrics.lossPct) : null;
  const positionIdr = lossPct && lossPct > 0 ? Math.round(EXAMPLE_RISK_IDR / (lossPct / 100)) : null;
  const idr = (value: number) => 'Rp' + value.toLocaleString(language === 'id' ? 'id-ID' : 'en-US');
  const opposite = result.setups.length > 1 && result.setups[1].direction !== setup.direction;
  const expires = result.expiresAt ? new Date(result.expiresAt).toLocaleString(language === 'id' ? 'id-ID' : 'en-US',
    { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) + ' WIB' : null;

  const steps: Array<[string, string]> = [];
  if (conditional) {
    steps.push([
      copy('Tunggu pemicu terpenuhi', 'Wait for the trigger'),
      copy(`Pemicu dinilai dari harga PENUTUPAN candle ${timeframe}, bukan sentuhan sumbu (wick) sesaat. Selama candle belum tutup, anggap pemicu belum terjadi. Isi pemicu persis ada di bagian "Pemicu masuk" pada rencana.`,
        `The trigger is judged on the CLOSE of a ${timeframe} candle, not a brief wick touch. Until the candle closes, treat the trigger as not met. The exact trigger is in the plan's "Entry trigger" line.`),
    ]);
  }
  steps.push([
    copy('Masuk hanya di zona entry', 'Enter only inside the entry zone'),
    copy(`${conditional ? 'Setelah pemicu, tunggu harga kembali (retest) ke zona' : 'Masuk ketika harga berada di zona'} ${setup.entryLow.toLocaleString('en-US', { maximumSignificantDigits: 8 })} – ${price(setup.entryHigh)}.${metrics ? ` Entry terburuk adalah ${price(metrics.entry)} (${long ? 'batas atas' : 'batas bawah'} zona); semua hitungan R:R memakai titik ini.` : ''}`,
      `${conditional ? 'After the trigger, wait for price to come back (retest) to the zone' : 'Enter while price is inside the zone'} ${setup.entryLow.toLocaleString('en-US', { maximumSignificantDigits: 8 })} – ${price(setup.entryHigh)}.${metrics ? ` The worst entry is ${price(metrics.entry)} (the zone's ${long ? 'upper' : 'lower'} edge); every R:R figure uses this point.` : ''}`),
  ]);
  steps.push([
    copy('Pasang stop loss sejak awal', 'Set the stop loss from the start'),
    copy(`SL di ${price(setup.stopLoss)}${lossPct ? ` (${lossPct.toFixed(2)}% dari entry terburuk)` : ''}. Jika harga menyentuhnya, rencana dianggap gagal. Jangan menggeser SL menjauh agar rugi tidak membesar.`,
      `SL at ${price(setup.stopLoss)}${lossPct ? ` (${lossPct.toFixed(2)}% from the worst entry)` : ''}. If price touches it, the plan has failed. Do not move the SL further away to avoid a larger loss.`),
  ]);
  steps.push([
    copy('Tentukan cara ambil profit', 'Decide how to take profit'),
    copy(`TP1 ${price(setup.takeProfit1)}${metrics ? ` (1:${metrics.targets[0].riskReward.toFixed(2)})` : ''}, TP2 ${price(setup.takeProfit2)}${metrics ? ` (1:${metrics.targets[1].riskReward.toFixed(2)})` : ''}. Banyak trader mengamankan sebagian di TP1; keputusan akhir tetap milikmu. Saran pengelolaan posisi ada di bagian "Tindakan & pengelolaan posisi".`,
      `TP1 ${price(setup.takeProfit1)}${metrics ? ` (1:${metrics.targets[0].riskReward.toFixed(2)})` : ''}, TP2 ${price(setup.takeProfit2)}${metrics ? ` (1:${metrics.targets[1].riskReward.toFixed(2)})` : ''}. Many traders secure part of the position at TP1; the final decision is yours. Position management notes are under "Actions & position management".`),
  ]);
  if (conditional) {
    const cancel = setup.cancelAt !== undefined
      ? copy(`Jika candle ${timeframe} ditutup ${long ? 'di bawah' : 'di atas'} ${price(setup.cancelAt)} sebelum kamu entry, abaikan rencana ini.`,
        `If a ${timeframe} candle closes ${long ? 'below' : 'above'} ${price(setup.cancelAt)} before you enter, discard this plan.`)
      : copy('Jika syarat pembatalan pada rencana terjadi sebelum kamu entry, abaikan rencana ini.',
        'If the plan\'s cancel condition happens before you enter, discard this plan.');
    steps.push([
      copy('Tahu kapan membatalkan', 'Know when to cancel'),
      `${cancel}${expires ? ' ' + copy(`Rencana juga berlaku sampai ${expires}; setelah itu minta analisis baru.`, `The plan is also valid until ${expires}; after that, request a new analysis.`) : ''}`,
    ]);
  }

  const pitfalls = [
    copy('Masuk sebelum pemicu terpenuhi hanya karena harga "sudah dekat".', 'Entering before the trigger is met just because price is "close".'),
    copy('Mengira R:R besar berarti peluang menang besar. Makin besar R:R, makin jauh targetnya dan biasanya makin jarang tercapai.',
      'Assuming a high R:R means a high chance to win. The larger the R:R, the farther the target and usually the less often it is reached.'),
    copy('Memakai leverage tinggi tanpa menghitung jarak SL; likuidasi bisa terjadi sebelum SL tersentuh.',
      'Using high leverage without checking the SL distance; liquidation can happen before the SL is hit.'),
    ...(opposite ? [copy('Menjalankan rencana utama dan alternatif sekaligus. Keduanya berlawanan arah; pilih berdasarkan pemicu mana yang terpenuhi lebih dulu.',
      'Running the primary and alternative plans at once. They point in opposite directions; follow whichever trigger is met first.')] : []),
  ];

  return <details className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 text-sm">
    <summary className="cursor-pointer font-bold">{copy('Cara membaca & menjalankan rencana ini', 'How to read & follow this plan')}</summary>
    <div className="mt-4 space-y-4 leading-relaxed">
      <p className="text-slate-600 dark:text-slate-400">{conditional
        ? copy('Rencana bersyarat bukan perintah beli atau jual sekarang. Ini daftar syarat yang harus terpenuhi berurutan sebelum kamu masuk.',
          'A conditional plan is not an instruction to buy or sell now. It is a list of conditions that must be met in order before you enter.')
        : copy('Setup ini sudah dekat zona entry. Tetap ikuti urutan di bawah dan jangan melewati stop loss.',
          'This setup is already close to its entry zone. Still follow the order below and never skip the stop loss.')}</p>
      <ol className="space-y-3">
        {steps.map(([title, body], index) => <li key={title} className="flex gap-3">
          <span aria-hidden className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon/15 text-xs font-bold">{index + 1}</span>
          <div><h4 className="font-semibold">{title}</h4><p className="text-slate-600 dark:text-slate-400">{body}</p></div>
        </li>)}
      </ol>
      {positionIdr && lossPct && <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3">
        <h4 className="font-semibold">{copy('Contoh menghitung ukuran posisi', 'Position size example')}</h4>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{copy(
          `Jika kamu rela rugi maksimal ${idr(EXAMPLE_RISK_IDR)} pada trade ini dan SL berjarak ${lossPct.toFixed(2)}%, nilai posisinya sekitar ${idr(positionIdr)} (${idr(EXAMPLE_RISK_IDR)} ÷ ${lossPct.toFixed(2)}%), tanpa leverage. Ganti ${idr(EXAMPLE_RISK_IDR)} dengan risiko yang sesuai modalmu; banyak trader membatasinya di sekitar 1–2% modal per trade. Ini contoh hitungan, bukan saran.`,
          `If you are willing to lose at most ${idr(EXAMPLE_RISK_IDR)} on this trade and the SL is ${lossPct.toFixed(2)}% away, the position value is about ${idr(positionIdr)} (${idr(EXAMPLE_RISK_IDR)} ÷ ${lossPct.toFixed(2)}%), without leverage. Replace ${idr(EXAMPLE_RISK_IDR)} with a risk that fits your capital; many traders cap it around 1–2% of capital per trade. This is an example calculation, not advice.`)}</p>
      </div>}
      <div>
        <h4 className="font-semibold">{copy('Kesalahan yang sering terjadi', 'Common mistakes')}</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-400">{pitfalls.map(item => <li key={item}>{item}</li>)}</ul>
      </div>
      <p className="text-xs text-slate-500">{copy('Edukasi umum untuk membaca rencana ini; bukan saran investasi dan bukan jaminan hasil.',
        'General education on reading this plan; not investment advice and not a guarantee of results.')}</p>
    </div>
  </details>;
}
