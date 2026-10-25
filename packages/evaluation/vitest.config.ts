import { defineConfig, mergeConfig } from 'vitest/config';

import baseConfig from '../../vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: '@elyum/evaluation',
      environment: 'node',
      setupFiles: ['reflect-metadata'],
    },
  }),
);
