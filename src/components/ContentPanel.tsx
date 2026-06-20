import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { SubDiscipline } from '../data/course';
import type { ProgressLevel } from '../data/course';
import { ProgressHeader } from './ProgressHeader';
import { OnboardingBanner } from './OnboardingBanner';
import { ResetModal } from './ResetModal';
import { SubChapterGrid } from './SubChapterGrid';

interface ContentPanelProps {
  open: boolean;
  subDiscipline: SubDiscipline;
  progress: Record<string, ProgressLevel>;
  getLevel: (itemId: string) => ProgressLevel;
  onCycleItem: (itemId: string) => void;
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
  getLevel,
  onCycleItem,
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
          <ProgressHeader subDiscipline={subDiscipline} progress={progress} />
          <OnboardingBanner compact />
          <SubChapterGrid
            subDiscipline={subDiscipline}
            getLevel={getLevel}
            onCycleItem={onCycleItem}
          />
          <footer className="content-panel-footer">
            <button
              type="button"
              className="panel-reset-btn"
              onClick={onOpenResetModal}
            >
              {tr.ui.resetProgressTitle}
            </button>
          </footer>
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
