'use client';

import React, { createContext, useContext, useState } from 'react';
import idLocale from '../locales/id.json';
import enLocale from '../locales/en.json';

export type Locale = 'id' | 'en';

type NestedLocaleDict = { [key: string]: string | NestedLocaleDict };

const dictionaries: Record<Locale, NestedLocaleDict> = {
  id: idLocale as NestedLocaleDict,
  en: enLocale as NestedLocaleDict,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: Locale;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  defaultLocale = 'id',
}) => {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let current: string | NestedLocaleDict | undefined = dictionaries[locale];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        current = undefined;
        break;
      }
    }

    if (typeof current !== 'string') {
      return key; // Fallback to key if not found
    }

    let result = current;
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(`{${paramKey}}`, String(paramValue));
      }
    }

    return result;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
