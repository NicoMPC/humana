/**
 * Jeu de données de démonstration.
 * Les dates sont calculées par rapport à « aujourd'hui » pour que la démo
 * reste cohérente (relances échues, diagnostics du jour, etc.).
 */
import { daysFromToday, todayISO } from '../lib/dates';
import { uid } from '../lib/ids';
import { PRODUITS_DEMO } from './produits';
import { QUESTIONS_DEMO } from './questions';

export const SCHEMA_VERSION = 9;

// Comptes réels de départ : Jessie ET Nathalie sont toutes les deux
// gérantes (role `patronne`, accès complet identique — voir isPatronne()
// dans store/selectors.js). Jessie en premier pour que l'écran de connexion
// l'affiche en haut (ordre du tableau, voir LoginPage.jsx).
// D'autres praticiennes (équipe) se rajoutent ensuite depuis Équipe
// (EquipePage.jsx), sans toucher au code — pas besoin d'en prévoir plus ici.
export const USERS_DEMO = [
  { id: 'u-jessie', prenom: 'Jessie', nom: 'Gunzle', email: 'jessie@humana-boutique.fr', role: 'patronne', actif: true, couleur: '#8fa379' },
  { id: 'u-nathalie', prenom: 'Nathalie', nom: 'Gunzle', email: 'nathalie@humana-boutique.fr', role: 'patronne', actif: true, couleur: '#647653' },
];

export const SETTINGS_DEMO = {
  delai_relance_jours: 10,
  delai_photos_semaines: 6,
  securite: { code: 'Saloncin17!' },
  // Entretien de mise en route (2026-09-14) : une fois pour la boutique
  // entière (pas par utilisatrice), voir `components/onboarding/`. Tant que
  // `complete` est faux, l'appli entière est remplacée par l'entretien ;
  // une fois terminé, `locked` fige l'appli sur un écran de remerciement
  // jusqu'à ce qu'un futur passage en V1 repasse `locked` à `false` à la main.
  onboarding: {
    complete: false, locked: true, step: 0,
    reponses: {
      delai_photos_semaines: 6, delai_relance_jours: 7, relance_anticipee_ok: true,
      plusieurs_diag_meme_type_ok: true, besoin_photos: true, besoin_notes_libres: true,
      modalites: ['boutique', 'visio'], telephone_obligatoire: false, champs_stricts_ok: true,
      stock_rappel_semaines: 1, signature: 'L’équipe Hu’mana',
    },
  },
  // Date volontairement ancienne (> 7 jours) pour que la démo montre tout de
  // suite l'alerte « stock à rafraîchir » et invite à essayer l'import.
  stock: { dernierImport: daysFromToday(-9), historique: [] },
  entreprise: {
    nom: 'Hu’mana – La Boutique',
    slogan: 'Beauté naturelle',
    email: 'contact@humana-boutique.fr',
    telephone: '04 75 00 00 00',
    adresse: '85 Impasse des Amandiers, 07170 Saint-Germain',
    site: 'www.humana-boutique.fr',
    instagram: '@humana.laboutique',
  },
  signature_pdf: 'Prenez soin de vous, simplement.',
  templates: {
    peau: {
      sujet: 'Votre routine visage personnalisée – Hu’mana',
      corps:
        'Bonjour {prenom},\n\nMerci pour {contexte_visite}. Vous trouverez ci-joint votre routine visage personnalisée, établie à partir de notre diagnostic.\n\nPrenez le temps de l’intégrer en douceur et n’hésitez pas à me poser vos questions.\n\nÀ très vite,\n{praticienne}\n{boutique}',
    },
    cheveux: {
      sujet: 'Votre routine capillaire personnalisée – Hu’mana',
      corps:
        'Bonjour {prenom},\n\nMerci pour {contexte_visite}. Voici votre routine capillaire personnalisée, en pièce jointe.\n\nLes premiers résultats se voient après 3 à 4 semaines : soyez régulière et douce avec vos cheveux !\n\nÀ très vite,\n{praticienne}\n{boutique}',
    },
    relance: {
      sujet: 'Comment se passe votre routine, {prenom} ?',
      corps:
        'Bonjour {prenom},\n\nCela fait {delai_relance} que vous avez commencé votre routine. Comment vous sentez-vous ? Avez-vous des questions sur l’application des produits ?\n\nN’hésitez pas à m’envoyer une photo ou à passer à la boutique : nous ajusterons ensemble si besoin.\n\nBelle journée,\n{praticienne}\n{boutique}',
    },
    lifestyle: {
      sujet: 'Vos conseils bien-être personnalisés – Hu’mana',
      corps:
        'Bonjour {prenom},\n\nEn complément de votre routine, voici quelques conseils bien-être personnalisés, en pièce jointe.\n\nCe sont de petites habitudes simples à intégrer à votre rythme, sans pression : chaque petit pas compte.\n\nÀ très vite,\n{praticienne}\n{boutique}',
    },
  },
};

