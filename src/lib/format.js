/** Formatage de textes, montants et identités. */

export function fullName(person) {
  if (!person) return '';
  return `${person.prenom || ''} ${person.nom || ''}`.trim();
}

export function initials(person) {
  if (!person) return '?';
  const p = (person.prenom || '').charAt(0);
  const n = (person.nom || '').charAt(0);
  return `${p}${n}`.toUpperCase() || '?';
}

export function formatPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
}

export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

/** Remplace {prenom}, {praticienne}, {boutique}… dans un gabarit d'email. */
export function fillTemplate(template, vars) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? `{${key}}`));
}

/** Nom de fichier sûr : « Routine_peau_Lefevre_Marie.pdf ». */
export function safeFileName(...parts) {
  return parts
    .join('_')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_.-]+/g, '_')
    .replace(/_+/g, '_');
}

export function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
}

export function capitalize(str) {
  const s = String(str || '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
