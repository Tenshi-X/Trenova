'use client';

import { Clock, AlertTriangle, Zap } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { TerminalThemeProvider } from '@/components/ThemeProvider';
import MobileDashboardSidebar from './MobileDashboardSidebar';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardChrome({ children, daysLeft, isExpired, tokenRemaining, tokenLimit,
  showTokenBadge, showSubBadge }: {
  children: React.ReactNode;
  daysLeft: number;
  isExpired: boolean;
  tokenUsed: number;
  tokenLimit: number;
  tokenRemaining: number;
  showTokenBadge: boolean;
  showSubBadge: boolean;
}) {
  const { language, t } = useLanguage();
  return <TerminalThemeProvider>
    <div className="terminal-dashboard dark">
      <header className="terminal-topbar">
        <div className="terminal-brand">
          <span>TRENOVA <span className="terminal-brand-divider">{'//'}</span> TERMINAL</span>
          <span className="terminal-eyebrow">CRYPTO INTELLIGENCE</span>
        </div>
        <div className="terminal-account">
          {showTokenBadge && <div className="terminal-badge" title={`${tokenRemaining} / ${tokenLimit} ${t('dash_token_runs')}`}>
            <Zap size={13} aria-hidden="true" />
            <span>{language === 'id' ? 'SISA TOKEN' : 'CREDITS LEFT'} <strong>{tokenRemaining}</strong></span>
          </div>}
          {showSubBadge && <div className={'terminal-badge terminal-subscription ' + (isExpired ? 'terminal-expired' : '')}>
            {isExpired ? <AlertTriangle size={13} /> : <Clock size={13} />}
            <span>{isExpired ? t('dash_expired') : `${daysLeft} ${t('dash_days_left')}`}</span>
          </div>}
          <LanguageSwitcher />
        </div>
      </header>
      <MobileDashboardSidebar />
      <main className="terminal-main">{children}</main>
      <footer className="terminal-footer">{'TRENOVA // TRADING INTELLIGENCE'} <span>{language === 'id' ? 'Data pasar · Analisis · Rencana transaksi' : 'Market data · Analysis · Trade plans'}</span></footer>
    </div>
  </TerminalThemeProvider>;
}
