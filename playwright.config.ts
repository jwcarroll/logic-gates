import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/tests/e2e/playwright',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4173',
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host --port 4173',
    port: 4173,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
