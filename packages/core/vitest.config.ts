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
        '@di': path.resolve(__dirname, 'src', 'di'),
        '@context': path.resolve(__dirname, 'src', 'context'),
        '@decorators': path.resolve(__dirname, 'src', 'decorators'),
        '@lifecycle': path.resolve(__dirname, 'src', 'lifecycle'),
        '@metadata': path.resolve(__dirname, 'src', 'metadata'),
        '@types': path.resolve(__dirname, 'src', 'types'),
        '@errors': path.resolve(__dirname, 'src', 'errors'),
      },
    },
  }),
);
