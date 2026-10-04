'use client';

import { Clock, AlertTriangle, Zap } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MobileDashboardSidebar from './MobileDashboardSidebar';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardChrome({
  children,
  daysLeft,
  isExpired,
  tokenUsed,
  tokenLimit,
  tokenRemaining,
  showTokenBadge,
  showSubBadge,
}: {
  children: React.ReactNode;
  daysLeft: number;
  isExpired: boolean;
  tokenUsed: number;
  tokenLimit: number;
  tokenRemaining: number;
  showTokenBadge: boolean;
  showSubBadge: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-300 ml-0 md:ml-20">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-lg text-foreground pl-12 md:pl-0">
            <img src="/app-logo.png" alt="Trenova Logo" className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-100 dark:border-slate-800 md:hidden" />
            <span className="hidden md:inline">{t('dash_nav_title')}</span>
            <span className="md:hidden text-sm">Trenova</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            {showTokenBadge && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold border bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm">
                <Zap size={13} className="fill-blue-700 dark:fill-blue-400" />
                <span>{tokenRemaining} / {tokenLimit} {t('dash_token_runs')}</span>
              </div>
            )}
            {showSubBadge && (
              <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                !isExpired
                  ? daysLeft > 7
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 shadow-sm"
                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
              }`}>
                {!isExpired ? (
                  <>
                    <Clock size={13} className={daysLeft > 7 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"} />
                    <span>{daysLeft} {t('dash_days_left')}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={13} />
                    <span>{t('dash_expired')}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
      <MobileDashboardSidebar daysLeft={daysLeft} isExpired={isExpired} tokenUsed={tokenUsed} tokenLimit={tokenLimit} />
      <main className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
