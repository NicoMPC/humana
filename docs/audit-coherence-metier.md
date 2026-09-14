# Audit de cohérence métier — dashboard, statuts, ergonomie (11/09/2026)

Point de départ : en regardant le dashboard, Nicolas remarque que la stat
« Relances à faire » affiche souvent 0 (le niveau 2 automatise déjà l'envoi)
et se demande si elle a encore un sens à afficher. En creusant plus loin,
il avance une hypothèse plus large : dans la vraie vie de la boutique, une
cliente n'est probablement **jamais** réellement « en cours » pendant
plusieurs jours — le diagnostic se fait en une seule séance, en cabine,
contrairement au jeu de démo (`src/data/seed.js`) qui étale volontairement
des diagnostics « en cours » sur plusieurs jours pour peupler le kanban.
Cet audit endosse le point de vue d'une gérante/esthéticienne qui utilise
l'app tous les jours en cabine (le profil réel de Nathalie), et challenge
chaque écran du dashboard sous cet angle : est-ce un geste/info dont elle a
vraiment besoin au quotidien, ou un artefact qui n'a de sens qu'en démo ?

## Résumé exécutif

L'hypothèse de Nicolas se confirme dans le code : tout le parcours
(questionnaire → routine → PDF → envoi) tient sur une seule page
scrollable (`DiagnosticPage.jsx`), pensée pour être remplie en une seule
séance. `en_cours` ne devrait donc durer que le temps du rendez-vous — des
minutes, pas des jours — sauf interruption. Le jeu de démo triche
volontairement là-dessus (assumé, pas un bug). Plus grave : la relance
« automatique » du niveau 2 n'est en réalité qu'un rattrapage **une fois
par jour, au login** (`useRelancesAtStartup`) — sans backend, il ne peut
pas y avoir de vraie tâche planifiée. Résultat, la stat « Relances à
faire » n'est ni un pur doublon (le bouton dashboard sert à rattraper les
relances devenues dues *en cours de journée*, que le check du matin ne
voit pas) ni un signal fiable (elle peut être à 0 par succès de
l'automatisation *ou* parce que personne n'a rouvert l'app ce matin-là —
les deux cas sont indiscernables à l'écran). Le kanban 3 colonnes
(`en_cours` / `envoyé` / `terminé`) reflète la machine à états interne du
code, pas les priorités réelles d'une gérante en boutique. Plan d'action :
distinguer visuellement un `en_cours` normal (séance active) d'un
`en_cours` anormal (oublié depuis plus d'un jour), reformuler la
communication de « Relances à faire » selon le niveau, et alléger le
dashboard des blocs qui n'apportent rien en usage réel quotidien (bannière
stock toujours en pleine taille, notamment).

## Constats détaillés

### 1. Le statut `en_cours` est structurellement un état de séance, pas un état multi-jours

- Les 4 étapes du diagnostic (`QuizStep`, `RoutineBuilder`, `LifestyleStep`,
  `SendStep`) sont **toutes rendues sur la même page**
  (`src/pages/DiagnosticPage.jsx:83-106`), en sections empilées avec un
  scroll automatique entre elles (`scrollTo`, ligne 43-51). Rien dans le
  parcours ne force ni ne suggère une reprise le lendemain : c'est conçu
  pour être rempli d'une traite, en cabine, pendant que la cliente est
  encore là.
- `diagnosticStep()` (`src/store/selectors.js:73-78`) ne connaît que la
  progression logique (quiz → routine → envoi), aucune notion de temps
  écoulé. Un diagnostic `en_cours` depuis 5 minutes et un diagnostic
  `en_cours` depuis 5 jours ont exactement le même traitement partout
  (dashboard, fiche cliente, carte).
- **Ceci n'a de sens qu'en démo** : `src/data/seed.js:107-161`, les
  diagnostics `en_cours` couvrent volontairement plusieurs jours (`rdv: 0`,
  `-1`, `-2`) pour peupler la colonne kanban en démonstration — commentaire
  explicite en tête de fichier (« Les dates sont calculées... pour que la
  démo reste cohérente »). Ce n'est pas un bug, c'est un choix de démo à ne
  pas reproduire comme référence du comportement réel.
- **Le vrai problème d'usage réel** : rien dans le produit ne distingue
  aujourd'hui un `en_cours` « normal » (séance active, quelques minutes)
  d'un `en_cours` « anormal » (praticienne interrompue par la cliente
  suivante, session oubliée, tablette fermée avant la fin). Le second cas
  est probablement rare mais precisément le seul qui mérite l'attention de
  la gérante — et il est aujourd'hui invisible : même apparence de carte
  que n'importe quel autre `en_cours`.

