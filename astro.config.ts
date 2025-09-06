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
  // Security configuration - simplified CSP for now
  experimental: {
    csp: true
  },
  // Vite configuration for Liquid Glass optimization
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'dompurify', 'crypto-js'],
    },
    build: {
      // Bundle optimization
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk for third-party libraries
            vendor: ['react', 'react-dom'],
            // Security utilities chunk
            security: ['dompurify', 'crypto-js'],
            // UI libraries chunk
            ui: ['@headlessui/react', '@heroicons/react'],
          },
        },
      },
      // Enable source maps in development only
      sourcemap: !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
      // Minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true,
        },
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
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
