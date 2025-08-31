// @ts-check
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
  // Environment variables for backend API
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000',
    WS_BASE_URL: process.env.WS_BASE_URL || 'ws://localhost:8000'
  }
});
