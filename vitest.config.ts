import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/unit/**/*.spec.ts', 'src/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.e2e-spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.entity.ts',
        'src/**/*.e2e-spec.ts',
        'src/**/index.ts',
        'src/article/article.repository.ts',
        'src/category/category.repository.ts',
        'src/comment/comment.repository.ts',
        'src/user/user.repository.ts',
        'src/prisma/prisma.service.ts',
      ],
      thresholds: {
        lines: 90,
        branches: 85,
      },
    },
  },
});