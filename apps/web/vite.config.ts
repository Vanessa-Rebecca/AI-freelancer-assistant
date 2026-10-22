import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // The browser only ever talks to this origin, so the SameSite=Strict
    // refresh cookie works and no CORS is needed. Vercel does the same in production.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
