import { useLanguage } from '../context/LanguageContext';
import { calcProgress, getAllItemIds, type SubDiscipline } from '../data/course';
import type { ProgressLevel } from '../data/course';

interface ProgressHeaderProps {
  subDiscipline: SubDiscipline;
  progress: Record<string, ProgressLevel>;
}

export function ProgressHeader({ subDiscipline, progress }: ProgressHeaderProps) {
  const { tSubject, tr } = useLanguage();
  const itemIds = getAllItemIds(subDiscipline);
  const { percent } = calcProgress(itemIds, progress);

  return (
    <header className="progress-header">
      <div className="progress-percent">
        <span className="percent-value">{percent}%</span>
        <span className="percent-label">
          {tr.ui.completedIn} {tSubject(subDiscipline.id)}
        </span>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </header>
  );
}
