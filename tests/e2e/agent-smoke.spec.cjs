const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('Agent Mode starts and exposes observable state', async ({ page }) => {
  const consoleErrors = [];
  const railwayRequests = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', request => {
    if (request.url().includes('railway.app')) railwayRequests.push(request.url());
  });

  if (process.env.PLAYWRIGHT_STORAGE_STATE) {
    const saved = JSON.parse(fs.readFileSync(process.env.PLAYWRIGHT_STORAGE_STATE, 'utf8'));
    await page.addInitScript(entries => {
      for (const [key, value] of Object.entries(entries || {})) sessionStorage.setItem(key, value);
    }, saved.sessionStorage || {});
  }
  await page.goto('/?routeTestFares=1', { waitUntil: 'networkidle' });
  await expect(page.locator('#agentTopStrip')).toBeAttached();

  await page.locator('#titleTournament').click();
  await page.locator('#tournamentGarage').click();
  await page.locator('.garage-driver-card').first().click();
  const readyButton = page.locator('#garageCreateDriver');
  await readyButton.click();
  await readyButton.click();
  await readyButton.click();
  await page.waitForTimeout(1_500);

  const status = page.locator('#agentTopStatus');
  await expect(status).toBeVisible();
  const statusText = await status.textContent();
  test.info().annotations.push({ type: 'agent-status', description: statusText || 'empty' });

  const authenticated = Boolean(process.env.PLAYWRIGHT_STORAGE_STATE);
  if (authenticated) {
    await expect.poll(async () => (await status.textContent()) || '').toMatch(/ACTIVE|ON TRIP|EVALUATING|FARE|QUEUED/i);
    await expect(page.locator('#agentActivitySection')).toBeVisible();
    await expect(page.locator('#agentStrategyPitCalls')).toBeAttached();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('#agentTopStatus')).toBeVisible();
  }

  expect(railwayRequests, 'normal Agent browser path must not call Railway').toEqual([]);
  expect(consoleErrors.filter(error => !error.includes('ObjectMultiplex'))).toEqual([]);
});
