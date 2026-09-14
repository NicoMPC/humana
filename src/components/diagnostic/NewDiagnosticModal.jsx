import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useCurrentUser, useStore } from '../../store/useStore';
import { isPatronne, visibleClients } from '../../store/selectors';
import { DIAG_TYPES } from '../../data/constants';
import { fullName, normalize } from '../../lib/format';
import { toast } from '../../store/useUI';
import { Avatar, Button, Modal, SearchBar } from '../ui';
import { ClientFormModal } from '../clients/ClientFormModal';

/**
 * Lancement d'un diagnostic en 2 temps : type (peau / cheveux) puis cliente
 * (existante ou nouvelle). Si `clientId` est fourni, l'étape cliente est sautée.
 */
export function NewDiagnosticModal({ open, onClose, clientId = null }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const clients = useStore(useShallow((s) => visibleClients(s, user)));
  const createDiagnostic = useStore((s) => s.createDiagnostic);
  const [type, setType] = useState(null);
  const [search, setSearch] = useState('');
  const [newClient, setNewClient] = useState(false);

  useEffect(() => { if (open) { setType(null); setSearch(''); } }, [open]);

  const filtered = useMemo(() => {
    const q = normalize(search);
    return clients.filter((c) => !q || normalize(fullName(c)).includes(q) || normalize(c.email).includes(q)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).slice(0, 8);
  }, [clients, search]);

  const start = (client, chosenType = type) => {
    const d = createDiagnostic({ clientId: client.id, type: chosenType, praticienneId: isPatronne(user) ? client.praticienne_id : user.id, auteurId: user.id });
    onClose();
    toast(`Diagnostic ${DIAG_TYPES[chosenType].label.toLowerCase()} démarré pour ${client.prenom}`);
    navigate(`/diagnostic/${d.id}`);
  };

  const pickType = (t) => {
    if (clientId) {
      const c = clients.find((x) => x.id === clientId);
      if (c) return start(c, t);
    }
    setType(t);
  };

  return (
    <>
      <Modal open={open && !newClient} onClose={onClose} title="Nouveau diagnostic" subtitle={type ? `Diagnostic ${DIAG_TYPES[type].label.toLowerCase()} · pour quelle cliente ?` : 'Quel type de diagnostic souhaitez-vous réaliser ?'}>
        {!type ? (
          <div className="grid-2 stagger">
            {Object.values(DIAG_TYPES).map((t) => (
              <button key={t.key} type="button" className="card interactive" style={{ textAlign: 'left', display: 'grid', gap: '.5rem' }} onClick={() => pickType(t.key)}>
                <span className={`card-icon ${t.color === 'clay' ? 'accent' : ''}`} style={{ width: 48, height: 48, fontSize: '1.3rem' }}><i className={t.icon} /></span>
                <h3>{t.label}</h3>
                <p className="small muted">{t.key === 'peau' ? 'Type de peau, préoccupations, routine visage matin / soir.' : 'Nature du cheveu, cuir chevelu, routine capillaire.'}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="stack">
            <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une cliente…" autoFocus />
            <div className="stack" style={{ gap: '.4rem', maxHeight: '40vh', overflow: 'auto' }}>
              {filtered.map((c) => (
                <button key={c.id} type="button" className="account" onClick={() => start(c)}>
                  <Avatar person={c} />
                  <span className="who"><b>{fullName(c)}</b><span>{c.email || 'Email à renseigner'}</span></span>
                  <i className="fa-solid fa-arrow-right muted" />
                </button>
              ))}
              {!filtered.length && <p className="muted small" style={{ textAlign: 'center', padding: '1rem' }}>Aucune cliente ne correspond.</p>}
            </div>
            <div className="divider-text">ou</div>
            <Button variant="soft" icon="fa-solid fa-user-plus" block onClick={() => setNewClient(true)}>Créer une nouvelle cliente</Button>
            <Button variant="ghost" size="sm" icon="fa-solid fa-arrow-left" onClick={() => setType(null)} style={{ justifySelf: 'start' }}>Changer de type</Button>
          </div>
        )}
      </Modal>
      <ClientFormModal open={newClient} onClose={() => setNewClient(false)} onSaved={(c) => start(c)} />
    </>
  );
}
