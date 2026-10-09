import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:3200', trace: 'retain-on-failure' },
  projects: [{ name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } }],
  webServer: { command: 'npm run preview', env: { PORT: '3200', CONTENT_DIR: `.data/e2e-${process.pid}-${Date.now()}` }, url: 'http://127.0.0.1:3200', reuseExistingServer: false, timeout: 30000 },
});