### 2. « Relances à faire » : une stat dont le sens change selon le niveau, sans que l'écran le dise

- Contrairement à ce qu'on pourrait croire, l'automatisation niveau 2
  n'est pas un vrai déclenchement planifié côté serveur (l'app est 100 %
  front-end, `docs/a-faire.md` section 0) : c'est un rattrapage **au
  démarrage de session, une fois par jour et par utilisatrice**
  (`src/hooks/useRelances.js:15-49`, garde `sessionStorage` ligne 20-23).
  Concrètement : à la première connexion du jour, si des relances sont
  échues, elles partent automatiquement (`runDueRelances`,
  `useStore.js:141-153`) ; le reste de la journée, **aucun nouveau check
  automatique ne se relance**, même si l'app reste ouverte en boutique et
  qu'une relance devient due à 15h.
- Le bouton « Lancer les relances du jour » sur le dashboard
  (`DashboardPage.jsx`, bannière `due-banner`) n'est donc **pas
  redondant** avec l'automatisation : c'est le seul filet de rattrapage
  pour tout ce qui devient dû après le login du matin. Mais rien à l'écran
  ne l'explique — la copie dit juste « Lancer les relances du jour »,
  laissant croire que c'est une action facultative plutôt qu'un vrai
  complément nécessaire au fonctionnement « automatique ».
- Conséquence directe sur la question de Nicolas : **« Relances à faire »
  à 0 est ambigu**. Ça peut vouloir dire (a) tout est réellement à jour,
  l'automatisation a fonctionné, ou (b) personne n'a encore rouvert l'app
  aujourd'hui donc le check du matin n'a pas eu lieu, ou (c) — cas niveau 1
  uniquement — aucune relance n'est simplement due aujourd'hui. Ces trois
  cas ont des implications très différentes pour la gérante et sont
  aujourd'hui indiscernables à l'écran.
- Aggravant déjà noté dans `docs/a-faire.md` (audit du 10/09) :
  `recordEnvoi` (`useStore.js:119-130`) marque un diagnostic « envoyé »
  dès le clic sur « Ouvrir Gmail », avant confirmation réelle. Si l'email
  n'est jamais réellement parti, le diagnostic quitte quand même le radar
  des relances (statut avancé, `date_relance` posée) sans qu'aucune action
  réelle n'ait eu lieu côté cliente — un compteur « à jour » peut donc être
  silencieusement faux, pas seulement ambigu.
- **Ceci est un vrai problème d'usage réel**, pas un artefact de démo : la
  démo (niveau 2 par défaut, `SETTINGS_DEMO.niveau: 2`,
  `src/data/seed.js:20`) est justement construite pour déclencher une
  relance automatique dès l'ouverture (`d-04`, relance échue depuis 9
  jours, commentaire explicite ligne 118) — donc ce comportement d'« une
  fois par jour au login » est bien celui qui sera vécu en production.

### 3. Le kanban 3 colonnes organise l'écran autour de la machine à états interne, pas des priorités de la gérante

