import { useState } from 'react';
import { isPatronne } from '../../store/selectors';
import { fullName } from '../../lib/format';
import { uid } from '../../lib/ids';
import { nowISO } from '../../lib/dates';
import { reportBug } from '../../lib/sheetsSync';
import { toast } from '../../store/useUI';
import { Button, Modal, Select, Textarea } from '../ui';

const SEEN_PREFIX = 'humana.onboarding.';

export function hasSeenOnboarding(userId) {
  try { return localStorage.getItem(SEEN_PREFIX + userId) === '1'; } catch { return true; }
}
function markSeen(userId) {
  try { localStorage.setItem(SEEN_PREFIX + userId, '1'); } catch { /* stockage indisponible, tant pis */ }
}

const EXEMPLES = [
  { key: 'boutique', label: 'Cliente reçue en boutique', phrase: 'Merci pour votre visite à la boutique. Vous trouverez ci-joint votre routine personnalisée…' },
  { key: 'visio', label: 'Cliente reçue en visio', phrase: 'Merci pour notre échange en visio. Vous trouverez ci-joint votre routine personnalisée…' },
];

/**
 * Onboarding « premier lancement » (V0 six-pack, 2026-09-13, voir
 * CLAUDE.md) : quelques questions rapides pour capter les préférences et
 * premières remarques de la praticienne, envoyées dans l'onglet Retours du
 * classeur Google Sheets via la même action `reportBug` que le bouton
 * « Signaler un problème » — aucun changement backend nécessaire, `upsert_`
 * conserve tous les champs du payload dans la colonne `json` même hors de
 * la liste des colonnes lisibles. Affiché une seule fois par praticienne
 * (drapeau localStorage par id d'utilisatrice), jamais ré-affiché ensuite.
 */
export function OnboardingWizard({ open, onClose, user }) {
  const [messageSouhaite, setMessageSouhaite] = useState('');
  const [volume, setVolume] = useState('');
  const [remarque, setRemarque] = useState('');
  const [sending, setSending] = useState(false);

  const skip = () => { markSeen(user.id); onClose?.(); };

  const send = async () => {
    setSending(true);
    const resume = [
      volume ? `Volume estimé : ${volume}` : null,
      messageSouhaite.trim() ? `Ajustement souhaité sur le message : ${messageSouhaite.trim()}` : null,
      remarque.trim() ? `Remarque : ${remarque.trim()}` : null,
    ].filter(Boolean).join(' — ') || '(aucun commentaire laissé)';

    const payload = {
      id: uid('onboarding'),
      date: nowISO(),
      type: 'onboarding',
      auteur: `${fullName(user)} (${isPatronne(user) ? 'Gérante' : 'Praticienne'})`,
      page: 'Bienvenue (premier lancement)',
      client: '',
      message: resume,
      volume_semaine: volume,
      message_souhaite: messageSouhaite.trim(),
      remarque: remarque.trim(),
    };
    const res = await reportBug(payload);
    setSending(false);
    markSeen(user.id);
    if (res.ok) toast('Merci ! Vos réponses ont bien été transmises.', { type: 'success' });
    else toast('Échec de l’envoi, mais pas de souci — on en reparlera de vive voix.', { type: 'error', duration: 6000 });
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={skip}
      title={`Bienvenue ${user.prenom} !`}
      subtitle="Quelques questions rapides pour adapter l’appli à votre façon de faire — une minute, pas plus."
      size="sm"
      actions={
        <>
          <Button variant="ghost" onClick={skip} disabled={sending}>Plus tard</Button>
          <Button variant="primary" icon="fa-solid fa-paper-plane" loading={sending} onClick={send}>Envoyer</Button>
        </>
      }
    >
      <div className="stack-lg">
        <div>
          <div className="xs muted mb-1">Voici comment on pourrait un jour rédiger vos messages aux clientes — ça vous correspond ?</div>
          {EXEMPLES.map((e) => (
            <div key={e.key} className="notice mt-2" style={{ fontSize: 'var(--fs-sm)' }}>
              <b>{e.label} :</b> <span className="muted">« {e.phrase} »</span>
            </div>
          ))}
          <Textarea
            rows={2}
            className="mt-2"
            placeholder="Ex : je dirais plutôt « merci d’être passée nous voir »…"
            value={messageSouhaite}
            onChange={(e) => setMessageSouhaite(e.target.value)}
          />
        </div>

        <div>
          <div className="xs muted mb-1">Environ combien de diagnostics faites-vous par semaine ?</div>
          <Select value={volume} onChange={(e) => setVolume(e.target.value)}>
            <option value="">— Choisir —</option>
            <option value="Moins de 5">Moins de 5</option>
            <option value="5 à 15">5 à 15</option>
            <option value="Plus de 15">Plus de 15</option>
          </Select>
        </div>

        <div>
          <div className="xs muted mb-1">Une remarque, une question, ou un truc qui vous a semblé bizarre pour l’instant ?</div>
          <Textarea
            rows={3}
            placeholder="Tout est bon à prendre, même un détail…"
            value={remarque}
            onChange={(e) => setRemarque(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
