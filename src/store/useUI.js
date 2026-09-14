/** État d'interface éphémère (toasts, modale globale) — non persisté. */
import { create } from 'zustand';
import { uid } from '../lib/ids';

export const useUI = create((set, get) => ({
  toasts: [],
  toast: (message, options = {}) => {
    const t = { id: uid('t'), message, type: options.type || 'success', duration: options.duration ?? 3600, action: options.action || null };
    set((s) => ({ toasts: [...s.toasts, t].slice(-4) }));
    if (t.duration > 0) setTimeout(() => get().dismissToast(t.id), t.duration);
    return t.id;
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // Modale de confirmation générique
  confirm: null,
  askConfirm: (options) =>
    new Promise((resolve) => {
      set({ confirm: { ...options, resolve } });
    }),
  resolveConfirm: (value) => {
    const c = get().confirm;
    set({ confirm: null });
    c?.resolve?.(value);
  },

  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  // Mode tutoriel (bandeau d'aide contextuel, voir TutorialBanner.jsx) :
  // activable/désactivable depuis la topbar, non persisté (repart désactivé
  // à chaque session — volontaire, pour ne pas encombrer l'usage quotidien).
  tutorielActif: false,
  toggleTutoriel: () => set((s) => ({ tutorielActif: !s.tutorielActif })),
}));

export const toast = (message, options) => useUI.getState().toast(message, options);
export const confirmDialog = (options) => useUI.getState().askConfirm(options);
