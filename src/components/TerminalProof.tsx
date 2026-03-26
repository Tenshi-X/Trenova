'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function TerminalProof() {
  const { t } = useLanguage();

  const stats = [
    { numKey: 'lp_proof_stat1_num' as const, suffix: "+", labelKey: 'lp_proof_stat1_label' as const, subKey: 'lp_proof_stat1_sub' as const },
    { numKey: 'lp_proof_stat2_num' as const, suffix: "+", labelKey: 'lp_proof_stat2_label' as const, subKey: 'lp_proof_stat2_sub' as const },
    { numKey: 'lp_proof_stat3_num' as const, suffix: "/5", labelKey: 'lp_proof_stat3_label' as const, subKey: 'lp_proof_stat3_sub' as const },
    { numKey: 'lp_proof_stat4_num' as const, suffix: "s", labelKey: 'lp_proof_stat4_label' as const, subKey: 'lp_proof_stat4_sub' as const },
  ];

  const testimonials = [
    { initials: "AR", nameKey: 'lp_proof_t1_name' as const, roleKey: 'lp_proof_t1_role' as const, quoteKey: 'lp_proof_t1_quote' as const },
    { initials: "DM", nameKey: 'lp_proof_t2_name' as const, roleKey: 'lp_proof_t2_role' as const, quoteKey: 'lp_proof_t2_quote' as const },
    { initials: "SF", nameKey: 'lp_proof_t3_name' as const, roleKey: 'lp_proof_t3_role' as const, quoteKey: 'lp_proof_t3_quote' as const },
  ];

  return (
    <section className="py-20 bg-slate-950 border-t border-slate-800 font-mono text-slate-300">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-neon text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            {t('lp_proof_pill')}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            {t('lp_proof_title')}<br /><span className="text-neon">{t('lp_proof_title_accent')}</span> di Seluruh Dunia
          </h2>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800 border border-slate-800 mb-px">
          {stats.map((s, i) => (
            <div key={i} className="bg-slate-950 p-6 text-center relative">
              <div className="text-3xl md:text-[40px] font-bold text-neon leading-none mb-1.5 tracking-tight">
                {t(s.numKey)}<span className="text-lg text-neon/70">{s.suffix}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-[0.06em] mb-1">{t(s.labelKey)}</div>
              <div className="text-[10px] text-slate-700">{t(s.subKey)}</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neon/50 to-transparent" />
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-800 border border-slate-800">
          {testimonials.map((tItem, i) => (
            <div key={i} className="bg-slate-950 p-7">
              <p className="text-[11px] text-slate-300 leading-[1.9] mb-5 italic">
                <span className="text-neon text-base not-italic">&ldquo;</span>{t(tItem.quoteKey)}<span className="text-neon text-base not-italic">&rdquo;</span>
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-neon/[0.06] border border-neon/20 text-[11px] font-bold text-neon flex-shrink-0">
                  {tItem.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-white">{t(tItem.nameKey)}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{t(tItem.roleKey)}</div>
                </div>
                <span className="text-[8px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 tracking-[0.04em] flex-shrink-0">
                  VERIFIED
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
