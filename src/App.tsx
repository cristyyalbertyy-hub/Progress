import { useEffect, useState } from 'react';
import { ContentPanel } from './components/ContentPanel';
import { DisciplineAccordion } from './components/DisciplineAccordion';
import { LanguageSelector } from './components/LanguageSelector';
import { useAuth, initialPackageFromUrl } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import {
  disciplineGroups,
  findGroupForSubDiscipline,
  findSubDiscipline,
} from './data/course';
import { isSyncedPackage } from './data/packageProgress';
import { useHybridProgress } from './hooks/useHybridProgress';
import { useRemoteProgressCache } from './hooks/useRemoteProgressCache';
import { useProgress } from './hooks/useProgress';
import './App.css';

function AuthNotice() {
  const { tr } = useLanguage();
  const { user, ready, configured, accountUrl } = useAuth();

  if (!configured || !ready || user) return null;

  return (
    <aside className="auth-notice">
      <p>{tr.ui.signInPrompt}</p>
      <a className="auth-notice-link" href={accountUrl}>
        {tr.ui.signInCta}
      </a>
    </aside>
  );
}

function AppContent() {
  const { tr } = useLanguage();
  const { entitledPackageIds, user } = useAuth();
  const { progress: localProgress, cycleItem, resetAll, getLevel: getLocalLevel } =
    useProgress();
  const { summaryForSub } = useRemoteProgressCache();

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

  const hybrid = useHybridProgress(activeSubDiscipline);

  useEffect(() => {
    const pkg = initialPackageFromUrl();
    if (!pkg) return;
    const sub = disciplineGroups
      .flatMap((g) => g.subDisciplines)
      .find((s) => s.packageId === pkg || s.id === pkg);
    if (sub?.available) {
      const group = findGroupForSubDiscipline(sub.id);
      if (group) setExpandedGroupIds((prev) => new Set(prev).add(group.id));
      setActiveSubDisciplineId(sub.id);
      if (sub.chapters.length > 0) setPanelOpen(true);
    }
  }, []);

  const hasContent = Boolean(
    activeSubDiscipline?.available && activeSubDiscipline.chapters.length > 0,
  );

  const isActiveSynced = Boolean(
    activeSubDiscipline?.packageId && isSyncedPackage(activeSubDiscipline.packageId),
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

  const handleReset = () => {
    if (isActiveSynced) return;
    resetAll();
  };

  const sidebarProgress = isActiveSynced
    ? hybrid.flatProgressForHeader()
    : localProgress;

  return (
    <div className="app-shell">
      <header className="top-bar">
        <h1 className="app-title">{tr.ui.appTitle}</h1>
        <LanguageSelector />
      </header>

      <AuthNotice />

      <div className="app">
        <DisciplineAccordion
          groups={disciplineGroups}
          activeSubDisciplineId={activeSubDisciplineId}
          expandedGroupIds={expandedGroupIds}
          localProgress={localProgress}
          summaryForSub={summaryForSub}
          entitledPackageIds={entitledPackageIds}
          signedIn={Boolean(user)}
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
          progress={sidebarProgress}
          synced={hybrid.synced}
          loadingRemote={hybrid.loadingRemote}
          canEditRemote={hybrid.canEditRemote}
          getLegacyLevel={getLocalLevel}
          getResourceLevel={hybrid.getResourceLevel}
          onCycleLegacyItem={cycleItem}
          onCycleManualResource={hybrid.cycleManualResource}
          onClose={() => setPanelOpen(false)}
          onReset={handleReset}
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
