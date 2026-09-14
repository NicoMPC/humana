/**
 * Point d'entrée navigateur pour la génération des PDF clientes.
 * Les builders purs (routinePdf.js, lifestylePdf.js) sont indépendants du
 * DOM ; ce module y ajoute le blob / l'URL objet et le nom de fichier.
 */
import { buildRoutinePdf } from './routinePdf.js';
import { buildLifestylePdf } from './lifestylePdf.js';
import { safeFileName } from '../format.js';

// Ré-exporté pour que les appelants (ex. usePdfActions) n'aient qu'un seul
// import dynamique à faire pour construire, encoder les assets et générer.
export { browserAssetLoader } from './assets.js';

const TYPE_LABEL = { peau: 'peau', cheveux: 'cheveux' };

function toResult(doc, fileName) {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  return { doc, blob, url, fileName };
}

/** Génère le PDF de routine pour une cliente et renvoie { doc, blob, url, fileName }. */
export async function generateRoutinePdf(args) {
  const doc = await buildRoutinePdf(args);
  const { diag, client } = args;
  const fileName = `${safeFileName('Routine', TYPE_LABEL[diag.type] || diag.type, client.nom, client.prenom)}.pdf`;
  return toResult(doc, fileName);
}

/** Génère le PDF lifestyle pour une cliente et renvoie { doc, blob, url, fileName }. */
export async function generateLifestylePdf(args) {
  const doc = await buildLifestylePdf(args);
  const { client } = args;
  const fileName = `${safeFileName('Conseils_lifestyle', client.nom, client.prenom)}.pdf`;
  return toResult(doc, fileName);
}

/** Déclenche le téléchargement du PDF (Save As du navigateur). */
export function downloadPdf(doc, fileName) {
  doc.save(fileName);
}
