import { useStore } from '../../store/useStore';
import { LIFESTYLE_TIPS } from '../../data/constants';
import { Button, Notice } from '../ui';

/** Sélection des conseils lifestyle et génération du PDF correspondant. */
export function LifestyleStep({ diag, onGenerate, busy }) {
  const toggle = useStore((s) => s.toggleLifestyle);

  return (
    <div className="stack">
      <p className="muted small">Cochez les conseils bien-être complémentaires à inclure dans un document séparé, à remettre en plus de la routine.</p>
      <div className="tips-grid">
        {LIFESTYLE_TIPS.map((tip) => {
          const on = diag.lifestyle.includes(tip.id);
          return (
            <button key={tip.id} type="button" className={`tip-card ${on ? 'is-on' : ''}`} onClick={() => toggle(diag.id, tip.id)} aria-pressed={on}>
              <span className="tip-icon"><i className={tip.icon} /></span>
              <span>
                <b>{tip.titre}</b>
                <p>{tip.texte}</p>
              </span>
            </button>
          );
        })}
      </div>
      <Button variant="accent" icon="fa-solid fa-file-pdf" loading={busy} disabled={!diag.lifestyle.length} onClick={onGenerate}>
        Générer le PDF lifestyle
      </Button>
    </div>
  );
}
