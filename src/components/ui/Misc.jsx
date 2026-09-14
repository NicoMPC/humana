import { useEffect, useRef, useState } from 'react';

export function Tabs({ value, onChange, items }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((it) => (
        <button key={it.value} type="button" role="tab" aria-selected={value === it.value} className={value === it.value ? 'is-active' : ''} onClick={() => onChange(it.value)}>
          {it.icon && <i className={it.icon} />} {it.label}
          {it.count != null && <span className="count-pill">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon = 'fa-regular fa-folder-open', title, text, action, compact = false }) {
  return (
    <div className={`empty ${compact ? 'compact' : ''}`}>
      <div className="empty-icon"><i className={icon} /></div>
      {title && <h4>{title}</h4>}
      {text && <p className="small">{text}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function Skeleton({ width = '100%', height = 16, radius, style }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card stack">
      <Skeleton width="55%" height={22} />
      {Array.from({ length: lines }).map((_, i) => <Skeleton key={i} width={`${90 - i * 15}%`} />)}
    </div>
  );
}

export function Tooltip({ text, children }) {
  return (
    <span className="tip">
      {children || <span className="tip-trigger" tabIndex={0} aria-label={text}>?</span>}
      <span className="tip-text" role="tooltip">{text}</span>
    </span>
  );
}

export function Progress({ value = 0, accent = false }) {
  return (
    <div className={`progress ${accent ? 'accent' : ''}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Stepper({ steps, current, onSelect, done = [] }) {
  return (
    <div className="stepper" role="list">
      {steps.map((label, i) => {
        const num = i + 1;
        const isDone = done.includes(num) || num < current;
        const cls = ['step', num === current && 'is-active', isDone && num !== current && 'is-done'].filter(Boolean).join(' ');
        return (
          <div key={label} className={cls} role="listitem" onClick={() => onSelect?.(num)} aria-current={num === current ? 'step' : undefined}>
            <span className="step-num">{isDone && num !== current ? <i className="fa-solid fa-check" /> : num}</span>
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Menu déroulant simple (actions secondaires). items: [{label, icon, onClick, danger}] */
export function Dropdown({ trigger, items, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className="dropdown" ref={ref}>
      <span onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>{trigger}</span>
      {open && (
        <div className="dropdown-menu" style={align === 'left' ? { right: 'auto', left: 0 } : undefined} role="menu">
          {items.filter(Boolean).map((it) => (
            <button key={it.label} type="button" role="menuitem" className={it.danger ? 'danger' : ''} onClick={(e) => { e.stopPropagation(); setOpen(false); it.onClick?.(); }}>
              {it.icon && <i className={it.icon} />} {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Notice({ tone, icon = 'fa-solid fa-circle-info', className = '', children }) {
  return (
    <div className={`notice ${tone || ''} ${className}`.trim()}>
      <i className={icon} />
      <div>{children}</div>
    </div>
  );
}

export function CardIcon({ icon, tone }) {
  return <span className={`card-icon ${tone || ''}`}><i className={icon} /></span>;
}
