import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { CATEGORIES } from '../data/constants';
import { normalize } from '../lib/format';
import { toast, confirmDialog } from '../store/useUI';
import { Button, Dropdown, EmptyState, Field, Input, Modal, SearchBar, Select, Textarea } from '../components/ui';
import { PlanityImportModal, lastImportLabel } from '../components/produits/PlanityImportModal';
import { StockFreshnessBanner } from '../components/produits/StockFreshnessBanner';

const CIBLES = [{ value: 'peau', label: 'Peau' }, { value: 'cheveux', label: 'Cheveux' }, { value: 'mixte', label: 'Mixte' }];

export default function ProduitsPage() {
  const produits = useStore((s) => s.produits);
  const dernierImport = useStore((s) => s.settings.stock?.dernierImport);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [form, setForm] = useState(null); // null | {} | produit
  const [importOpen, setImportOpen] = useState(false);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    if (params.get('import') === '1') {
      setImportOpen(true);
      const next = new URLSearchParams(params);
      next.delete('import');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => [...new Set(produits.map((p) => p.categorie))], [produits]);
  const filtered = useMemo(() => {
    const q = normalize(search);
    return produits
      .filter((p) => (!cat || p.categorie === cat) && (!q || normalize(p.nom).includes(q) || normalize(p.reference).includes(q) || normalize(p.ean).includes(q)))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }, [produits, search, cat]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Catalogue Hu’mana</div>
          <h1>Produits</h1>
          <p className="lead">{produits.length} référence{produits.length > 1 ? 's' : ''} · {lastImportLabel(dernierImport)}</p>
        </div>
        <div className="page-actions">
          <div style={{ width: 220 }}><SearchBar value={search} onChange={setSearch} placeholder="Nom, référence, EAN…" /></div>
          <Button variant="soft" icon="fa-solid fa-file-arrow-up" onClick={() => setImportOpen(true)}>Importer depuis Planity</Button>
          <Button variant="primary" icon="fa-solid fa-plus" onClick={() => setForm({})}>Ajouter un produit</Button>
        </div>
      </div>

      <StockFreshnessBanner />

      <div className="cat-chips mb-3">
        <button type="button" className={`chip chip-sm ${!cat ? 'is-active' : ''}`} onClick={() => setCat('')}>Toutes ({produits.length})</button>
        {categories.map((c) => <button key={c} type="button" className={`chip chip-sm ${cat === c ? 'is-active' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
      </div>

      {!filtered.length ? (
        <EmptyState icon="fa-solid fa-box-open" title="Aucun produit" text="Ajustez la recherche, importez le stock Planity, ou ajoutez un nouveau produit." />
      ) : (
        <div className="table-wrap card flush">
          <table className="table">
            <thead><tr><th>Produit</th><th>Catégorie</th><th>Cible</th><th>Réf. / EAN</th><th>Prix</th><th>Stock</th><th /></tr></thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className={`interactive ${p.actif === false ? 'muted' : ''}`} onClick={() => setForm(p)}>
                  <td>
                    <div className="semibold">{p.nom} {p.actif === false && <span className="badge badge-ink xs">Inactif</span>}</div>
                    <div className="xs muted truncate" style={{ maxWidth: 320 }}>{p.description}</div>
                  </td>
                  <td>{p.categorie}</td>
                  <td className="muted small">{CIBLES.find((c) => c.value === p.cible)?.label || '—'}</td>
                  <td className="muted small">{p.reference}{p.ean && p.ean !== p.reference && <div className="xs">EAN {p.ean}</div>}</td>
                  <td>{p.prix} €</td>
                  <td>{p.stock <= 3 ? <span className="badge badge-amber xs">{p.stock}</span> : p.stock}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Dropdown trigger={<Button variant="ghost" size="sm" icon="fa-solid fa-ellipsis-vertical" aria-label="Actions" />} items={[
                      { label: 'Modifier', icon: 'fa-solid fa-pen', onClick: () => setForm(p) },
                      { label: 'Supprimer', icon: 'fa-solid fa-trash-can', danger: true, onClick: () => removeProduit(p) },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormModal open={!!form} product={form?.id ? form : null} onClose={() => setForm(null)} />
      <PlanityImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}

function removeProduit(p) {
  confirmDialog({ title: 'Supprimer ce produit ?', message: `« ${p.nom} » sera retiré du catalogue. Les routines déjà créées conservent leur historique.`, confirmLabel: 'Supprimer', danger: true }).then((ok) => {
    if (ok) { useStore.getState().deleteProduit(p.id); toast('Produit supprimé'); }
  });
}

const EMPTY = { nom: '', categorie: CATEGORIES[0].key, cible: 'mixte', reference: '', ean: '', prix: '', prix_achat: '', stock: '', description: '' };

function ProductFormModal({ open, product, onClose }) {
  const addProduit = useStore((s) => s.addProduit);
  const updateProduit = useStore((s) => s.updateProduit);
  const [form, setForm] = useState(EMPTY);

  useMemo(() => { if (open) setForm(product ? { ...EMPTY, ...product } : EMPTY); }, [open, product]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.nom.trim()) return toast('Le nom du produit est requis', { type: 'warning' });
    const payload = {
      ...form,
      nom: form.nom.trim(),
      reference: form.reference.trim() || `HM-${Date.now().toString(36).toUpperCase()}`,
      prix: Number(form.prix || 0).toFixed(2),
      prix_achat: form.prix_achat ? Number(form.prix_achat).toFixed(2) : '',
      stock: Number(form.stock || 0),
    };
    if (product) { updateProduit(product.id, payload); toast('Produit mis à jour'); } else { addProduit(payload); toast('Produit ajouté au catalogue'); }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={product ? 'Modifier le produit' : 'Nouveau produit'}
      actions={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" icon="fa-solid fa-check" onClick={submit}>Enregistrer</Button></>}>
      <form className="stack" onSubmit={submit}>
        <Field label="Nom" required>{(id) => <Input id={id} value={form.nom} onChange={set('nom')} autoFocus />}</Field>
        <Field label="Description">{(id) => <Textarea id={id} rows={2} value={form.description} onChange={set('description')} />}</Field>
        <div className="form-row">
          <Field label="Catégorie">{(id) => <Select id={id} value={form.categorie} onChange={set('categorie')}>{CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}</Select>}</Field>
          <Field label="Cible">{(id) => <Select id={id} value={form.cible} onChange={set('cible')}>{CIBLES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select>}</Field>
        </div>
        <div className="form-row">
          <Field label="Référence">{(id) => <Input id={id} value={form.reference} onChange={set('reference')} placeholder="Générée automatiquement" />}</Field>
          <Field label="Code EAN">{(id) => <Input id={id} value={form.ean} onChange={set('ean')} placeholder="Code-barres (optionnel)" />}</Field>
        </div>
        <div className="form-row">
          <Field label="Prix de vente (€)">{(id) => <Input id={id} type="number" min="0" step="0.01" value={form.prix} onChange={set('prix')} />}</Field>
          <Field label="Prix d’achat (€)" hint="Optionnel, non affiché à la cliente">{(id) => <Input id={id} type="number" min="0" step="0.01" value={form.prix_achat} onChange={set('prix_achat')} />}</Field>
        </div>
        <Field label="Stock">{(id) => <Input id={id} type="number" min="0" value={form.stock} onChange={set('stock')} />}</Field>
        <button type="submit" className="sr-only">Enregistrer</button>
      </form>
    </Modal>
  );
}
