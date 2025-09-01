import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react({
      // Enable React components in .astro files
      include: ['**/react/*', '**/components/**/*'],
    }),
    tailwind({
      applyBaseStyles: false, // We'll apply our own Liquid Glass styles
      config: {
        path: './tailwind.config.js',
      },
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
