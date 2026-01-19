import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5000 },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 5000,
    ignoreHTTPSErrors: true,
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
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
