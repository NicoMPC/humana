# Humana Essentiel — Diagnostic Peau & Cheveux (Hu'mana)

> **⚠️ Périmètre actuel (2026-09-13) : « V0 six-pack ».** Ce qui tourne
> réellement aujourd'hui est volontairement plus court que ce que décrit le
> reste de ce README : diagnostic → routine → PDF, puis **envoi assisté via
> Gmail** — un onglet Gmail s'ouvre avec le message pré-rempli (gabarit tout
> prêt), la praticienne joint elle-même le PDF téléchargé et confirme d'un
> clic une fois l'envoi fait (pas d'envoi automatique en tâche de fond).
> Alertes de relance et suivi photos/notes restent actifs. Voir
> **`CLAUDE.md`** pour l'histoire complète et savoir où vit la version
> entièrement automatisée (déjà construite, prête à réactiver).

Application de **production** pour la boutique **Hu'mana** : diagnostic
guidé (peau ou cheveux, en boutique ou en visio), construction de routine,
génération de PDF à l'image de la marque, envoi automatique de l'email (avec
pièce jointe) via Google Apps Script — mais toujours après relecture et
validation explicite de la praticienne sur un aperçu exact de ce qui va
partir — et suivi des relances et des photos/notes avant-après.

Application front-end (React + Vite), avec toutes les données persistées en
local (`localStorage`) **et** synchronisées entre les 2 postes de travail via
un classeur Google Sheets + Apps Script (voir « Backend Google Sheets »
ci-dessous) — pas de vrai serveur ni de base de données classique.

Ce dossier est une copie de travail du projet de démonstration commerciale
(`../humana-demo-prospects/`, à paliers 1/2/3), adaptée au périmètre réel validé avec
Nathalie pour la V1 de Hu'mana : un produit unique, sans notion de niveau,
avec les correctifs et ajustements métier décidés au rendez-vous commercial.
**Le dossier `../humana-demo-prospects/` reste la démo de référence pour d'autres
prospects et n'est jamais modifié depuis ce dépôt.**

## Ce qui a changé par rapport à la démo (`humana/`)

- **Plus de système de niveaux (1/2/3).** Produit unique : PDF lifestyle et
  personnalisation des questionnaires disponibles pour tout le monde, sans
  restriction ni pastille « Premium ». `NIVEAUX`, `PremiumTag` et l'onglet
  « Niveau de service » des Paramètres ont été retirés.
- **Envoi automatique, avec validation humaine obligatoire avant départ.**
  L'email (avec PDF en pièce jointe) part directement via Google Apps
  Script (`GmailApp.sendEmail`, voir « Backend Google Sheets »), sans
  action manuelle dans Gmail. Mais rien ne part sans que la praticienne
  ait cliqué **« Vérifier puis envoyer »** et relu, dans une même fenêtre,
  le destinataire, le sujet, le corps du message modifiable et un aperçu
  PDF exact du document joint (`AutoSendConfirmModal`) — le diagnostic
  n'est marqué « envoyé » (et la relance planifiée) qu'une fois l'envoi
  confirmé et effectivement parti. Même principe pour la relance, qui peut
  aussi être envoyée avant son échéance si la praticienne le souhaite.
  L'ancien flux « Ouvrir Gmail / solution de secours » a été retiré : il
  n'existe plus qu'un seul chemin d'envoi.
- **Plus de parcours d'achat / QR code.** `src/lib/qr.js`, la dépendance
  `qrcode`, le panier en ligne (`creerPanier`, champ `panier`) et l'espace
  QR sur le PDF routine ont été retirés.
- **Statut « en cours » retiré.** `STATUTS` ne connaît plus que `envoye` et
  `termine` : la praticienne fait tout le parcours (questionnaire → routine
  → PDF → envoi) en une seule séance ininterrompue. Un diagnostic pas
  encore envoyé n'affiche plus de badge ni de filtre « en cours » nulle
  part — juste un repère neutre « brouillon » le temps de la séance.
- **Délais réglables.** Relance à J+10 par défaut (au lieu de J+7), et
  nouveau délai réglable pour le rappel photos avant/après (S+6 par
  défaut) — les deux se modifient dans Paramètres → Général.
- **Photos & notes de suivi.** Section sur la fiche cliente : deux zones
  d'upload (avant / après) par diagnostic envoyé, une alerte sur le tableau
  de bord quand le délai est dépassé et qu'il manque une photo, et une zone
  de texte libre par diagnostic pour noter le suivi (visible uniquement par
  l'équipe, jamais dans le PDF ni l'email).
