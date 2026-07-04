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
    onboardingSyncedIntro:
      'For purchased packages, progress works in two ways — automatic where the app can see your study, manual where only you can judge readiness.',
    onboardingAutoRule:
      'Video and podcast squares update on their own when you finish watching or listening in the package app (up to 3 times: yellow → orange → green).',
    onboardingManualRule:
      'Infographic and questionnaire squares are yours to update: click to mark how well you know the topic. That is your responsibility.',
    manualResponsibilityNote:
      'From the infographic and questionnaire columns onward, progress reflects your honest self-assessment — the app cannot know when you have truly understood.',
    signInPrompt:
      'Sign in with the same email you used to buy a package to see synced progress for videos and podcasts.',
    signInCta: 'Sign in on Studio9 →',
    refreshEntitlements: 'Refresh my packages',
    loadingProgress: 'Loading your progress…',
    noEntitlement:
      'This package is not active on your account. Progress is read-only until you purchase access.',
    saveProgressError:
      'Could not sync this change to the cloud. Your rating is saved on this device — open My account → My progress to refresh your session.',
    noEntitledPackages:
      'No packages are active on your account. Sign in with the email you used to purchase, or open My account on Studio9.',
    placeholder:
      'Select a discipline with available content or wait for subchapters to be added.',
    chapters: 'chapters',
    chapter: 'chapter',
    subchapters: 'subchapters',
    subchapter: 'subchapter',
    progressClick: 'click to advance',
    language: 'Language',
  },
  resources: {
    V: 'Video',
    P: 'Podcast',
    I: 'Infographic',
    Q: 'Questions',
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
