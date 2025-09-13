/**
 * Astro Configuration for Docker Development
 * Following Astro MCP best practices for containerized environments
 * Using Tailwind 4 with @tailwindcss/vite plugin (matching main config)
 */

import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// Force WASM mode for lightningcss in Docker
process.env.CSS_TRANSFORMER_WASM = '1';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react({
      // Enable React components in .astro files (matching main config)
      include: ['**/react/*', '**/components/**/*'],
    }),
  ],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  
  // Astro MCP recommended settings for Docker
  server: {
    // CRITICAL: Bind to all interfaces for Docker
    host: '0.0.0.0',
    port: 3000,
    
    // File watching configuration for containers
    watch: {
      // Use polling for file changes (required in Docker)
      usePolling: true,
      interval: 1000,
      
      // Ignore node_modules and build directories
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/.astro/**'
      ]
    }
  },
  
  // Vite-specific configuration for containers
  vite: {
    server: {
      // HMR configuration for Docker
      hmr: {
        // Use the container port
        port: 3000,
        // Use host networking for HMR
        host: 'localhost',
        // Protocol for HMR
        protocol: 'ws'
      },
      
      // Watch configuration
      watch: {
        // Enable polling (required for Docker on some systems)
        usePolling: true,
        interval: 1000,
        
        // Aggressive file watching for containers
        binaryInterval: 1000,
        awaitWriteFinish: {
          stabilityThreshold: 500,
          pollInterval: 100
        }
      },
      
      // Explicitly set host for container
      host: true,
      
      // Strict port to avoid conflicts
      strictPort: true
    },
    
    // Optimize for container builds
    build: {
      // Increase chunk size warning limit for containers
      chunkSizeWarningLimit: 1000,
      
      // Use esbuild for faster builds in containers
      target: 'esnext',
      
      // Source maps for development
      sourcemap: true
    },
    
    // Clear cache handling for containers
    cacheDir: '.vite',
    
    // PostCSS configuration (matching main config)
    css: {
      postcss: {
        plugins: [],
      },
    },
    
    // Optimize deps for containers (matching main config)
    optimizeDeps: {
      include: ['react', 'react-dom', 'dompurify', 'crypto-js'],
    },

    plugins: [tailwindcss()]
  },
  
  // Build configuration for containers
  build: {
    // Use server-side rendering
    inlineStylesheets: 'auto',
    
    // Split code for better caching
    splitting: true,
    
    // Exclude drafts from build
    excludeDrafts: true
  },
  
  // Prefetch configuration
  prefetch: {
    // Enable prefetching for better performance
    prefetchAll: true,
    defaultStrategy: 'viewport'
  }
});