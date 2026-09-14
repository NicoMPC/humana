import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useStore } from '../store/useStore';
import { assignableUsers, getClient, getUser, isPatronne, visibleDiagnostics } from '../store/selectors';
import { fullName } from '../lib/format';
import { formatDate, monthLabel } from '../lib/dates';
import { Avatar, Button, EmptyState, Segmented, TypeBadge } from '../components/ui';
import { usePdfActions } from '../hooks/usePdfActions';

export default function DocumentsPage() {
  const user = useCurrentUser();
  const state = useStore();
  const admin = isPatronne(user);
  const prats = assignableUsers(state);
  const [filterPrat, setFilterPrat] = useState('all');

  const diags = visibleDiagnostics(state, user)
    .filter((d) => d.documents?.length)
    .filter((d) => !admin || filterPrat === 'all' || d.praticienne_id === filterPrat)
    .sort((a, b) => (a.date_rdv < b.date_rdv ? 1 : -1));

  const groups = useMemo(() => {
    const map = {};
    diags.forEach((d) => { (map[d.date_rdv.slice(0, 7)] ||= []).push(d); });
    return Object.entries(map).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [diags]);

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">Documents générés</div><h1>PDF</h1><p className="lead">{diags.length} diagnostic{diags.length > 1 ? 's' : ''} avec au moins un document</p></div>
        {admin && prats.length > 1 && <Segmented value={filterPrat} onChange={setFilterPrat} options={[{ value: 'all', label: 'Toutes' }, ...prats.map((p) => ({ value: p.id, label: p.prenom }))]} />}
      </div>

      {!groups.length ? (
        <EmptyState icon="fa-regular fa-file-pdf" title="Aucun PDF pour le moment" text="Les PDF générés lors des diagnostics apparaîtront ici, classés par mois." />
      ) : (
        groups.map(([month, list]) => (
          <div key={month}>
            <h3 className="doc-month">{monthLabel(`${month}-01`)}</h3>
            <div className="stack stagger">{list.map((d) => <DocumentRow key={d.id} diag={d} showPractitioner={admin} />)}</div>
          </div>
        ))
      )}
    </>
  );
}

function DocumentRow({ diag, showPractitioner }) {
  const state = useStore();
  const navigate = useNavigate();
  const client = getClient(state, diag.client_id);
  const prat = getUser(state, diag.praticienne_id);
  const { busy, download } = usePdfActions(diag);
  const routineDoc = diag.documents.find((d) => d.type === 'routine');
  const lifestyleDoc = diag.documents.find((d) => d.type === 'lifestyle');

  return (
    <div className="card doc-row">
      <Avatar person={client} />
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="flex" style={{ gap: '.5rem' }}>
          <span className="semibold truncate">{fullName(client)}</span>
          <TypeBadge type={diag.type} />
        </div>
        <div className="xs muted mt-1">
          {formatDate(diag.date_rdv)}
          {showPractitioner && prat && ` · ${fullName(prat)}`}
          {routineDoc && ` · Routine v${routineDoc.version}`}
          {lifestyleDoc && ` · Lifestyle v${lifestyleDoc.version}`}
        </div>
      </div>
      <div className="flex doc-actions">
        {routineDoc && <Button variant="ghost" size="sm" icon="fa-solid fa-download" loading={busy === 'routine'} onClick={() => download('routine')}>Routine</Button>}
        {lifestyleDoc && <Button variant="ghost" size="sm" icon="fa-solid fa-download" loading={busy === 'lifestyle'} onClick={() => download('lifestyle')}>Lifestyle</Button>}
        <Button variant="soft" size="sm" icon="fa-solid fa-pen" onClick={() => navigate(`/diagnostic/${diag.id}`)}>Ouvrir</Button>
      </div>
    </div>
  );
}
