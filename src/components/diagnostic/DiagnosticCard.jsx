import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { daysUntilRelance, diagnosticStep, getClient, getUser, isRelanceDue, quizProgress } from '../../store/selectors';
import { DIAG_TYPES } from '../../data/constants';
import { diffDays, formatDate, relativeDays, todayISO } from '../../lib/dates';
import { fullName } from '../../lib/format';
import { Avatar, StatusBadge, TypeBadge } from '../ui';

const STEP_LABELS = { 1: 'Questionnaire', 2: 'Routine', 3: 'PDF & envoi', 4: 'Suivi' };

/** Carte compacte d'un diagnostic (dashboard, fiche cliente). */
export function DiagnosticCard({ diag, showClient = true, showPractitioner = false }) {
  const navigate = useNavigate();
  const client = useStore((s) => getClient(s, diag.client_id));
  const prat = useStore((s) => getUser(s, diag.praticienne_id));
  const questions = useStore((s) => s.questions[diag.type]);
  const due = isRelanceDue(diag);
  // « Force tranquille » du tableau de bord (voir styles/pages.css) : seule
  // une relance vraiment en retard (3 jours ou plus) prend le liseré argile
  // vif — une relance du jour reste sur un liseré sauge, plus doux.
  const lateDays = due && diag.date_relance ? diffDays(diag.date_relance, todayISO()) : 0;
  const urgent = due && lateDays >= 3;
  const step = diagnosticStep(diag, questions);
  const t = DIAG_TYPES[diag.type];

  let hint = null;
  if (diag.statut !== 'envoye' && diag.statut !== 'termine') {
    const p = quizProgress(diag, questions);
    // Un diagnostic dure normalement une séance (audit du 11/09/2026,
    // docs/audit-coherence-metier.md) : signal neutre — pas une alerte —
    // dès qu'il a franchi minuit sans être bouclé.
    hint = diag.date_rdv !== todayISO() ? `Ouvert depuis le ${formatDate(diag.date_rdv)}` : step === 1 ? `Questionnaire ${p.answered}/${p.total}` : `Étape suivante : ${STEP_LABELS[step]}`;
  } else if (diag.statut === 'envoye') {
    const d = daysUntilRelance(diag);
    hint = due ? 'Relance à envoyer' : d === 0 ? 'Relance aujourd’hui' : `Relance ${relativeDays(diag.date_relance)}`;
  } else {
    hint = diag.relance_envoyee ? 'Relance envoyée' : 'Clôturé';
  }

  return (
    <article className={`card interactive diag-card ${urgent ? 'is-due' : due ? 'is-due-soon' : ''}`} onClick={() => navigate(`/diagnostic/${diag.id}`)} role="link" tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/diagnostic/${diag.id}`)}>
      <div className="diag-top">
        {showClient ? <Avatar person={client} size="sm" /> : <span className={`card-icon ${t.color === 'clay' ? 'accent' : ''}`} style={{ width: 32, height: 32, fontSize: '.85rem' }}><i className={t.icon} /></span>}
        <div className="grow">
          <div className="diag-name truncate">{showClient ? fullName(client) : `Diagnostic ${t.label}`}</div>
          <div className="diag-meta">
            {showClient && <TypeBadge type={diag.type} />}
            <span><i className="fa-regular fa-calendar" /> {formatDate(diag.date_rdv)}</span>
          </div>
        </div>
      </div>
      <div className="diag-foot">
        <StatusBadge diag={diag} short />
        <span className="xs muted">{hint}</span>
      </div>
      {showPractitioner && prat && (
        <span className="prat-chip"><Avatar person={prat} color={prat.couleur} /> {fullName(prat)}</span>
      )}
    </article>
  );
}
