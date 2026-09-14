/**
 * Humana Essentiel — backend Google Apps Script lié au classeur.
 *
 * Sert de synchronisation partagée minimale entre 2 postes (pas un vrai
 * serveur) : chaque onglet stocke une colonne "json" qui fait foi (source de
 * vérité), plus quelques colonnes lisibles pour un coup d'œil rapide dans le
 * Sheet. Toute requête (GET ou POST) doit porter le bon `token` (comparé à
 * la Script Property TOKEN) sinon elle est rejetée.
 *
 * Déjà déployé : classeur "Humana Essentiel — Données" sur le compte Google
 * de Nicolas (seopourvous@gmail.com), Web App "Backend Humana Essentiel v1".
 * Ce fichier est gardé ici pour référence/historique — le code réellement
 * exécuté vit dans l'éditeur Apps Script du classeur, pas ici.
 *
 * Pour redéployer ailleurs : Extensions > Apps Script > coller ce fichier >
 * Paramètres du projet > Propriétés du script > ajouter TOKEN = Saloncin17!
 * > Déployer > Nouveau déploiement > type "Application Web" > Exécuter en
 * tant que "Moi" > Qui a accès "Tout le monde".
 */

const SHEETS = {
  clients: 'Clientes',
  diagnostics: 'Diagnostics',
  produits: 'Produits',
  settings: 'Settings',
  retours: 'Retours',
};

const PHOTOS_FOLDER_NAME = 'Humana Essentiel — Photos';

function getToken_() {
  return PropertiesService.getScriptProperties().getProperty('TOKEN');
}

function checkToken_(token) {
  const expected = getToken_();
  if (!expected || token !== expected) throw new Error('Token invalide');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('Onglet introuvable : ' + name);
  return sh;
}

/** Lit toutes les lignes d'un onglet "id | ... | json" et renvoie les objets JSON parsés. */
function readAll_(name) {
  const sh = sheet_(name);
  const values = sh.getDataRange().getValues();
  const header = values[0] || [];
  const jsonCol = header.indexOf('json');
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const raw = values[i][jsonCol];
    if (!raw) continue;
    try { out.push(JSON.parse(raw)); } catch (e) { /* ligne corrompue, ignorée */ }
  }
  return out;
}

/** Insère ou met à jour une ligne par id, colonnes lisibles + json en dernière colonne. */
function upsert_(name, obj, readableCols) {
  const sh = sheet_(name);
  const values = sh.getDataRange().getValues();
  const header = values[0] || [];
  const idCol = header.indexOf('id');
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol] === obj.id) { rowIndex = i + 1; break; }
  }
  const row = header.map((h) => {
    if (h === 'id') return obj.id;
    if (h === 'json') return JSON.stringify(obj);
    return readableCols[h] != null ? readableCols[h] : '';
  });
  if (rowIndex === -1) {
    sh.appendRow(row);
  } else {
    sh.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  }
}

function readSettings_() {
  const sh = sheet_(SHEETS.settings);
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === 'settings') {
      try { return JSON.parse(values[i][1]); } catch (e) { return {}; }
    }
  }
  return {};
}

function writeSettings_(settings) {
  const sh = sheet_(SHEETS.settings);
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === 'settings') {
      sh.getRange(i + 1, 2).setValue(JSON.stringify(settings));
      return;
    }
  }
  sh.appendRow(['settings', JSON.stringify(settings)]);
}

function getPhotosFolder_() {
  const it = DriveApp.getFoldersByName(PHOTOS_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(PHOTOS_FOLDER_NAME);
}

/** payload: { diagnosticId, type: 'avant'|'apres', dataUrl, filename } */
function uploadPhoto_(payload) {
  const m = /^data:(.+);base64,(.*)$/.exec(payload.dataUrl || '');
  if (!m) throw new Error('dataUrl invalide');
  const [, mime, b64] = m;
  const blob = Utilities.newBlob(Utilities.base64Decode(b64), mime, payload.filename || (payload.diagnosticId + '-' + payload.type));
  const folder = getPhotosFolder_();
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const url = 'https://drive.google.com/uc?id=' + file.getId();

  const diags = readAll_(SHEETS.diagnostics);
  const diag = diags.find((d) => d.id === payload.diagnosticId);
  if (diag) {
    diag.photos = diag.photos || { avant: null, apres: null };
    diag.photos[payload.type] = { url, date: new Date().toISOString() };
    upsert_(SHEETS.diagnostics, diag, {
      client_id: diag.client_id, type: diag.type, statut: diag.statut,
      date_creation: diag.date_creation, date_envoi: diag.date_envoi, date_relance: diag.date_relance,
    });
  }
  return { url };
}

/** payload: { to, subject, body, attachmentDataUrl, attachmentName, senderName } */
function sendEmail_(payload) {
  const options = {};
  if (payload.senderName) options.name = payload.senderName;
  if (payload.attachmentDataUrl) {
    const m = /^data:(.+);base64,(.*)$/.exec(payload.attachmentDataUrl);
    if (!m) throw new Error('attachmentDataUrl invalide');
    const [, mime, b64] = m;
    const blob = Utilities.newBlob(Utilities.base64Decode(b64), mime, payload.attachmentName || 'document.pdf');
    options.attachments = [blob];
  }
  GmailApp.sendEmail(payload.to, payload.subject, payload.body, options);
}

function doGet(e) {
  try {
    checkToken_(e.parameter.token);
    const action = e.parameter.action || 'pull';
    if (action === 'pull') {
      return json_({
        ok: true,
        clients: readAll_(SHEETS.clients),
        diagnostics: readAll_(SHEETS.diagnostics),
        produits: readAll_(SHEETS.produits),
        settings: readSettings_(),
      });
    }
    return json_({ ok: false, error: 'Action inconnue : ' + action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    checkToken_(body.token);
    const { action, payload } = body;
    switch (action) {
      case 'upsertClient':
        upsert_(SHEETS.clients, payload, {
          prenom: payload.prenom, nom: payload.nom, email: payload.email,
          telephone: payload.telephone, date_creation: payload.date_creation,
        });
        return json_({ ok: true });
      case 'upsertDiagnostic':
        upsert_(SHEETS.diagnostics, payload, {
          client_id: payload.client_id, type: payload.type, statut: payload.statut,
          date_creation: payload.date_creation, date_envoi: payload.date_envoi, date_relance: payload.date_relance,
        });
        return json_({ ok: true });
      case 'upsertProduit':
        upsert_(SHEETS.produits, payload, {
          nom: payload.nom, categorie: payload.categorie, prix: payload.prix, stock: payload.stock,
        });
        return json_({ ok: true });
      case 'updateSettings':
        writeSettings_(payload);
        return json_({ ok: true });
      case 'uploadPhoto':
        return json_({ ok: true, ...uploadPhoto_(payload) });
      case 'sendEmail':
        sendEmail_(payload);
        return json_({ ok: true });
      case 'reportBug':
        upsert_(SHEETS.retours, payload, {
          date: payload.date, auteur: payload.auteur, page: payload.page,
          client: payload.client, message: payload.message,
        });
        return json_({ ok: true });
      default:
        return json_({ ok: false, error: 'Action inconnue : ' + action });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
