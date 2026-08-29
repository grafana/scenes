import { createRequire } from 'module';
import { mkdirSync } from 'fs';

const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const OUT = process.env.OUT_DIR || '/home/user/scenes/spike-artifacts';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 900, height: 460 },
  deviceScaleFactor: 2,
  recordVideo: { dir: OUT, size: { width: 900, height: 460 } },
});
const page = await context.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    console.log('console error:', msg.text());
  }
});
page.on('pageerror', (err) => console.log('page error:', err.message));

await page.goto('http://127.0.0.1:8123/index.html');
await page.waitForSelector('[role="combobox"]');
await page.waitForTimeout(400);

const input = page.getByRole('combobox');

// 1. key step
await input.click();
await page.getByRole('option', { name: 'RVP Region' }).waitFor();
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/01-key-step.png` });

// 2. label step, prefilled with the datasource label
await page.getByRole('option', { name: 'RVP Region' }).click();
await page.getByText('Optional display name - press Enter to continue').waitFor();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/02-label-step-prefilled.png` });

// 3. type an override (prefill is selected, typing replaces it)
await page.keyboard.type('Region (RVP)', { delay: 40 });
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/03-label-step-override.png` });

// 4. Enter accepts -> operator step
await page.keyboard.press('Enter');
await page.getByRole('option', { name: '=', exact: true }).waitFor();
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/04-operator-step.png` });

// 5. pick '=' -> value step
await page.getByRole('option', { name: '=', exact: true }).click();
try {
  await page.getByRole('option', { name: 'EMEA' }).waitFor({ timeout: 2000 });
} catch {
  await page.keyboard.press('ArrowDown');
  await page.getByRole('option', { name: 'EMEA' }).waitFor();
}
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/05-value-step.png` });

// 6. pick EMEA -> committed pill shows the display name
await page.getByRole('option', { name: 'EMEA' }).click();
await page.getByText('Region (RVP) = EMEA').waitFor();
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/06-committed-pill.png` });

const filtersJson = await page.getByTestId('filters-json').innerText();
console.log('committed filters:', filtersJson);

await context.close();
await browser.close();
console.log('done');
