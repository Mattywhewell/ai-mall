import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 5000,
    ignoreHTTPSErrors: true,
    trace: 'on', // record trace for each test
    screenshot: 'only-on-failure', // capture screenshots only for failures
    video: 'retain-on-failure', // keep videos for failed tests
  },
  // When BASE_URL points to a remote/staging host (or a local URL on a different port), skip starting the local dev server.
  webServer: (process.env.BASE_URL && !/^(https?:\/\/)?(localhost(:3000)?|127\.0\.0\.1(:3000)?)$/i.test(process.env.BASE_URL)) ? undefined : (() => {
    const isCI = !!process.env.CI;
    return {
      command: isCI ? 'npm run build && npm run start' : 'npm run dev',
      url: 'http://localhost:3000',
      timeout: 120_000,
      // When a BASE_URL is supplied (workflow starts the server), allow Playwright to reuse it.
      // Keep the previous behavior of reusing the server in local dev (when not CI).
      reuseExistingServer: !!process.env.BASE_URL || !isCI,
    };
  })(),
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  outputDir: 'playwright-artifacts',
});
