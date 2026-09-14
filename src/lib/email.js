/**
 * Préparation des emails : remplissage des gabarits avant l'envoi.
 * V0 six-pack (2026-09-13, voir CLAUDE.md) : l'envoi se fait via Gmail
 * (onglet pré-rempli, voir `gmailComposeUrl`), jamais automatiquement — la
 * praticienne joint elle-même le PDF puis confirme dans `SendStep`.
 */
import { fillTemplate, fullName } from './format';

/** « votre visite à la boutique » ou « notre échange en visio » selon `diag.modalite`. */
function contexteVisite(modalite) {
  return modalite === 'visio' ? 'notre échange en visio' : 'votre visite à la boutique';
}

/** « une semaine », « 3 jours »… à partir de `settings.delai_relance_jours` : évite que le
 * texte de la relance se désynchronise silencieusement du délai réellement configuré. */
function delaiRelanceLabel(jours) {
  if (jours === 7) return 'une semaine';
  if (jours === 14) return 'deux semaines';
  if (jours === 1) return 'un jour';
  return `${jours} jours`;
}

export function buildEmail({ diag, client, praticienne, settings, type = 'initial' }) {
  const tpl = type === 'relance' ? settings.templates.relance : settings.templates[diag.type] || settings.templates.peau;
  const vars = {
    prenom: client?.prenom || '',
    nom: client?.nom || '',
    praticienne: fullName(praticienne),
    boutique: settings.entreprise?.nom || 'Hu’mana',
    type: diag.type === 'peau' ? 'visage' : 'capillaire',
    contexte_visite: contexteVisite(diag.modalite),
    delai_relance: delaiRelanceLabel(settings.delai_relance_jours ?? 10),
  };
  return { to: client?.email || '', sujet: fillTemplate(tpl.sujet, vars), corps: fillTemplate(tpl.corps, vars) };
}

/** Ouvre Gmail (web) dans un nouvel onglet, message pré-rempli — la pièce jointe
 * (PDF) reste à joindre à la main, Gmail ne permet pas de la pré-remplir depuis une URL. */
export function gmailComposeUrl({ to, sujet, corps }) {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to: to || '', su: sujet || '', body: corps || '' });
  return `https://mail.google.com/mail/?${params.toString()}`;
}
