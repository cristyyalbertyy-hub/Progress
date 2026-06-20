import { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface ResetModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetModal({ open, onClose, onConfirm }: ResetModalProps) {
  const { tr } = useLanguage();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    cancelRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="reset-modal-title" className="modal-title">
          {tr.ui.resetProgressTitle}
        </h2>
        <p className="modal-text">{tr.ui.resetConfirm}</p>
        <div className="modal-actions">
          <button
            ref={cancelRef}
            type="button"
            className="modal-btn modal-btn-secondary"
            onClick={onClose}
          >
            {tr.ui.cancel}
          </button>
          <button
            type="button"
            className="modal-btn modal-btn-danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {tr.ui.confirmReset}
          </button>
        </div>
      </div>
    </div>
  );
}
