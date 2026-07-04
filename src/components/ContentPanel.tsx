import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { SubDiscipline } from '../data/course';
import type { ProgressLevel } from '../data/course';
import type { ResourceType } from '../data/packageProgress';
import { ProgressHeader } from './ProgressHeader';
import { OnboardingBanner } from './OnboardingBanner';
import { ResetModal } from './ResetModal';
import { SubChapterGrid } from './SubChapterGrid';

interface ContentPanelProps {
  open: boolean;
  subDiscipline: SubDiscipline;
  progress: Record<string, ProgressLevel>;
  synced: boolean;
  loadingRemote: boolean;
  canEditRemote: boolean;
  saveError?: string | null;
  getLegacyLevel: (itemId: string) => ProgressLevel;
  getResourceLevel: (itemId: string, resource: ResourceType) => ProgressLevel;
  onCycleLegacyItem: (itemId: string) => void;
  onCycleManualResource: (itemId: string, resource: 'I' | 'Q') => void;
  onClose: () => void;
  onReset: () => void;
  resetModalOpen: boolean;
  onOpenResetModal: () => void;
  onCloseResetModal: () => void;
}

export function ContentPanel({
  open,
  subDiscipline,
  progress,
  synced,
  loadingRemote,
  canEditRemote,
  saveError,
  getLegacyLevel,
  getResourceLevel,
  onCycleLegacyItem,
  onCycleManualResource,
  onClose,
  onReset,
  resetModalOpen,
  onOpenResetModal,
  onCloseResetModal,
}: ContentPanelProps) {
  const { tr } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !resetModalOpen) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose, resetModalOpen]);

  if (!open) return null;

  return (
    <>
      <div
        className="content-panel-backdrop"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      <aside
        className="content-panel"
        role="dialog"
        aria-modal="true"
        aria-label={tr.ui.viewProgress}
      >
        <div className="content-panel-inner">
          <header className="content-panel-toolbar">
            <button
              type="button"
              className="panel-close-btn"
              onClick={onClose}
            >
              {tr.ui.backToMenu}
            </button>
          </header>
          {synced && loadingRemote && (
            <p className="sync-status">{tr.ui.loadingProgress}</p>
          )}
          {synced && !loadingRemote && !canEditRemote && (
            <p className="sync-status sync-status--warn">{tr.ui.noEntitlement}</p>
          )}
          {synced && saveError && (
            <p className="sync-status sync-status--warn">{tr.ui.saveProgressError}</p>
          )}
          <ProgressHeader subDiscipline={subDiscipline} progress={progress} synced={synced} />
          <OnboardingBanner compact subDiscipline={subDiscipline} />
          <SubChapterGrid
            subDiscipline={subDiscipline}
            synced={synced}
            canEditManual={canEditRemote}
            getLegacyLevel={getLegacyLevel}
            getResourceLevel={getResourceLevel}
            onCycleLegacyItem={onCycleLegacyItem}
            onCycleManualResource={onCycleManualResource}
          />
          {!synced && (
            <footer className="content-panel-footer">
              <button
                type="button"
                className="panel-reset-btn"
                onClick={onOpenResetModal}
              >
                {tr.ui.resetProgressTitle}
              </button>
            </footer>
          )}
        </div>
      </aside>
      <ResetModal
        open={resetModalOpen}
        onClose={onCloseResetModal}
        onConfirm={onReset}
      />
    </>
  );
}
