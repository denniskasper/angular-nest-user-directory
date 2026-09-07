import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

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
      command: 'npx nx run api:serve',
      url: 'http://localhost:3000/api',
      reuseExistingServer: true,
      cwd: workspaceRoot,
    },
    {
      command: 'npx nx run frontend:serve',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      cwd: workspaceRoot,
    },
  ],
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'phone',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
