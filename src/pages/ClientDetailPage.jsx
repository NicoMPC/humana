import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentUser, useStore } from '../store/useStore';
import { assignableUsers, clientLifestyleDone, diagnosticsForClient, getClient, getUser, hasDocument, isPatronne, isPhotosDue } from '../store/selectors';
import { DIAG_TYPES } from '../data/constants';
import { fullName } from '../lib/format';
import { formatDate, todayISO } from '../lib/dates';
import { Avatar, Button, Dropdown, EmptyState, Notice, Select, Textarea } from '../components/ui';
import { DiagnosticCard } from '../components/diagnostic/DiagnosticCard';
import { NewDiagnosticModal } from '../components/diagnostic/NewDiagnosticModal';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { confirmDialog, toast } from '../store/useUI';
import { uploadPhotoToSheets } from '../lib/sheetsSync';
import { usePdfActions } from '../hooks/usePdfActions';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const state = useStore();
  const client = getClient(state, id);
  const deleteClient = useStore((s) => s.deleteClient);
  const reassignClient = useStore((s) => s.reassignClient);
  const [newDiag, setNewDiag] = useState(false);
  const [edit, setEdit] = useState(false);
  const admin = isPatronne(user);

  if (!client) {
    return <EmptyState icon="fa-regular fa-face-frown" title="Cliente introuvable" text="Cette fiche a peut-être été supprimée." action={<Button variant="primary" onClick={() => navigate('/clientes')}>Retour au carnet</Button>} />;
  }

  const diags = diagnosticsForClient(state, id);
  const prat = getUser(state, client.praticienne_id);
  const prats = assignableUsers(state);
  const sentDiags = diags.filter((d) => d.date_envoi);
  const lifestylePending = diags.length > 0 && !clientLifestyleDone(state, id);

  const handleDelete = async () => {
    const ok = await confirmDialog({ title: 'Supprimer cette cliente ?', message: `${fullName(client)} et l’historique de ses ${diags.length} diagnostic(s) seront définitivement supprimés.`, confirmLabel: 'Supprimer', danger: true });
    if (ok) { deleteClient(id); toast('Fiche cliente supprimée'); navigate('/clientes'); }
  };

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/clientes')}><i className="fa-solid fa-arrow-left" /> Clientes</button>

      <div className="card mb-3">
        <div className="client-hero">
          <Avatar person={client} size="xl" />
          <div className="grow">
            <h1 style={{ fontSize: 'var(--fs-2xl)' }}>{fullName(client)}</h1>
            <div className="hero-meta">
              {client.email ? <a href={`mailto:${client.email}`}><i className="fa-regular fa-envelope" />{client.email}</a> : <span className="muted"><i className="fa-regular fa-envelope" />Email non renseigné</span>}
              {client.telephone && <span><i className="fa-solid fa-phone" />{client.telephone}</span>}
              <span><i className="fa-regular fa-calendar" />Cliente depuis le {formatDate(client.date_creation)}</span>
              {admin && prat && <span><i className="fa-regular fa-user" />Suivie par {fullName(prat)}</span>}
            </div>
          </div>
          <div className="flex">
            <Button variant="primary" icon="fa-solid fa-plus" onClick={() => setNewDiag(true)}>Nouveau diagnostic</Button>
            <Dropdown trigger={<Button variant="ghost" icon="fa-solid fa-ellipsis-vertical" aria-label="Plus d’actions" />} items={[
              { label: 'Modifier la fiche', icon: 'fa-solid fa-pen', onClick: () => setEdit(true) },
              { label: 'Supprimer la cliente', icon: 'fa-solid fa-trash-can', danger: true, onClick: handleDelete },
            ]} />
          </div>
        </div>
        {client.notes && (
          <div className="notice mt-3"><i className="fa-regular fa-note-sticky" /><div><b>Notes</b><p className="small mt-1" style={{ whiteSpace: 'pre-wrap' }}>{client.notes}</p></div></div>
        )}
        {lifestylePending && (
          <div className="mt-3"><Notice tone="accent" icon="fa-regular fa-heart"><span className="small">{fullName(client)} n’a encore jamais reçu de PDF lifestyle (conseils généraux) — à proposer à la prochaine visite.</span></Notice></div>
        )}
        {admin && prats.length > 1 && (
          <div className="flex mt-2" style={{ maxWidth: 320 }}>
            <span className="small muted">Réassigner à</span>
            <Select size="sm" value={client.praticienne_id} onChange={(e) => { reassignClient(id, e.target.value, user.id); toast('Cliente réassignée'); }}>
              {prats.map((p) => <option key={p.id} value={p.id}>{fullName(p)}</option>)}
            </Select>
          </div>
        )}
      </div>

      <div className="section-head">
        <div><div className="eyebrow">Historique</div><h2>{diags.length} diagnostic{diags.length > 1 ? 's' : ''}</h2></div>
      </div>
      {diags.length ? (
        <div className="grid-auto stagger">{diags.map((d) => <DiagnosticCard key={d.id} diag={d} showClient={false} />)}</div>
      ) : (
        <EmptyState icon="fa-regular fa-clipboard" title="Aucun diagnostic" text="Commencez le premier diagnostic de cette cliente." action={<Button variant="primary" icon="fa-solid fa-plus" onClick={() => setNewDiag(true)}>Nouveau diagnostic</Button>} />
      )}

      {sentDiags.length > 0 && (
        <>
          <div className="section-head mt-4">
            <div><div className="eyebrow">Suivi</div><h2>Photos &amp; notes de suivi</h2></div>
          </div>
          <div className="stack-lg">
            {sentDiags.map((d) => <DiagnosticPhotosCard key={d.id} diag={d} />)}
          </div>
        </>
      )}

      <NewDiagnosticModal open={newDiag} onClose={() => setNewDiag(false)} clientId={id} />
      <ClientFormModal open={edit} onClose={() => setEdit(false)} client={client} />
    </>
  );
}

