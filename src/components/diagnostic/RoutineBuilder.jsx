import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { produitsForType } from '../../store/selectors';
import { CATEGORY_MAP, MOMENTS } from '../../data/constants';
import { normalize } from '../../lib/format';
import { Button, EmptyState, SearchBar, Textarea } from '../ui';

/**
 * Construction de la routine : recherche/filtre à gauche, aperçu par moment
 * (Matin / Soir / Hebdo) à droite. Une praticienne peut ne composer qu'un
 * seul moment (ex. routine du soir uniquement).
 */
export function RoutineBuilder({ diag, onValidate }) {
  const state = useStore();
  const toggleProduct = useStore((s) => s.toggleRoutineProduct);
  const setItem = useStore((s) => s.setRoutineItem);
  const toggleMoment = useStore((s) => s.toggleRoutineMoment);
  const moveItem = useStore((s) => s.moveRoutineItem);
  const updateDiagnostic = useStore((s) => s.updateDiagnostic);

  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const products = produitsForType(state, diag.type);
  const categories = useMemo(() => [...new Set(products.map((p) => p.categorie))], [products]);
  const selectedIds = new Set(diag.routine.map((r) => r.produit_id));

  const filtered = useMemo(() => {
    const q = normalize(search);
    return products.filter((p) => (!cat || p.categorie === cat) && (!q || normalize(p.nom).includes(q) || normalize(p.description).includes(q)));
  }, [products, search, cat]);

  const invalidCount = diag.routine.filter((r) => !r.moments?.length).length;

  return (
    <div className="routine-layout">
      <div>
        <div className="routine-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un produit du catalogue…" />
          <div className="cat-chips">
            <button type="button" className={`chip chip-sm ${!cat ? 'is-active' : ''}`} onClick={() => setCat('')}>Toutes catégories</button>
            {categories.map((c) => (
              <button key={c} type="button" className={`chip chip-sm ${cat === c ? 'is-active' : ''}`} onClick={() => setCat(c)}>
                {CATEGORY_MAP[c]?.icon && <i className={CATEGORY_MAP[c].icon} />} {c}
              </button>
            ))}
          </div>
        </div>
        <div className="product-list">
          {filtered.length ? filtered.map((p) => {
            const checked = selectedIds.has(p.id);
            return (
              <button key={p.id} type="button" className={`product-pick ${checked ? 'is-selected' : ''}`} onClick={() => toggleProduct(diag.id, p.id)} aria-pressed={checked}>
                <span className="pick-box">{checked && <i className="fa-solid fa-check" />}</span>
                <span className="pick-body">
                  <span className="pick-name">{p.nom}</span>
                  <span className="pick-meta"><span>{p.categorie}</span><span>·</span><span>Réf. {p.reference}</span>{p.stock <= 3 && <span className="badge badge-amber xs">Stock bas</span>}</span>
                </span>
                <span className="pick-price">{p.prix} €</span>
              </button>
            );
          }) : <EmptyState compact icon="fa-solid fa-magnifying-glass" text="Aucun produit ne correspond à cette recherche." />}
        </div>
      </div>

      <div className="routine-panel">
        <div className="card">
          <div className="card-header">
            <div><div className="eyebrow">Routine composée</div><h3>{diag.routine.length} produit{diag.routine.length > 1 ? 's' : ''}</h3></div>
          </div>
          {!diag.routine.length ? (
            <EmptyState compact icon="fa-solid fa-hand-sparkles" text="Sélectionnez au moins un produit dans le catalogue." />
          ) : (
            <div className="routine-items">
              {diag.routine.map((item, index) => {
                const p = products.find((x) => x.id === item.produit_id) || state.produits.find((x) => x.id === item.produit_id);
                if (!p) return null;
                return (
                  <div key={item.produit_id} className="routine-item">
                    <div className="ri-top">
                      <span className="ri-num">{index + 1}</span>
                      <span className="ri-name truncate">{p.nom}</span>
                      <span className="ri-actions">
                        <Button variant="ghost" size="sm" icon="fa-solid fa-arrow-up" aria-label="Monter" onClick={() => moveItem(diag.id, index, index - 1)} disabled={index === 0} />
                        <Button variant="ghost" size="sm" icon="fa-solid fa-arrow-down" aria-label="Descendre" onClick={() => moveItem(diag.id, index, index + 1)} disabled={index === diag.routine.length - 1} />
                        <Button variant="ghost" size="sm" icon="fa-solid fa-xmark" aria-label="Retirer" onClick={() => toggleProduct(diag.id, item.produit_id)} />
                      </span>
                    </div>
                    <div className="ri-moments">
                      {MOMENTS.map((m) => (
                        <button key={m.key} type="button" className={`moment-chip ${m.key} ${item.moments.includes(m.key) ? 'is-on' : ''}`} onClick={() => toggleMoment(diag.id, item.produit_id, m.key)} title={m.hint}>
                          <i className={m.icon} /> {m.label}
                        </button>
                      ))}
                    </div>
                    <input className="input input-sm" placeholder="Conseil d’utilisation (ex. 2 gouttes, sur peau humide…)" value={item.conseil || ''} onChange={(e) => setItem(diag.id, item.produit_id, { conseil: e.target.value })} />
                  </div>
                );
              })}
            </div>
          )}
          {!!invalidCount && <p className="xs mt-2" style={{ color: 'var(--accent-strong)' }}><i className="fa-solid fa-triangle-exclamation" /> Choisissez au moins un moment pour chaque produit.</p>}

          <div className="field mt-3">
            <label>Conseils généraux (facultatif)</label>
            <Textarea rows={3} placeholder="Ex. Boire un grand verre d’eau au réveil, éviter l’eau trop chaude…" value={diag.conseils || ''} onChange={(e) => updateDiagnostic(diag.id, { conseils: e.target.value })} />
            <span className="hint">Apparaît dans la section « Conseils » du PDF.</span>
          </div>

          <Button variant="primary" block className="mt-3" icon="fa-solid fa-check" disabled={!diag.routine.length || !!invalidCount} onClick={onValidate}>
            Valider la routine
          </Button>
        </div>
      </div>
    </div>
  );
}
