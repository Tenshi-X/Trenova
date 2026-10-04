'use client';

import { Lock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import LogoutButton from '@/components/LogoutButton';

export default function DashboardBlockedView({ isNewAccount, userIdPrefix }: { isNewAccount: boolean; userIdPrefix: string }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500 animate-in zoom-in duration-300">
          <Lock size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {isNewAccount ? t('dash_block_new_title') : t('dash_block_exp_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            {isNewAccount ? t('dash_block_new_desc') : t('dash_block_exp_desc')}
          </p>
        </div>
        <div className="pt-4 space-y-3">
          <a
            href="https://shopee.co.id/Trading-Signal-Ai-Analisis-Crypto-TRENOVA-INTELLIGENCE-1-BULAN--i.1734650704.48456534787?extraParams=%7B%22display_model_id%22%3A345586316291%2C%22model_selection_logic%22%3A3%7D"
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 bg-neon text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neon-hover transition-all hover:-translate-y-1 shadow-lg shadow-neon/20"
          >
            {t('dash_block_contact')}
          </a>
          <LogoutButton className="block w-full py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold text-sm transition-colors">
            {t('side_back_home')} ({t('nav_signout')})
          </LogoutButton>
        </div>
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400">User ID: {userIdPrefix}...</p>
        </div>
      </div>
    </div>
  );
}
