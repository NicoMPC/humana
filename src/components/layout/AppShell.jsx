import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUser, useStore } from '../../store/useStore';
import { useUI } from '../../store/useUI';
import { isPatronne, isRelanceDue, visibleDiagnostics } from '../../store/selectors';
import { fullName } from '../../lib/format';
import { Avatar, Button, Dropdown } from '../ui';
import { useRelancesAtStartup } from '../../hooks/useRelances';
import { useStockReminderAtStartup } from '../../hooks/useStockReminder';
import { NewDiagnosticModal } from '../diagnostic/NewDiagnosticModal';
import { BugReportModal } from './BugReportModal';
import { TutorialBanner } from './TutorialBanner';
import { hasSeenOnboarding, OnboardingWizard } from './OnboardingWizard';

const NAV = [
  { to: '/', label: 'Accueil', icon: 'fa-solid fa-house', end: true },
  { to: '/clientes', label: 'Clientes', icon: 'fa-solid fa-user-group' },
  { to: '/documents', label: 'Documents', icon: 'fa-regular fa-file-pdf' },
  { to: '/produits', label: 'Produits', icon: 'fa-solid fa-box-open' },
];
// Gardé hors du bas de nav mobile (4 icônes + « Plus ») : accessible depuis
// le tiroir mobile et le bas de la barre latérale sur desktop. La page
// « Équipe » a été retirée du routage (2 gérantes pour le moment, voir
// README) — la remettre ici et dans `App.jsx`/`TITLES` suffirait à la
// réactiver, `EquipePage.jsx` et les actions store associées sont conservés.
const NAV_SETTINGS = { to: '/parametres', label: 'Paramètres', icon: 'fa-solid fa-sliders' };

export const TITLES = [
  [/^\/$/, 'Accueil'], [/^\/clientes\/.+/, 'Fiche cliente'], [/^\/clientes/, 'Clientes'], [/^\/diagnostic/, 'Diagnostic'],
  [/^\/documents/, 'Documents'], [/^\/produits/, 'Produits'], [/^\/parametres/, 'Paramètres'],
];

export const pageLabel = (pathname) => TITLES.find(([re]) => re.test(pathname))?.[1] || 'Humana';

