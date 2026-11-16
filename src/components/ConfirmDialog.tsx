import { useEffect, useId, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus(); // sichere Wahl vorauswählen
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="confirm"
      aria-labelledby={titleId}
      onCancel={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id={titleId} className="confirm__title">
        {title}
      </h2>
      <p className="confirm__text">{message}</p>
      <div className="confirm__actions">
        <button type="button" className="btn btn--primary" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel} ref={cancelRef}>
          abbrechen
        </button>
      </div>
    </dialog>
  );
}
