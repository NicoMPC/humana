import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCurrentUser, useStore } from '../../store/useStore';
import { assignableUsers, isPatronne } from '../../store/selectors';
import { isValidEmail, fullName } from '../../lib/format';
import { toast } from '../../store/useUI';
import { Button, Field, Input, Modal, Select, Textarea } from '../ui';

const EMPTY = { prenom: '', nom: '', email: '', telephone: '', notes: '', praticienne_id: '' };

/** Création / édition d'une cliente. onSaved(client) est appelé après enregistrement. */
export function ClientFormModal({ open, onClose, client = null, onSaved }) {
  const user = useCurrentUser();
  const addClient = useStore((s) => s.addClient);
  const updateClient = useStore((s) => s.updateClient);
  // Toute utilisatrice active peut être référente (Jessie et Nathalie
  // pratiquent aussi — voir seed.js) — pas seulement le personnel listé
  // dans Équipe (`praticiennes()`, réservé à la gestion d'équipe).
  const prats = useStore(useShallow((s) => assignableUsers(s)));
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    // Par défaut : la cliente est rattachée à qui la crée (soi-même) — que
    // ce soit une gérante ou une praticienne — plutôt que de dépendre d'un
    // premier élément de liste qui peut être vide (aucun personnel encore
    // ajouté depuis Équipe).
    setForm(client ? { ...EMPTY, ...client } : { ...EMPTY, praticienne_id: user.id });
  }, [open, client, user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e?.preventDefault();
    const errs = {};
    if (!form.prenom.trim()) errs.prenom = 'Le prénom est requis.';
    if (!form.nom.trim()) errs.nom = 'Le nom est requis.';
    if (!form.email.trim()) errs.email = 'L’email est obligatoire : sans lui, l’envoi du PDF et les relances automatiques sont impossibles.';
    else if (!isValidEmail(form.email)) errs.email = 'Adresse email invalide.';
    if (!form.praticienne_id) errs.praticienne_id = 'Choisissez une praticienne.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const payload = { prenom: form.prenom.trim(), nom: form.nom.trim(), email: form.email.trim(), telephone: form.telephone.trim(), notes: form.notes.trim(), praticienne_id: form.praticienne_id };
    let saved;
    if (client) { updateClient(client.id, payload); saved = { ...client, ...payload }; toast('Fiche cliente mise à jour'); }
    else { saved = addClient(payload); toast(`${fullName(saved)} ajoutée au carnet`); }
    onSaved?.(saved);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={client ? 'Modifier la cliente' : 'Nouvelle cliente'} subtitle="L’email est obligatoire : c’est lui qui permet l’envoi du PDF et les relances automatiques."
      actions={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" icon="fa-solid fa-check" onClick={submit}>{client ? 'Enregistrer' : 'Créer la fiche'}</Button></>}>
      <form onSubmit={submit} className="stack">
        <div className="form-row">
          <Field label="Prénom" required error={errors.prenom}>{(id) => <Input id={id} value={form.prenom} onChange={set('prenom')} autoFocus invalid={!!errors.prenom} autoComplete="off" />}</Field>
          <Field label="Nom" required error={errors.nom}>{(id) => <Input id={id} value={form.nom} onChange={set('nom')} invalid={!!errors.nom} autoComplete="off" />}</Field>
        </div>
        <div className="form-row">
          <Field label="Email" required error={errors.email}>{(id) => <Input id={id} type="email" value={form.email} onChange={set('email')} invalid={!!errors.email} placeholder="prenom@exemple.fr" />}</Field>
          <Field label="Téléphone">{(id) => <Input id={id} type="tel" value={form.telephone} onChange={set('telephone')} placeholder="06 00 00 00 00" />}</Field>
        </div>
        {isPatronne(user) && (
          <Field label="Praticienne référente" error={errors.praticienne_id}>
            {(id) => (
              <Select id={id} value={form.praticienne_id} onChange={set('praticienne_id')}>
                <option value="">Choisir…</option>
                {prats.map((p) => <option key={p.id} value={p.id}>{fullName(p)}</option>)}
              </Select>
            )}
          </Field>
        )}
        <Field label="Notes" hint="Allergies, préférences, contexte… visibles uniquement par l’équipe.">{(id) => <Textarea id={id} rows={3} value={form.notes} onChange={set('notes')} />}</Field>
        <button type="submit" className="sr-only">Enregistrer</button>
      </form>
    </Modal>
  );
}