// Clientes réparties entre les deux gérantes (démo) : peu importe laquelle
// puisque Jessie et Nathalie voient toutes les deux tout — juste pour que
// la démo ne mette pas tout sur un seul compte.
const CLIENTS = [
  ['c-marie', 'u-nathalie', 'Marie', 'Lefèvre', 'marie.lefevre@email.com', '06 12 34 56 78', 'Peau sensible, allergie au parfum de synthèse.', -60],
  ['c-emma', 'u-jessie', 'Emma', 'Garcia', 'emma.garcia@email.com', '06 98 76 54 32', '', -45],
  ['c-chloe', 'u-nathalie', 'Chloé', 'Roux', 'chloe.roux@email.com', '07 11 22 33 44', 'Cheveux bouclés, souhaite espacer les lavages.', -40],
  ['c-lucie', 'u-jessie', 'Lucie', 'Moreau', 'lucie.moreau@email.com', '06 11 22 33 44', '', -30],
  ['c-anna', 'u-nathalie', 'Anna', 'Petit', 'anna.petit@email.com', '07 55 66 77 88', 'Enceinte : éviter les huiles essentielles.', -28],
  ['c-zoe', 'u-jessie', 'Zoé', 'Bernard', 'zoe.bernard@email.com', '06 44 55 66 77', '', -25],
  ['c-lina', 'u-nathalie', 'Lina', 'Dubois', 'lina.dubois@email.com', '07 33 44 55 66', 'Sportive, douche quotidienne.', -20],
  ['c-rose', 'u-jessie', 'Rose', 'Martin', 'rose.martin@email.com', '06 22 33 44 55', '', -15],
  ['c-alice', 'u-nathalie', 'Alice', 'Faure', 'alice.faure@email.com', '07 99 00 11 22', '', -10],
  ['c-julia', 'u-jessie', 'Julia', 'Mercier', 'julia.mercier@email.com', '06 77 88 99 00', 'Vient sur recommandation de Zoé.', -6],
  ['c-ines', 'u-nathalie', 'Inès', 'Lambert', 'ines.lambert@email.com', '06 31 41 59 26', '', -2],
  ['c-sarah', 'u-jessie', 'Sarah', 'Nguyen', '', '07 27 18 28 18', 'Email à demander lors du prochain passage.', -1],
];

// Pour que chaque diagnostic de démo reste cohérent avec la gérante en
// charge de la cliente (voir `diag()` ci-dessous, valeur par défaut de
// `praticienne_id`).
const CLIENT_PRAT = Object.fromEntries(CLIENTS.map(([id, praticienne_id]) => [id, praticienne_id]));

function client([id, praticienne_id, prenom, nom, email, telephone, notes, delta]) {
  return { id, praticienne_id, prenom, nom, email, telephone, notes, date_creation: daysFromToday(delta), archive: false };
}

function journal(entries, auteur_id) {
  return entries.map(([delta, action]) => ({ id: uid('j'), date: new Date(new Date(`${daysFromToday(delta)}T10:00:00`)).toISOString(), action, auteur_id }));
}

function diag(spec) {
  const {
    id, client_id, praticienne_id = CLIENT_PRAT[client_id], type, rdv, statut, reponses = {}, observations = {}, routine = [], conseils = '',
    lifestyle = [], envoi = null, relance = null, documents = [], notes = '', modalite = 'boutique', suivi_notes = '',
  } = spec;
  const date_rdv = daysFromToday(rdv);
  const date_envoi = envoi != null ? daysFromToday(envoi) : null;
  const date_relance = date_envoi ? daysFromToday(envoi + 10) : null;
  const relance_envoyee = relance != null;
  const j = [[rdv, 'Diagnostic démarré']];
  if (routine.length) j.push([rdv, 'Routine validée']);
  if (documents.length) j.push([rdv, 'PDF routine généré']);
  if (date_envoi) j.push([envoi, 'Email envoyé à la cliente']);
  if (relance != null) j.push([relance, 'Relance J+10 envoyée']);
  return {
    id, client_id, praticienne_id, type, date_rdv, date_creation: date_rdv, statut,
    reponses, observations, note_generale: notes, routine, conseils, lifestyle,
    documents: documents.map((d, i) => ({ id: `${id}-doc-${i}`, type: d, nom_fichier: `${d === 'routine' ? 'Routine' : 'Lifestyle'}_${type}.pdf`, date: `${date_rdv}T11:00:00.000Z`, version: 1 })),
    envois: [
      ...(date_envoi ? [{ id: `${id}-env-1`, date: `${date_envoi}T11:30:00.000Z`, type: 'initial', mode: 'manuel', destinataire: '', sujet: '' }] : []),
      ...(relance != null ? [{ id: `${id}-env-2`, date: `${daysFromToday(relance)}T09:00:00.000Z`, type: 'relance', mode: 'manuel', destinataire: '', sujet: '' }] : []),
    ],
    date_envoi, date_relance, relance_envoyee, photos: { avant: null, apres: null }, suivi_notes,
    date_cloture: statut === 'termine' ? daysFromToday(relance ?? rdv) : null,
    journal: journal(j, praticienne_id),
    modalite,
  };
}

