import { useLanguage } from '../context/LanguageContext';
import {
  countSubDisciplineItems,
  type SubDiscipline,
} from '../data/course';
import type { ProgressLevel } from '../data/course';
import {
  AUTO_RESOURCES,
  RESOURCE_TYPES,
  type ResourceType,
} from '../data/packageProgress';
import { ProgressSquare } from './ProgressSquare';

interface SubChapterGridProps {
  subDiscipline: SubDiscipline;
  synced: boolean;
  canEditManual?: boolean;
  getLegacyLevel: (itemId: string) => ProgressLevel;
  getResourceLevel: (itemId: string, resource: ResourceType) => ProgressLevel;
  onCycleLegacyItem: (itemId: string) => void;
  onCycleManualResource: (itemId: string, resource: 'I' | 'Q') => void;
}

export function SubChapterGrid({
  subDiscipline,
  synced,
  canEditManual = true,
  getLegacyLevel,
  getResourceLevel,
  onCycleLegacyItem,
  onCycleManualResource,
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

      {synced && (
        <div className="resource-legend-row" aria-hidden="true">
          {RESOURCE_TYPES.map((resource) => (
            <span key={resource} className="resource-legend-label">
              {tr.resources[resource]}
            </span>
          ))}
        </div>
      )}

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
                  {synced ? (
                    <div className="resource-progress-row">
                      {RESOURCE_TYPES.map((resource) => {
                        const level = getResourceLevel(item.id, resource);
                        const auto = AUTO_RESOURCES.includes(resource);
                        return (
                          <ProgressSquare
                            key={resource}
                            level={level}
                            readOnly={auto || !canEditManual}
                            title={`${tr.resources[resource]}: ${tr.progress[level]}`}
                            onClick={
                              auto || !canEditManual
                                ? undefined
                                : () =>
                                    onCycleManualResource(
                                      item.id,
                                      resource as 'I' | 'Q',
                                    )
                            }
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <ProgressSquare
                      level={getLegacyLevel(item.id)}
                      onClick={() => onCycleLegacyItem(item.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {synced && (
        <p className="manual-responsibility-note">{tr.ui.manualResponsibilityNote}</p>
      )}
    </div>
  );
}
