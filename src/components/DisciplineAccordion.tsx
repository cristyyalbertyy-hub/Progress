import { useLanguage } from '../context/LanguageContext';
import {
  calcProgress,
  getAllItemIds,
  type DisciplineGroup,
  type SubDiscipline,
} from '../data/course';
import type { ProgressLevel } from '../data/course';
import { isSyncedPackage } from '../data/packageProgress';

interface DisciplineAccordionProps {
  groups: DisciplineGroup[];
  activeSubDisciplineId: string | null;
  expandedGroupIds: Set<string>;
  localProgress: Record<string, ProgressLevel>;
  summaryForSub: (sub: SubDiscipline) => { consolidated: number; itemCount: number };
  entitledPackageIds: string[];
  signedIn: boolean;
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
  localProgress,
  summaryForSub,
  entitledPackageIds,
  signedIn,
  panelOpen,
  hasContent,
  onToggleGroup,
  onSelectSubDiscipline,
  onTogglePanel,
}: DisciplineAccordionProps) {
  const { tr } = useLanguage();

  const panelButtonLabel = panelOpen ? tr.ui.closePanel : tr.ui.viewProgress;

  const sidebarHint = !panelOpen
    ? !activeSubDisciplineId || hasContent
      ? tr.ui.selectDisciplineHint
      : tr.ui.placeholder
    : null;

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      subDisciplines: group.subDisciplines.filter((sub) => {
        if (!sub.packageId || !isSyncedPackage(sub.packageId)) return true;
        if (!signedIn) return true;
        return entitledPackageIds.includes(sub.packageId);
      }),
    }))
    .filter((group) => group.subDisciplines.length > 0);

  return (
    <aside className="discipline-accordion">
      <header className="accordion-header">
        <h2 className="accordion-heading">{tr.ui.disciplines}</h2>
      </header>

      <nav className="accordion-nav">
        {visibleGroups.map((group) => (
          <AccordionGroup
            key={group.id}
            group={group}
            isExpanded={expandedGroupIds.has(group.id)}
            activeSubDisciplineId={activeSubDisciplineId}
            localProgress={localProgress}
            summaryForSub={summaryForSub}
            entitledPackageIds={entitledPackageIds}
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
  isExpanded,
  activeSubDisciplineId,
  localProgress,
  summaryForSub,
  entitledPackageIds,
  onToggle,
  onSelectSubDiscipline,
}: {
  group: DisciplineGroup;
  isExpanded: boolean;
  activeSubDisciplineId: string | null;
  localProgress: Record<string, ProgressLevel>;
  summaryForSub: (sub: SubDiscipline) => { consolidated: number; itemCount: number };
  entitledPackageIds: string[];
  onToggle: () => void;
  onSelectSubDiscipline: (id: string) => void;
}) {
  const { tGroup } = useLanguage();

  return (
    <div className={`accordion-group ${isExpanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="accordion-group-btn"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className="accordion-chevron">{isExpanded ? '▾' : '▸'}</span>
        <span className="accordion-group-title">{tGroup(group.id)}</span>
      </button>

      {isExpanded && (
        <div className="accordion-subdisciplines">
          {group.subDisciplines.map((sub) => (
            <SubDisciplineBtn
              key={sub.id}
              sub={sub}
              isActive={sub.id === activeSubDisciplineId}
              localProgress={localProgress}
              summaryForSub={summaryForSub}
              entitledPackageIds={entitledPackageIds}
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
  localProgress,
  summaryForSub,
  entitledPackageIds,
  onSelect,
}: {
  sub: SubDiscipline;
  isActive: boolean;
  localProgress: Record<string, ProgressLevel>;
  summaryForSub: (sub: SubDiscipline) => { consolidated: number; itemCount: number };
  entitledPackageIds: string[];
  onSelect: () => void;
}) {
  const { tSubject, tr } = useLanguage();
  const itemIds = getAllItemIds(sub);
  const synced = Boolean(sub.packageId && isSyncedPackage(sub.packageId));
  const entitled = synced && sub.packageId ? entitledPackageIds.includes(sub.packageId) : false;

  let consolidated = 0;
  let itemCount = itemIds.length;

  if (synced && entitled) {
    const remote = summaryForSub(sub);
    consolidated = remote.consolidated;
    itemCount = remote.itemCount;
  } else if (!synced) {
    ({ consolidated } = calcProgress(itemIds, localProgress));
  }

  return (
    <button
      type="button"
      className={`subdiscipline-btn ${isActive ? 'active' : ''} ${!sub.available ? 'unavailable' : ''}`}
      onClick={onSelect}
    >
      <span className="subdiscipline-label">{tSubject(sub.id)}</span>
      {sub.available ? (
        <span className="subdiscipline-progress">
          {synced && !entitled ? '—' : `${consolidated}/${itemCount}`}
        </span>
      ) : (
        <span className="coming-soon">{tr.ui.comingSoon}</span>
      )}
    </button>
  );
}
