import path from 'node:path';

import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    exclude: [...configDefaults.exclude, '**/dist/**', '**/.typecheck/**'],
    coverage: {
      provider: 'v8',
    },
  },
  resolve: {
    alias: {
      '@elyum/core': path.resolve(__dirname, 'packages', 'core', 'src'),
      '@elyum/http': path.resolve(__dirname, 'packages', 'http', 'src'),
      '@elyum/express': path.resolve(__dirname, 'packages', 'express', 'src'),
      '@elyum/fastify': path.resolve(__dirname, 'packages', 'fastify', 'src'),
      '@elyum/validation': path.resolve(
        __dirname,
        'packages',
        'validation',
        'src',
      ),
      '@elyum/validation-zod': path.resolve(
        __dirname,
        'packages',
        'validation-zod',
        'src',
      ),
      '@elyum/validation-yup': path.resolve(
        __dirname,
        'packages',
        'validation-yup',
        'src',
      ),
    },
  },
});
