import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Component tests don't need Tailwind/PostCSS processing.
  css: { postcss: { plugins: [] } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{spec,test}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Scoped to Feature 010's interactive surface (contracts require ≥80% here —
      // see tasks.md T094). packages/ui also carries a pre-existing, pre-Feature-010
      // design system (Button, Card, Modal, DataTable, shells, ...) with no test
      // coverage yet; backfilling that is a separate, much larger effort out of
      // this feature's scope, so it's excluded from this gate rather than left
      // permanently failing it.
      include: [
        'src/components/interactive/**/*.{ts,tsx}',
        'src/components/lesson/**/*.{ts,tsx}',
        'src/components/question/**/*.{ts,tsx}',
        'src/components/a11y/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/**/*.{spec,test}.{ts,tsx}',
        'src/**/__tests__/**',
        'src/index.ts',
        'src/locales/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
