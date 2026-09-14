import { useState } from 'react';
import { useCurrentUser, useStore } from '../../store/useStore';
import { clientLifestyleDone, hasDocument, routineIsValid } from '../../store/selectors';
import { buildEmail, gmailComposeUrl } from '../../lib/email';
import { formatDate, relativeDays, todayISO } from '../../lib/dates';
import { toast } from '../../store/useUI';
import { Button, Notice } from '../ui';
import { usePdfActions } from '../../hooks/usePdfActions';

/**
 * V0 « six-pack » (2026-09-13, voir CLAUDE.md) : envoi assisté via Gmail —
 * un onglet Gmail s'ouvre avec le message pré-rempli (gabarit tout prêt,
 * voir `lib/email.js`), la praticienne joint elle-même le PDF téléchargé
 * ci-dessus puis confirme d'un clic une fois l'envoi réellement fait. Pas
 * d'automatisation backend dans cette version (voir CLAUDE.md pour la
 * version complète avec envoi automatique via Apps Script, déjà construite
 * et prête à réactiver dans `../humana-boutique-archive/`).
 */
export function SendStep({ diag, client, onEditClient }) {
  const user = useCurrentUser();
  const state = useStore();
  const settings = state.settings;
  const recordEnvoi = useStore((s) => s.recordEnvoi);
  const { busy, lastDoc, generate, download, praticienne } = usePdfActions(diag);
  const [lifestylePromptDismissed, setLifestylePromptDismissed] = useState(false);

  const routineOk = routineIsValid(diag);
  const hasEmail = !!client?.email;
  const routineDoc = hasDocument(diag, 'routine');
  const lifestyleDoc = hasDocument(diag, 'lifestyle');
  const isRelancePhase = diag.statut === 'envoye';
  const isDone = diag.statut === 'termine';
  const showLifestylePrompt = routineDoc && !lifestyleDoc && !isDone && !lifestylePromptDismissed && !clientLifestyleDone(state, diag.client_id);

  if (!routineOk) return <Notice icon="fa-solid fa-hourglass-half">Terminez d’abord la routine (au moins un produit, avec son moment) pour pouvoir générer le PDF.</Notice>;
  if (!isDone && !hasEmail) {
    return (
      <Notice tone="amber" icon="fa-solid fa-envelope-circle-check">
        L’email de {client?.prenom} est nécessaire pour l’envoi. <button type="button" className="btn btn-sm btn-soft" style={{ marginLeft: 8 }} onClick={onEditClient}>Ajouter l’email</button>
      </Notice>
    );
  }

  const email = !isDone ? buildEmail({ diag, client, praticienne, settings, type: isRelancePhase ? 'relance' : 'initial' }) : null;

  const openGmail = async () => {
    if (!isRelancePhase) {
      let doc = lastDoc.routine?.doc ? lastDoc.routine : await generate('routine', { auteurId: user.id });
      if (!doc?.doc) { toast('Génération du PDF impossible pour le moment, réessayez.', { type: 'error' }); return; }
    }
    window.open(gmailComposeUrl({ to: email.to, sujet: email.sujet, corps: email.corps }), '_blank');
  };

  const confirmEnvoye = () => {
    recordEnvoi(diag.id, { type: 'initial', mode: 'manuel', destinataire: client?.email || '', sujet: email.sujet }, user.id);
    toast('Diagnostic marqué comme envoyé.', { type: 'success' });
  };

  const confirmRelance = () => {
    recordEnvoi(diag.id, { type: 'relance', mode: 'manuel', destinataire: client?.email || '', sujet: email.sujet }, user.id);
    toast('Relance marquée comme faite.', { type: 'success' });
  };

  return (
    <div className="stack-lg">
      {/* Documents */}
      <div>
        <div className="flex between mb-2">
          <h4 style={{ fontSize: 'var(--fs-md)' }}>Documents</h4>
        </div>
        <div className="grid-2">
          <DocTile
            icon="fa-regular fa-file-pdf" title={`Routine ${diag.type === 'peau' ? 'visage' : 'cheveux'}`}
            exists={routineDoc} busy={busy === 'routine'}
            onGenerate={() => generate('routine', { auteurId: user.id })} onDownload={() => download('routine')}
          />
          {lifestyleDoc && (
            <DocTile icon="fa-regular fa-heart" title="Conseils lifestyle" exists busy={busy === 'lifestyle'} onGenerate={() => generate('lifestyle', { auteurId: user.id })} onDownload={() => download('lifestyle')} />
          )}
        </div>
        {lastDoc.routine?.url && (
          <div className="doc-preview mt-2 anim-fade-in"><iframe title="Aperçu du PDF routine" src={lastDoc.routine.url} /></div>
        )}
      </div>

      {showLifestylePrompt && (
        <Notice tone="accent" icon="fa-regular fa-heart">
          <div className="grow">
            {client?.prenom} n’a encore jamais reçu de PDF lifestyle (conseils généraux). Le préparer avant l’envoi ?
          </div>
          <div className="flex" style={{ gap: '.5rem', flexShrink: 0 }}>
            <Button variant="soft" size="sm" onClick={() => document.getElementById('section-2b')?.scrollIntoView({ behavior: 'smooth' })}>Le préparer</Button>
            <Button variant="ghost" size="sm" onClick={() => setLifestylePromptDismissed(true)}>Pas cette fois</Button>
          </div>
        </Notice>
      )}

      {/* Envoi */}
      {!isDone && (
        <div>
          <h4 style={{ fontSize: 'var(--fs-md)' }} className="mb-2">{isRelancePhase ? 'Relance de suivi' : 'Envoi à la cliente'}</h4>
          {isRelancePhase && (
            <p className="muted small mb-2">
              Email envoyé le {formatDate(diag.date_envoi)}. Relance prévue {diag.date_relance <= todayISO() ? "aujourd'hui ou avant" : relativeDays(diag.date_relance)} ({formatDate(diag.date_relance)}) — vous pouvez aussi relancer avant si vous le souhaitez.
            </p>
          )}
          <div className="send-card">
            <span className="send-icon"><i className="fa-solid fa-envelope" /></span>
            <h3>{isRelancePhase ? 'Envoyer la relance' : 'Envoyer à la cliente'}</h3>
            <p>{isRelancePhase ? 'Ouvre Gmail avec le message de suivi pré-rempli, sans pièce jointe.' : 'Ouvre Gmail avec le message pré-rempli — le PDF ci-dessus est à joindre vous-même avant d’envoyer.'}</p>
            <div className="flex" style={{ gap: '.5rem', flexWrap: 'wrap' }}>
              <Button variant="soft" icon="fa-solid fa-arrow-up-right-from-square" onClick={openGmail}>Ouvrir Gmail</Button>
              <Button variant="primary" icon="fa-solid fa-check" onClick={isRelancePhase ? confirmRelance : confirmEnvoye}>
                {isRelancePhase ? 'Relance envoyée' : 'J’ai bien envoyé le mail'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDone && (
        <Notice icon="fa-solid fa-circle-check">
          Diagnostic terminé : email et relance envoyés à {client?.prenom}. Dernière relance le {formatDate(diag.date_cloture)}.
        </Notice>
      )}
    </div>
  );
}

function DocTile({ icon, title, exists, busy, onGenerate, onDownload }) {
  return (
    <div className="doc-tile">
      <span className="doc-icon"><i className={icon} /></span>
      <div className="grow">
        <div className="doc-name">{title}</div>
        <div className="doc-sub">{exists ? 'Généré · prêt à télécharger' : 'Pas encore généré'}</div>
      </div>
      {exists ? (
        <Button variant="ghost" size="sm" icon="fa-solid fa-download" loading={busy} onClick={onDownload}>Télécharger</Button>
      ) : (
        <Button variant="soft" size="sm" icon="fa-solid fa-file-pdf" loading={busy} onClick={onGenerate}>Générer</Button>
      )}
    </div>
  );
}
