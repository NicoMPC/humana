import { STATUTS, DIAG_TYPES } from '../../data/constants';
import { isRelanceDue } from '../../store/selectors';

export function Badge({ tone, icon, dot = false, outline = false, children, className = '', ...rest }) {
  const cls = ['badge', tone && `badge-${tone}`, dot && 'badge-dot', outline && 'badge-outline', className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...rest}>
      {icon && <i className={icon} aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Badge de statut d'un diagnostic (tient compte des relances échues). */
export function StatusBadge({ diag, short = false }) {
  if (isRelanceDue(diag)) {
    return <span className="badge status-relance"><i className="fa-regular fa-bell" /> {short ? 'Relance' : 'Relance à faire'}</span>;
  }
  const s = STATUTS[diag.statut];
  if (!s) {
    // Diagnostic pas encore envoyé (voir `createDiagnostic`) : pas de statut
    // formel, juste un repère neutre "brouillon" pendant la séance.
    return <span className="badge status-brouillon"><i className="fa-regular fa-pen-to-square" /> {short ? 'Brouillon' : 'Brouillon · pas encore envoyé'}</span>;
  }
  return <span className={`badge status-${s.key}`}><i className={s.icon} /> {short ? s.short : s.label}</span>;
}

export function TypeBadge({ type, outline = true }) {
  const t = DIAG_TYPES[type] || DIAG_TYPES.peau;
  return <Badge tone={t.color} outline={outline} icon={t.icon}>{t.label}</Badge>;
}
