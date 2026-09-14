import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modale accessible : portail, fermeture Échap / clic fond, focus initial,
 * verrouillage du scroll du body. Sur mobile, elle devient un « bottom sheet ».
 */
export function Modal({ open, onClose, title, subtitle, size = 'md', children, actions, hideClose = false, labelledBy }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const el = ref.current?.querySelector('[autofocus], input, select, textarea, button:not(.modal-close)');
      el?.focus?.();
    }, 40);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${size}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={ref}>
        {!hideClose && (
          <button type="button" className="btn btn-ghost btn-icon modal-close" onClick={onClose} aria-label="Fermer">
            <i className="fa-solid fa-xmark" />
          </button>
        )}
        {(title || subtitle) && (
          <div className="modal-head">
            {title && <h2 id={labelledBy}>{title}</h2>}
            {subtitle && <p className="muted small mt-1">{subtitle}</p>}
          </div>
        )}
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>,
    document.body
  );
}
