import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    coverage: {
      provider: 'v8',
    },
    setupFiles: ['reflect-metadata'],
  },
});
