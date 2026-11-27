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

test('motto: the vibecat either is or isn\'t, in every language', async ({ page }) => {
  const want = { uk: 'вайбкот або є', en: 'either is or isn', ar: 'قطّ الفايب', zh: '氛围猫', ru: 'вайбкот либо есть' };
  for (const [l, t] of Object.entries(want)) {
    await page.addInitScript(x => localStorage.setItem('lang', x), l);
    await page.goto('/index.html');
    await page.evaluate(x => { localStorage.setItem('lang', x); }, l);
    await page.reload();
    await expect(page.locator('.motto')).toContainText(t);
  }
});

test('Бібліотека: author card opens for 3, pays +1 for reading', async ({ page }) => {
  const errs = watch(page);
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'uk');
    window.VV_AVTORKY = [{ id: 'test-card', name: { uk: 'Тестова Авторка', en: 'Test Author' }, years: '1900–1990',
      place: { uk: 'Київ', en: 'Kyiv' }, work: { uk: '«Тест»', en: 'Test', year: '1950' }, text: { uk: 'Тестовий опис.', en: 'Test text.' },
      emoji: '🖋', src: 'https://uk.wikipedia.org/' }];
  });
  await page.goto('/biblioteka.html');
  await page.evaluate(() => VV_KOTO.earn(5, 'test', true));
  await page.waitForTimeout(300);
  const bal = async () => page.evaluate(() => VV_KOTO.balance());
  const start = await bal();
  await page.getByRole('button', { name: '🃏 Авторки' }).click();
  await expect(page.locator('.card.locked')).toHaveCount(1);
  await page.getByRole('button', { name: 'Відкрити за 3 🐾' }).click();
  await expect(page.locator('.card .tx')).toHaveText('Тестовий опис.');
  expect(await bal()).toBe(start - 3);
  await page.getByRole('button', { name: 'Прочитав ✓ +1 🐾' }).click();
  await expect(page.getByRole('button', { name: 'прочитано ✓' })).toBeVisible();
  expect(await bal()).toBe(start - 2);
  expect(errs).toEqual([]);
});
