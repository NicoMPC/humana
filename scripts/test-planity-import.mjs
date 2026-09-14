// Outil de contrôle : vérifie ce que buildImportPlan() ferait d'un vrai
// export Planity, sans toucher à l'application. Utile après toute
// modification de src/lib/planityImport.js.
//
// Usage : node --experimental-loader ./scripts/extensionless-loader.mjs \
//           scripts/test-planity-import.mjs chemin/vers/export.csv
import fs from 'node:fs';
import { parseCsvText } from '../src/lib/csv.js';
import { buildImportPlan } from '../src/lib/planityImport.js';

const path = process.argv[2];
if (!path) {
  console.error('Usage : node scripts/test-planity-import.mjs <export.csv>');
  process.exit(1);
}

const text = fs.readFileSync(path, 'utf-8');
const { rows } = parseCsvText(text);
console.log('Lignes brutes (hors entête) :', rows.length);

const plan = buildImportPlan(rows, []);
console.log('\n=== STATS ===');
console.log(plan.stats);

console.log('\n=== RÉSUMÉ DES EXCLUSIONS PAR RAYON ===');
plan.excludedSummary.forEach((e) => console.log(`  ${String(e.count).padStart(3)}  ${e.categorie.padEnd(28)} — ${e.raison}`));

console.log('\n=== RÉPARTITION DES CATÉGORIES INTERNES ATTRIBUÉES ===');
const byCat = {};
plan.toCreate.forEach((p) => { byCat[p.categorie] = (byCat[p.categorie] || 0) + 1; });
Object.entries(byCat).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${String(n).padStart(3)}  ${c}`));

console.log('\n=== ÉCHANTILLON DE PRODUITS CRÉÉS (15) ===');
plan.toCreate.slice(0, 15).forEach((p) => console.log(`  [${p.cible}/${p.categorie}] ${p.nom} — ${p.prix}€ · stock ${p.stock} · réf ${p.reference}${p.actif === false ? ' · INACTIF' : ''}`));

console.log('\nSans EAN :', plan.toCreate.filter((p) => !p.ean).length, '/', plan.toCreate.length);
console.log('Marqués inactifs (0€ et 0 stock) :', plan.toCreate.filter((p) => p.actif === false).length);
