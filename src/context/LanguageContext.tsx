import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language } from '@/data/locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('th'); // Default to Thai

  // Sync HTML lang attribute with current language
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (path: string, params: Record<string, string> = {}): string => {
    const keys = path.split('.');
    let value: unknown = translations[language];
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return path; // Fallback to key if not found
      }
    }

    // Perform interpolation
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      let result = value;
      Object.keys(params).forEach(key => {
        result = result.replace(`{${key}}`, params[key]);
      });
      return result;
    }

    return typeof value === 'string' ? value : path;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'th' ? 'en' : 'th'));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
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
