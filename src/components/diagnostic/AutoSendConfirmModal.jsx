import { useEffect, useState } from 'react';
import { Button, Field, Input, Modal, Textarea } from '../ui';

/**
 * Aperçu obligatoire avant tout envoi automatique (email + PDF exact) :
 * rien ne part avant ce clic explicite sur « Envoyer ». La praticienne peut
 * encore ajuster le texte au dernier moment. Voir `SendStep.jsx`
 * (prepareAutoSend / confirmAutoSend) pour la préparation et l'appel réel.
 */
export function AutoSendConfirmModal({ open, onClose, preview, sending, onConfirm }) {
  const [to, setTo] = useState('');
  const [sujet, setSujet] = useState('');
  const [corps, setCorps] = useState('');

  useEffect(() => {
    if (open && preview?.email) {
      setTo(preview.email.to || '');
      setSujet(preview.email.sujet || '');
      setCorps(preview.email.corps || '');
    }
  }, [open, preview]);

  if (!preview) return null;
  const hasPdf = !!preview.pdfUrl;

  return (
    <Modal
      open={open}
      onClose={sending ? undefined : onClose}
      title={preview.isRelance ? 'Vérifier la relance avant l’envoi' : 'Vérifier l’email avant l’envoi'}
      subtitle="Relisez le message (et le PDF joint) : rien ne part tant que vous n’avez pas cliqué sur « Envoyer »."
      size={hasPdf ? 'lg' : 'md'}
      actions={
        <>
          <Button variant="ghost" onClick={onClose} disabled={sending}>Annuler</Button>
          <Button variant="primary" icon="fa-solid fa-paper-plane" loading={sending} disabled={!to} onClick={() => onConfirm({ to, sujet, corps })}>
            {preview.isRelance ? 'Envoyer la relance' : 'Envoyer à la cliente'}
          </Button>
        </>
      }
    >
      <div className={hasPdf ? 'grid-side' : 'stack'}>
        <div className="stack">
          <Field label="Destinataire" required>{(id) => <Input id={id} type="email" value={to} onChange={(e) => setTo(e.target.value)} disabled={sending} />}</Field>
          <Field label="Sujet">{(id) => <Input id={id} value={sujet} onChange={(e) => setSujet(e.target.value)} disabled={sending} />}</Field>
          <Field label="Message">{(id) => <Textarea id={id} rows={hasPdf ? 12 : 9} value={corps} onChange={(e) => setCorps(e.target.value)} disabled={sending} />}</Field>
          {hasPdf && <p className="xs muted"><i className="fa-solid fa-paperclip" /> Pièce jointe : {preview.attachmentName}</p>}
        </div>
        {hasPdf && (
          <div className="doc-preview">
            <iframe title="Aperçu du PDF envoyé à la cliente" src={preview.pdfUrl} style={{ height: 460 }} />
          </div>
        )}
      </div>
    </Modal>
  );
}
