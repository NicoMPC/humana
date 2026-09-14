/**
 * Store global (Zustand + persistance localStorage).
 * Toute la logique métier de mutation passe par ici : les composants ne
 * modifient jamais les données directement.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { buildSeed, SCHEMA_VERSION } from '../data/seed';
import { uid } from '../lib/ids';
import { addDays, nowISO, todayISO } from '../lib/dates';
import { toast } from './useUI';

export const STORAGE_KEY = 'humana.app.v8';

const journalEntry = (action, auteur_id, meta = {}) => ({ id: uid('j'), date: nowISO(), action, auteur_id, ...meta });

export const useStore = create(
  persist(
    (set, get) => ({
      ...buildSeed(),
      session: { userId: null },

      /* ---------------- Session ---------------- */
      login: (userId) => set({ session: { userId } }),
      logout: () => set({ session: { userId: null } }),
      currentUser: () => get().users.find((u) => u.id === get().session.userId) || null,

      /* ---------------- Utilisateurs (patronne) ---------------- */
      addUser: (payload) => {
        const user = { id: uid('u'), role: 'praticienne', actif: true, couleur: '#8fa379', ...payload };
        set((s) => ({ users: [...s.users, user] }));
        return user;
      },
      updateUser: (id, patch) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),

      /* ---------------- Clientes ---------------- */
      addClient: (payload) => {
        const client = { id: uid('c'), notes: '', telephone: '', email: '', archive: false, date_creation: todayISO(), ...payload };
        set((s) => ({ clients: [...s.clients, client] }));
        return client;
      },
      updateClient: (id, patch) => set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteClient: (id) =>
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id), diagnostics: s.diagnostics.filter((d) => d.client_id !== id) })),
      reassignClient: (clientId, praticienneId, auteurId) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === clientId ? { ...c, praticienne_id: praticienneId } : c)),
          diagnostics: s.diagnostics.map((d) =>
            d.client_id === clientId && d.statut !== 'termine'
              ? { ...d, praticienne_id: praticienneId, journal: [...d.journal, journalEntry('Diagnostic réassigné', auteurId)] }
              : d
          ),
        })),

      /* ---------------- Diagnostics ---------------- */
      createDiagnostic: ({ clientId, type, praticienneId, auteurId, modalite = 'boutique' }) => {
        const d = {
          id: uid('d'), client_id: clientId, praticienne_id: praticienneId, type,
          date_rdv: todayISO(), date_creation: todayISO(),
          // Statut transitoire tant que le diagnostic n'a pas été envoyé :
          // volontairement PAS une clé de STATUTS (ni badge ni filtre "en
          // cours" nulle part dans l'UI) — la praticienne fait tout le
          // parcours (questionnaire → routine → PDF → envoi) en une seule
          // séance ininterrompue, `recordEnvoi` le fait passer à 'envoye'.
          statut: 'brouillon',
          // Boutique ou visio : change la formule d'accroche de l'email
          // (voir `contexte_visite` dans `lib/email.js`) — modifiable à
          // tout moment depuis l'en-tête du diagnostic.
          modalite,
          reponses: {}, observations: {}, note_generale: '', routine: [], conseils: '', lifestyle: [],
          documents: [], envois: [], photos: { avant: null, apres: null }, suivi_notes: '',
          date_envoi: null, date_relance: null, relance_envoyee: false, date_cloture: null,
          journal: [journalEntry('Diagnostic démarré', auteurId)],
        };
        set((s) => ({ diagnostics: [d, ...s.diagnostics] }));
        return d;
      },
      updateDiagnostic: (id, patch) =>
        set((s) => ({ diagnostics: s.diagnostics.map((d) => (d.id === id ? { ...d, ...(typeof patch === 'function' ? patch(d) : patch) } : d)) })),
      deleteDiagnostic: (id) => set((s) => ({ diagnostics: s.diagnostics.filter((d) => d.id !== id) })),
      addJournal: (id, action, auteurId, meta) =>
        get().updateDiagnostic(id, (d) => ({ journal: [...d.journal, journalEntry(action, auteurId, meta)] })),

      setAnswer: (id, questionId, value) => get().updateDiagnostic(id, (d) => ({ reponses: { ...d.reponses, [questionId]: value } })),
      setObservation: (id, questionId, value) => get().updateDiagnostic(id, (d) => ({ observations: { ...d.observations, [questionId]: value } })),

      /* Routine */
      toggleRoutineProduct: (id, produitId, defaultMoments = ['matin']) =>
        get().updateDiagnostic(id, (d) => {
          const exists = d.routine.some((r) => r.produit_id === produitId);
          return { routine: exists ? d.routine.filter((r) => r.produit_id !== produitId) : [...d.routine, { produit_id: produitId, moments: defaultMoments, conseil: '' }] };
        }),
      setRoutineItem: (id, produitId, patch) =>
        get().updateDiagnostic(id, (d) => ({ routine: d.routine.map((r) => (r.produit_id === produitId ? { ...r, ...patch } : r)) })),
      toggleRoutineMoment: (id, produitId, moment) =>
        get().updateDiagnostic(id, (d) => ({
          routine: d.routine.map((r) => {
            if (r.produit_id !== produitId) return r;
            const has = r.moments.includes(moment);
            const moments = has ? r.moments.filter((m) => m !== moment) : [...r.moments, moment];
            return { ...r, moments: moments.length ? moments : r.moments };
          }),
        })),
      moveRoutineItem: (id, from, to) =>
        get().updateDiagnostic(id, (d) => {
          if (to < 0 || to >= d.routine.length) return {};
          const routine = [...d.routine];
          const [item] = routine.splice(from, 1);
          routine.splice(to, 0, item);
          return { routine };
        }),
      validateRoutine: (id, auteurId) => get().addJournal(id, 'Routine validée', auteurId),

      toggleLifestyle: (id, tipId) =>
        get().updateDiagnostic(id, (d) => ({ lifestyle: d.lifestyle.includes(tipId) ? d.lifestyle.filter((t) => t !== tipId) : [...d.lifestyle, tipId] })),

      /**
       * Photo avant / après (suivi à S+6, voir `isPhotosDue`). `photo` est
       * `{ url, date }` — `url` est une data-URL base64 en l'absence de
       * backend (un futur module de synchronisation Google Sheets pourra la
       * remplacer par un vrai lien Drive, hors périmètre ici).
       */
      setDiagnosticPhoto: (id, type, photo) =>
        get().updateDiagnostic(id, (d) => ({ photos: { ...d.photos, [type]: photo } })),

      /* Documents (PDF) */
      addDocument: (id, { type, nom_fichier }, auteurId) =>
        get().updateDiagnostic(id, (d) => {
          const previous = d.documents.filter((doc) => doc.type === type);
          const doc = { id: uid('doc'), type, nom_fichier, date: nowISO(), version: previous.length + 1 };
          return {
            documents: [...d.documents.filter((x) => x.type !== type), doc],
            journal: [...d.journal, journalEntry(type === 'routine' ? `PDF routine généré (v${doc.version})` : `PDF lifestyle généré (v${doc.version})`, auteurId)],
          };
        }),

      /* Envois (simulés) */
      recordEnvoi: (id, { type, mode, destinataire, sujet }, auteurId) => {
        const delai = get().settings.delai_relance_jours || 7;
        get().updateDiagnostic(id, (d) => {
          const envoi = { id: uid('env'), date: nowISO(), type, mode, destinataire, sujet };
          const base = { envois: [...d.envois, envoi] };
          const suffixe = mode === 'auto' ? 'automatiquement' : 'à la cliente';
          if (type === 'relance') {
            // Pas de « J+{delai} » dans le libellé : la praticienne peut
            // volontairement relancer avant l'échéance (voir SendStep), le
            // délai réglé dans Paramètres n'est alors plus exact.
            return { ...base, relance_envoyee: true, statut: 'termine', date_cloture: todayISO(), journal: [...d.journal, journalEntry(`Relance envoyée ${suffixe}`, auteurId)] };
          }
          const date_envoi = todayISO();
          return { ...base, statut: 'envoye', date_envoi, date_relance: addDays(date_envoi, delai), journal: [...d.journal, journalEntry(`Email envoyé ${suffixe}`, auteurId)] };
        });
      },
      cloturer: (id, auteurId, motif = 'Diagnostic clôturé sans relance') =>
        get().updateDiagnostic(id, (d) => ({ statut: 'termine', date_cloture: todayISO(), journal: [...d.journal, journalEntry(motif, auteurId)] })),
      // Rouvrir un diagnostic « en cours d'interruption » n'a plus de sens
      // (parcours en une seule séance, plus de statut brouillon persistant à
      // restaurer) : rouvrir un diagnostic déjà terminé le remet simplement
      // au statut 'envoye' (suivi de relance) si un envoi a bien eu lieu,
      // pour permettre une correction/réédition directe par la praticienne.
      reopen: (id, auteurId) =>
        get().updateDiagnostic(id, (d) => ({ statut: d.date_envoi ? 'envoye' : d.statut, date_cloture: null, relance_envoyee: false, journal: [...d.journal, journalEntry('Diagnostic rouvert', auteurId)] })),

      /* ---------------- Produits ---------------- */
      addProduit: (payload) => {
        const p = { id: uid('p'), actif: true, stock: 0, prix: '0.00', prix_achat: '', description: '', cible: 'mixte', reference: '', ean: '', ...payload };
        set((s) => ({ produits: [...s.produits, p] }));
        return p;
      },
      updateProduit: (id, patch) => set((s) => ({ produits: s.produits.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteProduit: (id) => set((s) => ({ produits: s.produits.filter((p) => p.id !== id) })),

      /**
       * Applique un plan d'import Planity (voir `lib/planityImport.js`) :
       * crée les nouveaux produits, met à jour stock/prix des existants
       * (sans toucher à leur fiche déjà personnalisée), et enregistre la
       * date d'import pour le suivi de « fraîcheur du stock ».
       */
      applyStockImport: (plan, auteurId) => {
        const created = plan.toCreate.map((p) => ({ id: uid('p'), actif: true, description: '', cible: 'mixte', reference: '', ean: '', ...p }));
        const updateMap = new Map(plan.toUpdate.map((u) => [u.id, u.patch]));
        set((s) => ({
          produits: [...s.produits.map((p) => (updateMap.has(p.id) ? { ...p, ...updateMap.get(p.id) } : p)), ...created],
          settings: {
            ...s.settings,
            stock: {
              dernierImport: todayISO(),
              historique: [
                { date: nowISO(), auteur_id: auteurId, crees: plan.stats.crees, maj: plan.stats.maj, ignores: plan.stats.ignores },
                ...(s.settings.stock?.historique || []),
              ].slice(0, 10),
            },
          },
        }));
        get().notify('stock', {
          toastMessage: `Stock mis à jour : ${plan.stats.crees} produit${plan.stats.crees > 1 ? 's' : ''} ajouté${plan.stats.crees > 1 ? 's' : ''} · ${plan.stats.maj} mis à jour.`,
          toastType: 'success',
        });
        return created;
      },

      /* ---------------- Questions ---------------- */
      setQuestions: (type, list) => set((s) => ({ questions: { ...s.questions, [type]: list } })),

      /* ---------------- Paramètres ---------------- */
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...(typeof patch === 'function' ? patch(s.settings) : patch) } })),

      /**
       * Point d'entrée unique pour signaler un événement de suivi (relance,
       * stock, envoi auto…) par un toast — pas de centre de notifications
       * séparé (le tableau de bord affiche déjà tout ce qui est en attente,
       * voir DashboardPage). `prefKey`/le reste du payload ne servent plus
       * qu'à documenter la provenance de l'appel, conservés pour éviter de
       * toucher tous les appelants.
       */
      notify: (_prefKey, { toastMessage, toastType, toastDuration, toastAction } = {}) => {
        if (toastMessage) toast(toastMessage, { type: toastType, duration: toastDuration, action: toastAction });
      },
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => (version === SCHEMA_VERSION ? persisted : { ...buildSeed(), session: { userId: null } }),
      partialize: (s) => ({
        version: s.version, seededAt: s.seededAt, users: s.users, clients: s.clients, diagnostics: s.diagnostics,
        produits: s.produits, questions: s.questions, settings: s.settings, session: s.session,
      }),
    }
  )
);

/** Hook pratique : utilisatrice connectée (ou null). */
export const useCurrentUser = () => useStore((s) => s.users.find((u) => u.id === s.session.userId) || null);
