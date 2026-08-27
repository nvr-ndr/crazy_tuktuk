const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP(process.env.CHROME_CDP_URL || 'http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(candidate =>
    /(^https?:\/\/localhost:4173|crazy-tuktuk\.vercel\.app)/.test(candidate.url())
  ) || context.pages()[0];
  if (!page) throw new Error('Open CrazyTukuk in Brave before running this test');
  const errors = [];
  const railway = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (request.url().includes('railway.app')) railway.push(request.url()); });
  await page.bringToFront();
  // CDP runs against the user's already-authenticated Brave tab. Do not reload:
  // reloading can hide an active Agent session before the smoke check observes it.
  const agentEntry = page.getByRole('button', { name: 'Open Agent Mode' });
  if (await agentEntry.isVisible().catch(() => false)) await agentEntry.click();

  const agentPanel = page.locator('#tournamentPanel');
  if (await agentPanel.isVisible().catch(() => false)) {
    const garageAction = agentPanel.getByRole('button', { name: /Open Agent Garage|Watch Driver/i });
    await garageAction.waitFor({ state: 'visible' });
    await garageAction.click();
    await page.waitForTimeout(1_500);
  }

  const garage = page.locator('#garagePanel');
  if (await garage.isVisible().catch(() => false)) {
    const driver = garage.locator('.garage-driver-card').first();
    await driver.waitFor({ state: 'visible' });
    await driver.click();
    const createDriver = garage.locator('#garageCreateDriver');
    await createDriver.waitFor({ state: 'visible' });
    await createDriver.click();
    await createDriver.click();
    await createDriver.click();
  }
  await page.waitForTimeout(2_000);
  const status = await page.locator('#agentTopStatus').textContent();
  if (!/ACTIVE|ON TRIP|EVALUATING|FARE|QUEUED/i.test(status || '')) throw new Error('Agent did not start: ' + status);
  if (railway.length) throw new Error('Railway requests detected: ' + railway.join(', '));
  const relevantErrors = errors.filter(error =>
    !error.includes('ObjectMultiplex')
    && !error.includes('MetaMask encountered an error setting the global Ethereum provider')
  );
  if (relevantErrors.length) throw new Error('Console errors detected: ' + relevantErrors.join('\n'));
  console.log('PASS Agent CDP smoke: status=' + status.trim() + ', railwayRequests=0, consoleErrors=0');
  await browser.close();
})().catch(error => { console.error('FAIL ' + error.message); process.exit(1); });
