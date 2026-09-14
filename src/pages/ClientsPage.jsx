import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useStore } from '../store/useStore';
import { assignableUsers, clientStats, isPatronne, visibleClients } from '../store/selectors';
import { fullName, normalize } from '../lib/format';
import { relativeDays } from '../lib/dates';
import { Avatar, Button, EmptyState, Segmented, SearchBar } from '../components/ui';
import { ClientFormModal } from '../components/clients/ClientFormModal';

export default function ClientsPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const state = useStore();
  const clients = visibleClients(state, user);
  const prats = assignableUsers(state);
  const admin = isPatronne(user);
  const [search, setSearch] = useState('');
  const [filterPrat, setFilterPrat] = useState('all');
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(search);
    return clients
      .filter((c) => (admin && filterPrat !== 'all' ? c.praticienne_id === filterPrat : true))
      .filter((c) => !q || normalize(fullName(c)).includes(q) || normalize(c.email).includes(q) || normalize(c.telephone).includes(q))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }, [clients, search, filterPrat, admin]);

  const groups = useMemo(() => {
    const map = {};
    filtered.forEach((c) => {
      const letter = (c.nom[0] || '#').toUpperCase();
      (map[letter] ||= []).push(c);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'fr'));
  }, [filtered]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Carnet client</div>
          <h1>Clientes</h1>
          <p className="lead">{clients.length} cliente{clients.length > 1 ? 's' : ''} au total</p>
        </div>
        <div className="page-actions">
          <div style={{ width: 240 }}><SearchBar value={search} onChange={setSearch} placeholder="Nom, email, téléphone…" /></div>
          <Button variant="primary" icon="fa-solid fa-user-plus" onClick={() => setFormOpen(true)}>Nouvelle cliente</Button>
        </div>
      </div>

      {admin && prats.length > 1 && (
        <div className="mb-3">
          <Segmented value={filterPrat} onChange={setFilterPrat} options={[{ value: 'all', label: 'Toutes' }, ...prats.map((p) => ({ value: p.id, label: p.prenom }))]} />
        </div>
      )}

      {!filtered.length ? (
        <EmptyState icon="fa-solid fa-user-group" title="Aucune cliente" text={search ? 'Aucun résultat pour cette recherche.' : 'Créez votre première fiche cliente pour commencer.'}
          action={!search && <Button variant="primary" icon="fa-solid fa-user-plus" onClick={() => setFormOpen(true)}>Nouvelle cliente</Button>} />
      ) : (
        groups.map(([letter, list]) => (
          <div key={letter}>
            <div className="alpha-group">{letter}</div>
            <div className="grid-auto stagger">
              {list.map((c) => <ClientCard key={c.id} client={c} onClick={() => navigate(`/clientes/${c.id}`)} showPrat={admin && filterPrat === 'all'} />)}
            </div>
          </div>
        ))
      )}
      <ClientFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={(c) => navigate(`/clientes/${c.id}`)} />
    </>
  );
}

function ClientCard({ client, onClick, showPrat }) {
  const state = useStore();
  const stats = clientStats(state, client.id);
  const prat = state.users.find((u) => u.id === client.praticienne_id);
  return (
    <article className="card interactive client-card" role="link" tabIndex={0} onClick={onClick} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}>
      <Avatar person={client} />
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="client-name truncate">{fullName(client)}</div>
        <div className="client-sub">
          <span><i className="fa-regular fa-envelope" /> {client.email || 'Non renseigné'}</span>
          {showPrat && prat && <span><i className="fa-regular fa-user" /> {prat.prenom}</span>}
        </div>
      </div>
      <div className="client-right">
        <span className="count-pill">{stats.total} diag.</span>
        {stats.last && <span className="xs muted">{relativeDays(stats.last.date_rdv)}</span>}
      </div>
    </article>
  );
}
