/** Constantes métier partagées (statuts, moments, types, catégories). */

export const DIAG_TYPES = {
  peau: { key: 'peau', label: 'Peau', icon: 'fa-solid fa-spa', color: 'sage' },
  cheveux: { key: 'cheveux', label: 'Cheveux', icon: 'fa-solid fa-wind', color: 'clay' },
};

/**
 * Cycle de vie d'un diagnostic :
 *  (brouillon, transitoire, ni affiché ni filtrable comme statut à part —
 *   voir `createDiagnostic` dans le store) → questionnaire / routine / PDF
 *   en préparation, en une seule séance ininterrompue ;
 *  envoye    → PDF envoyé à la cliente, relance planifiée (date_relance) ;
 *  termine   → relance envoyée ou diagnostic clôturé.
 */
export const STATUTS = {
  envoye: { key: 'envoye', label: 'Envoyé · suivi à venir', short: 'Envoyé', tone: 'sage', icon: 'fa-regular fa-paper-plane' },
  termine: { key: 'termine', label: 'Terminé', short: 'Terminé', tone: 'ink', icon: 'fa-regular fa-circle-check' },
};

export const MOMENTS = [
  { key: 'matin', label: 'Matin', icon: 'fa-regular fa-sun', hint: 'Au réveil, avant le maquillage' },
  { key: 'soir', label: 'Soir', icon: 'fa-regular fa-moon', hint: 'Avant le coucher' },
  { key: 'hebdo', label: 'Hebdo', icon: 'fa-regular fa-calendar', hint: '1 à 2 fois par semaine' },
];

export const QUESTION_TYPES = {
  choix_multiple: 'Choix multiple',
  choix_unique: 'Choix unique',
  oui_non: 'Oui / Non',
  texte: 'Texte libre',
};

/** Catégories de produits et ordre logique d'application dans une routine. */
export const CATEGORIES = [
  { key: 'Nettoyant', cible: 'peau', ordre: 1, icon: 'fa-solid fa-droplet' },
  { key: 'Lotion', cible: 'peau', ordre: 2, icon: 'fa-solid fa-spray-can-sparkles' },
  { key: 'Sérum', cible: 'peau', ordre: 3, icon: 'fa-solid fa-vial' },
  { key: 'Crème', cible: 'peau', ordre: 4, icon: 'fa-solid fa-jar' },
  { key: 'Huile', cible: 'mixte', ordre: 5, icon: 'fa-solid fa-leaf' },
  { key: 'Masque', cible: 'mixte', ordre: 6, icon: 'fa-solid fa-mask' },
  { key: 'Shampoing', cible: 'cheveux', ordre: 1, icon: 'fa-solid fa-pump-soap' },
  { key: 'Après-shampoing', cible: 'cheveux', ordre: 2, icon: 'fa-solid fa-bottle-droplet' },
  { key: 'Soin capillaire', cible: 'cheveux', ordre: 3, icon: 'fa-solid fa-wand-magic-sparkles' },
  { key: 'Complément alimentaire', cible: 'mixte', ordre: 9, icon: 'fa-solid fa-capsules' },
  { key: 'Accessoire', cible: 'mixte', ordre: 10, icon: 'fa-solid fa-spa' },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

export const LIFESTYLE_TIPS = [
  { id: 'sommeil', titre: 'Sommeil réparateur', icon: 'fa-regular fa-moon', texte: 'Visez 7 à 8 h de sommeil par nuit : c’est la nuit que la peau et le cuir chevelu se régénèrent.' },
  { id: 'hydratation', titre: 'Hydratation', icon: 'fa-solid fa-glass-water', texte: 'Buvez 1,5 L d’eau par jour, répartis dans la journée, pour soutenir l’hydratation de l’intérieur.' },
  { id: 'soleil', titre: 'Protection solaire', icon: 'fa-regular fa-sun', texte: 'Appliquez une protection solaire chaque matin, même par temps couvert, pour prévenir taches et vieillissement prématuré.' },
  { id: 'massage', titre: 'Auto-massage', icon: 'fa-regular fa-hand', texte: 'Deux minutes d’auto-massage du visage ou du cuir chevelu stimulent la circulation et détendent les tissus.' },
  { id: 'alimentation', titre: 'Assiette beauté', icon: 'fa-solid fa-seedling', texte: 'Privilégiez les légumes colorés, les bonnes graisses (huile d’olive, oléagineux) et limitez sucres rapides et alcool.' },
  { id: 'stress', titre: 'Gestion du stress', icon: 'fa-solid fa-spa', texte: 'Quelques minutes de respiration profonde chaque jour apaisent le système nerveux, et la peau le ressent.' },
  { id: 'chaleur', titre: 'Chaleur douce', icon: 'fa-solid fa-temperature-low', texte: 'Rincez à l’eau tiède et limitez les appareils chauffants : la chaleur excessive fragilise peau et fibre capillaire.' },
  { id: 'taie', titre: 'Linge propre', icon: 'fa-solid fa-bed', texte: 'Changez taie d’oreiller et serviettes chaque semaine pour limiter bactéries et frottements.' },
];
