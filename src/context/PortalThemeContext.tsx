import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Language, Theme } from '../types/portalTypes';
import { t as translations, type TKey } from '../lib/translations';

interface PortalThemeContextType {
  lang: Language;
  theme: Theme;
  setLang: (l: Language) => void;
  setTheme: (t: Theme) => void;
  toggleLang: () => void;
  toggleTheme: () => void;
  tr: (key: TKey) => string;
  isRtl: boolean;
}

const PortalThemeContext = createContext<PortalThemeContextType | null>(null);

export function PortalThemeProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() =>
    (localStorage.getItem('alx_portal_lang') as Language) || 'ar'
  );
  const [theme, setThemeState] = useState<Theme>(() =>
    (localStorage.getItem('alx_portal_theme') as Theme) || 'dark'
  );

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('alx_portal_lang', l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('alx_portal_theme', t);
    if (t === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  };

  const toggleLang = () => setLang(lang === 'ar' ? 'en' : 'ar');
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const tr = (key: TKey): string => translations[key]?.[lang] || String(key);

  // Apply on mount
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (theme === 'light') document.documentElement.classList.add('light-mode');
    else document.documentElement.classList.remove('light-mode');
  }, []);

  return (
    <PortalThemeContext.Provider value={{
      lang, theme, setLang, setTheme, toggleLang, toggleTheme,
      tr, isRtl: lang === 'ar'
    }}>
      {children}
    </PortalThemeContext.Provider>
  );
}

export function usePortalTheme(): PortalThemeContextType {
  const ctx = useContext(PortalThemeContext);
  if (!ctx) throw new Error('usePortalTheme must be used within PortalThemeProvider');
  return ctx;
}
