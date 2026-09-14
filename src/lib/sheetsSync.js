/**
 * Synchronisation partagée minimale entre 2 postes via Google Sheets +
 * Apps Script (voir `apps-script/Code.gs`, à coller dans l'éditeur Apps
 * Script du classeur "Humana Essentiel — Données").
 *
 * Pas un vrai backend : dernier écrit gagne, pas de gestion de conflits
 * concurrents. Toute erreur réseau est avalée silencieusement — l'appli
 * continue de fonctionner en local (localStorage) même hors ligne ou si le
 * Sheet est indisponible ; voir README, section "Backend Google Sheets".
 */

const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbyIOVRYE_8bHBr-cFQku8x8k4-mWPtHiCUFcJ0O53cVVP4A2J9ioTqzh0PpOryBPsjylg/exec';
const SHEETS_TOKEN = 'Saloncin17!';

async function apiGet(action, params = {}) {
  const p = new URLSearchParams({ token: SHEETS_TOKEN, action, ...params });
  const res = await fetch(`${SHEETS_API_URL}?${p.toString()}`);
  return res.json();
}

async function apiPost(action, payload) {
  const res = await fetch(SHEETS_API_URL, {
    method: 'POST',
    // text/plain évite le préflight CORS (Apps Script ne gère pas OPTIONS) ;
    // le corps reste du JSON, parsé côté script via e.postData.contents.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: SHEETS_TOKEN, action, payload }),
  });
  return res.json();
}

/** Instantané complet { clients, diagnostics, produits, settings }, ou { ok:false } si indisponible. */
export async function pullSnapshot() {
  try {
    return await apiGet('pull');
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export function pushClient(client) {
  return apiPost('upsertClient', client).catch(() => {});
}

export function pushDiagnostic(diagnostic) {
  return apiPost('upsertDiagnostic', diagnostic).catch(() => {});
}

export function pushProduit(produit) {
  return apiPost('upsertProduit', produit).catch(() => {});
}

export function pushSettings(settings) {
  return apiPost('updateSettings', settings).catch(() => {});
}

/**
 * Envoie une photo (data-URL base64) au dossier Drive dédié et renvoie son
 * URL publique (lien "Anyone with the link"), ou null en cas d'échec —
 * l'appelant garde alors la data-URL locale en repli.
 */
export async function uploadPhotoToSheets(diagnosticId, type, dataUrl, filename) {
  try {
    const res = await apiPost('uploadPhoto', { diagnosticId, type, dataUrl, filename });
    return res.ok ? res.url : null;
  } catch {
    return null;
  }
}

/**
 * Envoi automatique réel d'un email (routine ou relance) via l'action
 * `sendEmail` du backend Apps Script — jamais d'exception qui remonte : en
 * cas d'échec ou d'indisponibilité réseau, l'appelant bascule sur le flux
 * manuel existant (voir `SendStep.jsx`).
 */
export async function sendEmailAutomatique({ to, subject, body, attachmentDataUrl = null, attachmentName = null, senderName }) {
  try {
    const res = await apiPost('sendEmail', { to, subject, body, attachmentDataUrl, attachmentName, senderName });
    return res?.ok ? { ok: true } : { ok: false, error: res?.error || 'Échec inconnu' };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Signale un problème ou une remarque (bouton flottant, voir
 * `BugReportModal.jsx`) dans l'onglet "Retours" du classeur — contrairement
 * aux autres pushs, un échec est remonté à l'appelant (pas avalé) pour ne
 * jamais faire croire à tort qu'un retour est bien parti.
 */
export async function reportBug(payload) {
  try {
    const res = await apiPost('reportBug', payload);
    return res?.ok ? { ok: true } : { ok: false, error: res?.error || 'Échec inconnu' };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
