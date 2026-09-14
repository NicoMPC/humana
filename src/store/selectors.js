/**
 * Sélecteurs purs : dérivent des informations de l'état sans le modifier.
 * Utilisés par les pages et par le store lui-même.
 */
import { todayISO, diffDays } from '../lib/dates';
import { CATEGORY_MAP } from '../data/constants';

export const isPatronne = (user) => user?.role === 'patronne';

const STOCK_WARNING_DAYS = 7;
const STOCK_DANGER_DAYS = 14;

/**
 * Fraîcheur du catalogue produits (import Planity) : `days` (null si jamais
 * importé) et un niveau `ok` / `warning` / `danger` pour l'alerte du tableau
 * de bord (import attendu au moins une fois par semaine).
 */
export function stockFreshness(state, today = todayISO()) {
  const last = state.settings?.stock?.dernierImport || null;
  if (!last) return { days: null, level: 'danger', last: null };
  const days = diffDays(last, today);
  const level = days >= STOCK_DANGER_DAYS ? 'danger' : days >= STOCK_WARNING_DAYS ? 'warning' : 'ok';
  return { days, level, last };
}

/** Clientes visibles : toutes pour la patronne, les siennes pour une praticienne. */
export function visibleClients(state, user, { includeArchived = false } = {}) {
  const list = state.clients.filter((c) => includeArchived || !c.archive);
  return isPatronne(user) ? list : list.filter((c) => c.praticienne_id === user?.id);
}

export function visibleDiagnostics(state, user) {
  return isPatronne(user) ? state.diagnostics : state.diagnostics.filter((d) => d.praticienne_id === user?.id);
}

export const getClient = (state, id) => state.clients.find((c) => c.id === id);
export const getUser = (state, id) => state.users.find((u) => u.id === id);
export const getDiagnostic = (state, id) => state.diagnostics.find((d) => d.id === id);
export const getProduit = (state, id) => state.produits.find((p) => p.id === id);
export const praticiennes = (state) => state.users.filter((u) => u.role === 'praticienne');

/**
 * Toute utilisatrice active à qui une cliente/un diagnostic peut être
 * rattaché — patronnes comprises (Jessie et Nathalie pratiquent aussi,
 * voir seed.js) — contrairement à `praticiennes()` qui ne liste que le
 * personnel géré depuis Équipe (EquipePage.jsx). Utilisé pour les filtres
 * "par praticienne" et le sélecteur de référente d'une fiche cliente.
 */
export const assignableUsers = (state) => state.users.filter((u) => u.actif !== false);

export function diagnosticsForClient(state, clientId) {
  return state.diagnostics.filter((d) => d.client_id === clientId).sort((a, b) => (a.date_rdv < b.date_rdv ? 1 : -1));
}

/** Relance échue : envoyé, pas encore relancé, date de relance atteinte. */
export function isRelanceDue(diag, today = todayISO()) {
  return diag.statut === 'envoye' && !diag.relance_envoyee && !!diag.date_relance && diag.date_relance <= today;
}

export function daysUntilRelance(diag, today = todayISO()) {
  if (!diag.date_relance) return null;
  return diffDays(today, diag.date_relance);
}

/**
 * Photos avant/après à recueillir (S+6, réglable via
 * `settings.delai_photos_semaines`) : le diagnostic a été envoyé, le délai
 * est dépassé et il manque au moins une des deux photos.
 */
export function isPhotosDue(diag, settings, today = todayISO()) {
  if (!diag.date_envoi) return false;
  const semaines = settings?.delai_photos_semaines || 6;
  const dueDate = new Date(diag.date_envoi);
  dueDate.setDate(dueDate.getDate() + semaines * 7);
  const due = dueDate.toISOString().slice(0, 10);
  const missing = !diag.photos?.avant || !diag.photos?.apres;
  return missing && due <= today;
}

export const answerIsFilled = (answer) =>
  Array.isArray(answer) ? answer.length > 0 : answer !== undefined && answer !== null && String(answer).trim() !== '';

/** Progression du questionnaire (questions obligatoires remplies). */
export function quizProgress(diag, questions) {
  const list = questions || [];
  const answered = list.filter((q) => answerIsFilled(diag.reponses?.[q.id])).length;
  const required = list.filter((q) => q.obligatoire);
  const requiredDone = required.filter((q) => answerIsFilled(diag.reponses?.[q.id])).length;
  return { answered, total: list.length, requiredDone, requiredTotal: required.length, complete: requiredDone === required.length && required.length > 0 || (required.length === 0 && answered === list.length) };
}

export const routineIsValid = (diag) => diag.routine.length >= 1 && diag.routine.every((r) => r.moments?.length);

export const hasDocument = (diag, type = 'routine') => diag.documents?.some((d) => d.type === type);

/** Étape courante d'un diagnostic (1 quiz, 2 routine, 3 envoi, 4 suivi). */
export function diagnosticStep(diag, questions) {
  if (diag.statut === 'envoye' || diag.statut === 'termine') return 4;
  if (!quizProgress(diag, questions).complete) return 1;
  if (!routineIsValid(diag)) return 2;
  return 3;
}

/** Produits pertinents pour un type de diagnostic, triés par ordre d'application. */
export function produitsForType(state, type) {
  return state.produits
    .filter((p) => p.actif !== false && (p.cible === 'mixte' || p.cible === type))
    .sort((a, b) => (CATEGORY_MAP[a.categorie]?.ordre || 9) - (CATEGORY_MAP[b.categorie]?.ordre || 9) || a.nom.localeCompare(b.nom, 'fr'));
}

/** Routine groupée par moment, dans l'ordre de la routine puis par catégorie. */
export function routineByMoment(diag, state) {
  const groups = { matin: [], soir: [], hebdo: [] };
  diag.routine.forEach((item, index) => {
    const produit = getProduit(state, item.produit_id);
    if (!produit) return;
    item.moments.forEach((m) => groups[m]?.push({ ...item, produit, index }));
  });
  return groups;
}

/** Statistiques simples pour le tableau de bord. */
export function dashboardStats(diags, today = todayISO()) {
  return {
    brouillon: diags.filter((d) => d.statut !== 'envoye' && d.statut !== 'termine').length,
    envoye: diags.filter((d) => d.statut === 'envoye').length,
    relances_dues: diags.filter((d) => isRelanceDue(d, today)).length,
    termine: diags.filter((d) => d.statut === 'termine').length,
    ce_mois: diags.filter((d) => d.date_rdv?.slice(0, 7) === today.slice(0, 7)).length,
    aujourdhui: diags.filter((d) => d.date_rdv === today).length,
  };
}

export function clientStats(state, clientId) {
  const diags = diagnosticsForClient(state, clientId);
  return { total: diags.length, last: diags[0] || null, brouillon: diags.filter((d) => d.statut !== 'envoye' && d.statut !== 'termine').length };
}

/**
 * Un PDF lifestyle a-t-il déjà été préparé pour cette cliente, tous
 * diagnostics confondus ? Calculé à partir de l'historique plutôt que
 * stocké, pour ne jamais désynchroniser cette « mémoire » de la réalité.
 */
export function clientLifestyleDone(state, clientId) {
  return diagnosticsForClient(state, clientId).some((d) => hasDocument(d, 'lifestyle'));
}
