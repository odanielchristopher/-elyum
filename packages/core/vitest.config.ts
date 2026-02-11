import path from 'path';

import { defineConfig, mergeConfig } from 'vitest/config';

import baseConfig from '../../vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: '@elyum/core',
      include: ['tests/**/*.spec.ts'],
    },
    resolve: {
      alias: {
        '@elyum/di': path.resolve(__dirname, 'src', 'di'),
        '@elyum/context': path.resolve(__dirname, 'src', 'context'),
        '@elyum/decorators': path.resolve(__dirname, 'src', 'decorators'),
        '@elyum/lifecycle': path.resolve(__dirname, 'src', 'lifecycle'),
        '@elyum/metadata': path.resolve(__dirname, 'src', 'metadata'),
        '@elyum/types': path.resolve(__dirname, 'src', 'types'),
        '@elyum/helpers': path.resolve(__dirname, 'src', 'helpers'),
        '@elyum/errors': path.resolve(__dirname, 'src', 'errors'),
      },
    },
  }),
);
