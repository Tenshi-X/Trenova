'use client';

import { useLanguage } from '@/context/LanguageContext';
import clsx from 'clsx';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 p-1 items-center">
            <button
                onClick={() => setLanguage('id')}
                className={clsx(
                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1",
                    language === 'id' ? "bg-neon/10 text-neon" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
            >
                ID
            </button>
            <div className="w-[1px] h-3 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button
                onClick={() => setLanguage('en')}
                className={clsx(
                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1",
                    language === 'en' ? "bg-neon/10 text-neon" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
            >
                EN
            </button>
        </div>
    );
}
