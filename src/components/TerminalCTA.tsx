'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function TerminalCTA() {
  const { t } = useLanguage();

  return (
    <section className="py-28 bg-slate-950 font-mono text-slate-300 relative overflow-hidden">
      {/* Grid BG */}
      <div className="absolute inset-0 z-0 [background-image:linear-gradient(rgba(16,185,129,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,.04)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black_20%,transparent_100%)]" />
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(16,185,129,.08)_0%,transparent_70%)] z-0" />

      <div className="container mx-auto px-6 relative z-10 text-center">
        <div className="text-[10px] text-neon tracking-[0.2em] uppercase mb-5">
          {t('lp_cta_pill')}
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-[1.1]" style={{ fontFamily: "'Syne', sans-serif" }}>
          {t('lp_cta_title')}<br /><span className="text-neon">{t('lp_cta_title_accent')}</span>
        </h2>
        <p className="text-[13px] text-slate-500 max-w-lg mx-auto mb-10 leading-[1.8]">
          {t('lp_cta_desc')}
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-5">
          <Link
            href="#pricing"
            className="px-9 py-4 bg-neon hover:bg-emerald-400 text-slate-950 font-bold text-[13px] uppercase tracking-[0.1em] transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            {t('lp_cta_btn1')} <ArrowRight size={16} />
          </Link>
          <a
            href="https://instagram.com/trenova.intelligence"
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-4 bg-transparent border border-slate-700 text-slate-300 font-bold text-[13px] uppercase tracking-[0.1em] hover:border-neon hover:text-neon transition-all"
          >
            {t('lp_cta_btn2')}
          </a>
        </div>
        <p className="text-[10px] text-slate-700 tracking-[0.04em]">
          {t('lp_cta_note')}
        </p>
      </div>
    </section>
  );
}
