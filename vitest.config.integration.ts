import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

export default defineConfig({
  test: {
    name: 'integration',
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/integration',
      include: ['src/**/*.{js,ts}'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.spec.{js,ts}',
        '**/*.test.{js,ts}',
      ],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
