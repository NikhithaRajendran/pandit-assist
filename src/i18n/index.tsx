import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Language, LanguageOption, TranslationMap } from './types';
export type { Language, LanguageOption, TranslationMap };
import en from './en';
import ta from './ta';
import hi from './hi';
import { loadLanguage, saveLanguage } from '../utils/storage';
import { seedNameTranslations } from './seedNames';

export const LANGUAGES: LanguageOption[] = [
  { code: 'ta', nativeName: 'தமிழ்' },
  { code: 'hi', nativeName: 'हिन्दी' },
  { code: 'en', nativeName: 'English' },
];

const translations: Record<Language, TranslationMap> = { en, ta, hi };

export function getLanguageLabel(code: Language): string {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? lang.nativeName : 'English';
}

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
  tn: (name: string) => string;
  getName: (item: { nameEn: string; nameTa?: string; nameHi?: string }) => string;
  initialLoading: boolean;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [initialLoading, setInitialLoading] = useState(true);
  const mounted = useRef(false);

  useEffect(() => {
    (async () => {
      const saved = await loadLanguage();
      if (saved) {
        setLanguageState(saved);
      }
      setInitialLoading(false);
      mounted.current = true;
    })();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    await saveLanguage(lang);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      const map = translations[language];
      let value = map[key];
      if (value === undefined) {
        const fallback = translations.en[key];
        value = fallback ?? key;
      }
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(`{${k}}`, v);
        }
      }
      return value;
    },
    [language],
  );

  const tn = useCallback(
    (name: string): string => {
      const entry = seedNameTranslations[name];
      if (entry) {
        if (language === 'ta' || language === 'hi') return entry[language];
      }
      return name;
    },
    [language],
  );

  const getName = useCallback(
    (item: { nameEn: string; nameTa?: string; nameHi?: string }): string => {
      if (language === 'ta' && item.nameTa) return item.nameTa;
      if (language === 'hi' && item.nameHi) return item.nameHi;
      return item.nameEn;
    },
    [language],
  );

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, tn, getName, initialLoading }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
