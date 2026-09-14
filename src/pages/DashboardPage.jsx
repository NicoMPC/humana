import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useCurrentUser, useStore } from '../store/useStore';
import { assignableUsers, dashboardStats, isPatronne, isPhotosDue, isRelanceDue, stockFreshness, visibleDiagnostics } from '../store/selectors';
import { fullName } from '../lib/format';
import { diffDays, formatDateLong, todayISO } from '../lib/dates';
import { Button, CardIcon, EmptyState, Segmented } from '../components/ui';
import { DiagnosticCard } from '../components/diagnostic/DiagnosticCard';
import { NewDiagnosticModal } from '../components/diagnostic/NewDiagnosticModal';
import { StockFreshnessBanner } from '../components/produits/StockFreshnessBanner';

const BOARD_LIST_LIMIT = 5;
// « Force tranquille » (voir styles/pages.css, section Dashboard) : au-delà
// de ce nombre de jours de retard, une relance ou un stock à rafraîchir
// passe du sauge/crème habituel à l'argile plus soutenu — réservé aux
// situations vraiment urgentes plutôt qu'à toute échéance atteinte.
const URGENT_LATE_DAYS = 3;

/*
 * Réorganisation du 11/09/2026 (docs/audit-coherence-metier.md) : le kanban
 * calqué sur les statuts bruts (brouillon / envoyé / terminé) mélangeait
 * la progression de saisie et le suivi relationnel, sans répondre aux
 * priorités réelles d'une gérante en boutique. Remplacé par « Aujourd'hui »
 * (RDV du jour + diagnostics pas encore envoyés), « À suivre » (envoyés,
 * triés par urgence de relance) et un historique replié (terminés).
 */