- **Boutique ou visio.** Chaque diagnostic porte un réglage « En boutique »
  / « En visio » (visible en haut de sa page). Il ne change rien au
  contenu du diagnostic, seulement le passage de contexte dans l'email
  envoyé à la cliente (« merci pour votre visite à la boutique » vs
  « merci pour notre échange en visio »).
- **Code d'accès partagé.** Un code (modifiable dans Paramètres → Général)
  est demandé à l'écran de connexion avant de choisir un profil.
- **Comptes réels.** Les comptes de démo sont remplacés par les deux
  gérantes réelles de Hu'mana, Jessie et Nathalie Gunzle (rôle identique,
  accès complet aux deux). L'onglet **Équipe** (gestion de praticiennes
  salariées) a été retiré de la navigation tant qu'elles ne sont que
  toutes les deux — voir le commentaire dans `AppShell.jsx`
  (`NAV_SETTINGS`) pour le réactiver le jour où Hu'mana embauche.
- **Plus de centre de notifications.** La cloche et le panneau de
  notifications ont été retirés : le tableau de bord (pastilles de statut,
  colonne « Relances à faire ») et le journal de suivi de chaque
  diagnostic suffisent à voir ce qui reste à faire. Les toasts ponctuels
  (succès d'un envoi, alerte stock…) restent inchangés.

## Lancer le projet en un clic

Double-cliquez sur **`Humana.desktop`** (icône fleur) à la racine du
projet. Un terminal s'ouvre, construit l'application si nécessaire, démarre
un serveur local et ouvre automatiquement l'onglet dans votre navigateur,
sur `http://localhost:4174` — **un port différent de la démo** (`humana/`,
port 4173) pour que les deux applications puissent tourner en même temps
sur le même poste. Fermez la fenêtre du terminal pour arrêter le serveur.

Au tout premier lancement, GNOME/Nautilus peut demander de confirmer
l'exécution (clic droit sur le fichier → *Autoriser le lancement*, ou
*Permettre l'exécution comme un programme* dans l'onglet Permissions).

Vous pouvez aussi lancer directement le script en ligne de commande :

```bash
./humana.sh
```

## Lancer le projet en développement

```bash
npm install
npm run dev
```

Ouvrez ensuite l'adresse indiquée dans le terminal (`http://localhost:5173`
par défaut).

## Construire une version de production

```bash
npm run build
```

Le résultat est généré dans `dist/`. Vous pouvez le servir avec n'importe
quel serveur statique, par exemple :

```bash
npm run serve
# ou directement :
npx serve dist
```

`dist/` est autonome (chemins relatifs) : il peut être ouvert depuis
n'importe quel sous-dossier, y compris en double-cliquant sur
`dist/index.html` dans certains navigateurs, ou déposé tel quel sur un
hébergement statique.

## Accès et comptes

Un code d'accès partagé (`Saloncin17!` par défaut, modifiable dans
Paramètres → Général) est demandé avant de choisir un profil :

