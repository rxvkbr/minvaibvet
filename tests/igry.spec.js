// Every game page opens without JS errors, in every language it offers.
const { test, expect } = require('@playwright/test');

function watch(page) { const errs = []; page.on('pageerror', e => errs.push(String(e))); return errs; }
async function lang(page, l) { await page.addInitScript(x => localStorage.setItem('lang', x), l); }

const PAGES = ['index', 'racia', 'spravy', 'kotobank', 'korabel', 'polit', 'biblioteka', 'fotored'];
for (const p of PAGES) {
  test(`${p} opens without errors`, async ({ page }) => {
    const errs = watch(page);
    await page.goto(`/${p}.html`);
    await page.waitForTimeout(800);
    expect(errs).toEqual([]);
  });
}

for (const l of ['uk', 'en', 'nl', 'de', 'ar', 'zh', 'ru']) {
  test(`Рація speaks ${l}`, async ({ page }) => {
    const errs = watch(page);
    await lang(page, l);
    await page.goto('/racia.html');
    await expect(page.locator('#myName')).not.toBeEmpty();
    await expect(page.locator('#stSel option')).toHaveCount(13);
    if (l === 'ar') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(errs).toEqual([]);
  });
}

test('Фоторедакція: a perfect player scores everything', async ({ page }) => {
  const errs = watch(page);
  await page.goto('/fotored.html');
  for (let r = 0; r < 10; r++) {
    const want = await page.evaluate(() => VV_FOTORED.state().cur.want);
    for (const i of want) await page.locator('#grid .ph').nth(i).click();
    await expect(page.locator('#res')).toContainText(/Ідеально|Саме це фото/);
    await page.locator('#next').click();
  }
  await expect(page.locator('.end h2')).toHaveText('Номер зверстано!');
  const { score } = await page.evaluate(() => VV_FOTORED.state());
  await expect(page.locator('.end p')).toContainText(`${score} очок із ${score}`);
  expect(errs).toEqual([]);
});

test('Фоторедакція: wrong order is caught and shown', async ({ page }) => {
  await page.goto('/fotored.html');
  const st = await page.evaluate(() => VV_FOTORED.state().cur);
  if (st.type === 'front') test.skip();
  for (const i of [...st.want].reverse()) await page.locator('#grid .ph').nth(i).click();
  await expect(page.locator('#res')).toContainText('на своїх місцях');
  await expect(page.locator('#grid .ph.badp').first()).toBeVisible();
});
