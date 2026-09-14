/**
 * Parseur CSV tolérant, pensé pour des exports d'outils tiers (Planity, Excel…)
 * dont le délimiteur et le séparateur décimal varient selon les réglages
 * régionaux de qui a exporté le fichier.
 */

/** Devine le délimiteur (virgule ou point-virgule) à partir de la ligne d'en-tête. */
export function detectDelimiter(headerLine) {
  const semi = (headerLine.match(/;/g) || []).length;
  const comma = (headerLine.match(/,/g) || []).length;
  return semi > comma ? ';' : ',';
}

/** Découpe une ligne CSV en tenant compte des champs entre guillemets (avec `""` échappé). */
function splitLine(line, delimiter) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i += 1; } else { inQuotes = false; }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      cells.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

/**
 * Parse un texte CSV en liste d'objets { <entête>: <valeur> }.
 * Gère les champs entre guillemets et détecte automatiquement le délimiteur.
 */
export function parseCsvText(text) {
  const clean = text.replace(/^﻿/, ''); // BOM Excel
  const lines = clean.split(/\r\n|\n|\r/).filter((l) => l.length > 0);
  if (!lines.length) return { headers: [], rows: [] };
  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter);
  const rows = lines.slice(1).map((line) => {
    const cells = splitLine(line, delimiter);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
  });
  return { headers, rows };
}

/**
 * Convertit une valeur numérique texte, en tolérant la virgule décimale
 * française (« 12,5 ») et les espaces insécables des milliers.
 */
export function parseLocaleNumber(value) {
  if (value === null || value === undefined) return NaN;
  if (typeof value === 'number') return value;
  const s = String(value).trim().replace(/[\s ]/g, '').replace(/%$/, '');
  if (!s) return NaN;
  // Une seule virgule et pas de point → virgule décimale.
  const normalized = /^-?\d+,\d+$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}
