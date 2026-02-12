import path from 'path';

import { defineConfig, mergeConfig } from 'vitest/config';

import baseConfig from '../../vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: '@elyum/validation',
      environment: 'node',
    },
    resolve: {
      alias: {
        '@elyum/types': path.resolve(__dirname, 'src', 'types'),
        '@elyum/contracts': path.resolve(__dirname, 'src', 'contracts'),
        '@elyum/errors': path.resolve(__dirname, 'src', 'errors'),
      },
    },
  }),
);
