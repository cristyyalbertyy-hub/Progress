import { useState } from 'react';
import { ContentPanel } from './components/ContentPanel';
import { DisciplineAccordion } from './components/DisciplineAccordion';
import { LanguageSelector } from './components/LanguageSelector';
import { useLanguage } from './context/LanguageContext';
import {
  disciplineGroups,
  findGroupForSubDiscipline,
  findSubDiscipline,
} from './data/course';
import { useProgress } from './hooks/useProgress';
import './App.css';

function AppContent() {
  const { tr } = useLanguage();
  const { progress, cycleItem, resetAll, getLevel } = useProgress();
  const [activeSubDisciplineId, setActiveSubDisciplineId] = useState<string | null>(
    null,
  );
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const activeSubDiscipline = activeSubDisciplineId
    ? findSubDiscipline(activeSubDisciplineId)
    : undefined;

  const hasContent = Boolean(
    activeSubDiscipline?.available && activeSubDiscipline.chapters.length > 0,
  );

  const handleSelectSubDiscipline = (subId: string) => {
    const sub = findSubDiscipline(subId);
    if (!sub) return;

    const group = findGroupForSubDiscipline(subId);
    if (group) {
      setExpandedGroupIds((prev) => new Set(prev).add(group.id));
    }

    setActiveSubDisciplineId(subId);
    setPanelOpen(sub.available && sub.chapters.length > 0);
  };

  const handleToggleGroup = (groupId: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleTogglePanel = () => {
    if (panelOpen) {
      setPanelOpen(false);
      return;
    }
    if (hasContent) {
      setPanelOpen(true);
    }
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <h1 className="app-title">{tr.ui.appTitle}</h1>
        <LanguageSelector />
      </header>

      <div className="app">
        <DisciplineAccordion
          groups={disciplineGroups}
          activeSubDisciplineId={activeSubDisciplineId}
          expandedGroupIds={expandedGroupIds}
          progress={progress}
          panelOpen={panelOpen}
          hasContent={hasContent}
          onToggleGroup={handleToggleGroup}
          onSelectSubDiscipline={handleSelectSubDiscipline}
          onTogglePanel={handleTogglePanel}
        />

      </div>

      {hasContent && activeSubDiscipline && (
        <ContentPanel
          open={panelOpen}
          subDiscipline={activeSubDiscipline}
          progress={progress}
          getLevel={getLevel}
          onCycleItem={cycleItem}
          onClose={() => setPanelOpen(false)}
          onReset={resetAll}
          resetModalOpen={resetModalOpen}
          onOpenResetModal={() => setResetModalOpen(true)}
          onCloseResetModal={() => setResetModalOpen(false)}
        />
      )}
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
