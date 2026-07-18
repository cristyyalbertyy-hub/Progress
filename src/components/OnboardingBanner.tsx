import { useLanguage } from '../context/LanguageContext';
import { PROGRESS_COLORS } from '../data/course';
import { isSyncedPackage, packageIdForSub } from '../data/packageProgress';
import type { SubDiscipline } from '../data/course';

interface OnboardingBannerProps {
  compact?: boolean;
  subDiscipline?: SubDiscipline;
}

export function OnboardingBanner({ compact = false, subDiscipline }: OnboardingBannerProps) {
  const { tr } = useLanguage();
  const levels = [0, 1, 2, 3] as const;
  const synced = Boolean(
    subDiscipline && isSyncedPackage(packageIdForSub(subDiscipline)),
  );

  return (
    <section className={`onboarding ${compact ? 'onboarding--compact' : ''}`}>
      <h2>{tr.ui.onboardingTitle}</h2>
      {synced ? (
        <>
          <p>{tr.ui.onboardingSyncedIntro}</p>
          <ul className="onboarding-rules">
            <li>{tr.ui.onboardingAutoRule}</li>
            <li>{tr.ui.onboardingManualRule}</li>
          </ul>
        </>
      ) : (
        <p>{tr.ui.onboardingText}</p>
      )}
      <div className="onboarding-legend">
        {levels.map((level) => (
          <div key={level} className="legend-item">
            <span
              className="legend-square"
              style={{ backgroundColor: PROGRESS_COLORS[level] }}
            />
            <span>{tr.progress[level]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