- `COLUMNS` (`DashboardPage.jsx:14-19`) reprend telles quelles les 3
  valeurs de `diag.statut` (`en_cours`, `envoyé`, `terminé`). C'est un
  choix naturel côté code (un `filter` par statut), mais ça mélange deux
  axes métier différents : la progression de la *saisie* (est-ce que la
  praticienne a fini de remplir le diagnostic) et le *suivi relationnel*
  post-visite (est-ce qu'il faut relancer la cliente). Une gérante qui
  ouvre le dashboard le matin cherche probablement plutôt : qui ai-je
  rendez-vous aujourd'hui, qui dois-je relancer maintenant, et — cas
  exceptionnel — ai-je oublié de finir un diagnostic. Le découpage actuel
  ne répond directement à aucune de ces trois questions sans lire chaque
  carte.
- Si `en_cours` est structurellement quasi toujours vide ou à 1 élément en
  usage réel (constat 1), lui donner la même largeur de colonne que les
  deux autres surdimensionne visuellement un statut qui, dans la vraie
  vie, ne contient jamais de vrai backlog à trier — contrairement à
  `envoyé` (file d'attente réelle de relances à surveiller sur plusieurs
  jours) qui, lui, mérite cette place.
- Le plafonnement à 5 cartes/colonne + « voir plus » (fait dans ce tour
  précédent, `DashboardPage.jsx`) reste pertinent quel que soit le
  découpage retenu — il répond à un problème de volume, pas d'axe
  d'organisation.

### 4. La bannière « Fraîcheur du stock » occupe toujours sa pleine taille sur le dashboard, même quand tout va bien

- `DashboardPage.jsx` rend `<StockFreshnessBanner />` sans le prop
  `compact`, inconditionnellement (ligne 68). Or le composant lui-même
  prévoit déjà un mode `compact` (`StockFreshnessBanner.jsx:18-33`,
  utilisé nulle part actuellement) pour un badge discret. Résultat :
  même quand `level === 'ok'` (stock importé récemment), la bannière
  pleine largeur reste affichée avec sa carte, son icône et son bouton —
  de l'espace et de l'attention pris tous les jours par une information
  qui, la plupart du temps, n'appelle aucune action.
- **Usage réel concerné, pas juste démo** : la fraîcheur du stock est un
  sujet hebdomadaire (import Planity recommandé 1×/semaine,
  `STOCK_WARNING_DAYS = 7` dans `selectors.js:10`), pas un sujet à
  remonter chaque jour au même niveau que les diagnostics du jour.

### 5. Fiche cliente : un historique qui ne signale pas les diagnostics « en pause »

- `ClientDetailPage.jsx:78-79` affiche tous les diagnostics d'une cliente
  (`diagnosticsForClient`) dans une même grille, sans distinction visuelle
  pour un `en_cours` qui traînerait anormalement. Si le constat 1 est
  juste (un diagnostic dure une séance), c'est précisément dans cette vue
  qu'une gérante devrait pouvoir repérer d'un coup d'œil « ce diagnostic
  de Marie du 3 septembre n'a jamais été terminé » — aujourd'hui il se
  fond visuellement parmi les autres.

## Décisions prises avec Nicolas le 11/09/2026 (répondent aux questions ouvertes)

- **Des cas légitimes de `en_cours` prolongé existent** (préparer à
  l'avance, finir plus tard) : pas d'alerte dure façon « anomalie », un
  signal neutre/informatif suffit (voir plan, point 1 révisé).
- **Une séance dure environ 2h, sans interruption** par une autre cliente.
  `en_cours` reste donc un état de la journée en cours dans l'immense
  majorité des cas — un `en_cours` qui franchit minuit (toujours ouvert le
  lendemain) est le signal pertinent à afficher, pas un seuil en heures.
- **L'app est fermée/rouverte plusieurs fois par jour** en boutique (elle
  est lancée via `humana.sh`/`Humana.desktop`, qui ouvre une page dans le
  navigateur par défaut à chaque lancement — voir ces deux fichiers à la
  racine du projet). Conséquence technique importante, qui change la
  lecture du constat 2 : le garde-fou de `useRelancesAtStartup.js:20-23`
  est basé sur `sessionStorage`, qui est réinitialisé à chaque fermeture
  réelle du navigateur/de la fenêtre. Si « fermée/rouverte » veut bien dire
  fermeture de la fenêtre (pas juste un changement de profil dans
  `LoginPage` en gardant l'onglet ouvert), **chaque réouverture dans la
  journée redéclenche déjà le check de relances**, sans qu'aucun re-check
  périodique ne soit nécessaire. Point à vérifier une fois en usage réel
  (voir plan, point 3 révisé) plutôt qu'à corriger à l'aveugle — coder un
  `setInterval` par précaution serait une solution à un problème qui n'existe
  peut-être pas.
- **Le kanban est réorganisé** autour des priorités réelles plutôt que des
  statuts bruts (voir plan, point 4 révisé) : « Aujourd'hui » (RDV du jour +
  `en_cours`), « À suivre » (`envoyé`, trié par urgence de relance),
  historique (`terminé`) en accès secondaire plutôt qu'en colonne
  permanente.

## Plan d'action (priorisé)

1. **Signal neutre (pas une alerte) sur un `en_cours` qui a franchi
   minuit**, plutôt qu'un seuil en heures : vu qu'une séance normale dure
   ~2h sans interruption et que des cas légitimes de reprise le lendemain
   existent (décision du 11/09), le bon repère est « ce diagnostic n'a pas
   été bouclé le jour de sa création », pas un compte à rebours en heures.
   Badge informatif style « Ouvert depuis le [date] » sur `DiagnosticCard`
   (ton neutre, pas rouge/alerte), sans bloquer ni forcer d'action.
2. **Reformuler la communication des relances selon le niveau**, sans
   forcément retirer la stat : au niveau 2, présenter le chiffre comme une
   confirmation (« Relances à jour » avec un compteur discret plutôt qu'un
   gros chiffre orange type tâche-à-faire) tant qu'il est à 0, et ne
   basculer en alerte que si un rattrapage manuel est réellement
   nécessaire. Documenter clairement, y compris dans l'UI, que
   l'« automatique » veut dire *à chaque ouverture de l'app* et non *en
   temps réel*.
3. **Pas de re-check périodique à coder par précaution.** Décision du
   11/09 : l'app est fermée/rouverte plusieurs fois par jour en boutique
   (lancée via `humana.sh`), ce qui réinitialise le `sessionStorage` et
   redéclenche donc déjà `useRelancesAtStartup` à chaque réouverture — le
   filet de sécurité existe probablement déjà dans l'usage réel. À vérifier
   une fois en production (le point bascule en bug seulement si on constate
   des relances qui traînent malgré des réouvertures dans la journée),
   plutôt que d'ajouter un `setInterval` pour un problème non confirmé.
4. **Réorganiser le dashboard autour des priorités réelles** plutôt que
   des 3 statuts bruts (confirmé le 11/09) : « Aujourd'hui » (RDV du jour +
   `en_cours`), « À suivre » (`envoyé`, trié par urgence de relance),
   `terminé` en accès secondaire (replié, à la manière du bloc « Activité
   par praticienne ») plutôt qu'en colonne pleine largeur permanente.
