const { chromium } = require('playwright');
const readline = require('readline');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP(process.env.CHROME_CDP_URL || 'http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0] || await context.newPage();
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'https://crazy-tuktuk.vercel.app', { waitUntil: 'domcontentloaded' });
  console.log('Connect Phantom in the opened browser, then complete the Agent wallet setup.');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise(resolve => rl.question('Press Enter after the wallet is connected and ready: ', resolve));
  const statePath = process.env.PLAYWRIGHT_STORAGE_STATE || 'playwright/.auth/agent.json';
  const state = await context.storageState();
  state.cookies = state.cookies.filter(cookie => cookie.domain.endsWith('crazy-tuktuk.vercel.app'));
  const sessionStorage = await page.evaluate(() => Object.fromEntries(Object.entries(sessionStorage)));
  fs.mkdirSync(require('path').dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({ ...state, sessionStorage }, null, 2));
  rl.close();
  await browser.close();
  console.log('Saved Playwright storage state.');
})().catch(error => { console.error(error); process.exit(1); });
