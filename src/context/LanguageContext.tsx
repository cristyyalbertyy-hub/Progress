import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  detectLanguage,
  saveLanguage,
  tChapter,
  tGroup,
  tSubject,
  tSubchapter,
  translations,
  type Language,
  type Translations,
} from '../i18n';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  tr: Translations;
  tGroup: (id: string) => string;
  tSubject: (id: string) => string;
  tChapter: (id: string) => string;
  tSubchapter: (id: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectLanguage);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    saveLanguage(next);
    document.documentElement.lang = next;
  }, []);

  const tr = translations[lang];

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      tr,
      tGroup: (id) => tGroup(tr, id),
      tSubject: (id) => tSubject(tr, id),
      tChapter: (id) => tChapter(tr, id),
      tSubchapter: (id) => tSubchapter(tr, id),
    }),
    [lang, setLang, tr],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
