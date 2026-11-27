// «до Андрійка»: the page opens, retrieval stays on device, and with no
// model address the continuation is a local word-chain (no network call).
const { test, expect } = require('@playwright/test');

function watch(page) { const errs = []; page.on('pageerror', e => errs.push(String(e))); return errs; }

test('до Андрійка opens, finds a passage, continues offline', async ({ page }) => {
  const errs = watch(page);
  const left = [];
  page.on('request', req => {
    const u = req.url();
    if (u.startsWith('http://localhost') || u.startsWith('data:')) return;
    if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return;
    left.push(u);
  });
  await page.goto('/andriyko.html');
  await expect(page.locator('h1')).toHaveText('до Андрійка');
  const cfg = await page.evaluate(() => ({
    endpoint: ANDRIYKO_CONFIG.endpoint,
    key: ANDRIYKO_CONFIG.key,
    ready: ANDRIYKO.ready,
    noisy: ANDRIYKO_CORPUS.docs.some(d => d.id === 'ehy5qUozzyA' || d.id === 'ez1rZ94Q40U')
  }));
  expect(cfg.endpoint).toBe('');
  expect(cfg.key).toBe('');
  expect(cfg.ready).toBe(true);
  expect(cfg.noisy).toBe(false);

  const top = await page.evaluate(() => ANDRIYKO.retrieve('Дельта. Це прогалина між словом і ділом.', 3));
  expect(top[0].id).toBe('0dVUouq2aqs');
  expect(top[0].text).toMatch(/прогалин/);

  await page.locator('#seed').fill('Дельта. Це прогалина між словом і ділом.');
  await expect(page.locator('#reg')).toContainText('лекц');
  await page.locator('#go').click();
  await expect(page.locator('#paper')).toBeVisible();
  await expect(page.locator('#said .his')).not.toBeEmpty();
  const his = await page.locator('#said .his').innerText();
  expect(his).toMatch(/[а-яіїєґ]/i);
  expect(his.length).toBeGreaterThan(40);
  await expect(page.locator('#src')).toContainText('пристро');
  await page.locator('#langs button[lang="en"]').click();
  await expect(page.locator('#src')).toContainText(/device/i);
  expect(left).toEqual([]);
  expect(errs).toEqual([]);
});

test('до Андрійка speaks uk, en, nl and ru', async ({ page }) => {
  const errs = watch(page);
  await page.goto('/andriyko.html');
  const want = { uk: 'до Андрійка', en: 'to Andriyko', nl: 'naar Andriyko', ru: 'к Андрейку' };
  for (const [l, title] of Object.entries(want)) {
    await page.locator(`#langs button[lang="${l}"]`).click();
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('html')).toHaveAttribute('lang', l);
  }
  expect(errs).toEqual([]);
});

test('the station links to до Андрійка', async ({ page }) => {
  await page.goto('/index.html');
  const n = await page.locator('a[href="andriyko.html"], [data-go="andriyko"]').count();
  expect(n).toBeGreaterThan(0);
});
