import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base: './' makes the built site work from any folder (GitHub Pages, Netlify, a USB stick...).
// Routing uses the URL hash (#/bank, #/q/...), so no server-side rewrites are needed.
export default defineConfig({
  base: './',
  plugins: [react()],
  // Three chunks, so that adding questions does not change the libraries' files (browsers
  // keep those cached) and no chunk is very large: the libraries (React and KaTeX, which
  // renders the maths), the question bank (src/content) and the app itself.
  build: {
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor', test: /node_modules/, priority: 2 },
            { name: 'questions', test: /[\\/]src[\\/]content[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
