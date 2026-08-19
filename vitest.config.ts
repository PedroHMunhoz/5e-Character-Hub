import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Mirrors tsconfig.json's `paths: { "@/*": ["./*"] }` so tests can import
// app modules (data/wizard/*, utils/*, constants/*, types/*) the same way
// the app does. Node-only test environment - no jest-expo/RNTL needed since
// everything under test here is plain TypeScript with no React/RN imports.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