5. **Rendre la bannière stock discrète par défaut**, en passant
   `compact` (déjà prévu dans le composant) quand `level === 'ok'`, et ne
   déployer la version pleine largeur que pour `warning`/`danger` — cohérent
   avec le principe déjà appliqué à la relance (`due-banner` seulement si
   `due.length > 0`).
6. **Ajouter le même badge « Ouvert depuis le [date] » sur la fiche
   cliente** pour tout diagnostic `en_cours` créé un autre jour qu'aujourd'hui
   — réutilise la logique du point 1, appliquée à `ClientDetailPage.jsx`.
7. **Traiter en même temps le bug `recordEnvoi` déjà documenté**
   (`docs/a-faire.md`, audit du 10/09) : tant qu'un envoi peut être marqué
   « fait » sans confirmation réelle, toute reformulation de « Relances à
   faire » en signal de confiance (point 2) reposerait sur une donnée qui
   peut être fausse. Les deux corrections doivent être livrées ensemble
   pour être honnêtes envers l'utilisatrice.

Aucun de ces points n'a été codé dans le cadre de cet audit — c'est un
état des lieux et un plan, pas une implémentation.

## Mise en œuvre du 11/09/2026

Après confirmation explicite de Nicolas (durée de séance ~2h, app
fermée/rouverte plusieurs fois par jour en boutique, affichage différencié
par niveau souhaité, réorganisation du dashboard validée) :

