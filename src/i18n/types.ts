export type Language = 'en' | 'fr' | 'it' | 'es' | 'pt';

export interface Translations {
  ui: {
    appTitle: string;
    disciplines: string;
    viewProgress: string;
    resetConfirm: string;
    resetProgressTitle: string;
    cancel: string;
    confirmReset: string;
    closePanel: string;
    backToMenu: string;
    selectDisciplineHint: string;
    comingSoon: string;
    openPackage: string;
    completedIn: string;
    onboardingTitle: string;
    onboardingText: string;
    placeholder: string;
    chapters: string;
    chapter: string;
    subchapters: string;
    subchapter: string;
    progressClick: string;
    language: string;
  };
  progress: {
    0: string;
    1: string;
    2: string;
    3: string;
  };
  groups: Record<string, string>;
  subjects: Record<string, string>;
  chapters: Record<string, string>;
  subchapters: Record<string, string>;
}

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'En' },
  { code: 'es', label: 'Es' },
  { code: 'fr', label: 'Fr' },
  { code: 'it', label: 'It' },
  { code: 'pt', label: 'Pt' },
];
