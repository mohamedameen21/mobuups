import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Route suites share one in-memory Prisma double. Running files in
    // parallel lets one suite reset it while another is asserting results.
    fileParallelism: false,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/generated/**', 'src/server.ts', 'src/test/**', 'src/lib/prisma.ts'],
    },
  },
});
