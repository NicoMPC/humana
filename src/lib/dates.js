/**
 * Utilitaires de dates. Toutes les dates métier sont stockées en ISO « YYYY-MM-DD »
 * (jour civil, sans fuseau) ; les horodatages du journal sont en ISO complet.
 */

export function todayISO() {
  return toISODate(new Date());
}

export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso) {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function addDays(iso, days) {
  const d = parseISODate(iso) || new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysFromToday(days) {
  return addDays(todayISO(), days);
}

/** Différence en jours entre deux dates ISO (b - a). */
export function diffDays(a, b) {
  const da = parseISODate(a);
  const db = parseISODate(b);
  if (!da || !db) return 0;
  return Math.round((db - da) / 86400000);
}

export function formatDate(iso, opts = {}) {
  const d = parseISODate(iso);
  if (!d) return '—';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', ...opts });
}

export function formatDateLong(iso) {
  const d = parseISODate(iso);
  if (!d) return '—';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateTime(isoFull) {
  if (!isoFull) return '—';
  const d = new Date(isoFull);
  if (Number.isNaN(d.getTime())) return isoFull;
  return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function monthLabel(iso) {
  const d = parseISODate(iso);
  if (!d) return '';
  const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** « il y a 3 jours », « aujourd'hui », « dans 2 jours ». */
export function relativeDays(iso) {
  const diff = diffDays(todayISO(), iso);
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return 'demain';
  if (diff === -1) return 'hier';
  if (diff > 1) return `dans ${diff} jours`;
  return `il y a ${Math.abs(diff)} jours`;
}

export function nowISO() {
  return new Date().toISOString();
}
