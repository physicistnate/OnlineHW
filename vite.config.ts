import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base: './' makes the built site work from any folder (GitHub Pages, Netlify, a USB stick...).
// Routing uses the URL hash (#/bank, #/q/...), so no server-side rewrites are needed.
export default defineConfig({
  base: './',
  plugins: [react()],
  // KaTeX (maths rendering) + React is ~170 kB gzipped; fine for this site.
  build: { chunkSizeWarningLimit: 900 },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
