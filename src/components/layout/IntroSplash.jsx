import { useEffect, useRef, useState } from 'react';

const SEEN_KEY = 'humana.intro.shown';

/**
 * Voile de marque affiché une fois par session de navigateur, avant l'écran
 * de connexion — purement esthétique (aucune donnée, aucune navigation).
 * Respecte prefers-reduced-motion et ne rejoue pas si on revient sur /login
 * (déconnexion) dans la même session.
 */
export function IntroSplash() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Garde-fou contre le double-effet de React.StrictMode (dev uniquement,
  // même précaution que `useRelances.js`/`useStockReminder.js`) : l'effet
  // est monté/démonté/remonté une fois pour vérifier le nettoyage. Ne PAS
  // annuler les timers dans un cleanup ici : un vrai unmount plus tard rend
  // juste les `setState` différés inoffensifs (composant démonté), alors
  // qu'un cleanup qui les annule, combiné à la garde qui bloque le second
  // passage, empêcherait toute reprogrammation — le voile resterait affiché
  // indéfiniment (bug constaté). Voir le commentaire de `useRelances.js`
  // pour le même raisonnement.
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    let reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* ignore */ }
    let already = false;
    try { already = sessionStorage.getItem(SEEN_KEY) === '1'; } catch { /* stockage indisponible */ }
    if (reduced || already) return;
    ran.current = true;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }

    setVisible(true);
    setTimeout(() => setLeaving(true), 1300);
    setTimeout(() => setVisible(false), 1920);
  }, []);

  if (!visible) return null;

  return (
    <div className={`intro-splash ${leaving ? 'is-leaving' : ''}`} aria-hidden="true">
      <span className="intro-petal p1"><img src="./brand/fleur.png" alt="" /></span>
      <span className="intro-petal p2"><img src="./brand/fleur.png" alt="" /></span>
      <span className="intro-petal p3"><img src="./brand/fleur.png" alt="" /></span>
      <div className="intro-glow" />
      <div className="intro-mark"><img src="./brand/logo-blanc-crop.png" alt="Hu'mana" /></div>
      <p className="intro-tag">Beauté naturelle</p>
    </div>
  );
}
