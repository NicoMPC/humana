import { useStore } from '../../store/useStore';
import { getUser, isRelanceDue } from '../../store/selectors';
import { formatDate, formatDateTime, todayISO } from '../../lib/dates';

const ICONS = {
  'démarré': 'fa-solid fa-flag',
  'validée': 'fa-solid fa-check',
  'généré': 'fa-regular fa-file-pdf',
  'envoyé': 'fa-regular fa-paper-plane',
  'envoyés': 'fa-regular fa-paper-plane',
  'Relance': 'fa-regular fa-bell',
  'réassigné': 'fa-solid fa-shuffle',
  'rouvert': 'fa-solid fa-rotate-left',
  'clôturé': 'fa-solid fa-circle-check',
};
const iconFor = (action) => Object.entries(ICONS).find(([k]) => action.includes(k))?.[1] || 'fa-regular fa-circle';
const toneFor = (action) => (action.toLowerCase().includes('relance') ? 'accent' : action.toLowerCase().includes('généré') ? 'gold' : '');

/** Date d'échéance du rappel photos avant/après (S+N, réglable). */
function photosDueDate(diag, settings) {
  if (!diag.date_envoi) return null;
  const semaines = settings?.delai_photos_semaines || 6;
  const d = new Date(diag.date_envoi);
  d.setDate(d.getDate() + semaines * 7);
  return d.toISOString().slice(0, 10);
}

/**
 * Fil de suivi unique du diagnostic : les actions déjà réalisées (journal,
 * le plus récent en haut) précédées des prochaines échéances encore à
 * venir (relance, photos avant/après) — plutôt qu'une checklist séparée.
 * Dès qu'une échéance à venir se réalise, elle disparaît d'elle-même de la
 * section « à venir » et apparaît comme un événement passé au prochain
 * rendu (aucune confirmation manuelle à cocher ici).
 */
export function JournalTimeline({ diag, onGoToSend }) {
  const state = useStore();
  const settings = state.settings;
  const today = todayISO();
  const past = [...diag.journal].reverse();

  const upcoming = [];
  if (diag.statut === 'envoye' && !diag.relance_envoyee && diag.date_relance) {
    const due = diag.date_relance <= today;
    upcoming.push({
      key: 'relance',
      due,
      icon: 'fa-regular fa-bell',
      label: due ? 'Relance à envoyer' : 'Relance de suivi',
      when: due ? "Prévue aujourd'hui ou avant" : `Prévue le ${formatDate(diag.date_relance)}`,
    });
  }
  const photosDue = photosDueDate(diag, settings);
  if (photosDue && (!diag.photos?.avant || !diag.photos?.apres)) {
    const due = photosDue <= today;
    upcoming.push({
      key: 'photos',
      due,
      icon: 'fa-solid fa-camera',
      label: due ? 'Photos avant/après à recueillir' : 'Photos avant/après à venir',
      when: due ? 'Échéance dépassée' : `Prévues le ${formatDate(photosDue)}`,
    });
  }

  if (!past.length && !upcoming.length) return null;

  return (
    <div className="timeline">
      {upcoming.map((u) => (
        <div key={u.key} className="timeline-item is-upcoming">
          <span className={`timeline-dot ${u.due ? 'accent' : 'pending'}`}><i className={u.icon} /></span>
          <div className="timeline-body">
            <div>
              {u.label} <span className="muted">· à venir</span>
              {u.due && onGoToSend && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={onGoToSend}>Traiter →</button>
              )}
            </div>
            <div className="when">{u.when}</div>
          </div>
        </div>
      ))}
      {past.map((e) => {
        const auteur = getUser(state, e.auteur_id);
        return (
          <div key={e.id} className="timeline-item">
            <span className={`timeline-dot ${toneFor(e.action)}`}><i className={iconFor(e.action)} /></span>
            <div className="timeline-body">
              <div>{e.action}{auteur ? <span className="muted"> · {auteur.prenom}</span> : null}</div>
              <div className="when">{formatDateTime(e.date)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
