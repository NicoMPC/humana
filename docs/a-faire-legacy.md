# À faire — Humana, par niveau (réf. devis NFS-DEV-2026-0912-HUM-APP-V10)

Ce document liste, niveau par niveau, ce qu'il reste concrètement à construire
pour livrer l'application en production. Il part de l'état réel du code au
9 septembre 2026 (dossier `src/`), pas du devis : le devis vend une promesse,
ce fichier dit comment on la tient.

## Mise à jour du 12/09/2026 — devis V10 et démo figée en Niveau 3

**Devis.** Nouvelle version (`devis/Devis_NFS_DEV_2026_0912_HUM_APP_V10.pdf`) :
- Formule abonnement retirée : plus qu'un paiement en une fois, en deux
  temps (50 % signature / 50 % livraison) pour les 3 niveaux — remplace le
  40/60 et les montants d'abonnement mensuel mentionnés plus bas dans ce
  document (désormais obsolètes).
- Prix de mise en place revus : 990 € (N1, inchangé) / 2 290 € (N2, était
  1 890 €) / 4 290 € (N3, était 3 490 €, lui-même déjà remonté depuis
  2 890 € le 10/09 — voir le raisonnement en section 3.3, toujours valable
  en proportion).
- Maintenance Sérénité revue : 49 / 79 / 119 €/mois (était 39/59/89).
- Tarif horaire hors-forfait : 80 € HT (était 60 €).
- **« Illimités (poste partagé) », décidé le 10/09 (voir audit plus bas),
  est abrogé : le devis V10 autorise désormais explicitement le
  multi-appareils au Niveau 3** — chaque praticienne se connecte avec ses
  identifiants personnels depuis son propre appareil, en s'appuyant sur la
  synchronisation Sheets déjà prévue (3.2). Les Niveaux 1-2 restent
  mono-poste (pas de comptes/sync individuels pour justifier le
  multi-appareils à ces niveaux). Voir section 3.1, mise à jour en
  conséquence.

