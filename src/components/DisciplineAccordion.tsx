import { useLanguage } from '../context/LanguageContext';
import {
  calcProgress,
  getAllItemIds,
  type DisciplineGroup,
  type SubDiscipline,
} from '../data/course';
import type { ProgressLevel } from '../data/course';

interface DisciplineAccordionProps {
  groups: DisciplineGroup[];
  activeSubDisciplineId: string;
  expandedGroupIds: Set<string>;
  progress: Record<string, ProgressLevel>;
  panelOpen: boolean;
  hasContent: boolean;
  onToggleGroup: (groupId: string) => void;
  onSelectSubDiscipline: (subDisciplineId: string) => void;
  onTogglePanel: () => void;
}

export function DisciplineAccordion({
  groups,
  activeSubDisciplineId,
  expandedGroupIds,
  progress,
  panelOpen,
  hasContent,
  onToggleGroup,
  onSelectSubDiscipline,
  onTogglePanel,
}: DisciplineAccordionProps) {
  const { tGroup, tr } = useLanguage();

  const panelButtonLabel = panelOpen ? tr.ui.closePanel : tr.ui.viewProgress;

  const sidebarHint = !panelOpen
    ? hasContent
      ? tr.ui.selectDisciplineHint
      : tr.ui.placeholder
    : null;

  return (
    <aside className="discipline-accordion">
      <header className="accordion-header">
        <h2 className="accordion-heading">{tr.ui.disciplines}</h2>
      </header>

      <nav className="accordion-nav">
        {groups.map((group) => (
          <AccordionGroup
            key={group.id}
            group={group}
            groupTitle={tGroup(group.id)}
            isExpanded={expandedGroupIds.has(group.id)}
            activeSubDisciplineId={activeSubDisciplineId}
            progress={progress}
            onToggle={() => onToggleGroup(group.id)}
            onSelectSubDiscipline={onSelectSubDiscipline}
          />
        ))}
      </nav>

      <footer className="sidebar-footer">
        {sidebarHint && <p className="sidebar-hint">{sidebarHint}</p>}
        <button
          type="button"
          className={`panel-toggle-btn ${panelOpen ? 'is-open' : ''}`}
          onClick={onTogglePanel}
          disabled={!hasContent && !panelOpen}
          aria-expanded={panelOpen}
        >
          {panelButtonLabel}
        </button>
      </footer>
    </aside>
  );
}

function AccordionGroup({
  group,
  groupTitle,
  isExpanded,
  activeSubDisciplineId,
  progress,
  onToggle,
  onSelectSubDiscipline,
}: {
  group: DisciplineGroup;
  groupTitle: string;
  isExpanded: boolean;
  activeSubDisciplineId: string;
  progress: Record<string, ProgressLevel>;
  onToggle: () => void;
  onSelectSubDiscipline: (id: string) => void;
}) {
  return (
    <div className={`accordion-group ${isExpanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="accordion-group-btn"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className="accordion-chevron">{isExpanded ? '▾' : '▸'}</span>
        <span className="accordion-group-title">{groupTitle}</span>
      </button>

      {isExpanded && (
        <div className="accordion-subdisciplines">
          {group.subDisciplines.map((sub) => (
            <SubDisciplineBtn
              key={sub.id}
              sub={sub}
              isActive={sub.id === activeSubDisciplineId}
              progress={progress}
              onSelect={() => onSelectSubDiscipline(sub.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubDisciplineBtn({
  sub,
  isActive,
  progress,
  onSelect,
}: {
  sub: SubDiscipline;
  isActive: boolean;
  progress: Record<string, ProgressLevel>;
  onSelect: () => void;
}) {
  const { tSubject, tr } = useLanguage();
  const itemIds = getAllItemIds(sub);
  const { consolidated, itemCount } = calcProgress(itemIds, progress);

  return (
    <button
      type="button"
      className={`subdiscipline-btn ${isActive ? 'active' : ''} ${!sub.available ? 'unavailable' : ''}`}
      onClick={onSelect}
    >
      <span className="subdiscipline-label">{tSubject(sub.id)}</span>
      {sub.available ? (
        <span className="subdiscipline-progress">
          {consolidated}/{itemCount}
        </span>
      ) : (
        <span className="coming-soon">{tr.ui.comingSoon}</span>
      )}
    </button>
  );
}
