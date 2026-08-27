const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://crazy-tuktuk.vercel.app',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    storageState: process.env.PLAYWRIGHT_STORAGE_STATE || undefined,
  },
});
