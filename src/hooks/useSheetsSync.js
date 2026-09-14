import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { pullSnapshot, pushClient, pushDiagnostic, pushSettings } from '../lib/sheetsSync';

// Entre deux rafraîchissements déclenchés par un retour sur l'onglet
// (`focus`/`visibilitychange`) : évite d'enchaîner plusieurs pulls si les
// deux événements se déclenchent l'un après l'autre, ou si la praticienne
// change d'onglet plusieurs fois de suite en quelques secondes.
const MIN_REFRESH_INTERVAL_MS = 15000;

/**
 * Amorce la synchronisation Google Sheets au démarrage de l'app, puis pousse
 * en tâche de fond toute cliente/diagnostic/réglage modifié localement, et
 * rafraîchit depuis le Sheet à chaque retour sur l'onglet (2 postes : capte
 * ce que l'autre poste a pu changer entre-temps, voir README). Voir
 * `lib/sheetsSync.js` pour les limites assumées (pas de résolution de
 * conflits, tolérant au hors-ligne).
 */
export function useSheetsSync() {
  // Ne garde que l'amorçage (pull + seed initial) à usage unique : sous
  // React.StrictMode (dev), l'effet est monté/démonté/remonté une fois pour
  // détecter les nettoyages incorrects — si ce garde-fou protégeait aussi le
  // `subscribe`/les écouteurs ci-dessous, le démontage simulé les retirerait
  // sans jamais les remettre en place, et plus rien ne resynchroniserait
  // après le tout premier chargement (silencieux, sans erreur visible). Le
  // `subscribe`/`unsubscribe` et les écouteurs focus doivent donc se rejouer
  // à chaque exécution de l'effet, y compris ce remontage simulé.
  const started = useRef(false);
  const lastRefresh = useRef(0);

  useEffect(() => {
    /** Tire un instantané du Sheet et remplace l'état local s'il contient des données. */
    const refreshFromServer = async () => {
      const now = Date.now();
      if (now - lastRefresh.current < MIN_REFRESH_INTERVAL_MS) return null;
      lastRefresh.current = now;
      const snapshot = await pullSnapshot();
      if (!snapshot || snapshot.ok === false) return null;
      const state = useStore.getState();
      const hasServerData = (snapshot.clients?.length || 0) > 0 || (snapshot.diagnostics?.length || 0) > 0;
      if (hasServerData) {
        useStore.setState({
          clients: snapshot.clients,
          diagnostics: snapshot.diagnostics,
          produits: snapshot.produits?.length ? snapshot.produits : state.produits,
          settings: Object.keys(snapshot.settings || {}).length ? { ...state.settings, ...snapshot.settings } : state.settings,
        });
      }
      return { localState: state, hasServerData };
    };

    if (!started.current) {
      started.current = true;
      (async () => {
        const result = await refreshFromServer();
        if (result && !result.hasServerData) {
          // Premier poste à synchroniser : amorce le Sheet avec l'état local.
          const { localState } = result;
          localState.clients.forEach(pushClient);
          localState.diagnostics.forEach(pushDiagnostic);
          pushSettings(localState.settings);
        }
      })();
    }

    let prev = useStore.getState();
    const unsubscribe = useStore.subscribe((state) => {
      if (state.clients !== prev.clients) {
        state.clients.forEach((c) => {
          if (c !== prev.clients.find((p) => p.id === c.id)) pushClient(c);
        });
      }
      if (state.diagnostics !== prev.diagnostics) {
        state.diagnostics.forEach((d) => {
          if (d !== prev.diagnostics.find((p) => p.id === d.id)) pushDiagnostic(d);
        });
      }
      if (state.settings !== prev.settings) pushSettings(state.settings);
      prev = state;
    });

    const onWake = () => { if (document.visibilityState !== 'hidden') refreshFromServer(); };
    window.addEventListener('focus', onWake);
    document.addEventListener('visibilitychange', onWake);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', onWake);
      document.removeEventListener('visibilitychange', onWake);
    };
  }, []);
}
