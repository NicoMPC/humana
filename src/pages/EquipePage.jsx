import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser, useStore } from '../store/useStore';
import { isPatronne, praticiennes } from '../store/selectors';
import { fullName, isValidEmail } from '../lib/format';
import { toast } from '../store/useUI';
import { Avatar, Button, EmptyState, Field, Input, Modal, Switch } from '../components/ui';

const PALETTE = ['#8fa379', '#d88076', '#647653', '#c46a5f', '#b3c49d', '#a4544a'];

export default function EquipePage() {
  const user = useCurrentUser();
  const state = useStore();
  const updateUser = useStore((s) => s.updateUser);
  const [form, setForm] = useState(null);

  if (!isPatronne(user)) return <Navigate to="/" replace />;

  const prats = praticiennes(state);

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">Gestion</div><h1>Équipe</h1><p className="lead">{prats.length} praticienne{prats.length > 1 ? 's' : ''}</p></div>
        <Button variant="primary" icon="fa-solid fa-user-plus" onClick={() => setForm({})}>Ajouter une praticienne</Button>
      </div>

      {!prats.length ? (
        <EmptyState icon="fa-solid fa-people-group" title="Aucune praticienne" text="Ajoutez votre équipe pour répartir les diagnostics." />
      ) : (
        <div className="grid-auto stagger">
          {prats.map((p) => {
            const clients = state.clients.filter((c) => c.praticienne_id === p.id).length;
            return (
              <div key={p.id} className="card">
                <div className="flex">
                  <Avatar person={p} size="lg" color={p.couleur} />
                  <div className="grow">
                    <div className="semibold">{fullName(p)}</div>
                    <div className="xs muted">{p.email}</div>
                  </div>
                </div>
                <div className="flex between mt-3">
                  <span className="badge">{clients} cliente{clients > 1 ? 's' : ''}</span>
                  <Switch checked={p.actif !== false} onChange={(v) => { updateUser(p.id, { actif: v }); toast(v ? `${p.prenom} réactivée` : `${p.prenom} désactivée`); }} label={p.actif !== false ? 'Active' : 'Inactive'} />
                </div>
                <Button variant="ghost" size="sm" icon="fa-solid fa-pen" block className="mt-2" onClick={() => setForm(p)}>Modifier</Button>
              </div>
            );
          })}
        </div>
      )}

      <PractitionerFormModal open={!!form} practitioner={form?.id ? form : null} onClose={() => setForm(null)} />
    </>
  );
}

function PractitionerFormModal({ open, practitioner, onClose }) {
  const addUser = useStore((s) => s.addUser);
  const updateUser = useStore((s) => s.updateUser);
  const [f, setF] = useState({ prenom: '', nom: '', email: '', couleur: PALETTE[0] });

  return (
    <Modal open={open} onClose={onClose} title={practitioner ? 'Modifier la praticienne' : 'Nouvelle praticienne'} labelledBy="prat-title"
      actions={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" icon="fa-solid fa-check" onClick={() => {
        if (!f.prenom.trim() || !f.nom.trim()) return toast('Prénom et nom requis', { type: 'warning' });
        if (f.email && !isValidEmail(f.email)) return toast('Email invalide', { type: 'warning' });
        if (practitioner) updateUser(practitioner.id, f); else addUser({ ...f, role: 'praticienne' });
        toast(practitioner ? 'Praticienne mise à jour' : 'Praticienne ajoutée');
        onClose();
      }}>Enregistrer</Button></>}>
      <PractitionerForm key={practitioner?.id || 'new'} practitioner={practitioner} onChange={setF} />
    </Modal>
  );
}

function PractitionerForm({ practitioner, onChange }) {
  const [prenom, setPrenom] = useState(practitioner?.prenom || '');
  const [nom, setNom] = useState(practitioner?.nom || '');
  const [email, setEmail] = useState(practitioner?.email || '');
  const [couleur, setCouleur] = useState(practitioner?.couleur || PALETTE[0]);

  const sync = (patch) => onChange((f) => ({ ...f, prenom, nom, email, couleur, ...patch }));

  return (
    <div className="stack">
      <div className="form-row">
        <Field label="Prénom" required>{(id) => <Input id={id} value={prenom} onChange={(e) => { setPrenom(e.target.value); sync({ prenom: e.target.value }); }} autoFocus />}</Field>
        <Field label="Nom" required>{(id) => <Input id={id} value={nom} onChange={(e) => { setNom(e.target.value); sync({ nom: e.target.value }); }} />}</Field>
      </div>
      <Field label="Email">{(id) => <Input id={id} type="email" value={email} onChange={(e) => { setEmail(e.target.value); sync({ email: e.target.value }); }} />}</Field>
      <Field label="Couleur">
        <div className="flex">
          {PALETTE.map((c) => (
            <button key={c} type="button" onClick={() => { setCouleur(c); sync({ couleur: c }); }} aria-label={c}
              style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: couleur === c ? '2px solid var(--ink-900)' : '2px solid transparent', boxShadow: couleur === c ? '0 0 0 2px #fff inset' : 'none' }} />
          ))}
        </div>
      </Field>
    </div>
  );
}
