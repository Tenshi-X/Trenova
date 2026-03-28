'use client';

import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/lib/translations';

export default function TerminalComparison() {
  const { t } = useLanguage();

  const rows: { featureKey: TranslationKey; manual: string; signal: string; standard: string; premium: string; premiumWin: boolean }[] = [
    { featureKey: "lp_comp_r1", manual: "45–90 menit", signal: "Tunggu kiriman", standard: "≤ 60 detik", premium: "≤ 60 detik", premiumWin: false },
    { featureKey: "lp_comp_r2", manual: "Tergantung skill", signal: "✗", standard: "1 Timeframe", premium: "✓ Hingga 15 TF", premiumWin: false },
    { featureKey: "lp_comp_r3", manual: "✗", signal: "✗", standard: "✓ Gemini AI", premium: "✓ Claude AI", premiumWin: false },
    { featureKey: "lp_comp_r4", manual: "Manual hitung", signal: "✗", standard: "✗", premium: "✓ Auto SL/TP/R:R", premiumWin: false },
    { featureKey: "lp_comp_r5", manual: "✓", signal: "✗ Dependent", standard: "✓ + History track", premium: "✓ + History track", premiumWin: false },
    { featureKey: "lp_comp_r6", manual: "Harus manual", signal: "✗", standard: "✓ Terintegrasi", premium: "✓ Terintegrasi", premiumWin: false },
    { featureKey: "lp_comp_r7", manual: "✗", signal: "Format berbeda", standard: "✓ 1-Click Copy", premium: "✓ 1-Click Copy", premiumWin: false },
    { featureKey: "lp_comp_r8", manual: "Waktu kamu", signal: "Rp 200K–1jt+", standard: "Rp 55K–450K", premium: "Rp 99K–579K", premiumWin: true },
  ];

  const isCheckYes = (val: string) => val.startsWith("✓");
  const isCheckNo = (val: string) => val === "✗" || val.startsWith("✗ ");

  return (
    <section className="py-20 bg-slate-950 border-t border-slate-800 font-mono text-slate-300">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-neon text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            {t('lp_comp_pill')}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            {t('lp_comp_title')}<br /><span className="text-neon">{t('lp_comp_title_accent')}</span>
          </h2>
          <p className="text-slate-500 text-[13px] max-w-xl mx-auto leading-[1.8]">
            {t('lp_comp_desc')}
          </p>
        </div>

        <div className="border border-slate-800 overflow-x-auto">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] min-w-[800px] border-b border-slate-800">
            <div className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] border-r border-slate-800">{t('lp_comp_col_cap')}</div>
            <div className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] text-center border-r border-slate-800">{t('lp_comp_col_manual')}</div>
            <div className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] text-center border-r border-slate-800">{t('lp_comp_col_signal')}</div>
            <div className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] text-center border-r border-slate-800 bg-slate-900/50">
              TRENOVA STANDARD
            </div>
            <div className="px-5 py-3 text-[10px] font-bold text-neon uppercase tracking-[0.12em] text-center border-t-2 border-t-neon bg-neon/[0.04]">
              TRENOVA PREMIUM
              <div className="text-[9px] text-neon/70 font-normal mt-0.5">⭐ {t('lp_comp_col_trenova_rec')}</div>
            </div>
          </div>
          {/* Rows */}
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] min-w-[800px] border-b border-slate-800 last:border-b-0 hover:bg-white/[0.01] transition-colors">
              <div className="px-5 py-3.5 text-[11px] text-slate-300 border-r border-slate-800 flex items-center gap-2.5">
                {t(r.featureKey)}
              </div>
              <div className="px-5 py-3.5 text-[11px] text-center border-r border-slate-800 flex items-center justify-center">
                <span className={isCheckNo(r.manual) ? "text-slate-700" : isCheckYes(r.manual) ? "text-emerald-400 font-bold" : "text-neon/70 text-[10px]"}>
                  {r.manual}
                </span>
              </div>
              <div className="px-5 py-3.5 text-[11px] text-center border-r border-slate-800 flex items-center justify-center">
                <span className={isCheckNo(r.signal) ? "text-slate-700" : isCheckYes(r.signal) ? "text-emerald-400 font-bold" : "text-neon/70 text-[10px]"}>
                  {r.signal}
                </span>
              </div>
              {/* Standard column */}
              <div className="px-5 py-3.5 text-[11px] text-center border-r border-slate-800 bg-slate-900/30 flex items-center justify-center">
                <span className={isCheckNo(r.standard) ? "text-slate-700" : isCheckYes(r.standard) ? "text-emerald-400 font-bold" : "text-slate-300 text-[10px]"}>
                  {r.standard}
                </span>
              </div>
              {/* Premium column */}
              <div className="px-5 py-3.5 text-[11px] text-center bg-neon/[0.04] flex items-center justify-center gap-2">
                <span className="text-emerald-400 font-bold">{r.premium}</span>
                {r.premiumWin && (
                  <span className="bg-neon text-slate-950 text-[8px] font-bold px-2 py-0.5 tracking-[0.06em]">TERBAIK</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
