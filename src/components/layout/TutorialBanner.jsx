import { useLocation } from 'react-router-dom';
import { useUI } from '../../store/useUI';
import { Notice } from '../ui';

/**
 * Contenu du mode tutoriel, par page (voir bouton "Tutoriel" dans
 * `AppShell.jsx`) — première entrée dont la regex correspond qui gagne,
 * même logique que `TITLES`.
 */
const TUTORIAL_CONTENT = [
  [
    /^\/$/,
    {
      title: 'Le tableau de bord',
      points: [
        "Les pastilles en haut résument vos diagnostics : brouillons, envoyés, relances dues, terminés.",
        "« Relances à faire » liste les emails de suivi arrivés à échéance — un clic ouvre directement le diagnostic concerné.",
        "Les encarts « Fraîcheur du stock » et photos avant/après vous préviennent quand une action est en retard.",
      ],
    },
  ],
  [
    /^\/clientes\/.+/,
    {
      title: 'Fiche cliente',
      points: [
        "Toutes les infos de la cliente et l'historique de ses diagnostics passés.",
        "La section « Photos & notes de suivi » (photos avant/après et zone de texte libre) se déverrouille une fois le diagnostic envoyé (délai réglable dans Paramètres).",
        "Le bouton « Nouveau diagnostic » en haut permet d'enchaîner directement une nouvelle séance pour cette cliente.",
      ],
    },
  ],
  [
    /^\/clientes/,
    {
      title: 'Clientes',
      points: [
        "Recherchez une cliente par nom ou email, ou créez-en une nouvelle depuis « Nouveau diagnostic ».",
        "Cliquez sur une ligne pour ouvrir sa fiche complète et son historique.",
      ],
    },
  ],
  [
    /^\/diagnostic/,
    {
      title: 'Parcours de diagnostic',
      points: [
        "0. En-tête : précisez si le diagnostic a lieu en boutique ou en visio — ça adapte automatiquement le texte de l'email envoyé à la cliente.",
        "1. Questionnaire : une question à la fois, avec une observation libre si besoin.",
        "2. Routine : recherchez des produits, assignez-les à un ou plusieurs moments (matin/soir/hebdo).",
        "3. Conseils lifestyle (facultatif) : un second PDF de conseils bien-être.",
        "4. PDF & envoi : générez le PDF, puis « Vérifier puis envoyer » — relisez l'aperçu exact de l'email et du PDF, rien ne part avant votre confirmation.",
      ],
    },
  ],
  [
    /^\/documents/,
    {
      title: 'Documents',
      points: [
        "Retrouvez ici tous les PDF déjà générés (routine et lifestyle), classés par cliente et par date.",
      ],
    },
  ],
  [
    /^\/produits/,
    {
      title: 'Produits',
      points: [
        "Le catalogue complet, avec recherche et filtres par catégorie.",
        "« Importer depuis Planity » met à jour stock et prix depuis l'export du logiciel de caisse, sans écraser vos fiches déjà personnalisées.",
      ],
    },
  ],
  [
    /^\/equipe/,
    {
      title: 'Équipe',
      points: [
        "Ajoutez ou désactivez des praticiennes — chacune ne voit que ses propres clientes, la gérante voit tout.",
      ],
    },
  ],
  [
    /^\/parametres/,
    {
      title: 'Paramètres',
      points: [
        "Informations de la boutique, délais de relance et de rappel photo, code d'accès partagé, gabarits d'email et questionnaires.",
      ],
    },
  ],
];

export function TutorialBanner() {
  const location = useLocation();
  const actif = useUI((s) => s.tutorielActif);
  if (!actif) return null;
  const content = TUTORIAL_CONTENT.find(([re]) => re.test(location.pathname))?.[1];
  if (!content) return null;
  return (
    <Notice icon="fa-solid fa-graduation-cap" tone="accent" className="tutorial-banner mb-2">
      <div className="grow">
        <strong>{content.title}</strong>
        <ul className="tutorial-points">
          {content.points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>
    </Notice>
  );
}
