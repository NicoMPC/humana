/**
 * Import du stock Planity (export « Stock » en .csv ou .xlsx).
 *
 * Planity exporte un tableau unique avec, entre autres, des rayons qui ne
 * sont pas des produits de routine (prestations, maquillage, accessoires
 * cadeaux…) et des lignes de sous-total. Ce module isole cette logique
 * métier : détection du format, lecture, tri des rayons pertinents, et
 * mise en correspondance avec notre catalogue (création / mise à jour).
 */
import { parseCsvText, parseLocaleNumber } from './csv';
import { normalize } from './format';
import { CATEGORY_MAP } from '../data/constants';

/** Colonnes attendues dans un export Planity « Stock ». */
export const PLANITY_COLUMNS = {
  categorie: 'Catégorie de produits',
  nom: 'Produit',
  stock: 'Quantité restante',
  prix: 'Prix de vente unitaire',
  prixAchat: "Prix d'achat moyen",
  ean: 'Code EAN',
};

const stripEmoji = (s) => s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
const normCat = (s) => normalize(stripEmoji(s || '')).replace(/[^a-z0-9\s-]/g, '').trim();

/**
 * Règles par rayon Planity : inclusion dans le catalogue Humana, cible
 * (peau/cheveux/mixte) et catégorie interne par défaut. Les rayons absents
 * de cette table (ou explicitement exclus) sont écartés de l'import — ce
 * sont pour l'essentiel des prestations, du maquillage ou des accessoires
 * cadeaux, sans usage dans une routine peau/cheveux.
 */
const INCLUDE = (cible, categorie) => ({ include: true, cible, categorie });
const EXCLUDE = (raison) => ({ include: false, raison });

export const PLANITY_CATEGORY_RULES = {
  [normCat('Cheveux')]: INCLUDE('cheveux'),
  [normCat('Visage')]: INCLUDE('peau'),
  [normCat('Corps')]: INCLUDE('peau'),
  [normCat('Solaire')]: INCLUDE('peau', 'Crème'),
  [normCat('Compléments')]: INCLUDE('mixte', 'Complément alimentaire'),
  [normCat('Accessoire VISAGE')]: INCLUDE('peau', 'Accessoire'),
  [normCat('Accessoire CHEVEUX')]: INCLUDE('cheveux', 'Accessoire'),
  [normCat('Accessoire CORPS')]: INCLUDE('peau', 'Accessoire'),
  [normCat('Bébés')]: INCLUDE('mixte'),
  [normCat('DOUX')]: INCLUDE('peau'),

  [normCat('Maquillage')]: EXCLUDE('Maquillage — non utilisé dans une routine peau/cheveux'),
  [normCat('WIA')]: EXCLUDE('Maquillage — non utilisé dans une routine peau/cheveux'),
  [normCat('Vernis')]: EXCLUDE('Vernis à ongles — hors périmètre de l’application'),
  [normCat('UNAÖD')]: EXCLUDE('Soins des ongles — hors périmètre de l’application'),
  [normCat('Parfum')]: EXCLUDE('Parfumerie — non utilisée dans une routine'),
  [normCat('BOUGIES')]: EXCLUDE('Bougies — non utilisées dans une routine'),
  [normCat('GOODIES')]: EXCLUDE('Goodies — non utilisés dans une routine'),
  [normCat('TOMBOLA')]: EXCLUDE('Lot de tombola — non pertinent'),
  [normCat('COFFRETS NOËL 2025')]: EXCLUDE('Coffret cadeau — pas une étape de routine unique'),
  [normCat('SOINS VISAGE')]: EXCLUDE('Prestation en cabine (durée en minutes), pas un produit'),
  [normCat('MASSAGES')]: EXCLUDE('Prestation en cabine, pas un produit'),
  [normCat('DOMAINE DES BAINS')]: EXCLUDE('Prestation en cabine, pas un produit'),
  [normCat('MADEROTHERAPIE')]: EXCLUDE('Prestation en cabine, pas un produit'),
  [normCat('DRAINAGE Brésilien')]: EXCLUDE('Prestation en cabine, pas un produit'),
  [normCat('ÉPILATIONS')]: EXCLUDE('Prestation d’épilation, pas un produit'),
  [normCat('Épilations HOMMES')]: EXCLUDE('Prestation d’épilation, pas un produit'),
  [normCat('FORFAITS épils')]: EXCLUDE('Forfait de prestations, pas un produit'),
  [normCat('TEINTURES')]: EXCLUDE('Prestation de coloration, pas un produit'),
  [normCat('FRAIS DE PORT LIVRAISON')]: EXCLUDE('Frais de port — pas un produit'),
};

