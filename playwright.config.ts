import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    // --ignore-lock keeps Astro 7 in the foreground; under a coding agent it
    // otherwise backgrounds itself and Playwright sees the process exit.
    command: `node node_modules/astro/bin/astro.mjs dev --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}`,
    env: { DC_E2E: '1', DC_FIXTURES: '1' },
    reuseExistingServer: !process.env.CI,
  },
});
