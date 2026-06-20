import { useLanguage } from '../context/LanguageContext';
import { PROGRESS_COLORS } from '../data/course';

interface OnboardingBannerProps {
  compact?: boolean;
}

export function OnboardingBanner({ compact = false }: OnboardingBannerProps) {
  const { tr } = useLanguage();
  const levels = [0, 1, 2, 3] as const;

  return (
    <section className={`onboarding ${compact ? 'onboarding--compact' : ''}`}>
      <h2>{tr.ui.onboardingTitle}</h2>
      <p>{tr.ui.onboardingText}</p>
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
