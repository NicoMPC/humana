import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { stockFreshness } from '../../store/selectors';
import { CardIcon, Button } from '../ui';

// « Force tranquille » : le niveau `warning` (stock qui reste à rafraîchir
// dans les temps, voir isPatronne/stockFreshness) reste sur la palette de
// marque (sauge) ; seul `danger` (retard important) justifie l'argile vif.
const COPY = {
  ok: { icon: 'fa-solid fa-circle-check', tone: '', cta: 'Importer un stock plus récent' },
  warning: { icon: 'fa-solid fa-box-open', tone: '', cta: 'Importer maintenant' },
  danger: { icon: 'fa-solid fa-triangle-exclamation', tone: 'accent', cta: 'Importer maintenant' },
};

/**
 * Rappel de fraîcheur du catalogue produits : un import Planity est attendu
 * au moins une fois par semaine pour que le stock affiché reste fiable.
 * `compact` réduit la carte pour l'en-tête de la page Produits.
 */
export function StockFreshnessBanner({ compact = false }) {
  const navigate = useNavigate();
  const state = useStore();
  const { days, level, last } = stockFreshness(state);
  const copy = COPY[level];

  const label = last == null
    ? 'Stock jamais importé depuis Planity'
    : level === 'ok'
      ? `Stock à jour · importé il y a ${days} jour${days > 1 ? 's' : ''}`
      : `Stock non rafraîchi depuis ${days} jour${days > 1 ? 's' : ''} — un import par semaine est recommandé`;

  if (compact) {
    return (
      <button type="button" className={`badge ${level === 'danger' ? 'badge-red' : 'badge-sage'}`} onClick={() => navigate('/produits?import=1')} title={label}>
        <i className={copy.icon} /> {level === 'ok' ? 'Stock à jour' : 'Stock à rafraîchir'}
      </button>
    );
  }

  return (
    <div className={`stock-banner ${level !== 'ok' ? `is-${level}` : ''}`}>
      <CardIcon icon={copy.icon} tone={copy.tone} />
      <div className="grow">
        <b>Fraîcheur du stock</b>
        <div className="small muted">{label}</div>
      </div>
      <Button variant={level === 'danger' ? 'accent' : level === 'warning' ? 'soft' : 'ghost'} size="sm" icon="fa-solid fa-file-arrow-up" onClick={() => navigate('/produits?import=1')}>
        {copy.cta}
      </Button>
    </div>
  );
}