export default function DashboardPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const diagnostics = useStore(useShallow((s) => visibleDiagnostics(s, user)));
  const prats = useStore(useShallow((s) => assignableUsers(s)));
  const delai = useStore((s) => s.settings.delai_relance_jours);
  const settings = useStore((s) => s.settings);
  const stockLevel = useStore((s) => stockFreshness(s).level);
  const [filterPrat, setFilterPrat] = useState('all');
  const [newDiag, setNewDiag] = useState(false);
  const [expandedCols, setExpandedCols] = useState({});
  const [historiqueOpen, setHistoriqueOpen] = useState(false);
  const admin = isPatronne(user);
  const today = todayISO();

  const list = useMemo(() => (admin && filterPrat !== 'all' ? diagnostics.filter((d) => d.praticienne_id === filterPrat) : diagnostics), [diagnostics, admin, filterPrat]);
  const stats = dashboardStats(list);
  const due = list.filter((d) => isRelanceDue(d));
  const dueUrgent = due.filter((d) => diffDays(d.date_relance, today) >= URGENT_LATE_DAYS);
  const photosDue = list.filter((d) => isPhotosDue(d, settings));
  const sortByDate = (a, b) => (a.date_rdv < b.date_rdv ? 1 : -1);

  const todayItems = useMemo(() => list.filter((d) => (d.statut !== 'envoye' && d.statut !== 'termine') || d.date_rdv === today).sort(sortByDate), [list, today]);
  const suiviItems = useMemo(() => [...list.filter((d) => d.statut === 'envoye')].sort((a, b) => (isRelanceDue(b) - isRelanceDue(a)) || sortByDate(a, b)), [list]);
  const historiqueItems = useMemo(() => list.filter((d) => d.statut === 'termine').sort(sortByDate), [list]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const openHistorique = () => { setHistoriqueOpen(true); requestAnimationFrame(() => scrollTo('historique')); };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{formatDateLong(todayISO())}</div>
          <h1>{greeting} {user.prenom}</h1>
          <p className="lead">{stats.aujourdhui ? `${stats.aujourdhui} diagnostic${stats.aujourdhui > 1 ? 's' : ''} aujourd’hui · ` : ''}{stats.ce_mois} ce mois-ci</p>
        </div>
        <div className="page-actions">
          {admin && prats.length > 1 && (
            <Segmented size="sm" value={filterPrat} onChange={setFilterPrat} options={[{ value: 'all', label: 'Toutes' }, ...prats.map((p) => ({ value: p.id, label: p.prenom }))]} />
          )}
          <Button variant="accent" icon="fa-solid fa-plus" onClick={() => setNewDiag(true)} className="hide-mobile">Nouveau diagnostic</Button>
        </div>
      </div>

      <div className="stats-row stagger">
        <StatCard icon="fa-regular fa-pen-to-square" tone="amber" value={stats.brouillon} label="En préparation" onClick={() => scrollTo('col-aujourdhui')} />
        <StatCard icon="fa-regular fa-paper-plane" value={stats.envoye} label="Envoyés" onClick={() => scrollTo('col-suivi')} />
        <StatCard icon="fa-regular fa-bell" tone={dueUrgent.length > 0 ? 'accent' : ''} value={stats.relances_dues} label="Relances à faire" alert={dueUrgent.length > 0} due={!dueUrgent.length && stats.relances_dues > 0} onClick={() => scrollTo('due')} />
        <StatCard icon="fa-regular fa-circle-check" tone="" value={stats.termine} label="Terminés" onClick={openHistorique} />
      </div>

      <StockFreshnessBanner compact={stockLevel === 'ok'} />

      {due.length > 0 && (
        <div className={`due-banner anim-fade-up ${dueUrgent.length ? '' : 'is-soft'}`} id="due">
          <CardIcon icon="fa-regular fa-bell" tone={dueUrgent.length ? 'accent' : ''} />
          <div className="grow">
            <b>{due.length} relance{due.length > 1 ? 's' : ''} J+{delai} à envoyer</b>
            <div className="small muted">
              {due.slice(0, 3).map((d) => <ClientName key={d.id} id={d.client_id} />).reduce((acc, el, i) => (i ? [...acc, ', ', el] : [el]), [])}
              {due.length > 3 ? ` et ${due.length - 3} autre${due.length - 3 > 1 ? 's' : ''}` : ''}
            </div>
          </div>
          <Button variant={dueUrgent.length ? 'accent' : 'soft'} icon="fa-solid fa-arrow-right" onClick={() => navigate(`/diagnostic/${due[0].id}`)}>Traiter la première</Button>
        </div>
      )}

      {photosDue.length > 0 && (
        <div className="due-banner is-soft anim-fade-up" id="photos-due">
          <CardIcon icon="fa-solid fa-camera" />
          <div className="grow">
            <b>{photosDue.length} suivi{photosDue.length > 1 ? 's' : ''} photo{photosDue.length > 1 ? 's' : ''} avant/après à recueillir</b>
            <div className="small muted">
              {photosDue.slice(0, 3).map((d) => <ClientName key={d.id} id={d.client_id} />).reduce((acc, el, i) => (i ? [...acc, ', ', el] : [el]), [])}
              {photosDue.length > 3 ? ` et ${photosDue.length - 3} autre${photosDue.length - 3 > 1 ? 's' : ''}` : ''}
            </div>
          </div>
          <Button variant="soft" icon="fa-solid fa-arrow-right" onClick={() => navigate(`/clientes/${photosDue[0].client_id}`)}>Voir la fiche</Button>
        </div>
      )}

      <div className="board">
        <BoardSection id="col-aujourdhui" title="Aujourd’hui" color="var(--amber-400)" empty="Rien à traiter aujourd’hui" items={todayItems}
          expanded={!!expandedCols.aujourdhui} onToggle={() => setExpandedCols((s) => ({ ...s, aujourdhui: !s.aujourdhui }))}
          admin={admin} filterPrat={filterPrat} />
        <BoardSection id="col-suivi" title="À suivre" color="var(--sage-400)" empty="Aucun suivi en attente" items={suiviItems}
          expanded={!!expandedCols.suivi} onToggle={() => setExpandedCols((s) => ({ ...s, suivi: !s.suivi }))}
          admin={admin} filterPrat={filterPrat} />
      </div>

      <section className="card mt-4" id="historique">
        <div className="card-header">
          <button type="button" className="card-title-row" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }} onClick={() => setHistoriqueOpen((v) => !v)}>
            <i className={`fa-solid ${historiqueOpen ? 'fa-chevron-down' : 'fa-chevron-right'} xs muted`} />
            <div><div className="eyebrow">Historique</div><h3>Diagnostics terminés</h3></div>
          </button>
          <span className="count-pill">{historiqueItems.length}</span>
        </div>
        {historiqueOpen && (
          historiqueItems.length ? (
            <div className="grid-auto stagger">{historiqueItems.map((d) => <DiagnosticCard key={d.id} diag={d} showPractitioner={admin && filterPrat === 'all'} />)}</div>
          ) : <EmptyState compact icon="fa-regular fa-face-smile" text="Aucun diagnostic terminé" />
        )}
      </section>

      <NewDiagnosticModal open={newDiag} onClose={() => setNewDiag(false)} />
    </>
  );
}

function BoardSection({ id, title, color, empty, items, expanded, onToggle, admin, filterPrat }) {
  const visible = expanded ? items : items.slice(0, BOARD_LIST_LIMIT);
  const hidden = items.length - visible.length;
  return (
    <section className="board-col" id={id}>
      <div className="board-col-head"><span className="dot" style={{ background: color }} /><h3>{title}</h3><span className="count-pill">{items.length}</span></div>
      <div className="board-list stagger">
        {visible.length ? visible.map((d) => <DiagnosticCard key={d.id} diag={d} showPractitioner={admin && filterPrat === 'all'} />) : <EmptyState compact icon="fa-regular fa-face-smile" text={empty} />}
      </div>
      {items.length > BOARD_LIST_LIMIT && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={onToggle}>{expanded ? 'Réduire' : `Voir ${hidden} de plus`}</Button>
      )}
    </section>
  );
}

function StatCard({ icon, tone, value, label, alert = false, due = false, onClick }) {
  return (
    <button type="button" className={`card stat ${alert ? 'is-alert' : due ? 'is-due' : ''}`} onClick={onClick}>
      <CardIcon icon={icon} tone={tone} />
      <span><span className="stat-value">{value}</span><br /><span className="stat-label">{label}</span></span>
    </button>
  );
}

function ClientName({ id }) {
  const c = useStore((s) => s.clients.find((x) => x.id === id));
  return <span>{fullName(c)}</span>;
}
