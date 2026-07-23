import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120000, // 2 minutes for single complete E2E flow
  use: {
    baseURL: 'http://localhost:5173',
    headless: !!process.env.HEADLESS, // Headed mode by default for user visual inspection!
    viewport: { width: 1280, height: 800 },
    launchOptions: {
      slowMo: 150, // Smooth visual speed
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
