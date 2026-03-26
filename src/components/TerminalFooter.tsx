'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function TerminalFooter() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 font-mono text-slate-500">
      <div className="container mx-auto px-6 max-w-6xl py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 pb-8 border-b border-slate-800 flex-wrap">
          {/* Brand */}
          <div>
            <div className="text-base font-bold text-neon tracking-[0.08em] mb-2">
              TRENOVA<span className="text-slate-700">//</span>TERMINAL
            </div>
            <p className="text-[11px] text-slate-600 leading-[1.7] max-w-[260px] mb-4">
              {t('lp_footer_brand_desc')}
            </p>
            <a
              href="https://instagram.com/trenova.intelligence"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-neon/70 border border-neon/20 px-3 py-1 tracking-[0.06em] hover:border-neon hover:text-neon transition-colors inline-block"
            >
              {t('lp_footer_ig')}
            </a>
          </div>

          {/* Links */}
          <div className="flex gap-12 flex-wrap">
            <div>
              <div className="text-[10px] text-neon/70 tracking-[0.12em] uppercase mb-4">{t('lp_footer_platform')}</div>
              <Link href="#features" className="block text-[11px] text-slate-600 hover:text-slate-300 transition-colors mb-2">{t('lp_footer_features')}</Link>
              <Link href="#how" className="block text-[11px] text-slate-600 hover:text-slate-300 transition-colors mb-2">{t('lp_footer_howit')}</Link>
              <Link href="#pricing" className="block text-[11px] text-slate-600 hover:text-slate-300 transition-colors">{t('lp_footer_pricing')}</Link>
            </div>
            <div>
              <div className="text-[10px] text-neon/70 tracking-[0.12em] uppercase mb-4">{t('lp_footer_support')}</div>
              <Link href="#" className="block text-[11px] text-slate-600 hover:text-slate-300 transition-colors mb-2">{t('lp_footer_faq')}</Link>
              <a href="https://discord.gg/gGdkQypYWM" target="_blank" rel="noopener noreferrer" className="block text-[11px] text-slate-600 hover:text-slate-300 transition-colors mb-2">{t('lp_footer_discord')}</a>
              <a href="https://instagram.com/trenova.intelligence" target="_blank" rel="noopener noreferrer" className="block text-[11px] text-slate-600 hover:text-slate-300 transition-colors">{t('lp_footer_instagram')}</a>
            </div>
            <div>
              <div className="text-[10px] text-neon/70 tracking-[0.12em] uppercase mb-4">{t('lp_footer_legal')}</div>
              <Link href="/" className="block text-[11px] text-slate-600 hover:text-slate-300 transition-colors mb-2">{t('lp_footer_tos')}</Link>
              <Link href="/" className="block text-[11px] text-slate-600 hover:text-slate-300 transition-colors mb-2">{t('lp_footer_privacy')}</Link>
              <Link href="/" className="block text-[11px] text-slate-600 hover:text-slate-300 transition-colors">{t('lp_footer_refund')}</Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 text-[10px] text-slate-700 tracking-[0.04em] gap-3 flex-wrap">
          <div>© {new Date().getFullYear()} {t('lp_footer_rights')}</div>
          <div>{t('lp_footer_disclaimer')}</div>
        </div>
      </div>
    </footer>
  );
}
