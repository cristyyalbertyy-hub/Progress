import { useLanguage } from '../context/LanguageContext';
import { PROGRESS_COLORS, type ProgressLevel } from '../data/course';

interface ProgressSquareProps {
  level: ProgressLevel;
  onClick: () => void;
}

export function ProgressSquare({ level, onClick }: ProgressSquareProps) {
  const { tr } = useLanguage();
  const label = tr.progress[level];

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
