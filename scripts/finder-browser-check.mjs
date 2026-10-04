/** End-to-end checks for the profile flow; Playwright is a development-only dependency. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: { ...process.env, PORT: '8194' }, stdio: ['ignore', 'pipe', 'pipe'] });
let browser;
const errors = [];
const externalRequests = [];
try {
  await Promise.race([once(server.stdout, 'data'), once(server, 'exit').then(() => { throw new Error('Testserver konnte nicht starten.'); })]);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:8194/')) externalRequests.push(request.url()); });
  await page.goto('http://127.0.0.1:8194/');
  assert.equal(await page.title(), 'Asset-Finder · Frontier Lab');
  assert.equal(await page.locator('#asset-results article').count(), 0);
  assert.equal(await page.locator('#result-content').isVisible(), false);
  assert.equal(await page.locator('#horizon').inputValue(), '');
  await page.locator('[type="submit"]').click();
  assert.equal(await page.locator('#result-content').isVisible(), false);

  async function answer({ horizon = '10', capacity = '40', tolerance = '40', reserve = 'yes' } = {}) {
    for (const [id, value] of Object.entries({ horizon, capacity, tolerance, reserve })) await page.locator('#' + id).selectOption(value);
  }
  async function submit() {
    await page.locator('[type="submit"]').click();
    await page.locator('#result-content').waitFor({ state: 'visible' });
  }
  const visibleIds = () => page.locator('#asset-results article').evaluateAll(nodes => nodes.map(node => node.dataset.assetId).sort());
  await answer();
  await page.locator('[name="knowledge"][value="money"]').check();
  await submit();
  assert.deepEqual(await visibleIds(), ['all-world', 'cash-rate', 'euro-short', 'global-bond']);
  await page.locator('[data-asset-id="all-world"] summary').click();
  assert.match(await page.locator('#asset-results [data-asset-id="all-world"]').innerText(), /mindestens 10 Jahre/);
  assert.match(await page.locator('#asset-results').innerText(), /IE00BK5BQT80/);
  assert.equal(await page.locator('#asset-results a[href^="https://"]').count(), 4);

  const downloadEvent = page.waitForEvent('download');
  await page.locator('#export-result').click();
  const download = await downloadEvent;
  const saved = JSON.parse(await readFile(await download.path(), 'utf8'));
  assert.equal(saved.profile.capacity, 40);
  assert.equal(saved.matches.length, 4);
  assert.equal(saved.catalogueCheckedAt, '2026-10-04');

  await page.locator('#capacity').selectOption('5');
  assert.equal(await page.locator('#result-content').isVisible(), false);
  assert.match(await page.locator('#update-status').innerText(), /Antworten geändert/);
  await submit();
  assert.deepEqual(await visibleIds(), ['cash-rate', 'euro-short']);
  await page.locator('#reserve').selectOption('no');
  await submit();
  assert.equal(await page.locator('#asset-results article').count(), 0);
  assert.match(await page.locator('#notices').innerText(), /Rücklage/);
  await page.locator('#excluded-title').click();
  assert.equal(await page.locator('#excluded-results .excluded-item').count(), 7);

  await answer({ capacity: '0' });
  await submit();
  assert.equal(await page.locator('#asset-results article').count(), 0);
  assert.match(await page.locator('#notices').innerText(), /keinen Verlust/);

  await answer({ capacity: '100', tolerance: '100' });
  for (const type of ['stocks', 'gold', 'crypto']) await page.locator('[name="types"][value="' + type + '"]').check();
  await submit();
  assert.equal((await visibleIds()).includes('bitcoin'), false);
  for (const type of ['stocks', 'gold', 'crypto']) await page.locator('[name="knowledge"][value="' + type + '"]').check();
  await submit();
  assert.equal(await page.locator('#asset-results article').count(), 7);
  assert.equal(await page.locator('#excluded').isVisible(), false);
  await page.locator('[name="types"][value="crypto"]').uncheck();
  assert.equal(await page.locator('[name="knowledge"][value="crypto"]').isChecked(), false);
  assert.equal(await page.locator('[name="knowledge"][value="crypto"]').isDisabled(), true);
  await submit();
  assert.equal((await visibleIds()).includes('bitcoin'), false);

  for (const input of await page.locator('[name="types"]:checked').all()) await input.uncheck();
  await page.locator('[type="submit"]').click();
  assert.match(await page.locator('#form-error').innerText(), /mindestens eine Anlageart/);
  assert.equal(await page.locator('#result-content').isVisible(), false);

  await page.locator('#clear-profile').click();
  assert.equal(await page.locator('#horizon').inputValue(), '');
  assert.equal(await page.locator('[name="knowledge"]:checked').count(), 0);
  await answer();
  await page.locator('[name="knowledge"][value="money"]').check();
  await submit();
  await page.locator('#selection-method summary').click();
  assert.equal(await page.locator('#rules-body tr').count(), 7);
  await mkdir(path.join(root, 'test-output'), { recursive: true });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1050 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Horizontal overflow at ' + width);
    await page.screenshot({ path: path.join(root, 'test-output/finder-' + width + '.png'), fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#edit-profile').click();
  assert.equal(await page.locator('#horizon').evaluate(element => document.activeElement === element), true);
  await page.locator('#tolerance').selectOption('20');
  await submit();
  assert.deepEqual(await visibleIds(), ['cash-rate', 'euro-short', 'global-bond']);
  assert.equal(await page.locator('#results-title').evaluate(element => document.activeElement === element), true);
  await page.reload();
  assert.equal(await page.locator('#horizon').inputValue(), '');
  assert.equal(await page.locator('#result-content').isVisible(), false);
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
  await page.getByRole('link', { name: 'Rechenlabor', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#metrics')?.textContent.includes('9,06'));
  await page.getByRole('link', { name: '← Zum Asset-Finder' }).click();
  assert.equal(await page.locator('#horizon').inputValue(), '');
  for (const pathname of ['/package.json', '/.git/config', '/tests/profile.test.js']) {
    assert.equal((await page.request.get('http://127.0.0.1:8194' + pathname)).status(), 404);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(externalRequests, []);
  console.log(JSON.stringify({ finder: 'PASS', widths: [1440, 768, 390, 320], errors, externalRequests }, null, 2));
} finally {
  if (browser) await browser.close();
  server.kill();
}