- **Jessie Gunzle** et **Nathalie Gunzle** — toutes les deux gérantes,
  avec un accès identique et complet : toutes les clientes, tous les
  diagnostics, tous les réglages. Il n'y a pas de profil « praticienne »
  limité tant qu'elles sont seules à l'équipe (voir « Comptes réels »
  ci-dessus pour la réactivation future de l'onglet Équipe).

## Fonctionnement général

1. **Nouveau diagnostic** (bouton en haut de la barre latérale) : on choisit
   le type (peau ou cheveux), puis une cliente existante ou une nouvelle
   fiche. On précise aussi si la séance a lieu en boutique ou en visio
   (modifiable ensuite à tout moment sur la page du diagnostic).
2. **Questionnaire** : une question à la fois, avec observation optionnelle,
   puis un récapitulatif modifiable.
3. **Routine** : recherche dans le catalogue, sélection des produits,
   affectation à un ou plusieurs moments (matin / soir / hebdo), conseil
   d'application par produit, conseils généraux libres.
4. **Conseils lifestyle** (optionnel) : sélection de conseils bien-être pour
   un second PDF, disponible pour toutes les praticiennes.
5. **PDF & envoi** : génération du PDF (mise en page reprenant la charte
   Hu'mana), puis **« Vérifier puis envoyer »** ouvre un aperçu exact du
   destinataire, du sujet, du message (modifiable) et du PDF joint. Rien ne
   part avant un clic explicite sur « Envoyer » dans cette fenêtre ; une
   fois confirmé, l'email part automatiquement (pièce jointe incluse) via
   Google Apps Script, et le diagnostic passe alors à « envoyé ».
6. **Relances** : l'application signale les relances arrivées à échéance
   (J+10 par défaut, réglable) à l'ouverture de session et sur le tableau
   de bord. Même principe : « Vérifier puis envoyer la relance » montre un
   aperçu avant le départ effectif. Une relance peut aussi être envoyée
   avant son échéance, à l'initiative de la praticienne — elle est alors
   enregistrée normalement (journal de suivi, statut « terminé »).
7. **Suivi** : à partir de S+6 (réglable), le tableau de bord et la fiche
   cliente signalent les diagnostics pour lesquels il manque encore une
   photo avant ou après ; une zone de texte libre par diagnostic permet en
   plus de noter tout ce qui concerne le suivi de la cliente.

## Import du stock (Planity)

La page **Produits → Importer depuis Planity** accepte directement l'export
« Stock » de Planity, en `.csv` ou `.xlsx`, sans transformation préalable.

- Les rayons qui ne sont pas des produits de routine (prestations en
  cabine, maquillage, vernis, parfumerie, accessoires cadeaux, coffrets…)
  sont automatiquement écartés — un aperçu avant validation détaille ce qui
  a été importé et ce qui a été ignoré, et pourquoi
  (`src/lib/planityImport.js` centralise ces règles).
- Un produit déjà présent dans le catalogue (retrouvé par code EAN, ou à
  défaut par nom) voit son **stock et son prix mis à jour** ; sa fiche déjà
  personnalisée (catégorie, description, statut actif) n'est jamais
  écrasée.
- La date du dernier import est suivie dans les réglages
  (`settings.stock.dernierImport`). Un encart **« Fraîcheur du stock »**
  apparaît sur le tableau de bord et sur la page Produits.

## Choix de conception

- **React + Vite**, sans framework de composants tiers : un design system
  maison (`src/styles/`, `src/components/ui/`) reprenant la palette de la
  marque (sauge, crème, argile) et les typographies Cormorant Garamond /
  Quicksand.
- **Zustand** pour l'état global, avec persistance automatique dans
  `localStorage` (`src/store/useStore.js`). Toute la logique métier passe
  par des actions du store — les composants ne mutent jamais les données
  directement.
- **jsPDF**, avec les polices de la marque embarquées en base64, pour des
  PDF vectoriels fidèles à la charte (`src/lib/pdf/`).
- **react-router (HashRouter)** pour un routage compatible avec un simple
  hébergement statique.
- **SheetJS (`xlsx`)** pour lire les exports Planity `.xlsx` ; les `.csv`
  passent par un petit parseur maison (`src/lib/csv.js`).
- Les photos avant/après s'affichent d'abord en **data-URL base64** (retour
  visuel immédiat, et repli hors-ligne), puis sont remontées vers Google
  Drive en tâche de fond dès que possible (voir « Backend Google Sheets »).

## Backend Google Sheets (synchronisation 2 postes)

L'app est 100 % front-end, mais un classeur Google Sheets + un script Apps
Script (source dans `apps-script/Code.gs`) servent de « backend » léger pour
que les 2 postes de travail voient les mêmes clientes/diagnostics — sans
vrai serveur, dans l'esprit MVP décidé au rendez-vous du 12/09/2026.

- **Classeur** : "Humana Essentiel — Données", sur le compte Google
  `seopourvous@gmail.com` (compte de Nicolas, en attendant un compte dédié
  Hu'mana si besoin) — onglets `Clientes`, `Diagnostics`, `Produits`,
  `Settings`, `Retours` (remontées de bug/remarques, voir plus haut).
  Chaque onglet a une colonne `json` qui fait foi, plus quelques colonnes
  lisibles pour un coup d'œil rapide.
- **Apps Script Web App déployé** : "Backend Humana Essentiel v1", exécuté
  en tant que ce compte, accès "Tout le monde" — protégé uniquement par un
  jeton partagé (`Saloncin17!`, en Script Property `TOKEN`), vérifié sur
  chaque requête. **Ce n'est pas un vrai système d'authentification** : le
  jeton est visible dans le bundle front (`src/lib/sheetsSync.js`), choix
  assumé pour rester simple (cohérent avec le ton "MVP" du rendez-vous).
- **Câblage front** : `src/lib/sheetsSync.js` (appels à l'API) et
  `src/hooks/useSheetsSync.js` (branché dans `App.jsx`) — au démarrage,
  l'app récupère l'état du Sheet (`pullSnapshot`) ; si le Sheet est vide,
  elle y pousse son état local pour l'amorcer ; ensuite, chaque
  création/modification de cliente, diagnostic ou réglage est repoussée en
  tâche de fond. Les photos avant/après sont envoyées via l'action
  `uploadPhoto`, qui les stocke dans un dossier Drive dédié ("Humana
  Essentiel - Photos") et renvoie un lien partagé stocké dans le Sheet.
- **Limites assumées** : dernier écrit gagne (pas de résolution de
  conflits), aucune notion de suppression distante (les suppressions
  restent locales à l'appareil), et toute erreur réseau est avalée
  silencieusement — l'app continue de fonctionner en local même hors ligne
  ou si le Sheet est indisponible.
- **Avant la mise en service réelle chez Hu'mana** : le Sheet a été vidé de
  toutes les données de démo après les tests de ce déploiement (colonnes
  d'en-tête conservées). Pensez à vider aussi le `localStorage` des 2
  postes réels avant le premier vrai lancement (voir « Réinitialiser les
  données » ci-dessous), sinon le premier poste ouvert repousserait ses
  données de démo locales vers le Sheet.
- **Pour redéployer ou modifier le script** : ouvrir le classeur → Extensions
  → Apps Script. Le fichier `apps-script/Code.gs` de ce dépôt est la
  référence à recoller si le script doit être reconstruit ailleurs.

## Signalement de bug et tutoriel intégré

- **Bouton « bug » (bas gauche, toujours visible)** : ouvre une remontée de
  problème ou de remarque libre. La page courante, le profil (praticienne/
  gérante) et l'appareil (résolution, navigateur) sont capturés
  automatiquement — l'objectif est que tu comprennes le contexte d'une
  remontée sans devoir le redemander. Envoyée dans l'onglet **Retours** du
  classeur Google Sheets (voir « Backend Google Sheets » ci-dessous), via
  une nouvelle action `reportBug` de `apps-script/Code.gs`.
- **Bouton « Tutoriel » (topbar, en haut à droite)** : bascule un mode aide
  contextuelle — un bandeau explicatif adapté à la page consultée apparaît
  en haut du contenu (`src/components/layout/TutorialBanner.jsx`). Non
  persisté : redémarre désactivé à chaque session, pour ne pas encombrer
  l'usage quotidien une fois l'équipe formée.

## Hors scope / améliorations futures

Ces points ont été explicitement exclus du périmètre de cette V1
(à re-chiffrer séparément si Hu'mana en a besoin) :

1. **Filtre/tag sur les questions de diagnostic** (ex. retrouver toutes les
   clientes ayant répondu « peau sèche »). Les réponses sont bien
   enregistrées par diagnostic, mais aucune recherche/filtre transverse
   n'existe sur leur contenu.
2. **Parcours d'achat digital / QR code.** Le panier en ligne et le QR de
   suivi présents dans la démo (`humana/`) ont été retirés de cette V1 —
   aucune brique de vente en ligne n'est prévue ici.
3. **Gestion d'équipe au-delà de 2 personnes.** L'onglet Équipe (ajout de
   praticiennes salariées, permissions restreintes par praticienne) est
   codé mais retiré de la navigation tant que Jessie et Nathalie sont
   seules ; voir « Comptes réels » plus haut pour le réactiver.
4. **Résolution de conflits multi-poste.** La synchronisation Google
   Sheets applique « dernier écrit gagne » (voir « Backend Google
   Sheets ») : pas de fusion intelligente si les 2 postes modifient la
   même fiche au même moment.

## Réinitialiser les données

Il n'y a pas de bouton dans l'interface pour ça. Pour repartir du jeu de
données d'origine : vider le `localStorage` du site depuis les outils de
développement du navigateur (clé `humana.app.v8`, voir `STORAGE_KEY` dans
`src/store/useStore.js`) et recharger la page.

**Important** : vider le `localStorage` ne vide pas le Google Sheet — au
rechargement, l'app le retrouvera vide localement mais le repeuplera depuis
le Sheet s'il contient encore des données (voir « Backend Google Sheets »).
Pour une réinitialisation complète (les 2 postes + le Sheet), vider le
`localStorage` des 2 postes ET effacer les lignes de données des onglets
`Clientes`/`Diagnostics` du classeur (en gardant la ligne d'en-tête).

## Documents internes

- `docs/a-faire-legacy.md` — historique du suivi « à faire » de la démo
  (`humana/`), conservé tel quel pour référence, avant l'application de
  cette V1 allégée. Ne reflète plus l'état de ce dossier-ci.
- `docs/audit-coherence-metier.md` — audit produit hérité de la démo,
  conservé pour contexte.

Le dossier `devis/` (devis commercial de l'autre offre) n'a pas été copié
dans ce projet : non pertinent pour cette V1 déjà vendue.
