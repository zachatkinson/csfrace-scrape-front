import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react({
      // Enable React components in .astro files
      include: ['**/react/*', '**/components/**/*'],
    }),
  ],
  output: 'server',
  adapter: netlify({
    edgeMiddleware: true
  }),
  server: {
    port: 3000,
    host: true
  },
  // Vite configuration for Liquid Glass optimization
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    css: {
      postcss: {
        plugins: [],
      },
    },
  },
  // Environment variables configuration
  // Backend API URLs should be defined in .env files as:
  // VITE_API_BASE_URL=http://localhost:8000
  // VITE_WS_BASE_URL=ws://localhost:8000
});
