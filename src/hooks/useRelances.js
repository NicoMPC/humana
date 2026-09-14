import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { isPhotosDue, isRelanceDue, visibleDiagnostics } from '../store/selectors';
import { todayISO } from '../lib/dates';

const SESSION_KEY = 'humana.relances.lastRun';

/**
 * Au démarrage d'une session (et une fois par jour) : signale les relances
 * à faire et les photos avant/après à recueillir par un simple toast — ce
 * hook ne fait que prévenir, jamais n'envoie rien (l'envoi se fait toujours
 * depuis `SendStep`, avec aperçu et confirmation explicite).
 */
export function useRelancesAtStartup(user) {
  const navigate = useNavigate();
  const ran = useRef(false);
  useEffect(() => {
    if (!user || ran.current) return;
    const stamp = `${user.id}:${todayISO()}`;
    let last = null;
    try { last = sessionStorage.getItem(SESSION_KEY); } catch { /* stockage indisponible */ }
    if (last === stamp) return;
    ran.current = true;
    try { sessionStorage.setItem(SESSION_KEY, stamp); } catch { /* ignore */ }

    const t = setTimeout(() => {
      const state = useStore.getState();
      const visible = visibleDiagnostics(state, user);

      const due = visible.filter((d) => isRelanceDue(d));
      if (due.length) {
        state.notify('relances', {
          toastMessage: `${due.length} relance${due.length > 1 ? 's' : ''} à envoyer aujourd’hui`,
          toastType: 'warning', toastDuration: 6000, toastAction: { label: 'Voir', onClick: () => navigate('/') },
        });
      }

      const photosDue = visible.filter((d) => isPhotosDue(d, state.settings));
      if (photosDue.length) {
        state.notify('photos', {
          toastMessage: `${photosDue.length} suivi${photosDue.length > 1 ? 's' : ''} photo${photosDue.length > 1 ? 's' : ''} avant/après à recueillir`,
          toastType: 'info', toastDuration: 6000, toastAction: { label: 'Voir', onClick: () => navigate(`/clientes/${photosDue[0].client_id}`) },
        });
      }
    }, 900);
    // Pas de nettoyage du timer ici : la garde ran.current empêche toute
    // double planification (y compris sous le double-rendu de développement
    // de React.StrictMode), donc annuler ce timer sur un « unmount » simulé
    // empêcherait la relance de partir sans jamais être replanifiée.
    return undefined;
  }, [user, navigate]);
}
