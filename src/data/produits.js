/** Catalogue de démonstration Hu'mana (produits naturels, peau & cheveux). */

const P = (id, nom, categorie, cible, prix, description, stock = 12) => ({
  id: `p-${id}`,
  nom,
  categorie,
  cible, // 'peau' | 'cheveux' | 'mixte'
  reference: `HM-${String(id).padStart(3, '0')}`,
  prix: prix.toFixed(2),
  stock,
  description,
  actif: true,
});

export const PRODUITS_DEMO = [
  // Peau — nettoyants
  P(101, 'Nettoyant Doux à l’Aloe Vera', 'Nettoyant', 'peau', 18.9, 'Gel lavant sans savon qui élimine les impuretés en respectant le film hydrolipidique.', 14),
  P(102, 'Nettoyant Purifiant au Charbon Végétal', 'Nettoyant', 'peau', 19.9, 'Nettoie en profondeur et resserre les pores des peaux mixtes à grasses.', 9),
  P(103, 'Nettoyant Moussant à la Camomille', 'Nettoyant', 'peau', 17.5, 'Mousse fine et apaisante pour les peaux sensibles et réactives.', 11),
  P(104, 'Huile Démaquillante à l’Amande Douce', 'Nettoyant', 'peau', 22.0, 'Dissout maquillage et protection solaire sans dessécher, se rince à l’eau.', 8),
  P(105, 'Exfoliant Doux à l’Argile Rose', 'Nettoyant', 'peau', 21.0, 'Gommage enzymatique hebdomadaire pour affiner le grain de peau.', 6),
  // Peau — lotions
  P(111, 'Lotion Tonique à la Rose de Damas', 'Lotion', 'peau', 16.5, 'Rééquilibre le pH et prépare la peau à recevoir les soins.', 15),
  P(112, 'Brume Apaisante au Bleuet', 'Lotion', 'peau', 15.0, 'Rafraîchit et calme les rougeurs, à vaporiser matin et soir.', 10),
  // Peau — sérums
  P(121, 'Sérum Éclat à la Vitamine C', 'Sérum', 'peau', 34.0, 'Antioxydant qui unifie le teint et atténue les taches.', 7),
  P(122, 'Sérum Hydratant à l’Acide Hyaluronique', 'Sérum', 'peau', 32.0, 'Repulpe et hydrate en profondeur les peaux déshydratées.', 12),
  P(123, 'Sérum Anti-Âge au Bakuchiol', 'Sérum', 'peau', 39.0, 'Alternative végétale au rétinol : lisse les ridules sans irriter.', 5),
  P(124, 'Sérum Apaisant au Centella Asiatica', 'Sérum', 'peau', 31.0, 'Renforce la barrière cutanée des peaux sensibles.', 9),
  P(125, 'Sérum Matifiant à la Niacinamide', 'Sérum', 'peau', 29.0, 'Régule le sébum et resserre les pores.', 8),
  // Peau — crèmes
  P(131, 'Crème Hydratante au Beurre de Karité', 'Crème', 'peau', 27.0, 'Hydratation confort 24 h pour les peaux normales à sèches.', 13),
  P(132, 'Crème Riche à l’Huile d’Argan', 'Crème', 'peau', 31.0, 'Nourrit intensément les peaux sèches et matures.', 6),
  P(133, 'Crème Légère à l’Aloe Vera', 'Crème', 'peau', 24.0, 'Texture gel-crème non grasse pour les peaux mixtes.', 11),
  P(134, 'Crème Apaisante à l’Avoine', 'Crème', 'peau', 26.0, 'Calme les tiraillements des peaux réactives.', 9),
  P(135, 'Crème de Nuit Régénérante', 'Crème', 'peau', 36.0, 'Soutient le renouvellement cellulaire pendant le sommeil.', 7),
  P(136, 'Crème Solaire Minérale SPF 30', 'Crème', 'peau', 25.0, 'Protection quotidienne à l’oxyde de zinc, fini naturel.', 10),
  // Mixte — huiles & masques
  P(141, 'Huile Sèche à l’Argan', 'Huile', 'mixte', 23.0, 'Nourrit visage, corps et pointes des cheveux sans effet gras.', 12),
  P(142, 'Huile Réparatrice à la Rose Musquée', 'Huile', 'peau', 28.0, 'Régénère et atténue cicatrices et marques.', 6),
  P(143, 'Huile Fortifiante au Ricin', 'Huile', 'cheveux', 14.0, 'Stimule la pousse et fortifie la fibre, en bain d’huile avant shampoing.', 10),
  P(151, 'Masque Purifiant à l’Argile Verte', 'Masque', 'peau', 19.0, 'Absorbe l’excès de sébum, une fois par semaine.', 11),
  P(152, 'Masque Hydratant au Miel', 'Masque', 'peau', 21.0, 'Bain d’hydratation hebdomadaire pour les peaux assoiffées.', 8),
  P(153, 'Masque Éclat à la Papaye', 'Masque', 'peau', 22.0, 'Exfoliation enzymatique douce, teint lumineux.', 5),
  P(154, 'Masque Capillaire Nourrissant à l’Avocat', 'Masque', 'cheveux', 20.0, 'Répare les longueurs sèches et abîmées, 10 min sous serviette chaude.', 9),
  P(155, 'Masque Capillaire Réparateur à la Kératine Végétale', 'Masque', 'cheveux', 24.0, 'Comble les brèches de la fibre et limite les fourches.', 7),
  // Cheveux
  P(161, 'Shampoing Doux à l’Avoine', 'Shampoing', 'cheveux', 16.0, 'Lavage quotidien sans sulfates, tous types de cheveux.', 15),
  P(162, 'Shampoing Purifiant à l’Ortie', 'Shampoing', 'cheveux', 17.0, 'Assainit les cuirs chevelus gras et espace les lavages.', 9),
  P(163, 'Shampoing Hydratant à l’Aloe Vera', 'Shampoing', 'cheveux', 17.0, 'Hydrate les cheveux secs, bouclés et frisés.', 12),
  P(164, 'Shampoing Fortifiant au Ricin', 'Shampoing', 'cheveux', 18.0, 'Limite la chute et densifie la chevelure.', 8),
  P(165, 'Shampoing Antipelliculaire à l’Arbre à Thé', 'Shampoing', 'cheveux', 18.5, 'Apaise démangeaisons et pellicules.', 6),
  P(171, 'Après-shampoing Démêlant au Karité', 'Après-shampoing', 'cheveux', 15.0, 'Démêle et adoucit sans alourdir.', 12),
  P(172, 'Après-shampoing Nourrissant à l’Argan', 'Après-shampoing', 'cheveux', 16.5, 'Longueurs souples et brillantes.', 10),
  P(173, 'Après-shampoing Volume au Bambou', 'Après-shampoing', 'cheveux', 16.0, 'Gaine la fibre pour un volume naturel.', 7),
  P(181, 'Soin Sans Rinçage à l’Argan', 'Soin capillaire', 'cheveux', 19.0, 'Protège de la chaleur et discipline les frisottis.', 11),
  P(182, 'Sérum Pointes Réparateur', 'Soin capillaire', 'cheveux', 21.0, 'Scelle les pointes et prévient les fourches.', 8),
  P(183, 'Gelée Boucles Définition', 'Soin capillaire', 'cheveux', 18.0, 'Définit les boucles sans effet carton.', 9),
  P(184, 'Lotion Cuir Chevelu Fortifiante', 'Soin capillaire', 'cheveux', 26.0, 'Tonifie le cuir chevelu et stimule la pousse, en massage le soir.', 5),
  // Compléments
  P(191, 'Complexe Beauté Peau & Cheveux', 'Complément alimentaire', 'mixte', 29.0, 'Biotine, zinc et sélénium : 1 gélule le matin pendant 3 mois.', 14),
  P(192, 'Complexe Éclat Vitamine E', 'Complément alimentaire', 'peau', 24.0, 'Antioxydants pour un teint lumineux.', 10),
  P(193, 'Complexe Anti-Chute Zinc & Biotine', 'Complément alimentaire', 'cheveux', 27.0, 'Cure de 3 mois pour ralentir la chute saisonnière.', 8),
  P(194, 'Complexe Hydratation Acide Hyaluronique', 'Complément alimentaire', 'peau', 32.0, 'Hydratation de l’intérieur, 2 gélules par jour.', 6),
];