export function AppShell({ children }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useStore((s) => s.logout);
  const diagnostics = useStore((s) => s.diagnostics);
  const [newDiag, setNewDiag] = useState(false);
  const [bugOpen, setBugOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const tutorielActif = useUI((s) => s.tutorielActif);
  const toggleTutoriel = useUI((s) => s.toggleTutoriel);

  useRelancesAtStartup(user);
  useStockReminderAtStartup(user);

  useEffect(() => {
    if (!user || location.pathname !== '/' || hasSeenOnboarding(user.id)) return undefined;
    const t = setTimeout(() => setOnboardingOpen(true), 900);
    return () => clearTimeout(t);
  }, [user, location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); setDrawer(false); }, [location.pathname]);

  const dueCount = useMemo(() => visibleDiagnostics({ diagnostics }, user).filter((d) => isRelanceDue(d)).length, [diagnostics, user]);
  const title = pageLabel(location.pathname);
  const admin = isPatronne(user);

  const navLink = (item) => (
    <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}>
      <i className={item.icon} /> {item.label}
      {item.to === '/' && dueCount > 0 && <span className="count-pill accent nav-count">{dueCount}</span>}
    </NavLink>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo"><img src="./brand/logo-vert-crop.png" alt="Hu'mana – La Boutique" /></div>
        <Button variant="accent" icon="fa-solid fa-plus" block className="sidebar-cta" onClick={() => setNewDiag(true)}>Nouveau diagnostic</Button>
        <nav className="nav-list" aria-label="Navigation principale">
          {NAV.map(navLink)}
          {navLink(NAV_SETTINGS)}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <Avatar person={user} color={user.couleur} />
            <div className="grow">
              <div className="user-name truncate">{fullName(user)}</div>
              <div className="user-role">{admin ? 'Gérante' : 'Praticienne'}</div>
            </div>
            <Button variant="ghost" size="sm" icon="fa-solid fa-arrow-right-from-bracket" onClick={() => { logout(); navigate('/login'); }} aria-label="Se déconnecter" title="Se déconnecter" />
          </div>
        </div>
      </aside>

      <div className="main">
        <header className={`topbar ${scrolled ? 'is-scrolled' : ''}`}>
          <img className="topbar-logo" src="./brand/logo-vert-crop.png" alt="Hu'mana" />
          <div className="topbar-title"><span>Humana</span><i className="fa-solid fa-chevron-right" /><span style={{ color: 'var(--text)' }}>{title}</span></div>
          <div className="topbar-actions">
            <Button
              variant={tutorielActif ? 'accent' : 'ghost'}
              icon="fa-solid fa-graduation-cap"
              onClick={toggleTutoriel}
              aria-pressed={tutorielActif}
              title={tutorielActif ? 'Désactiver le tutoriel' : 'Activer le tutoriel'}
            >
              <span className="hide-mobile">Tutoriel</span>
            </Button>
            <Dropdown
              trigger={<button type="button" className="btn btn-ghost" style={{ padding: '.2rem .4rem' }} aria-label="Menu utilisatrice"><Avatar person={user} size="sm" color={user.couleur} /></button>}
              items={[
                { label: fullName(user), icon: 'fa-regular fa-user' },
                { label: 'Paramètres', icon: 'fa-solid fa-sliders', onClick: () => navigate('/parametres') },
                { label: 'Se déconnecter', icon: 'fa-solid fa-arrow-right-from-bracket', onClick: () => { logout(); navigate('/login'); }, danger: true },
              ]}
            />
          </div>
        </header>
        <main className="page" key={location.pathname}>
          <TutorialBanner />
          {children}
        </main>
      </div>

      <button
        type="button"
        className="bug-fab"
        aria-label="Signaler un problème ou une remarque"
        title="Signaler un problème ou une remarque"
        onClick={() => setBugOpen(true)}
      >
        <i className="fa-solid fa-bug" />
      </button>

      {/* Mobile */}
      <button type="button" className="fab" aria-label="Nouveau diagnostic" onClick={() => setNewDiag(true)}><i className="fa-solid fa-plus" /></button>
      <nav className="bottom-nav" aria-label="Navigation mobile">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
            {({ isActive }) => (
              <button type="button" className={isActive ? 'is-active' : ''} tabIndex={-1}>
                <i className={item.icon} />{item.label}
                {item.to === '/' && dueCount > 0 && <span className="notif-dot" style={{ top: 8, right: 'calc(50% - 16px)' }} />}
              </button>
            )}
          </NavLink>
        ))}
        <button type="button" onClick={() => setDrawer(true)} className={drawer ? 'is-active' : ''}><i className="fa-solid fa-ellipsis" />Plus</button>
      </nav>
      {drawer && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawer(false)} />
          <div className="drawer" role="dialog" aria-label="Menu">
            <div className="grabber" />
            <div className="user-card mb-2">
              <Avatar person={user} color={user.couleur} />
              <div className="grow"><div className="user-name">{fullName(user)}</div><div className="user-role">{admin ? 'Gérante' : 'Praticienne'}</div></div>
            </div>
            <nav className="nav-list">
              {navLink(NAV_SETTINGS)}
              <button type="button" className="nav-item" onClick={() => { logout(); navigate('/login'); }}><i className="fa-solid fa-arrow-right-from-bracket" /> Se déconnecter</button>
            </nav>
          </div>
        </>
      )}

      <NewDiagnosticModal open={newDiag} onClose={() => setNewDiag(false)} />
      <BugReportModal open={bugOpen} onClose={() => setBugOpen(false)} />
      {user && <OnboardingWizard open={onboardingOpen} onClose={() => setOnboardingOpen(false)} user={user} />}
    </div>
  );
}
