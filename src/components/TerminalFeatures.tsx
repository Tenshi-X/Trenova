'use client';

import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/lib/translations';

export default function TerminalFeatures() {
  const { t } = useLanguage();

  const features: { num: string; icon: string; titleKey: TranslationKey; descKey: TranslationKey; tags: { text: string; active?: boolean }[] }[] = [
    {
      num: "01", icon: "📊",
      titleKey: "lp_feat1_title",
      descKey: "lp_feat1_desc",
      tags: [{ text: "1W / 3D / 1D", active: true }, { text: "4H / 1H / 15M", active: true }, { text: "CVD" }, { text: "Volume Profile" }]
    },
    {
      num: "02", icon: "🤖",
      titleKey: "lp_feat2_title",
      descKey: "lp_feat2_desc",
      tags: [{ text: "EMA Confluence", active: true }, { text: "RSI + MACD", active: true }, { text: "CVD Analysis", active: true }]
    },
    {
      num: "03", icon: "🎯",
      titleKey: "lp_feat3_title",
      descKey: "lp_feat3_desc",
      tags: [{ text: "Auto SL/TP", active: true }, { text: "R/R Calculator", active: true }, { text: "Liquidation Guard" }]
    },
    {
      num: "04", icon: "📋",
      titleKey: "lp_feat4_title",
      descKey: "lp_feat4_desc",
      tags: [{ text: "One-Click Copy", active: true }, { text: "JSON Export" }, { text: "Telegram Ready" }]
    },
    {
      num: "05", icon: "🗂️",
      titleKey: "lp_feat5_title",
      descKey: "lp_feat5_desc",
      tags: [{ text: "30 Session Storage", active: true }, { text: "Screenshot Archive", active: true }, { text: "Export History" }]
    },
    {
      num: "06", icon: "📚",
      titleKey: "lp_feat6_title",
      descKey: "lp_feat6_desc",
      tags: [{ text: "Step-by-Step Guide", active: true }, { text: "Visual Reference", active: true }, { text: "OKX Optimized" }]
    }
  ];

  return (
    <section id="features" className="py-20 bg-slate-950 font-mono text-slate-300">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-neon text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            {t('lp_feat_pill')}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            {t('lp_feat_title')}<br />Trader <span className="text-neon">{t('lp_feat_title_accent')}</span>
          </h2>
          <p className="text-slate-500 text-[13px] max-w-xl mx-auto leading-[1.8]">
            {t('lp_feat_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-800 border border-slate-800">
          {features.map((f, i) => (
            <div key={i} className="bg-slate-950 p-7 flex flex-col items-start group hover:bg-slate-900/50 transition-colors">
              <div className="flex items-center justify-between w-full mb-4">
                <span className="text-[10px] text-slate-700 font-bold tracking-[0.1em]">{f.num}</span>
                <span className="text-2xl">{f.icon}</span>
              </div>
              <h3 className="text-[12px] font-bold text-white mb-3 tracking-[0.08em] uppercase">{t(f.titleKey)}</h3>
              <p className="text-[11px] text-slate-500 leading-[1.9] mb-4 flex-grow">{t(f.descKey)}</p>
              <div className="flex flex-wrap gap-1.5">
                {f.tags.map((tag, j) => (
                  <span key={j} className={`text-[9px] px-2 py-0.5 border tracking-[0.04em] ${tag.active ? 'border-neon/30 text-neon bg-neon/5' : 'border-slate-800 text-slate-600'}`}>
                    {tag.text}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
