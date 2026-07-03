import { useLanguage } from '../context/LanguageContext';
import { PROGRESS_COLORS, type ProgressLevel } from '../data/course';

interface ProgressSquareProps {
  level: ProgressLevel;
  onClick?: () => void;
  readOnly?: boolean;
  title?: string;
}

export function ProgressSquare({
  level,
  onClick,
  readOnly = false,
  title,
}: ProgressSquareProps) {
  const { tr } = useLanguage();
  const label = title ?? tr.progress[level];

  if (readOnly) {
    return (
      <span
        className="progress-square progress-square--readonly"
        style={{ backgroundColor: PROGRESS_COLORS[level] }}
        title={label}
        aria-label={label}
      />
    );
  }

  return (
    <button
      type="button"
      className="progress-square"
      style={{ backgroundColor: PROGRESS_COLORS[level] }}
      onClick={onClick}
      title={label}
      aria-label={`${label} — ${tr.ui.progressClick}`}
    />
  );
}
