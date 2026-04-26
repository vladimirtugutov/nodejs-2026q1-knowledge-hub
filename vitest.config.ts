import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.spec.ts',
      'src/**/*.test.ts',
      'tests/**/*.spec.ts',
      'tests/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/test/**',
      '**/*.e2e-spec.ts',
      '**/*.e2e.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.entity.ts',
        'src/**/*.e2e-spec.ts',
        'src/**/*.e2e.test.ts',
        'src/**/index.ts',
      ],
      thresholds: {
        lines: 90,
        branches: 85,
      },
    },
  },
});