/** Une carte « photos avant/après + notes libres » pour un diagnostic déjà envoyé. */
function DiagnosticPhotosCard({ diag }) {
  const user = useCurrentUser();
  const setPhoto = useStore((s) => s.setDiagnosticPhoto);
  const updateDiagnostic = useStore((s) => s.updateDiagnostic);
  const settings = useStore((s) => s.settings);
  const due = isPhotosDue(diag, settings);
  const t = DIAG_TYPES[diag.type];
  const [notes, setNotes] = useState(diag.suivi_notes || '');
  useEffect(() => { setNotes(diag.suivi_notes || ''); }, [diag.suivi_notes]);
  const { busy, generate, download } = usePdfActions(diag);
  const routineDoc = hasDocument(diag, 'routine');

  const commitNotes = () => {
    if (notes !== (diag.suivi_notes || '')) updateDiagnostic(diag.id, { suivi_notes: notes });
  };

  return (
    <div className="card">
      <div className="flex between mb-2">
        <div className="card-title-row"><span className={`card-icon ${t.color === 'clay' ? 'accent' : ''}`}><i className={t.icon} /></span><h3>{t.label} · {formatDate(diag.date_envoi)}</h3></div>
        <div className="flex" style={{ gap: '.5rem', alignItems: 'center' }}>
          {due && <span className="badge status-brouillon"><i className="fa-solid fa-camera" /> À recueillir</span>}
          {routineDoc ? (
            <Button variant="ghost" size="sm" icon="fa-solid fa-download" loading={busy === 'routine'} onClick={() => download('routine')}>PDF</Button>
          ) : (
            <Button variant="soft" size="sm" icon="fa-solid fa-file-pdf" loading={busy === 'routine'} onClick={() => generate('routine', { auteurId: user.id })}>Générer le PDF</Button>
          )}
        </div>
      </div>
      <div className="grid-2">
        <PhotoSlot diagId={diag.id} type="avant" label="Photo avant" photo={diag.photos?.avant} onUpload={(photo) => setPhoto(diag.id, 'avant', photo)} />
        <PhotoSlot diagId={diag.id} type="apres" label="Photo après" photo={diag.photos?.apres} onUpload={(photo) => setPhoto(diag.id, 'apres', photo)} />
      </div>
      <div className="mt-3">
        <div className="xs muted mb-1">Notes de suivi (visible uniquement par l’équipe)</div>
        <Textarea
          rows={3}
          placeholder="Ex : a rappelé pour dire que ça allait mieux, légère rougeur au début…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={commitNotes}
        />
      </div>
    </div>
  );
}

function PhotoSlot({ diagId, type, label, photo, onUpload }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const date = todayISO();
      // Affichage immédiat en local (base64), puis on tente l'upload Drive
      // en tâche de fond : si ça réussit, on remplace par le lien Drive
      // (léger, synchronisable) plutôt que de garder le base64 volumineux.
      onUpload({ url: dataUrl, date });
      uploadPhotoToSheets(diagId, type, dataUrl, `${diagId}-${type}.jpg`).then((driveUrl) => {
        if (driveUrl) onUpload({ url: driveUrl, date });
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="photo-slot">
      <div className="xs muted mb-1">{label}</div>
      {photo?.url ? (
        <div className="stack" style={{ gap: '.4rem' }}>
          <img src={photo.url} alt={label} style={{ width: '100%', maxWidth: 220, borderRadius: 'var(--r-md)', display: 'block' }} />
          <span className="xs muted">Ajoutée le {formatDate(photo.date)}</span>
          <Button variant="ghost" size="sm" icon="fa-solid fa-arrow-rotate-left" onClick={() => inputRef.current?.click()}>Remplacer</Button>
        </div>
      ) : (
        <Button variant="soft" size="sm" icon="fa-solid fa-camera" onClick={() => inputRef.current?.click()}>Ajouter la photo</Button>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  );
}
