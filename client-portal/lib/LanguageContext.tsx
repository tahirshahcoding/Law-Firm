'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from './locales/en.json';
import ur from './locales/ur.json';

type Language = 'en' | 'ur';
type Dictionary = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('client-language') as Language;
    if (saved && (saved === 'en' || saved === 'ur')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('client-language', lang);
    if (lang === 'ur') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.lang = 'ur';
      document.documentElement.classList.add('font-urdu');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.lang = 'en';
      document.documentElement.classList.remove('font-urdu');
    }
  };

  // Sync html dir on initial load
  useEffect(() => {
    if (language === 'ur') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.lang = 'ur';
      document.documentElement.classList.add('font-urdu');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.lang = 'en';
      document.documentElement.classList.remove('font-urdu');
    }
  }, [language]);

  const t = language === 'en' ? en : ur;
  const isRtl = language === 'ur';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
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
