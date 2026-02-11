import path from 'path';

import { defineConfig, mergeConfig } from 'vitest/config';

import baseConfig from '../../vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: '@elyum/http',
      environment: 'node',
    },
    resolve: {
      alias: {
        '@contracts': path.resolve(__dirname, 'src', 'contracts'),
        '@routing': path.resolve(__dirname, 'src', 'routing'),
        '@decorators': path.resolve(__dirname, 'src', 'decorators'),
        '@validation': path.resolve(__dirname, 'src', 'validation'),
        '@guards': path.resolve(__dirname, 'src', 'guards'),
        '@context': path.resolve(__dirname, 'src', 'context'),
        '@exceptions': path.resolve(__dirname, 'src', 'exceptions'),
        '@utils': path.resolve(__dirname, 'src', 'utils'),
      },
    },
  }),
);
