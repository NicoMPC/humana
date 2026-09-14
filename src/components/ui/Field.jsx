import { useId } from 'react';

/** Champ de formulaire avec label, aide et erreur. */
export function Field({ label, hint, error, children, required, className = '' }) {
  const id = useId();
  return (
    <div className={`field ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label} {required && <span style={{ color: 'var(--accent-strong)' }}>*</span>}
        </label>
      )}
      {typeof children === 'function' ? children(id) : children}
      {error ? <span className="error">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function Input({ className = '', invalid = false, size, ...rest }) {
  return <input className={`input ${size === 'sm' ? 'input-sm' : ''} ${invalid ? 'is-invalid' : ''} ${className}`} {...rest} />;
}

export function Textarea({ className = '', invalid = false, ...rest }) {
  return <textarea className={`textarea ${invalid ? 'is-invalid' : ''} ${className}`} {...rest} />;
}

export function Select({ className = '', children, size, ...rest }) {
  return (
    <select className={`select ${size === 'sm' ? 'input-sm' : ''} ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange?.(e.target.checked)} disabled={disabled} />
      <span className="track" />
      {label && <span className="small semibold">{label}</span>}
    </label>
  );
}

/** Contrôle segmenté (choix exclusif). options: [{value,label,icon}] */
export function Segmented({ value, onChange, options, size, className = '' }) {
  return (
    <div className={`segmented ${size === 'sm' ? 'sm' : ''} ${className}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? 'is-active' : ''} onClick={() => onChange(o.value)}>
          {o.icon && <i className={o.icon} />} {o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Rechercher…', autoFocus }) {
  return (
    <div className="search-bar">
      <i className="fa-solid fa-magnifying-glass" />
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} aria-label={placeholder} />
      {value && (
        <button type="button" className="btn btn-ghost btn-icon btn-sm clear" onClick={() => onChange('')} aria-label="Effacer">
          <i className="fa-solid fa-xmark" />
        </button>
      )}
    </div>
  );
}
