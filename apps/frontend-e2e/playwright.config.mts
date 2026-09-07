import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * The API the browser specs run against gets a store of its own, started
 * afresh each run, so creating Users neither touches the real data
 * directory nor accumulates between runs.
 */
const apiDataDir = 'tmp/e2e/data';

/** The spec that creates Users; it grows the directory the others count. */
const creation = /create\.spec\.ts$/;
const desktop = { ...devices['Desktop Chrome'] };
const phone = { ...devices['Pixel 7'] };

/**
 * The spec requires every browser spec to run at a phone and a desktop
 * viewport (see .scratch/user-directory/spec.md, Testing Decisions).
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  // The frontend proxies /api to the API, so both must be up.
  webServer: [
    {
      command: `rm -rf ${apiDataDir} && npx nx run api:serve`,
      url: 'http://localhost:3000/api',
      reuseExistingServer: true,
      cwd: workspaceRoot,
      env: { DATA_DIR: apiDataDir },
    },
    {
      command: 'npx nx run frontend:serve',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      cwd: workspaceRoot,
    },
  ],
  projects: [
    { name: 'desktop', use: desktop, testIgnore: creation },
    { name: 'phone', use: phone, testIgnore: creation },
    // Creating Users runs once every spec that counts them has finished at
    // both widths.
    {
      name: 'desktop-create',
      use: desktop,
      testMatch: creation,
      dependencies: ['desktop', 'phone'],
    },
    {
      name: 'phone-create',
      use: phone,
      testMatch: creation,
      dependencies: ['desktop', 'phone'],
    },
  ],
});
