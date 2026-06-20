import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { it } from './locales/it';
import { pt } from './locales/pt';
import type { Language, Translations } from './types';

export { LANGUAGES } from './types';
export type { Language, Translations };

const STORAGE_KEY = 'medical-science-y1-lang';

export const translations: Record<Language, Translations> = {
  en,
  fr,
  it,
  es,
  pt,
};

export function isLanguage(value: string): value is Language {
  return value in translations;
}

export function detectLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isLanguage(stored)) return stored;
  } catch {
    /* ignore */
  }

  const browser = navigator.language.slice(0, 2).toLowerCase();
  if (isLanguage(browser)) return browser;
  return 'en';
}

export function saveLanguage(lang: Language): void {
  localStorage.setItem(STORAGE_KEY, lang);
}

export function tGroup(tr: Translations, id: string): string {
  return tr.groups[id] ?? id;
}

export function tSubject(tr: Translations, id: string): string {
  return tr.subjects[id] ?? id;
}

export function tChapter(tr: Translations, id: string): string {
  return tr.chapters[id] ?? id;
}

export function tSubchapter(tr: Translations, id: string): string {
  return tr.subchapters[id] ?? id;
}
