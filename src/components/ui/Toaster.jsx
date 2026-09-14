import { useUI } from '../../store/useUI';
import { Modal } from './Modal';
import { Button } from './Button';

const ICONS = { success: 'fa-solid fa-circle-check', warning: 'fa-solid fa-triangle-exclamation', error: 'fa-solid fa-circle-exclamation', info: 'fa-solid fa-circle-info' };

/** Zone de toasts (coin supérieur droit, bas sur mobile). */
export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => dismiss(t.id)}>
          <i className={ICONS[t.type] || ICONS.info} aria-hidden="true" />
          <span>{t.message}</span>
          {t.action && (
            <button type="button" className="toast-action" onClick={(e) => { e.stopPropagation(); t.action.onClick?.(); dismiss(t.id); }}>
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/** Boîte de confirmation globale (pilotée par confirmDialog()). */
export function ConfirmDialog() {
  const confirm = useUI((s) => s.confirm);
  const resolve = useUI((s) => s.resolveConfirm);
  if (!confirm) return null;
  const { title = 'Confirmer', message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = false, icon } = confirm;
  return (
    <Modal open size="sm" onClose={() => resolve(false)} hideClose>
      <div className="modal-hero">
        <div className={`success-mark ${danger ? 'accent' : ''}`}>
          <i className={icon || (danger ? 'fa-solid fa-trash-can' : 'fa-solid fa-circle-question')} />
        </div>
        <h2 style={{ fontSize: 'var(--fs-xl)' }}>{title}</h2>
        {message && <p className="muted small">{message}</p>}
      </div>
      <div className="modal-actions">
        <Button variant="ghost" onClick={() => resolve(false)}>{cancelLabel}</Button>
        <Button variant={danger ? 'accent' : 'primary'} onClick={() => resolve(true)} autoFocus>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
