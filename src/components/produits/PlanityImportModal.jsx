import { useRef, useState } from 'react';
import { useCurrentUser, useStore } from '../../store/useStore';
import { readPlanityFile, buildImportPlan, PLANITY_COLUMNS } from '../../lib/planityImport';
import { formatDate } from '../../lib/dates';
import { toast } from '../../store/useUI';
import { Button, Modal, Notice } from '../ui';

/**
 * Import du stock depuis un export Planity (.csv ou .xlsx) : lecture,
 * aperçu du plan (créations / mises à jour / rayons ignorés) puis
 * confirmation. Les fiches déjà personnalisées ne sont jamais écrasées :
 * seuls le stock et le prix sont rafraîchis pour les produits reconnus.
 */
export function PlanityImportModal({ open, onClose }) {
  const user = useCurrentUser();
  const produits = useStore((s) => s.produits);
  const applyStockImport = useStore((s) => s.applyStockImport);
  const [fileName, setFileName] = useState('');
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExcluded, setShowExcluded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const reset = () => { setFileName(''); setPlan(null); setError(''); setShowExcluded(false); };
  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError('');
    setPlan(null);
    setFileName(file.name);
    try {
      const rows = await readPlanityFile(file);
      if (!rows.length || !(PLANITY_COLUMNS.nom in rows[0])) {
        setError(`Ce fichier ne ressemble pas à un export « Stock » Planity (colonne « ${PLANITY_COLUMNS.nom} » introuvable).`);
        return;
      }
      setPlan(buildImportPlan(rows, produits));
    } catch (e) {
      console.error(e);
      setError('Impossible de lire ce fichier. Vérifiez qu’il s’agit bien d’un export Planity (.csv ou .xlsx).');
    } finally {
      setLoading(false);
    }
  };

  const confirm = () => {
    if (!plan) return;
    applyStockImport(plan, user.id);
    toast(`Stock mis à jour : ${plan.stats.crees} ajouté${plan.stats.crees > 1 ? 's' : ''} · ${plan.stats.maj} mis à jour`);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      title="Importer le stock depuis Planity"
      subtitle="Export « Stock » Planity, au format .csv ou .xlsx. Les rayons prestations, maquillage et accessoires cadeaux sont automatiquement écartés."
      actions={
        <>
          <Button variant="ghost" onClick={handleClose}>Annuler</Button>
          <Button variant="primary" icon="fa-solid fa-check" disabled={!plan || !plan.stats.importes} onClick={confirm}>
            Importer {plan?.stats.importes ? `(${plan.stats.importes})` : ''}
          </Button>
        </>
      }
    >
      {!plan && (
        <div
          className="empty"
          style={{ border: `2px dashed ${dragOver ? 'var(--sage-400)' : 'var(--border-strong)'}`, borderRadius: 'var(--r-lg)', background: dragOver ? 'var(--sage-50)' : 'var(--bg-muted)', cursor: 'pointer' }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
        >
          <div className="empty-icon"><i className="fa-solid fa-file-arrow-up" /></div>
          <h4>{loading ? 'Lecture du fichier…' : 'Glissez le fichier ici, ou cliquez pour le choisir'}</h4>
          {fileName && !loading && <p className="small muted">{fileName}</p>}
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>
      )}

      {error && <div className="mt-2"><Notice tone="amber" icon="fa-solid fa-triangle-exclamation">{error}</Notice></div>}

      {plan && (
        <div className="stack mt-2">
          <div className="grid-3">
            <StatTile icon="fa-solid fa-plus" value={plan.stats.crees} label="Nouveaux produits" />
            <StatTile icon="fa-solid fa-rotate" value={plan.stats.maj} label="Mis à jour (stock/prix)" />
            <StatTile icon="fa-regular fa-circle-xmark" value={plan.stats.ignores} label="Rayons ignorés" />
          </div>

          {!plan.stats.importes && (
            <Notice tone="amber" icon="fa-solid fa-triangle-exclamation">Aucun produit reconnu dans ce fichier. Vérifiez qu’il s’agit bien de l’export « Stock » (et pas un autre export Planity).</Notice>
          )}

          <button type="button" className="btn btn-ghost btn-sm" style={{ justifySelf: 'start' }} onClick={() => setShowExcluded((v) => !v)}>
            <i className={`fa-solid fa-chevron-${showExcluded ? 'up' : 'down'}`} /> {showExcluded ? 'Masquer' : 'Voir'} le détail des rayons ignorés
          </button>
          {showExcluded && (
            <div className="table-wrap" style={{ maxHeight: 220, overflow: 'auto' }}>
              <table className="table">
                <thead><tr><th>Rayon Planity</th><th>Articles</th><th>Raison</th></tr></thead>
                <tbody>
                  {plan.excludedSummary.map((e) => (
                    <tr key={e.categorie}><td>{e.categorie}</td><td>{e.count}</td><td className="muted small">{e.raison}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Notice icon="fa-solid fa-circle-info">Les fiches déjà personnalisées (catégorie, description, statut actif) ne sont pas modifiées : seuls le stock et le prix sont rafraîchis.</Notice>

          <Button variant="ghost" size="sm" onClick={reset} style={{ justifySelf: 'start' }}>Choisir un autre fichier</Button>
        </div>
      )}
    </Modal>
  );
}

function StatTile({ icon, value, label }) {
  return (
    <div className="subtle-card" style={{ textAlign: 'center' }}>
      <i className={icon} style={{ color: 'var(--primary)' }} />
      <div style={{ fontSize: 'var(--fs-2xl)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{value}</div>
      <div className="xs muted">{label}</div>
    </div>
  );
}

/** Petit texte utilitaire : dernière date d'import affichable en en-tête. */
export function lastImportLabel(dernierImport) {
  return dernierImport ? `Dernier import : ${formatDate(dernierImport)}` : 'Aucun import pour le moment';
}
