'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/context/LanguageContext';

export default function AuthShell({ children, loading, mode }: {
  children: React.ReactNode;
  loading: boolean;
  mode: 'login' | 'register';
}) {
  const { language, t } = useLanguage();
  return <div className="auth-page">
    <header className="auth-header">
      <Link href="/" className="site-brand">TRENOVA <span>{'//'}</span> TERMINAL</Link>
      <div className="auth-header-actions">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-neon"><ArrowLeft size={16} />{t('btn_back_home')}</Link>
        <LanguageSwitcher />
      </div>
    </header>
    <main className="auth-workspace">
      <section className="auth-intro">
        <span className="site-eyebrow">CRYPTO INTELLIGENCE</span>
        <h2>{t('lp_hero_subtitle_1')}<br />{t('lp_hero_subtitle_2')}</h2>
        <p>{t('lp_hero_desc')} {t('lp_hero_desc_bold1')}{t('lp_hero_middle')} {t('lp_hero_desc_bold2')}</p>
        <div className="auth-modules">
          <div><span>01 / MARKET</span><strong>{t('nav_market')}</strong></div>
          <div><span>02 / ANALYSIS</span><strong>{t('tab_analysis')}</strong></div>
          <div><span>03 / HISTORY</span><strong>{t('nav_history')}</strong></div>
        </div>
      </section>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card-heading">
          <span className="site-eyebrow">TRENOVA {'//'} {mode === 'login' ? 'ACCESS' : 'REGISTER'}</span>
          <h1 id="auth-title">{t(mode === 'login' ? 'login_title' : 'register_title')}</h1>
          <p>{t(mode === 'login' ? 'login_subtitle' : 'register_subtitle')}</p>
        </div>
        {children}
      </section>
    </main>
    <footer className="auth-footer">TRENOVA {'//'} TRADING INTELLIGENCE <span>MARKET · ANALYSIS · TRADE PLANS</span></footer>
    {loading && <div className="auth-loading" role="status" aria-live="polite">
      <div><Loader2 size={28} className="mx-auto animate-spin text-neon" />
        <h2>TRENOVA {'//'} TERMINAL</h2>
        {mode === 'login' && <p className="auth-encouragement">
          {t('auth_login_loading_prefix')}{' '}
          <strong>{language === 'id' ? '$1.000.000' : '$1,000,000'}</strong>{' '}
          {t('auth_login_loading_suffix')}
        </p>}
        <p>{t('authenticating')}</p>
      </div>
    </div>}
  </div>;
}
