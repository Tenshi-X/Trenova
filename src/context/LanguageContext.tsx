'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { translations, TranslationKey } from '@/lib/translations';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = 'trenova-lang';
const LANGUAGE_CHANGE_EVENT = 'trenova-language-change';

function readStoredLanguage(): Language {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return saved === 'en' || saved === 'id' ? saved : 'id';
}

function subscribeToLanguage(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, callback);
  };
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // getServerSnapshot keeps the first client render identical to the server;
  // the stored preference is applied immediately after hydration.
  const language = useSyncExternalStore<Language>(
    subscribeToLanguage,
    readStoredLanguage,
    () => 'id',
  );
  // The provider must remain mounted from the first render so descendants can
  // safely call useLanguage().
  useEffect(() => {
    document.documentElement.lang = language === 'id' ? 'id' : 'en';
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  };

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] ?? translations['en'][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
