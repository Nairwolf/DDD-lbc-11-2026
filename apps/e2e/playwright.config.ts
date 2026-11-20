import { defineConfig, devices } from '@playwright/test'

import { API_PORT, API_URL, WEB_PORT, WEB_URL } from './ports'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: WEB_URL,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'go run ./cmd/api',
      cwd: '../api',
      url: `${API_URL}/health`,
      env: {
        PORT: String(API_PORT),
        DEMO_DATA: 'off',
        SMTP_ADDR: process.env.SMTP_ADDR ?? 'localhost:1025',
        FRONTEND_URL: WEB_URL,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `pnpm exec vite dev --port ${WEB_PORT} --strictPort`,
      cwd: '../web',
      url: WEB_URL,
      env: { API_URL },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
