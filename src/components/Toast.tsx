import { useEffect } from 'react';
import { TOAST_DURATION } from '../config/boards';

export interface ToastData {
  id: number;
  message: string;
  onUndo?: () => void;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, TOAST_DURATION);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.id}>
          <span>{toast.message}</span>
          {toast.onUndo && (
            <>
              <span className="toast__sep" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                className="toast__undo"
                onClick={() => {
                  toast.onUndo?.();
                  onDismiss();
                }}
              >
                rückgängig
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
