const { chromium } = require('playwright');
const readline = require('readline');

(async () => {
  const userDataDir = process.env.CHROME_USER_DATA_DIR || `${process.env.LOCALAPPDATA}\\Google\\Chrome\\User Data`;
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome',
    headless: false,
    args: ['--profile-directory=Default']
  });
  const page = context.pages()[0] || await context.newPage();
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'https://crazy-tuktuk.vercel.app', { waitUntil: 'domcontentloaded' });
  console.log('Connect Phantom in the opened browser, then complete the Agent wallet setup.');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise(resolve => rl.question('Press Enter after the wallet is connected and ready: ', resolve));
  await context.storageState({ path: process.env.PLAYWRIGHT_STORAGE_STATE || 'playwright/.auth/agent.json' });
  rl.close();
  await context.close();
  console.log('Saved Playwright storage state.');
})().catch(error => { console.error(error); process.exit(1); });
