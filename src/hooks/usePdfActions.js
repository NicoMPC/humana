import { useCallback, useState } from 'react';
import { useStore } from '../store/useStore';
import { getClient, getProduit, getUser } from '../store/selectors';
import { LIFESTYLE_TIPS } from '../data/constants';
import { toast } from '../store/useUI';

/**
 * Génération des PDF (routine / lifestyle) pour un diagnostic.
 * Le module `src/lib/pdf` est chargé dynamiquement : il regénère le document
 * à la demande depuis les données (aucun blob n'est persisté en localStorage).
 */
export function usePdfActions(diag) {
  const state = useStore();
  const addDocument = useStore((s) => s.addDocument);
  const [busy, setBusy] = useState(null); // 'routine' | 'lifestyle' | null
  const [lastDoc, setLastDoc] = useState({ routine: null, lifestyle: null });

  const client = getClient(state, diag?.client_id);
  const praticienne = getUser(state, diag?.praticienne_id);
  const produits = state.produits;
  const settings = state.settings;

  const run = useCallback(
    async (kind, { record = true, auteurId } = {}) => {
      if (!diag || !client) return null;
      setBusy(kind);
      try {
        const pdfLib = await import('../lib/pdf');
        const loadAsset = pdfLib.browserAssetLoader(import.meta.env.BASE_URL);
        let result;
        if (kind === 'routine') {
          result = await pdfLib.generateRoutinePdf({ diag, client, praticienne, produits, settings, loadAsset });
        } else {
          const tips = diag.lifestyle.map((id) => LIFESTYLE_TIPS.find((t) => t.id === id)).filter(Boolean);
          result = await pdfLib.generateLifestylePdf({ diag, client, praticienne, settings, tips, loadAsset });
        }
        setLastDoc((d) => ({ ...d, [kind]: result }));
        if (record) addDocument(diag.id, { type: kind, nom_fichier: result.fileName }, auteurId);
        return result;
      } catch (e) {
        console.error(e);
        toast('La génération du PDF a échoué. Réessayez.', { type: 'error' });
        return null;
      } finally {
        setBusy(null);
      }
    },
    [diag, client, praticienne, produits, settings, addDocument]
  );

  const download = useCallback(
    async (kind) => {
      const pdfLib = await import('../lib/pdf');
      const existing = lastDoc[kind];
      if (existing?.doc) return pdfLib.downloadPdf(existing.doc, existing.fileName);
      const result = await run(kind, { record: false });
      if (result) pdfLib.downloadPdf(result.doc, result.fileName);
    },
    [lastDoc, run]
  );

  return { busy, lastDoc, generate: run, download, client, praticienne };
}
