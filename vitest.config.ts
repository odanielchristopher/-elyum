import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    coverage: {
      provider: 'v8',
    },
  },
  resolve: {
    alias: {
      '@elyum/core': path.resolve(__dirname, 'packages', 'core', 'src'),
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
