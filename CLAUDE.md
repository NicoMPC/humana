# Humana Essentiel — repères pour Claude

## Deux versions du produit, décision du 2026-09-13

Le process actuel de Hu'mana pour un diagnostic, c'est une photo d'une
feuille de papier envoyée sur WhatsApp — une référence utilisée pour
mesurer l'ampleur du saut de qualité, pas une consigne de garder WhatsApp
comme canal d'envoi. Avant ce jour, ce dossier (`humana-essentiel/`)
contenait une version « complète » : envoi et relance automatiques via
Apps Script, suivi de relances avec délai réglable, photos avant/après
avec délai réglable, notes de suivi libres, PDF « conseils lifestyle »,
dashboard façon tableau de bord, Paramètres avec gabarits d'email
éditables.

Nicolas (le prestataire) a jugé que c'était trop d'un coup pour une toute
première mise en main — l'idée : proposer d'abord le strict nécessaire
(diagnostic guidé, routine, PDF propre) avec un envoi **assisté via
Gmail** plutôt qu'automatique : un onglet Gmail s'ouvre avec le message
pré-rempli (gabarit tout prêt, non éditable dans l'appli pour l'instant),
la praticienne joint elle-même le PDF téléchargé et confirme d'un clic une
fois l'envoi fait. Alertes de relance et suivi photos/notes restent actifs
avec leurs délais par défaut (non réglables dans Paramètres pour l'instant).
Objectif : observer 2-3 jours d'usage réel par Jessie et Nathalie, capter
leurs retours via un onboarding dynamique, puis « serrer les écrous » et
réactiver l'automatisation complète une fois qu'elles sont accros — sans
avoir à redévelopper quoi que ce soit.

**`humana-essentiel/` (ce dossier) est donc désormais la version courte
« V0 / six-pack »**, celle qui sera réellement testée et déployée.

**`../humana-boutique-archive/` est une copie figée de la version
complète juste avant ce recentrage** (snapshot du 2026-09-13, sans
`node_modules` ni `dist` — `npm install` avant de la relancer). C'est la
référence long terme : quand Hu'mana sera prête pour l'automatisation,
les relances, les photos de suivi, etc., c'est cette copie qui contient
déjà tout ça, testé et fonctionnel — le travail sera de réintégrer/
réactiver ces briques dans `humana-essentiel/`, pas de les reconstruire.
**Ne pas modifier `../humana-boutique-archive/` — c'est un instantané de
référence, pas une copie de travail.**

Le README de ce dossier (`README.md`) documentait la version complète ;
il est en cours d'ajustement pour refléter la V0. En cas de doute sur le
périmètre réel du code présent ici, se fier au code plutôt qu'au README
tant qu'il n'a pas été entièrement repassé.

## Rappel de contexte projet (voir aussi README.md)

- Client réel : boutique **Hu'mana** (Nathalie et Jessie Gunzle, toutes
  les deux gérantes). Prestataire : NF Studio (Nicolas Follezou).
- Le dossier sibling `../humana-demo-prospects/` est la démo commerciale pour d'autres
  prospects — **ne jamais le modifier depuis ce dépôt**.
- Backend actuel (Google Sheets + Apps Script) tourne sur le compte
  Google personnel du prestataire (`seopourvous@gmail.com`), le temps des
  essais — à migrer vers un compte Google appartenant à Hu'mana avant
  toute mise en service réelle (les fiches clientes contiennent des
  informations sensibles, ex. grossesse, allergies).
- Pas de dépôt git initialisé dans ce dossier (`git` n'est même pas
  installé sur cette machine) — les sauvegardes de version se font par
  copie de dossier, comme `../humana-boutique-archive/` ci-dessus.
