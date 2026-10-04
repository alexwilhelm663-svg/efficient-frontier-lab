/** Optional UI smoke test; install Playwright separately. Does not run in npm test. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Playwright fehlt. Optional: npm install --no-save playwright');
  playwright = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
}
const root = fileURLToPath(new URL('../', import.meta.url));
const port = process.env.TEST_PORT || '8193';
const server = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: { ...process.env, PORT: port }, stdio: ['ignore', 'pipe', 'pipe'] });
let browser;
const errors = [];
try {
  await Promise.race([once(server.stdout, 'data'), once(server, 'exit').then(() => { throw new Error('Testserver konnte nicht starten.'); })]);
  browser = await playwright.chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  const origin = `http://127.0.0.1:${port}`;
  await page.goto(origin + '/lab.html');
  await page.waitForFunction(() => document.querySelector('#metrics')?.textContent.includes('9,06'));
  assert.match(await page.locator('#comparison-body').innerText(), /19,6 %/);
  assert.equal(await page.locator('#error').isVisible(), false);

  await page.locator('#risk-budget-number').fill('1');
  await page.locator('#risk-budget-number').press('Tab');
  await page.waitForFunction(() => document.querySelector('#budget-result').textContent.includes('nicht erreichbar'));
  assert.match(await page.locator('#comparison-body').innerText(), /Nicht erreichbar/);
  await page.locator('#reset').click();
  const metricsBefore = await page.locator('#metrics').innerText();
  await page.locator('#corr-0-1').fill('0.9');
  await page.locator('#corr-0-2').fill('0.9');
  await page.locator('#corr-1-2').fill('-0.9');
  await page.locator('#calculate').click();
  await page.locator('#error').waitFor({ state: 'visible' });
  assert.match(await page.locator('#error').innerText(), /positiv definit/);
  assert.equal(await page.locator('#metrics').innerText(), metricsBefore);
  assert.match(await page.locator('#sample-badge').innerText(), /nicht berechnet/);
  await page.locator('#reset').click();
  await page.locator('#return-2').fill('15');
  await page.locator('#calculate').click();
  await page.waitForFunction(() => document.querySelector('#input-status').textContent.startsWith('Berechnet'));
  assert.notEqual(await page.locator('#metrics').innerText(), metricsBefore);
  await page.locator('#reset').click();
  await page.locator('#show-envelope').check();

  const csvDownload = page.waitForEvent('download');
  await page.locator('#download-csv').click();
  const csvFile = await csvDownload;
  const csv = await readFile(await csvFile.path(), 'utf8');
  assert.equal(csv.trim().split('\n').length, 5001);

  await page.locator('summary').click();
  const jsonDownload = page.waitForEvent('download');
  await page.locator('#save-config').click();
  const jsonFile = await jsonDownload;
  const saved = JSON.parse(await readFile(await jsonFile.path(), 'utf8'));
  assert.equal(saved.seed, 42); assert.equal(saved.assets.length, 3);
  saved.assets[0].name = '<img src=x onerror=alert(1)>';
  saved.correlation[0][1] = saved.correlation[1][0] = 0.123;
  saved.riskFreeRate = 0.0314;
  await page.locator('#import-config').setInputFiles({ name: 'test.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
  await page.waitForFunction(() => document.querySelector('#name-0').value.startsWith('<img'));
  assert.equal(await page.locator('#comparison-body img').count(), 0);
  assert.equal(await page.locator('#config-form').evaluate(form => form.checkValidity()), true);
  assert.equal(await page.locator('#error').isVisible(), false);
  await page.locator('#import-config').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await page.locator('#error').waitFor({ state: 'visible' });
  assert.match(await page.locator('#error').innerText(), /Import fehlgeschlagen/);
  await page.locator('#reset').click();
  await page.locator('#show-envelope').uncheck();
  await page.locator('summary').click();

  await mkdir(path.join(root, 'docs'), { recursive: true });
  const screenshots = [];
  for (const viewport of [{ width: 1440, height: 1050, name: 'desktop' }, { width: 768, height: 1024, name: 'tablet' }, { width: 390, height: 1000, name: 'mobile' }]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow: ${viewport.name}`);
    await page.screenshot({ path: path.join(root, `docs/preview-${viewport.name}.png`), fullPage: viewport.name === 'desktop' });
    screenshots.push(viewport.name);
  }
  for (const pathname of ['/.git/config', '/package.json', '/%2e%2e/README.md']) {
    const response = await page.request.get(origin + pathname); assert.equal(response.status(), 404);
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ browser: await browser.version(), uiFlows: 'PASS', responsive: screenshots, errors }, null, 2));
} finally {
  if (browser) await browser.close();
  server.kill();
}
