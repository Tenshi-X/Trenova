'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function TerminalCredibility() {
  const { t } = useLanguage();

  return (
    <section id="about" className="py-20 bg-slate-950 border-t border-slate-800 font-mono text-slate-300">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-neon text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            {t('lp_cred_pill')}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            {t('lp_cred_title')}<br /><span className="text-neon">{t('lp_cred_title_accent')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left - Profile */}
          <div>
            <div className="flex items-start gap-5 mb-7">
              <div className="w-[72px] h-[72px] flex-shrink-0 bg-neon/[0.06] border-2 border-neon/30 flex items-center justify-center text-[28px] font-bold text-neon relative">
                TI
                <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] bg-emerald-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center">✓</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{t('lp_cred_brand')}</div>
                <div className="text-[11px] text-neon/70 tracking-[0.06em] mb-1">{t('lp_cred_brand_sub')}</div>
                <div className="text-[10px] text-slate-600">
                  {t('lp_cred_ig_label')} <a href="https://instagram.com/trenova.intelligence" className="text-neon hover:underline" target="_blank" rel="noopener noreferrer">@trenova.intelligence</a>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 leading-[1.9] mb-6">
              {t('lp_cred_desc1')} <strong className="text-slate-300">{t('lp_cred_desc1_bold')}</strong> — kami komunitas trader Indonesia yang membangun tools yang kami sendiri butuhkan setiap hari.
              <br /><br />
              {t('lp_cred_desc2')} <strong className="text-slate-300">{t('lp_cred_desc2_bold')}</strong>. Kamu yang beli adalah bagian dari komunitas yang ikut membentuk roadmap fitur berikutnya.
            </div>
          </div>

          {/* Right - Stats + Quote */}
          <div>
            <div className="grid grid-cols-2 gap-px bg-slate-800 border border-slate-800 mb-4">
              {[
                { num: "12K", suffix: "+", labelKey: 'lp_cred_stat1_label' as const },
                { num: "500", suffix: "+", labelKey: 'lp_cred_stat2_label' as const },
                { num: "2", suffix: "th", labelKey: 'lp_cred_stat3_label' as const },
                { num: "100", suffix: "%", labelKey: 'lp_cred_stat4_label' as const },
              ].map((s, i) => (
                <div key={i} className="bg-slate-950 p-5">
                  <div className="text-[32px] font-bold text-neon leading-none mb-1 tracking-tight">
                    {s.num}<span className="text-sm text-neon/70">{s.suffix}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 tracking-[0.06em]">{t(s.labelKey)}</div>
                </div>
              ))}
            </div>
            <div className="bg-slate-950 border border-slate-800 border-l-[3px] border-l-neon/50 p-5">
              <p className="text-[12px] text-slate-300 leading-[1.8] mb-3 italic">
                {t('lp_cred_quote')}
              </p>
              <div className="text-[10px] text-slate-600">
                — <strong className="text-neon">@trenova.intelligence</strong> · {t('lp_cred_quote_author')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
