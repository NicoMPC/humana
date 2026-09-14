import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { stockFreshness } from '../store/selectors';
import { todayISO } from '../lib/dates';

const SESSION_KEY = 'humana.stock.lastReminder';

/**
 * Une fois par jour et par session : si le stock n'a pas été importé depuis
 * Planity depuis au moins une semaine, le signale par un toast au démarrage.
 */
export function useStockReminderAtStartup(user) {
  const navigate = useNavigate();
  const ran = useRef(false);
  useEffect(() => {
    if (!user || ran.current) return;
    const stamp = todayISO();
    let last = null;
    try { last = sessionStorage.getItem(SESSION_KEY); } catch { /* stockage indisponible */ }
    if (last === stamp) return;
    ran.current = true;
    try { sessionStorage.setItem(SESSION_KEY, stamp); } catch { /* ignore */ }

    const t = setTimeout(() => {
      const state = useStore.getState();
      const { level, days } = stockFreshness(state);
      if (level === 'ok') return;
      const message = days == null ? 'Le stock n’a jamais été importé depuis Planity' : `Stock non rafraîchi depuis ${days} jours — pensez à l’import Planity`;
      state.notify('stock', {
        toastMessage: message,
        toastType: level === 'danger' ? 'warning' : 'info', toastDuration: 6500,
        toastAction: { label: 'Importer', onClick: () => navigate('/produits?import=1') },
      });
    }, 1400); // après le rappel de relances, pour ne pas empiler les toasts
    return undefined;
  }, [user, navigate]);
}
