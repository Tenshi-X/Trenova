'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/lib/translations';

export default function TerminalFAQ() {
  const { t } = useLanguage();

  const faqs: { qKey: TranslationKey; aKey: TranslationKey }[] = [
    { qKey: 'lp_faq1_q', aKey: 'lp_faq1_a' },
    { qKey: 'lp_faq2_q', aKey: 'lp_faq2_a' },
    { qKey: 'lp_faq3_q', aKey: 'lp_faq3_a' },
    { qKey: 'lp_faq4_q', aKey: 'lp_faq4_a' },
    { qKey: 'lp_faq5_q', aKey: 'lp_faq5_a' },
    { qKey: 'lp_faq6_q', aKey: 'lp_faq6_a' },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-slate-900/50 border-t border-slate-800 border-b font-mono text-slate-300">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-neon text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            {t('lp_faq_pill')}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            {t('lp_faq_title')} <span className="text-neon">{t('lp_faq_title_accent')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-800 border border-slate-800">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-slate-950 p-6 cursor-pointer hover:bg-slate-900/50 transition-colors"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <div className="flex justify-between items-start gap-4 mb-2.5">
                <span className="text-[12px] font-semibold text-white leading-snug">{t(faq.qKey)}</span>
                <span className="text-neon/70 flex-shrink-0 text-sm">{openIndex === i ? '−' : '→'}</span>
              </div>
              <div className={`text-[11px] text-slate-500 leading-[1.8] overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                {t(faq.aKey)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
