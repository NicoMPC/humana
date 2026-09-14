import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' permet de servir le dossier dist/ depuis n'importe quel chemin
// (npx serve dist, sous-dossier d'un hébergement, etc.).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 1200 },
  server: { port: 5173, open: false },
});
