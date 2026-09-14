import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrentUser, useStore } from '../../store/useStore';
import { isPatronne } from '../../store/selectors';
import { fullName } from '../../lib/format';
import { uid } from '../../lib/ids';
import { nowISO } from '../../lib/dates';
import { reportBug } from '../../lib/sheetsSync';
import { toast } from '../../store/useUI';
import { Button, Modal, Textarea } from '../ui';
import { pageLabel } from './AppShell';

/**
 * Remontée d'un problème ou d'une remarque vers l'onglet "Retours" du
 * classeur Google Sheets (voir `apps-script/Code.gs`, action `reportBug`).
 * La page, le profil et l'appareil sont capturés automatiquement pour que
 * Nicolas comprenne le contexte sans devoir le redemander à la praticienne.
 */
export function BugReportModal({ open, onClose }) {
  const user = useCurrentUser();
  const location = useLocation();
  const state = useStore();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const diagMatch = location.pathname.match(/^\/diagnostic\/([^/]+)/);
  const clientMatch = location.pathname.match(/^\/clientes\/([^/]+)/);
  const diagnostic = diagMatch ? state.diagnostics.find((d) => d.id === diagMatch[1]) : null;
  const client = diagnostic
    ? state.clients.find((c) => c.id === diagnostic.client_id)
    : clientMatch
    ? state.clients.find((c) => c.id === clientMatch[1])
    : null;

  const close = () => {
    if (sending) return;
    setMessage('');
    onClose?.();
  };

  const send = async () => {
    if (!message.trim() || !user) return;
    setSending(true);
    const payload = {
      id: uid('retour'),
      date: nowISO(),
      auteur: `${fullName(user)} (${isPatronne(user) ? 'Gérante' : 'Praticienne'})`,
      page: pageLabel(location.pathname),
      route: location.pathname,
      client: client ? fullName(client) : '',
      diagnostic_id: diagnostic?.id || '',
      message: message.trim(),
      navigateur: navigator.userAgent,
      resolution: `${window.innerWidth}×${window.innerHeight}`,
    };
    const res = await reportBug(payload);
    setSending(false);
    if (res.ok) {
      toast('Merci, votre remarque a bien été transmise.', { type: 'success' });
      setMessage('');
      onClose?.();
    } else {
      toast("Échec de l'envoi — vérifiez la connexion et réessayez.", { type: 'error', duration: 6000 });
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Signaler un problème ou une remarque"
      subtitle="Décrivez ce que vous observiez : la page, votre profil et l'appareil utilisé sont transmis automatiquement."
      size="sm"
      actions={
        <>
          <Button variant="ghost" onClick={close} disabled={sending}>Annuler</Button>
          <Button variant="primary" icon="fa-solid fa-paper-plane" loading={sending} disabled={!message.trim()} onClick={send}>
            Envoyer
          </Button>
        </>
      }
    >
      <Textarea
        autoFocus
        rows={5}
        placeholder="Ex : le bouton « Générer le PDF » ne réagit pas sur la fiche de Camille…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <p className="xs muted mt-2">
        <i className="fa-solid fa-location-dot" /> {pageLabel(location.pathname)}
        {client ? ` · ${fullName(client)}` : ''}
      </p>
    </Modal>
  );
}
