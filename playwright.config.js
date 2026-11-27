// Local tests only: `npx playwright test` serves the site from this folder and checks the pages
// in WebKit (the Safari engine, same as on iPhone) and Chromium. Nothing here runs in CI.
const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:8766', trace: 'retain-on-failure' },
  webServer: { command: 'python3 -m http.server 8766', url: 'http://localhost:8766/index.html', reuseExistingServer: true },
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 15 Pro'] } },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
