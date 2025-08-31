import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // We'll apply our own base styles
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
  // Vite environment variables are handled automatically
  // Backend API URLs should be defined in .env files as:
  // VITE_API_BASE_URL=http://localhost:8000
  // VITE_WS_BASE_URL=ws://localhost:8000
});