/** Mots-clés (sur le nom, normalisé) associés à chaque catégorie interne, du plus au moins spécifique. */
const NAME_KEYWORDS = [
  ['Après-shampoing', ['apres shampoing', 'apres-shampoing', 'apres shampooing']],
  ['Shampoing', ['shampoing', 'shampooing', 'shamp.']],
  ['Masque', ['masque']],
  ['Sérum', ['serum']],
  ['Complément alimentaire', ['complement', 'complexe', 'gelule', 'cure detox', 'booster']],
  ['Accessoire', ['brosse', 'peigne', 'chouchou', 'barrette', 'pince', 'gant', 'roller', 'gua sha', 'bracelet', 'brume d\'eveil']],
  ['Nettoyant', ['nettoyant', 'demaquillant', 'micellaire', 'gel lavant', 'gel nettoyant', 'savon']],
  ['Lotion', ['lotion', 'tonique', 'brume', 'spray multiprotect']],
  ['Crème', ['creme', 'baume', 'spf', 'solaire']],
  ['Huile', ['huile', 'h.e ', 'h.e.', 'huile essentielle']],
  ['Soin capillaire', ['leave-in', 'spray', 'soin sans rincage', 'lait', 'gelee']],
];

/** Devine une catégorie interne à partir du nom du produit, avec repli par cible. */
export function inferCategorie(nom, cible) {
  const n = normalize(nom);
  for (const [categorie, keywords] of NAME_KEYWORDS) {
    if (keywords.some((k) => n.includes(k))) return categorie;
  }
  if (cible === 'cheveux') return 'Soin capillaire';
  if (cible === 'peau') return 'Crème';
  return 'Huile';
}

/** Lit un fichier (.csv ou .xlsx) et renvoie des lignes brutes { <entête Planity>: valeur }. */
export async function readPlanityFile(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });
    // Les cellules numériques (EAN) reviennent parfois en nombre : on les repasse en texte.
    return rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' && k === PLANITY_COLUMNS.ean ? String(v) : v])));
  }
  const text = await file.text();
  return parseCsvText(text).rows;
}

/**
 * Construit un plan d'import à partir des lignes brutes Planity et du
 * catalogue existant : produits à créer, à mettre à jour (stock/prix
 * uniquement — la fiche déjà personnalisée par la praticienne n'est pas
 * écrasée) et lignes ignorées avec leur raison.
 */
export function buildImportPlan(rawRows, existingProduits = []) {
  const byEan = new Map();
  const byName = new Map();
  existingProduits.forEach((p) => {
    if (p.ean) byEan.set(p.ean, p);
    byName.set(normalize(p.nom), p);
  });

  const toCreate = [];
  const toUpdate = [];
  const excluded = [];
  let nextRef = existingProduits.reduce((max, p) => {
    const m = /^PL-(\d+)$/.exec(p.reference || '');
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);

  rawRows.forEach((row) => {
    const nom = String(row[PLANITY_COLUMNS.nom] ?? '').trim();
    const categorieBrute = String(row[PLANITY_COLUMNS.categorie] ?? '').trim();
    if (!nom || normalize(nom) === 'total') return; // ligne de sous-total Planity

    const rule = PLANITY_CATEGORY_RULES[normCat(categorieBrute)];
    if (!rule || !rule.include) {
      const raison = rule?.raison || 'Rayon non reconnu — à importer manuellement si besoin';
      excluded.push({ nom, categorie: categorieBrute, raison });
      return;
    }
    if (/\bcoffret\b/i.test(nom)) {
      excluded.push({ nom, categorie: categorieBrute, raison: 'Coffret / lot de plusieurs produits — pas une étape de routine unique' });
      return;
    }

    const stockVal = Math.max(0, Math.round(parseLocaleNumber(row[PLANITY_COLUMNS.stock]) || 0));
    const prixVal = Math.max(0, parseLocaleNumber(row[PLANITY_COLUMNS.prix]) || 0);
    const prixAchatVal = parseLocaleNumber(row[PLANITY_COLUMNS.prixAchat]);
    const eanVal = String(row[PLANITY_COLUMNS.ean] ?? '').trim();

    const existing = (eanVal && byEan.get(eanVal)) || byName.get(normalize(nom));
    if (existing) {
      toUpdate.push({
        id: existing.id,
        nom,
        patch: {
          stock: stockVal,
          prix: prixVal.toFixed(2),
          ...(Number.isFinite(prixAchatVal) ? { prix_achat: prixAchatVal.toFixed(2) } : {}),
          ...(eanVal && !existing.ean ? { ean: eanVal } : {}),
        },
      });
      return;
    }

    const categorie = rule.categorie || inferCategorie(nom, rule.cible);
    nextRef += eanVal ? 0 : 1;
    toCreate.push({
      nom,
      categorie: CATEGORY_MAP[categorie] ? categorie : rule.categorie || 'Huile',
      cible: rule.cible,
      ean: eanVal,
      reference: eanVal || `PL-${String(nextRef).padStart(4, '0')}`,
      prix: prixVal.toFixed(2),
      ...(Number.isFinite(prixAchatVal) ? { prix_achat: prixAchatVal.toFixed(2) } : {}),
      stock: stockVal,
      description: '',
      actif: !(prixVal <= 0 && stockVal <= 0),
    });
  });

  const excludedSummary = [...new Set(excluded.map((e) => e.categorie))]
    .map((categorie) => ({ categorie, count: excluded.filter((e) => e.categorie === categorie).length, raison: excluded.find((e) => e.categorie === categorie).raison }))
    .sort((a, b) => b.count - a.count);

  return {
    toCreate,
    toUpdate,
    excluded,
    excludedSummary,
    stats: { total: rawRows.length, importes: toCreate.length + toUpdate.length, crees: toCreate.length, maj: toUpdate.length, ignores: excluded.length },
  };
}
