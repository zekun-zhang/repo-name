import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'node server/index.js',
      url: 'http://localhost:4001/api/habits',
      reuseExistingServer: false,
      timeout: 10_000,
      env: {
        PORT: '4001',
        ALLOWED_ORIGINS: 'http://localhost:5173',
        DATA_FILE: '/tmp/e2e-habits.json',
      },
    },
    {
      command: 'vite preview --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 15_000,
    },
  ],

  globalSetup: './e2e/global-setup.ts',
})