- **Point 1 et 6 faits** : badge neutre « Ouvert depuis le [date] » sur
  `DiagnosticCard.jsx` (réutilisé par le dashboard et par
  `ClientDetailPage.jsx`), déclenché dès que `date_rdv !== today`.
- **Point 2 fait** : `DashboardPage.jsx`, la stat « Relances à faire »
  devient « Relances à jour » (icône check, ton neutre) au niveau 2 quand
  elle est à 0 ; ligne d'explication ajoutée dans la bannière de relances
  dues (« vérifiées automatiquement à chaque ouverture de l'app — pas en
  temps réel »).
- **Point 3 : pas de code**, décision confirmée de ne pas ajouter de
  re-check périodique — à surveiller en usage réel.
- **Point 4 fait** : kanban remplacé par « Aujourd'hui » (RDV du jour +
  `en_cours`) / « À suivre » (`envoyé`, trié par urgence), historique
  (`terminé`) replié par défaut dans sa propre section.
- **Point 5 fait** : `StockFreshnessBanner` passe en mode `compact` sur le
  dashboard quand `level === 'ok'`.
- **Point 7 non fait** : le bug `recordEnvoi` (statut marqué « envoyé »
  avant confirmation réelle) reste ouvert — c'est un choix produit
  (confirmation explicite après retour sur l'app, ou compromis assumé et
  documenté) qui n'a pas encore été tranché avec Nicolas, traité
  séparément.

## Questions ouvertes (arbitrage Nicolas / Nathalie nécessaire)

**Statut : tranchées avec Nicolas le 11/09/2026** (voir « Décisions » plus
haut, qui répond aux points 1-3 et 6 ; les points 4 et 5 sont absorbés dans
le plan d'action révisé — seuil basé sur le changement de jour plutôt qu'un
nombre d'heures, présentation « confirmation » retenue pour le niveau 2).
Liste conservée telle que posée initialement, pour la traçabilité :

1. Un diagnostic `en_cours` qui traîne plus d'une journée est-il **toujours**
   une anomalie (session interrompue, oubli), ou existe-t-il un cas
   légitime — par exemple préparer le questionnaire avant l'arrivée de la
   cliente, ou finaliser la routine le lendemain de son départ ? La
   réponse détermine si on doit alerter dessus ou laisser tel quel.
2. Combien de temps dure typiquement un diagnostic en cabine (10 minutes,
   30 minutes, plus), et une praticienne peut-elle être interrompue par une
   autre cliente en plein diagnostic ? Ça conditionne si `en_cours` doit
   rester une colonne kanban à part entière ou juste un badge ponctuel
   (« session en cours ») sans lui dédier un espace permanent.
3. En boutique, l'app/l'onglet reste-t-il ouvert toute la journée sur la
   même session, ou est-il fermé/rouvert plusieurs fois (pauses,
   redémarrage du poste) ? Si l'app reste ouverte en continu, le rattrapage
   « une fois par jour au login » laisse des relances non traitées tant que
   personne ne clique le bouton manuel — faut-il alors un vrai re-check
   périodique pendant que l'app reste ouverte (ex. toutes les X heures),
   plutôt que de compter sur une deuxième connexion ?
4. Quel seuil vous semble raisonnable pour signaler un `en_cours`
   « anormalement long » (24h ? le lendemain matin seulement ? autre) ?
5. Préférez-vous que « Relances à faire » reste un chiffre neutre à tous
   les niveaux, ou une présentation différenciée au niveau 2 (confirmation
   « à jour » plutôt que compteur façon tâche à faire) comme proposé au
   point 2 du plan d'action ?
6. Le kanban à 3 colonnes (calqué sur les statuts) est-il un format auquel
   Nathalie et l'équipe sont déjà attachées (habitude prise pendant la
   démo), ou êtes-vous ouverts à une réorganisation autour des priorités
   réelles (« aujourd'hui » / « à suivre » / historique secondaire) même si
   ça change visuellement l'écran d'accueil ?
