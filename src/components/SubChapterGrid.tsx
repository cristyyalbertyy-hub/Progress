import { useLanguage } from '../context/LanguageContext';
import {
  countSubDisciplineItems,
  type SubDiscipline,
} from '../data/course';
import type { ProgressLevel } from '../data/course';
import { ProgressSquare } from './ProgressSquare';

interface SubChapterGridProps {
  subDiscipline: SubDiscipline;
  getLevel: (itemId: string) => ProgressLevel;
  onCycleItem: (itemId: string) => void;
}

export function SubChapterGrid({
  subDiscipline,
  getLevel,
  onCycleItem,
}: SubChapterGridProps) {
  const { tChapter, tSubchapter, tSubject, tr } = useLanguage();
  const subChapterCount = countSubDisciplineItems(subDiscipline);
  const chapterCount = subDiscipline.chapters.length;

  return (
    <div className="subchapter-panel">
      <header className="subchapter-panel-header">
        <div className="subchapter-panel-title-row">
          <h2 className="subchapter-panel-title">{tSubject(subDiscipline.id)}</h2>
          {subDiscipline.packageUrl && (
            <a
              className="package-link"
              href={subDiscipline.packageUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {tr.ui.openPackage}
            </a>
          )}
        </div>
        <p className="subchapter-panel-meta">
          {chapterCount}{' '}
          {chapterCount === 1 ? tr.ui.chapter : tr.ui.chapters} ·{' '}
          {subChapterCount}{' '}
          {subChapterCount === 1 ? tr.ui.subchapter : tr.ui.subchapters}
        </p>
      </header>

      <div className="subchapter-table">
        {subDiscipline.chapters.map((ch) => (
          <section key={ch.id} className="subchapter-row">
            <div className="subchapter-row-header">
              <h3>{tChapter(ch.id)}</h3>
            </div>
            <div className="subchapter-grid">
              {ch.items.map((item) => (
                <div key={item.id} className="subchapter-tile">
                  <span className="subchapter-tile-label">
                    {tSubchapter(item.id)}
                  </span>
                  <ProgressSquare
                    level={getLevel(item.id)}
                    onClick={() => onCycleItem(item.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