const R = (produit_id, moments, conseil = '') => ({ produit_id, moments, conseil });

export const DIAGNOSTICS_DEMO = [
  // Brouillon — aujourd'hui (questionnaire pas encore terminé)
  diag({ id: 'd-01', client_id: 'c-ines', type: 'peau', rdv: 0, statut: 'brouillon',
    reponses: { 'qp-type': 'Mixte', 'qp-preoccupations': ['Imperfections', 'Pores dilatés'], 'qp-sensibilite': 'Non' },
    observations: { 'qp-type': 'Zone T brillante en fin de journée.' } }),
  diag({ id: 'd-02', client_id: 'c-sarah', type: 'cheveux', rdv: 0, statut: 'brouillon' }),
  // Brouillon — routine faite, PDF à générer
  diag({ id: 'd-03', client_id: 'c-julia', type: 'peau', rdv: -1, statut: 'brouillon',
    reponses: { 'qp-type': 'Sèche', 'qp-preoccupations': ['Déshydratation', 'Rides & ridules'], 'qp-sensibilite': 'Non', 'qp-soleil': 'Oui', 'qp-objectif': 'Hydratation', 'qp-routine': 'Eau micellaire + crème hydratante de grande surface.' },
    routine: [R('p-103', ['matin', 'soir']), R('p-122', ['matin', 'soir'], '3 gouttes sur peau humide'), R('p-131', ['matin']), R('p-135', ['soir']), R('p-152', ['hebdo'], 'Le dimanche, 15 min')],
    conseils: 'Pensez à boire un grand verre d’eau au réveil.' }),
  // Envoyé — relance échue (délai de relance : 10 jours, voir Paramètres)
  diag({ id: 'd-04', client_id: 'c-alice', type: 'peau', rdv: -12, statut: 'envoye', envoi: -12,
    reponses: { 'qp-type': 'Sensible', 'qp-preoccupations': ['Rougeurs'], 'qp-sensibilite': 'Oui', 'qp-objectif': 'Apaisement' },
    routine: [R('p-103', ['matin', 'soir']), R('p-124', ['soir']), R('p-134', ['matin', 'soir']), R('p-136', ['matin'])],
    documents: ['routine'], conseils: 'Éviter l’eau trop chaude au rinçage.' }),
  // Envoyé — relance aujourd'hui
  diag({ id: 'd-05', client_id: 'c-rose', type: 'cheveux', rdv: -10, statut: 'envoye', envoi: -10,
    reponses: { 'qc-type': 'Ondulés', 'qc-cuir': 'Normal', 'qc-problemes': ['Manque de volume', 'Cheveux fins'], 'qc-lavage': '2 à 3 fois / semaine', 'qc-chaleur': 'Oui', 'qc-objectif': 'Volume' },
    routine: [R('p-161', ['soir']), R('p-173', ['soir'], 'Sur les longueurs uniquement'), R('p-181', ['matin'])],
    documents: ['routine'] }),
  // Envoyé — relance dans 4 jours
  diag({ id: 'd-06', client_id: 'c-lina', type: 'cheveux', rdv: -6, statut: 'envoye', envoi: -6,
    reponses: { 'qc-type': 'Raides', 'qc-cuir': 'Gras', 'qc-problemes': ['Manque de volume'], 'qc-lavage': 'Tous les jours', 'qc-chaleur': 'Non', 'qc-objectif': 'Volume' },
    routine: [R('p-162', ['matin']), R('p-173', ['matin']), R('p-184', ['soir'], '2 fois par semaine en massage')],
    documents: ['routine', 'lifestyle'], lifestyle: ['chaleur', 'taie', 'alimentation'] }),
  // Envoyé — relance dans 6 jours
  diag({ id: 'd-07', client_id: 'c-lucie', type: 'peau', rdv: -4, statut: 'envoye', envoi: -4,
    reponses: { 'qp-type': 'Grasse', 'qp-preoccupations': ['Imperfections'], 'qp-sensibilite': 'Non', 'qp-objectif': 'Purification' },
    routine: [R('p-102', ['matin', 'soir']), R('p-125', ['soir']), R('p-133', ['matin', 'soir']), R('p-151', ['hebdo'])],
    documents: ['routine'] }),
  // Terminés — d-08 envoyé il y a plus de 6 semaines : sert à illustrer
  // l'alerte « Photos avant/après à recueillir » sur le tableau de bord.
  diag({ id: 'd-08', client_id: 'c-anna', type: 'peau', rdv: -50, statut: 'termine', envoi: -50, relance: -40,
    reponses: { 'qp-type': 'Normale', 'qp-preoccupations': ['Manque d’éclat'], 'qp-sensibilite': 'Non', 'qp-objectif': 'Éclat', 'qp-allergies': 'Huiles essentielles (grossesse)' },
    routine: [R('p-101', ['matin', 'soir']), R('p-121', ['matin']), R('p-131', ['matin', 'soir']), R('p-153', ['hebdo'])],
    documents: ['routine', 'lifestyle'], lifestyle: ['sommeil', 'hydratation', 'soleil'] }),
  diag({ id: 'd-09', client_id: 'c-zoe', type: 'cheveux', rdv: -23, statut: 'termine', envoi: -23, relance: -16,
    reponses: { 'qc-type': 'Crépus', 'qc-cuir': 'Sec', 'qc-problemes': ['Sécheresse', 'Fourches'], 'qc-lavage': '1 fois / semaine', 'qc-chaleur': 'Non', 'qc-objectif': 'Hydratation' },
    routine: [R('p-163', ['hebdo']), R('p-172', ['hebdo']), R('p-155', ['hebdo'], 'Sous serviette chaude, 15 min'), R('p-181', ['matin']), R('p-143', ['hebdo'], 'Bain d’huile la veille du shampoing')],
    documents: ['routine'] }),
  diag({ id: 'd-10', client_id: 'c-marie', type: 'peau', rdv: -19, statut: 'termine', envoi: -19, relance: -12,
    reponses: { 'qp-type': 'Sensible', 'qp-preoccupations': ['Rougeurs', 'Déshydratation'], 'qp-sensibilite': 'Oui', 'qp-objectif': 'Apaisement', 'qp-allergies': 'Parfum de synthèse' },
    routine: [R('p-103', ['soir']), R('p-112', ['matin', 'soir']), R('p-124', ['soir']), R('p-134', ['matin', 'soir'])],
    documents: ['routine'] }),
  diag({ id: 'd-11', client_id: 'c-emma', type: 'cheveux', rdv: -18, statut: 'termine', envoi: -18, relance: -11,
    reponses: { 'qc-type': 'Raides', 'qc-cuir': 'Normal', 'qc-problemes': ['Manque de brillance'], 'qc-objectif': 'Réparation' },
    routine: [R('p-161', ['soir']), R('p-172', ['soir']), R('p-182', ['soir'])],
    documents: ['routine'] }),
  diag({ id: 'd-12', client_id: 'c-chloe', type: 'cheveux', rdv: -17, statut: 'termine', envoi: -17, relance: -10,
    reponses: { 'qc-type': 'Bouclés', 'qc-cuir': 'Normal', 'qc-problemes': ['Frisottis', 'Sécheresse'], 'qc-lavage': '2 à 3 fois / semaine', 'qc-objectif': 'Définition des boucles' },
    routine: [R('p-163', ['soir']), R('p-171', ['soir']), R('p-183', ['matin'], 'Sur cheveux humides, froisser vers le haut'), R('p-154', ['hebdo'])],
    documents: ['routine', 'lifestyle'], lifestyle: ['chaleur', 'taie'] }),
  // Une 2e visite pour Marie, brouillon (historique cliente)
  diag({ id: 'd-13', client_id: 'c-marie', type: 'cheveux', rdv: -2, statut: 'brouillon',
    reponses: { 'qc-type': 'Ondulés', 'qc-cuir': 'Irrité', 'qc-problemes': ['Sécheresse'] } }),
];

export function buildSeed() {
  return {
    version: SCHEMA_VERSION,
    seededAt: todayISO(),
    users: USERS_DEMO,
    clients: CLIENTS.map(client),
    diagnostics: DIAGNOSTICS_DEMO,
    produits: PRODUITS_DEMO,
    questions: QUESTIONS_DEMO,
    settings: SETTINGS_DEMO,
  };
}
