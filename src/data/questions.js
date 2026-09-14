/** Questionnaires de diagnostic par défaut (modifiables dans Paramètres). */

export const QUESTIONS_DEMO = {
  peau: [
    { id: 'qp-type', texte: 'Quel type de peau observez-vous ?', type: 'choix_unique', options: ['Normale', 'Sèche', 'Grasse', 'Mixte', 'Sensible'], obligatoire: true, aide: 'Observez la zone T et les joues après nettoyage.' },
    { id: 'qp-preoccupations', texte: 'Quelles sont les préoccupations principales ?', type: 'choix_multiple', options: ['Déshydratation', 'Imperfections', 'Rides & ridules', 'Taches', 'Rougeurs', 'Manque d’éclat', 'Pores dilatés'], obligatoire: true },
    { id: 'qp-sensibilite', texte: 'La peau réagit-elle facilement aux produits ?', type: 'oui_non', options: [], obligatoire: true },
    { id: 'qp-routine', texte: 'Quelle est sa routine actuelle ?', type: 'texte', options: [], obligatoire: false, aide: 'Produits utilisés, fréquence, ce qu’elle aime ou non.' },
    { id: 'qp-soleil', texte: 'Utilise-t-elle une protection solaire au quotidien ?', type: 'oui_non', options: [], obligatoire: false },
    { id: 'qp-allergies', texte: 'Allergies ou ingrédients à éviter ?', type: 'texte', options: [], obligatoire: false },
    { id: 'qp-objectif', texte: 'Quel est l’objectif principal de la routine ?', type: 'choix_unique', options: ['Hydratation', 'Anti-âge', 'Éclat', 'Purification', 'Apaisement'], obligatoire: true },
  ],
  cheveux: [
    { id: 'qc-type', texte: 'Quel est le type de cheveux ?', type: 'choix_unique', options: ['Raides', 'Ondulés', 'Bouclés', 'Frisés', 'Crépus'], obligatoire: true },
    { id: 'qc-cuir', texte: 'Quel est l’état du cuir chevelu ?', type: 'choix_unique', options: ['Normal', 'Sec', 'Gras', 'Pellicules', 'Irrité'], obligatoire: true },
    { id: 'qc-problemes', texte: 'Quels sont les problèmes principaux ?', type: 'choix_multiple', options: ['Chute', 'Sécheresse', 'Fourches', 'Manque de volume', 'Manque de brillance', 'Frisottis', 'Cheveux fins'], obligatoire: true },
    { id: 'qc-lavage', texte: 'Fréquence de lavage ?', type: 'choix_unique', options: ['Tous les jours', '2 à 3 fois / semaine', '1 fois / semaine', 'Moins'], obligatoire: false },
    { id: 'qc-chaleur', texte: 'Utilise-t-elle régulièrement des appareils chauffants ?', type: 'oui_non', options: [], obligatoire: false },
    { id: 'qc-routine', texte: 'Quelle est sa routine capillaire actuelle ?', type: 'texte', options: [], obligatoire: false },
    { id: 'qc-allergies', texte: 'Allergies ou sensibilités connues ?', type: 'texte', options: [], obligatoire: false },
    { id: 'qc-objectif', texte: 'Quel est l’objectif principal ?', type: 'choix_unique', options: ['Hydratation', 'Réparation', 'Volume', 'Anti-chute', 'Définition des boucles'], obligatoire: true },
  ],
};
