'use client';

import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/lib/translations';

export default function TerminalHow() {
  const { t } = useLanguage();

  const steps: { num: string; titleKey: TranslationKey; descKey: TranslationKey; chips: string[] }[] = [
    {
      num: "01",
      titleKey: "lp_how1_title",
      descKey: "lp_how1_desc",
      chips: ["Drag & Drop", "Paste Clipboard", "File Upload"]
    },
    {
      num: "02",
      titleKey: "lp_how2_title",
      descKey: "lp_how2_desc",
      chips: ["Leverage Input", "Capital Size", "Auto Risk Calc"]
    },
    {
      num: "03",
      titleKey: "lp_how3_title",
      descKey: "lp_how3_desc",
      chips: ["Multi-TF Confluence", "Bias Detection", "Level Identification"]
    },
    {
      num: "04",
      titleKey: "lp_how4_title",
      descKey: "lp_how4_desc",
      chips: ["One-Click Copy", "Save History", "Performance Track"]
    }
  ];

  return (
    <section id="how" className="py-20 bg-slate-900/50 border-t border-slate-800 border-b font-mono text-slate-300">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-neon text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            {t('lp_how_pill')}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            {t('lp_how_title')}<br /><span className="text-neon">{t('lp_how_title_accent')}</span>
          </h2>
          <p className="text-slate-500 text-[13px] max-w-xl mx-auto leading-[1.8]">
            {t('lp_how_desc')}
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-slate-800 -translate-x-1/2 hidden md:block" />

          <div className="space-y-8">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col md:flex-row items-start gap-6 relative">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-800 text-neon font-bold text-sm relative z-10 md:mx-auto">
                  {s.num}
                </div>
                <div className="flex-1 bg-slate-900/50 border border-slate-800 p-6">
                  <div className="text-[12px] font-bold text-white mb-2 tracking-[0.06em]">{t(s.titleKey)}</div>
                  <p className="text-[11px] text-slate-500 leading-[1.9] mb-4">{t(s.descKey)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.chips.map((chip, j) => (
                      <span key={j} className="text-[9px] px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 tracking-[0.04em]">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
