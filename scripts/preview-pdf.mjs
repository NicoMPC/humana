#!/usr/bin/env node
/**
 * Génère des PDF de démonstration (routine + lifestyle) à partir du jeu de
 * données seed, pour montrer à quoi ressemblent les documents envoyés aux
 * clientes. Écrit dans ~/Documents/Humana-demo ; ne touche à aucun fichier
 * du projet.
 *
 * Usage : node scripts/preview-pdf.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildRoutinePdf } from '../src/lib/pdf/routinePdf.js';
import { buildLifestylePdf } from '../src/lib/pdf/lifestylePdf.js';
import { buildSeed } from '../src/data/seed.js';
import { LIFESTYLE_TIPS } from '../src/data/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUT_DIR = path.join(os.homedir(), 'Documents', 'Humana-demo');

fs.mkdirSync(OUT_DIR, { recursive: true });

async function loadAsset(relPath) {
  const filePath = path.join(PUBLIC_DIR, relPath);
  const buf = await fs.promises.readFile(filePath);
  return buf.toString('base64');
}

const seed = buildSeed();
const clientsById = new Map(seed.clients.map((c) => [c.id, c]));
const usersById = new Map(seed.users.map((u) => [u.id, u]));
const diagsById = new Map(seed.diagnostics.map((d) => [d.id, d]));

function ctxFor(diag) {
  return {
    diag,
    client: clientsById.get(diag.client_id),
    praticienne: usersById.get(diag.praticienne_id),
    produits: seed.produits,
    settings: seed.settings,
    loadAsset,
  };
}

async function writeDoc(doc, name) {
  const buf = Buffer.from(doc.output('arraybuffer'));
  const filePath = path.join(OUT_DIR, `${name}.pdf`);
  fs.writeFileSync(filePath, buf);
  console.log(`✓ ${name}.pdf (${(buf.length / 1024).toFixed(0)} Ko)`);
  return filePath;
}

async function main() {
  // 1) Routine peau complète (matin + soir + hebdo + conseils) — d-03
  const d03 = diagsById.get('d-03');
  const doc1 = await buildRoutinePdf(ctxFor(d03));
  await writeDoc(doc1, 'Routine-peau');

  // 2) Routine cheveux, beaucoup d'hebdo — d-09
  const d09 = diagsById.get('d-09');
  const doc2 = await buildRoutinePdf(ctxFor(d09));
  await writeDoc(doc2, 'Routine-cheveux');

  // 3) Routine peau + panier en ligne (QR, Niveau 3) — d-03
  const panier = { id: 'panier-demo', reference: 'HM-284517', date: new Date().toISOString() };
  const doc3b = await buildRoutinePdf({ ...ctxFor(d03), panier });
  await writeDoc(doc3b, 'Routine-peau-avec-panier');

  // 4) Conseils lifestyle — d-08
  const d08 = diagsById.get('d-08');
  const tips = LIFESTYLE_TIPS.filter((t) => (d08.lifestyle || []).includes(t.id));
  const doc4 = await buildLifestylePdf({ ...ctxFor(d08), tips });
  await writeDoc(doc4, 'Conseils-lifestyle');

  console.log(`\nPDF écrits dans ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
