import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/tests/e2e',
  testMatch: /.*\.spec\.ts$/,
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4173',
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-1440',
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet-1280',
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'wide-1920',
      use: { viewport: { width: 1920, height: 1080 } },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host --port 4173',
    port: 4173,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
