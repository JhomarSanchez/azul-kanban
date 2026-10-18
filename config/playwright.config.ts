import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const projectRoot = resolve(__dirname, '..');

export default defineConfig({
  testDir: resolve(projectRoot, 'tests/e2e'),
  outputDir: resolve(projectRoot, '.local/reports/test-results'),
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4200',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: resolve(projectRoot, '.local/reports/playwright') }],
  ],
});