**Démo (`src/`).** Pour la présentation du 12/09, l'application a été
**figée en Niveau 3 côté affichage**, sans construire les fonctionnalités
réelles du Niveau 3 (ça reste entièrement à faire, section 3 ci-dessous
n'a pas changé sur le fond) :
- `NIVEAUX` (`src/data/constants.js`) a maintenant une entrée `3`. Le code
  métier, lui, ne connaît toujours que la frontière **1 / 2+**
  (`niveau >= 2` partout où `niveau === 2` était utilisé) — le Niveau 3
  n'ajoute aucune mécanique propre. La phrase « le code ne connaît que
  deux niveaux, pas trois » en section 0 ci-dessous date d'avant ce
  changement et n'est plus exacte telle quelle (voir note sur place).
- `SETTINGS_DEMO.niveau` vaut `3` (`src/data/seed.js`, `SCHEMA_VERSION`
  passé à `8` pour forcer le reset du `localStorage` existant), et
  l'interrupteur de changement de niveau a été **retiré de l'UI** (barre
  latérale + Paramètres → Général, remplacés par un badge en lecture
  seule). L'action `setNiveau` existe toujours dans le store pour du
  développement ponctuel, juste plus déclenchable depuis l'interface.
- `PremiumTag` (déjà existant) s'affiche désormais **en permanence** sur
  les fonctionnalités niveau 2+, même débloquées — avant il n'apparaissait
  que verrouillé. Concerne `SendStep.jsx`, `LifestyleStep.jsx`,
  `ParametresPage.jsx` (onglet Questionnaires).
- Nouveau, purement esthétique, sans impact sur la logique métier :
  voile d'ouverture (`src/components/layout/IntroSplash.jsx`).

## -1. Correctif obligatoire, avant toute livraison (pas une option)

**Bug de perte de données silencieuse.** `src/store/useStore.js:213` :
```js
migrate: (persisted, version) => (version === SCHEMA_VERSION ? persisted : { ...buildSeed(), session: { userId: null } })
```
Si une future mise à jour change `SCHEMA_VERSION` (`src/data/seed.js:11`,
actuellement `7`), toutes les données réelles de HU'MANA sont **remplacées
sans avertissement par le jeu de démo** (Sarah Nguyen etc.). Pratique pour
une démo, inacceptable en production. À corriger avant la première livraison,
quel que soit le niveau : écrire une vraie fonction de migration (qui adapte
les données existantes au nouveau schéma au lieu de les jeter), ou a minima
avertir et bloquer plutôt qu'écraser silencieusement.

**Mise à jour du 11/09/2026** : le bouton manuel « Réinitialiser les
données de démo » (`ParametresPage.jsx`, action `resetDemo` de
`useStore.js`) a été supprimé — c'était un second chemin, accessible en un
clic par la gérante, vers le même `buildSeed()` que ce bug automatique.
**Le bug ci-dessus n'est pas corrigé pour autant** : `migrate()` peut
toujours écraser silencieusement les vraies données sur un changement de
version, sans qu'aucun clic humain ne soit nécessaire. Ce point reste
bloquant avant livraison.

## 0. État actuel du code (rappel factuel)

- App 100 % front-end (React + Vite + Zustand), aucune donnée ne quitte le
  navigateur : `src/store/useStore.js` persiste tout en `localStorage`.
- ~~Le code ne connaît que **deux** niveaux (`settings.niveau` = 1 ou 2), pas
  trois — ex. `useStore.js:143` : `if (s.settings.niveau !== 2) return [];`
  pour les relances auto.~~ **Périmé depuis le 12/09/2026** (voir la mise à
  jour en tête de document) : `NIVEAUX` a désormais une entrée `3`, et la
  condition est devenue `niveau < 2` / `niveau >= 2` partout. Ceci dit, le
  fond reste vrai : le Niveau 3 (profils multi-appareils, Google Sheets,
  parcours d'achat) n'a aucune mécanique propre dans le code, il est
  toujours entièrement à créer — le 12/09 n'a fait qu'ajouter le *label* et
  débloquer l'accès aux fonctionnalités 2+ sous ce label, pour la démo.
- Les envois d'e-mail sont **simulés** : `src/lib/email.js` ouvre Gmail
  pré-rempli (`gmailComposeUrl`) ou attend un délai fictif
  (`simulateAutoSend`). Aucun service d'envoi réel n'est branché.
- Le PDF généré (`src/lib/pdf/`) reprend déjà entièrement la charte Hu'mana
  (polices, logos, couleurs — `src/lib/pdf/brand.js`). Il n'existe pas de
  gabarit "générique" neutre : c'est un point à traiter pour livrer un vrai
  Niveau 1 (voir plus bas).
- L'import Planity (`src/lib/planityImport.js`) et le rappel de fraîcheur du
  stock (`src/hooks/useStockReminder.js`) sont déjà fonctionnels.
- Aucune limite de nombre de profils n'est appliquée dans `EquipePage.jsx` :
  la gérante peut ajouter autant de praticiennes qu'elle veut, quel que soit
  le niveau.
- Aucune brique QR code / page cliente publique / WhatsApp / Google Sheets
  n'existe : ni lib QR, ni route publique sans authentification, ni webhook.
- **Aucune authentification** : `src/pages/LoginPage.jsx` affiche "Aucun mot
  de passe en mode démonstration" — n'importe qui sur le poste choisit un
  profil et voit tout, y compris les données sensibles des diagnostics
  (allergies, préoccupations de santé-adjacentes).
- **Aucun export/sauvegarde des données** : `src/lib/csv.js` ne sert qu'à
  *importer* le stock Planity ; il n'existe aucune fonction pour sortir les
  clientes/diagnostics de l'app. Combiné au point précédent (localStorage
  = un seul navigateur), une perte du poste ou un cache vidé efface tout,
  sans filet de sécurité en dehors du Sheets du Niveau 3.

**Décisions prises avec Nathalie le 10/09/2026** (déterminent le reste de ce
document) :
- **Déploiement mono-poste confirmé** : un seul ordinateur/navigateur
  partagé en boutique, pas de vrais comptes multi-appareils. Décision
  assumée, à écrire explicitement dans le devis (fait en V7) plutôt que
  laissée implicite.
- **Sauvegarde à tous les niveaux** : ajouter un export manuel + un rappel
  de "fraîcheur de sauvegarde" (même logique que `useStockReminder.js`),
  inclus au tarif actuel des 3 niveaux — pas de sur-facturation pour ce
  correctif de sécurité de base.
- **Authentification légère à tous les niveaux** : un code d'accès partagé
  aux Niveaux 1-2 ; au Niveau 3, des identifiants par praticienne stockés
  dans une feuille Google Sheets que Nathalie gère elle-même (ajouter/retirer
  une ligne = donner/retirer un accès), en s'appuyant sur l'automatisation
  Sheets déjà prévue. Explicitement documenté comme protection légère, pas
  un système d'authentification professionnel — cohérent avec "on s'en fiche
  du niveau de sécurité pour le moment".
- **Synchronisation Sheets (Niveau 3) : continue**, pas à la demande —
  confirme le pitch d'origine du 3.2 ci-dessous, aucun changement de prix.

**Audit "logique métier" du 10/09/2026** (Nicolas a repéré une incohérence,
on a creusé et trouvé plus large — décisions ci-dessous) :
- **PDF Niveau 1 : logo seul, pas 100 % neutre.** Un gabarit totalement sans
  marque (pensé initialement) risquait de nuire à l'image de HU'MANA même au
  tarif d'entrée. Le PDF N1 garde le logo Hu'mana, sans le reste de la charte
  (couleurs, typographies) — voir section 1 ci-dessous.
- **"Espace gérante" redéfini.** En vérifiant le code, la visibilité globale
  de la gérante (`isPatronne()` dans `src/store/selectors.js`) n'a jamais été
  conditionnée par le niveau — elle voit déjà tout, gratuitement, à tous les
  niveaux. Vendre ça comme exclusif N2/N3 aurait demandé de développer une
  restriction artificielle sur une fonctionnalité qui marche déjà, pour la
  seule raison de la cacher : pas fait. Ce qui reste réellement exclusif à
  N2/N3, c'est la **gestion d'équipe** (ajouter/retirer une praticienne),
  qui se limite naturellement au Niveau 1 via le plafond de comptes (2) —
  pas besoin d'un verrou séparé, le plafond suffit.
- **Une recette légère à tous les niveaux, pas seulement au Niveau 3.** Les
  items "Recette" déjà prévus aux Niveaux 1 et 2 (voir plus bas) sont
  maintenant explicitement présentés dans le devis comme une "recette
  rapide" incluse — le Niveau 3 reste le seul avec une phase de tests
  approfondie (jeux de données représentatifs, séance formelle dédiée).
- **"Illimités" (Niveau 3) nuancé en "Illimités (poste partagé)"** dans le
  tableau comparatif du devis — pour ne pas laisser croire à un accès
  multi-appareils que l'architecture mono-poste ne permet pas.
- **Bug trouvé en auditant `recordEnvoi`** (`src/store/useStore.js:119-130`,
  appelé depuis `src/components/diagnostic/SendStep.jsx:46`) : cliquer
  « Ouvrir Gmail » marque *immédiatement* le diagnostic comme envoyé
  (`statut: 'envoye'`, `date_envoi` posée), avant même que l'e-mail soit
  réellement parti dans Gmail. Si la praticienne ferme la fenêtre sans
  envoyer, la relance (manuelle ou automatique) se déclenche quand même sur
  un e-mail jamais parti. À corriger avant livraison, tous niveaux : soit
  demander une confirmation explicite après le retour sur l'app ("l'avez-vous
  bien envoyé ?"), soit accepter le compromis actuel et le documenter comme
  tel plutôt que de le laisser en bug silencieux.

**Décision du 11/09/2026 — catégorie produit non ré-écrasée à l'import CSV.**
Confirmé : quand un produit Planity déjà connu (par EAN ou nom) est
ré-importé, `buildImportPlan` (`src/lib/planityImport.js:156-168`) ne met à
jour que `stock`/`prix`/`prix_achat`/`ean`, jamais `categorie` — même si le
rayon Planity ou le nom (mots-clés "nettoyant", "lotion", etc.) suggère une
catégorie différente. Comportement volontaire conservé tel quel : la fiche
produit personnalisée par la praticienne prime toujours sur l'import. Seuls
les **nouveaux** produits reçoivent une catégorie déduite automatiquement.

---

## 1. Niveau 1 — Essentiel (990 €)

### Déjà en place (à valider/nettoyer, pas à recréer)
- Diagnostic guidé peau/cheveux, questionnaire pas-à-pas (`src/pages/DiagnosticPage.jsx`, `src/data/questions.js`).
- Construction de routine (matin/soir/hebdo), recherche produits (`src/components/diagnostic/`).
- Catalogue produits + recherche (`src/pages/ProduitsPage.jsx`).
- Génération PDF de routine et téléchargement (`src/lib/pdf/routinePdf.js`, `usePdfActions.js`).
- Envoi manuel via Gmail pré-rempli (`openMailClient`, `src/lib/email.js`).
- Relance signalée manuellement (pas d'automatisation).

### Reste à faire
1. **Gabarit PDF léger (logo seul)** : créer une seconde mise en page dans
   `src/lib/pdf/` (ex. `routinePdfLight.js`), qui garde le logo Hu'mana
   (`src/lib/pdf/assets.js`) mais pas le reste de la charte (couleurs,
   typographies Cormorant/Quicksand — mise en page en polices système).
   Basculer entre gabarit léger (N1) et gabarit sur-mesure Hu'mana (N2/N3)
   selon `settings.niveau`.
2. **Limiter à 2 profils** : dans `EquipePage.jsx`, bloquer l'ajout d'une
   3ᵉ praticienne quand `settings.niveau === 1` (message clair, bouton
   désactivé plutôt qu'erreur silencieuse). *Décision produit à confirmer :
   blocage dur, ou simple avertissement ?* Ce plafond fait aussi office de
   restriction de "gestion d'équipe" (voir audit du 10/09 ci-dessus) : pas
   besoin d'un verrou séparé sur la page Équipe, une fois à 2/2 le bouton
   "Ajouter une praticienne" se désactive naturellement.
3. **Masquer les fonctionnalités hors-scope** dans l'UI quand niveau = 1 :
   import CSV (`ProduitsPage.jsx`), PDF lifestyle, bouton "relance
   automatique" — actuellement ces éléments sont dans le code mais pas
   forcément conditionnés proprement niveau par niveau ; à auditer et
   verrouiller un par un.
4. **Retirer la dépendance au compte de démo** : les comptes actuels
   (Nathalie, Jessie, Camille) sont un jeu de démonstration
   (`src/data/seed.js`) ; prévoir la création des vrais comptes de HU'MANA
   à la livraison (2 profils réels).
5. **Hébergement réel** : déployer `dist/` sur l'hébergement choisi par
   HU'MANA (nom de domaine/sous-domaine à obtenir de Nathalie), configurer
   HTTPS.
6. **Recette rapide** avec Nathalie sur un vrai parcours (diagnostic →
   routine → PDF → envoi) avant livraison — c'est la "recette rapide"
   mentionnée dans le devis pour ce niveau, à ne pas confondre avec la
   phase de tests approfondie, exclusive au Niveau 3 (voir 3.5).
7. **Formation 1 h** : support de formation minimal (captures d'écran ou
   courte vidéo) + session live.
8. **Export manuel des données** : nouveau bouton dans Paramètres (ou
   Documents), génère un fichier JSON ou CSV complet (clientes, diagnostics)
   téléchargeable — brique indépendante, pas de backend requis.
9. **Rappel de fraîcheur de sauvegarde** : réutiliser le pattern de
   `src/hooks/useStockReminder.js` (encart dashboard vert/orange/rouge selon
   l'ancienneté du dernier export, toast à l'ouverture si en retard) sur un
   nouveau `useBackupReminder.js`, avec `settings.sauvegarde.dernierExport`.
10. **Code d'accès partagé** : un champ code dans les réglages
    (`settings.securite.code`), demandé sur `LoginPage.jsx` avant de choisir
    un profil. Stockage en clair dans `settings` — cohérent avec le niveau
    de protection attendu (voir clause "Sécurité des accès" du devis), pas
    besoin de hachage/serveur pour ce cas d'usage.

---

## 2. Niveau 2 — Premium (1 890 €)

*(tout le Niveau 1, sans les restrictions ci-dessus, plus :)*

### Déjà en place
- Le gabarit PDF Hu'mana complet existe déjà (`src/lib/pdf/brand.js`,
  `routinePdf.js`, `lifestylePdf.js`) — c'est le rendu montré en démo.
- Import CSV/XLSX Planity (`src/lib/planityImport.js`, `src/lib/csv.js`).
- Relance automatique J+7 (code existant, `useStore.js:138-150`,
  `src/hooks/useRelances.js`).
- Page Équipe (`src/pages/EquipePage.jsx`) et sélecteurs de rôle
  (`src/store/selectors.js` → `praticiennes()`, `isPatronne()`) — la
  visibilité globale de la gérante est déjà incluse à tous les niveaux (voir
  audit du 10/09) ; ce qui devient réellement disponible ici, c'est la
  possibilité d'**ajouter/retirer des praticiennes** au-delà du plafond de 2
  du Niveau 1 (jusqu'à 5 comptes).
- Toggle de niveau dans Paramètres (`src/pages/ParametresPage.jsx`).
- **Personnalisation des questionnaires réservée au N2/N3** (décidé et fait
  le 11/09/2026) : l'éditeur de questions (`QuestionsEditorModal`,
  onglet Paramètres → Questionnaires) existait déjà mais fonctionnait à
  tous les niveaux, sans lien avec `settings.niveau` — audit similaire à
  celui de "l'espace gérante" du 10/09. Verrouillé dans
  `ParametresPage.jsx` (`QuestionsTab`) : bouton désactivé + bandeau
  Premium quand `niveau === 1`, questionnaire par défaut de
  `src/data/questions.js` figé pour ce niveau. Le contenu des questions
  reste un jeu unique par type (peau/cheveux), pas une variante par
  niveau — seule la *possibilité de l'éditer* est désormais gated.

### Reste à faire
0. **Export, rappel de sauvegarde et code d'accès partagé** : hérités du
   Niveau 1 (points 8-10 ci-dessus), rien de spécifique au Niveau 2 — juste
   ne pas les retirer en construisant le reste.
1. **Envoi automatique réel (et non simulé)** : `simulateAutoSend()` dans
   `src/lib/email.js` doit être remplacé par un vrai envoi. Ça implique un
   minimum de backend : soit une fonction serverless (ex. Cloudflare
   Worker / Vercel Function) appelant une API d'e-mailing transactionnel
   (Resend, Brevo/Sendinblue, Postmark…), soit l'API Gmail via OAuth pour
   envoyer au nom de HU'MANA. **C'est le principal écart entre la démo
   actuelle (100 % front-end) et la promesse "envoi automatique" — à
   trancher avec Nathalie (quel service, quel budget/quota mensuel).**
2. **Choix et abonnement au service d'e-mailing** (ligne "services tiers"
   du devis, non comprise dans le forfait dev, hors forfait maintenance
   qui couvre l'usage).
3. **Limiter à 5 profils** : même logique qu'au point 1.2 du Niveau 1, seuil
   à 5 au lieu de 2.
4. **Vérification de délivrabilité** : configurer SPF/DKIM/DMARC sur le
   domaine d'envoi retenu pour éviter les spams — nécessaire dès que
   l'envoi automatique passe en réel.
5. **Réglage du délai de relance** : le devis promet un "délai réglable" —
   actuellement le J+7 est en dur dans `useStore.js`. Sortir cette valeur
   vers `settings` et ajouter le champ dans `ParametresPage.jsx`.
6. **Formation 2 × 1h30**, incluant équipe + gérante.
7. **Recette rapide** sur l'envoi réel (boîte de réception cliente test)
   avant livraison — même logique que la recette du Niveau 1 (point 6),
   pas la phase de tests approfondie du Niveau 3.

---

## 3. Niveau 3 — Studio & Automatisation (3 490 €)

*(tout le Niveau 2, plus :)*

### 3.1 Comptes illimités, multi-appareils

**Mise à jour du 12/09/2026** : la nuance "poste partagé" décidée le 10/09
(ligne barrée ci-dessous) est abrogée — le devis V10 autorise explicitement
le multi-appareils au Niveau 3. Ça change la nature du travail restant :
il ne s'agit plus seulement de retirer un plafond de comptes, mais de
construire un vrai accès multi-appareils indépendants, ce qui suppose les
identifiants par praticienne (3.4) et la synchronisation Sheets (3.2)
opérationnels *avant* de pouvoir l'ouvrir sans risque (sans ça, deux
appareils sur le même diagnostic en même temps s'écrasent l'un l'autre —
le store actuel, `localStorage` par navigateur, n'a aucune notion de
conflit concurrent).

- Retirer toute limite de comptes (ou fixer un plafond très large "usage
  raisonnable", ex. 20, purement technique/anti-abus, pas commercial).
- ~~Le devis nuance désormais "Illimités (poste partagé)" dans le tableau
  comparatif (audit du 10/09) : le rappeler à l'écran de gestion d'équipe
  si utile, pour éviter toute confusion avec un accès multi-appareils.~~

### 3.2 Automatisation Google Sheets (Apps Script)
1. **Créer le classeur Google Sheets** de suivi (onglets : Clientes,
   Diagnostics, Commandes en attente — ce dernier alimenté par le parcours
   d'achat, voir 3.3).
2. **Écrire le Google Apps Script** exposé en Web App (endpoint HTTPS)
   côté Google, qui reçoit les données envoyées par l'app Humana et les
   écrit dans les bons onglets.
3. **Appeler cet endpoint depuis le front** (nouveau module
   `src/lib/sheetsSync.js`) à chaque création/mise à jour de cliente ou de
   diagnostic, et à chaque demande du parcours d'achat.
4. **Gérer les quotas et erreurs réseau** (Apps Script a des limites
   d'exécution/jour) — file d'attente locale + retry si l'appel échoue.
5. **Accord préalable de HU'MANA** sur le compte Google utilisé (celui de
   Nathalie ou un compte dédié HU'MANA), et partage des accès au classeur.
6. **Documentation courte** pour Nathalie : où sont les données, comment
   lire le classeur, que faire si une ligne "commande en attente" arrive.

### 3.3 Parcours d'achat digital — détail complet

Rappel du choix retenu dans l'échange : Planity n'expose aucune API
publique permettant de pré-remplir un panier ou de déclencher un envoi
automatique côté client (vérifié le 09/09/2026 — pas d'API panier
documentée, boutique en ligne = page générale du salon uniquement).
La solution ci-dessous reste donc **sans dépendance à une API Planity qui
n'existe pas**, en s'appuyant uniquement sur ce que l'app contrôle.

1. **Encodage de la routine dans une URL** : sérialiser la sélection de
   produits (ids produits, moments, conseils) en JSON compact, compresser
   (ex. `lz-string`) et encoder en base64 URL-safe. Nouveau module
   `src/lib/routineShareLink.js` (encode / decode).
2. **Route publique "vue cliente"** : nouvelle page React, ex.
   `src/pages/RoutinePubliquePage.jsx`, montée sur une route *sans
   authentification* (ex. `#/r/:data` dans le `HashRouter` existant,
   `src/main.jsx`). Elle décode l'URL et affiche : logo Hu'mana, routine
   (matin/soir/hebdo), produits recommandés (nom, photo si dispo, conseil
   d'application), mise en page mobile-first reprenant `src/styles/`.
3. **Génération du QR code** : ajouter une lib QR (ex. `qrcode`), générer
   le QR pointant vers l'URL ci-dessus, l'intégrer comme image dans le PDF
   (`src/lib/pdf/routinePdf.js` sait déjà dessiner des images —
   `src/lib/pdf/assets.js`).
4. **Bouton "Voir/commander en boutique"** : lien vers l'URL de la
   boutique de HU'MANA, configurable dans `ParametresPage.jsx` (champ
   générique `settings.entreprise.urlBoutique`, volontairement pas nommé
   "Planity" — voir 3.3 bis, la cible peut changer).
5. **Bouton "Envoyer ma demande"** :
   - Génère un message pré-rempli listant les produits (nom + quantité).
   - Deux canaux au choix de la cliente : lien `https://wa.me/<numéro>?text=...`
     (numéro WhatsApp de la boutique, à récupérer auprès de Nathalie et à
     stocker dans les réglages) et lien `mailto:` équivalent
     (réutilise les briques de `src/lib/email.js`).
   - **Limite connue** : `wa.me` tronque les messages très longs — prévoir
     un format court (liste condensée) + renvoi vers la page pour le
     détail complet.
6. **Journalisation de la demande** : à l'envoi, appeler
   `sheetsSync.js` (3.2) pour ajouter une ligne dans l'onglet "Commandes en
   attente" du Google Sheet (produits demandés, cliente, date, canal
   choisi), que l'équipe traite ensuite manuellement dans Planity.
7. **Confidentialité / RGPD** : la page publique ne doit exposer aucune
   donnée personnelle sensible au-delà du prénom éventuel et de la routine
   — pas d'historique de santé, pas d'email/téléphone visibles dans l'URL
   décodée si elle est repartagée. À revoir précisément avec Nathalie
   (mentions légales minimales sur la page publique).
8. **Tests multi-appareils** : scan QR réel (iOS/Android, plusieurs
   lecteurs d'appareil photo), ouverture des liens WhatsApp/mailto sur
   mobile et desktop, comportement si l'app WhatsApp n'est pas installée
   (fallback web `wa.me`).
9. **Mise à jour du PDF niveau 3** : intégrer visuellement le QR code sans
   dénaturer la mise en page existante (`routinePdf.js`) — prévoir un
   espace dédié.
10. **Formation dédiée** (incluse dans les 2×2h du Niveau 3) : montrer à
    l'équipe le flux complet, y compris le suivi des demandes dans le
    Sheet.

*Estimation : ~4 à 5 jours de développement pour l'ensemble du point 3.3,
en plus de l'automatisation Sheets du 3.2 — c'est ce qui justifie l'écart
de +600 € entre le Niveau 3 initial (2 890 €) et le Niveau 3 revu (3 490 €).*

### 3.3 bis — Évolution possible : cibler la future boutique WooCommerce (hors devis actuel, à ne pas chiffrer maintenant)

Nathalie fait construire un site avec boutique par une prestataire tierce
(pas NF Studio), sur **WooCommerce/WordPress**. Point à surveiller car ça
change la donne technique : contrairement à Planity, WooCommerce sait
nativement pré-remplir un panier via l'URL
(`?add-to-cart=ID_PRODUIT&quantity=X` pour un seul produit ; pour
plusieurs produits d'un coup, ça demande un petit bout de code côté
WordPress — un snippet `functions.php` ou un mini-plugin de quelques
dizaines de lignes, documenté et courant, pas un développement lourd).

Concrètement, si ce site se confirme, le bouton "Voir/commander en
boutique" du parcours d'achat (point 4 ci-dessus) pourrait devenir un
**vrai lien panier pré-rempli en un clic** — exactement l'idée d'origine —
au lieu du contournement WhatsApp/e-mail + Sheets. Le reste de
l'architecture (QR code, page cliente, encodage de la routine) resterait
identique : seul le bouton "boutique" changerait de comportement. C'est
justement pour ça que le champ est nommé `urlBoutique` en générique et non
`urlBoutiquePlanity` — pas besoin de reprendre l'existant pour basculer.

**Ce qui reste à clarifier avant de chiffrer quoi que ce soit là-dessus**
(bloqué sur des infos que seule Nathalie a) :
- Le site se fait ou non, et sur quel calendrier — réunion prévue le
  samedi 12 septembre 2026 entre Nathalie et sa prestataire pour
  débloquer la situation (relation "gentille mais ça n'avance pas",
  +3 000 € déjà évoqués sur ce projet séparé).
- Si le site aboutit : WooCommerce est-il confirmé définitivement, et
  est-ce que la prestataire tierce accepte d'ajouter un petit bout de
  code (le snippet multi-produits) ou de donner un accès admin/FTP
  ponctuel à NF Studio pour le faire ? Sans cette coopération minimale,
  on retombe sur le même blocage que Planity (lien générique vers la
  boutique, pas de panier pré-rempli).

**Ne pas modifier le devis V3 tant que ces deux points ne sont pas
clarifiés.** Si le site WooCommerce se confirme et que l'accès est donné,
ce sera une évolution facturée à part (quelques heures, pas une refonte —
l'architecture du 3.3 est déjà prévue pour) plutôt qu'une renégociation du
Niveau 3 actuel.

### 3.4 Identifiants par praticienne (via Google Sheets)

Améliore le code d'accès partagé du Niveau 1-2 : chaque praticienne a son
propre identifiant/mot de passe, que Nathalie gère elle-même sans repasser
par NF Studio.
1. **Onglet "Accès" dans le Sheet** (3.2) : colonnes identifiant / mot de
   passe / actif — Nathalie ajoute ou retire une ligne pour gérer les accès.
2. **Vérification à la connexion** : `LoginPage.jsx` interroge l'endpoint
   Apps Script (3.2) avec l'identifiant/mot de passe saisis, au lieu du
   simple choix de profil.
3. **Repli hors-ligne** : si l'appel Sheets échoue (pas de réseau), garder
   le code d'accès partagé du Niveau 1-2 en secours, pour ne jamais bloquer
   l'équipe en boutique.
4. **Avertissement explicite** : mots de passe en clair dans un Sheet
   partagé, ce n'est pas un système d'authentification robuste — documenté
   comme tel dans le devis (clause "Sécurité des accès"), choix assumé par
   HU'MANA pour rester simple et gérable sans NF Studio.

### 3.5 Phase de tests dédiée (approfondie — au-delà de la recette rapide des N1/N2)
1. Constituer un jeu de données de test représentatif (clientes fictives,
   diagnostics variés, catalogue partiel).
2. Séance de recette avec Nathalie sur environnement de préproduction.
3. Corriger les écarts avant mise en production.
4. Recette spécifique du parcours d'achat (scan réel en conditions
   boutique) et de la synchronisation Sheets.

### 3.6 Formation 2 × 2h
- Session 1 : usage quotidien + équipe.
- Session 2 : automatisation Sheets + parcours d'achat + que faire en cas
  de souci (numéro WhatsApp qui change, URL boutique qui change, etc.).

---

## 4. Autres pistes tarifaires à envisager (pour discussion)

En complément des 3 niveaux du devis, quelques alternatives possibles si
Nathalie hésite sur le montant ou la formule :

- **Parcours d'achat en option indépendante** : le proposer aussi en
  complément payant sur le Niveau 2 après coup (ex. +790 € posé plus tard,
  légèrement plus cher qu'en Niveau 3 d'origine car sans mutualiser le
  développement de l'automatisation Sheets déjà prévue au Niveau 3).
- **Palier intermédiaire "2 bis"** : Niveau 2 + relance/envoi auto (déjà
  inclus) + parcours d'achat simplifié *sans* journalisation Sheets
  (bouton boutique + WhatsApp seulement, pas de suivi centralisé) —
  around 2 490 €, pour une cliente qui veut le geste "waouh" sans payer
  l'automatisation Google complète.
- **Forfait maintenance ajusté** : 39 € / 59 € / 89 € par mois (Niveau
  1/2/3) déjà mis à jour dans le devis V3 ; possibilité de forfait annuel
  à 10 mois sur 12 pour fidéliser sans engagement lourd.
- **Paiement en 3 fois** (au lieu de 40/60) pour les Niveaux 2 et 3
  uniquement, sans frais, si le cash-flow de HU'MANA est plus confortable
  ainsi : 40 % signature / 30 % mi-parcours / 30 % livraison.
