import { defineConfig, mergeConfig } from 'vitest/config';

import baseConfig from '../../vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: '@elyum/core',
      environment: 'node',
      setupFiles: ['reflect-metadata'],
    },
  }),
);
