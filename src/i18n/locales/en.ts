import {
  chaptersEn,
  groupsEn,
  subchaptersEn,
  subjectsEn,
} from '../content-en';
import type { Translations } from '../types';

export const en: Translations = {
  ui: {
    appTitle: 'Medical Science year 1',
    disciplines: 'Disciplines',
    viewProgress: 'View progress',
    resetConfirm:
      'Are you sure you want to reset all progress? This action cannot be undone.',
    resetProgressTitle: 'Reset all progress',
    cancel: 'Cancel',
    confirmReset: 'Reset',
    closePanel: 'Close panel',
    backToMenu: '← Back to menu',
    selectDisciplineHint:
      'Select a discipline above, then click «View progress».',
    comingSoon: 'Coming soon',
    openPackage: 'Open package →',
    completedIn: 'completed in',
    onboardingTitle: 'How progress works',
    onboardingText:
      'Track your progress in each subchapter of the interactive packages. Click the square to advance through the learning stages.',
    placeholder:
      'Select a discipline with available content or wait for subchapters to be added.',
    chapters: 'chapters',
    chapter: 'chapter',
    subchapters: 'subchapters',
    subchapter: 'subchapter',
    progressClick: 'click to advance',
    language: 'Language',
  },
  progress: {
    0: 'Not started',
    1: 'Familiarisation',
    2: 'Comprehension',
    3: 'Consolidation',
  },
  groups: { ...groupsEn },
  subjects: { ...subjectsEn },
  chapters: { ...chaptersEn },
  subchapters: { ...subchaptersEn },
};
