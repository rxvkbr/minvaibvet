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

test('Стіл: a photo note renders, iMessage and share buttons are there', async ({ page }) => {
  const errs = watch(page);
  await page.goto('/stil.html');
  const id = 'abcd1234';
  await page.evaluate(id => {
    const c = document.createElement('canvas'); c.width = 8; c.height = 8; c.getContext('2d').fillRect(0, 0, 8, 8);
    localStorage.setItem('vvs-nimg-' + id, c.toDataURL('image/jpeg', .7));
    const a = JSON.parse(localStorage.getItem('vvs-notes') || '[]');
    a.unshift({ id: 'n1', t: 'Фото-нотатка', b: 'Текст\n![фото](img:' + id + ')', tag: '', ts: Date.now() });
    localStorage.setItem('vvs-notes', JSON.stringify(a));
    // skip the first-run mode picker: on a phone its modal covers the bottom nav
    localStorage.setItem('vvs-cfg', JSON.stringify({ mode: 'office', widgets: [], m1: 1 }));
  }, id);
  await page.reload();
  await page.getByRole('navigation', { name: 'Програми' }).getByRole('button', { name: '📝 Нотатки' }).click();
  await page.getByText('Фото-нотатка').first().click();
  await page.getByRole('button', { name: '👁 Перегляд' }).click();
  await expect(page.locator('.prev img.nimg')).toBeVisible();
  await expect(page.getByRole('button', { name: '💬 iMessage' })).toBeVisible();
  await expect(page.getByRole('button', { name: '📷 Фото' })).toBeVisible();
  expect(errs).toEqual([]);
});

test('Сцени Променя: locked without Pro, order form with Pro', async ({ page }) => {
  const errs = watch(page);
  await page.goto('/sceny.html');
  await expect(page.locator('#gate')).toBeVisible();
  await expect(page.locator('#order')).toBeHidden();
  await page.evaluate(() => localStorage.setItem('polit-vet', '1'));
  await page.reload();
  await expect(page.locator('#order')).toBeVisible();
  await expect(page.locator('#oSend')).toHaveAttribute('href', /labels=scene/);
  // the published renders are in the gallery, the sock one first
  await expect(page.locator('img[src="img/sceny/shkarpetky.jpg"]')).toBeVisible();
  expect(await page.locator('img[src^="img/sceny/"]').count()).toBeGreaterThanOrEqual(3);
  expect(errs).toEqual([]);
});

test('Кімната тваринок: the sock is a pet too', async ({ page }) => {
  const errs = watch(page);
  await page.goto('/index.html');
  await page.locator('[data-tab="pet"]').first().click();
  const b = page.locator('.pick button[data-a="sock"]');
  await b.click();
  await expect(page.locator('#petstage')).toHaveAttribute('data-a', 'sock');
  await expect(page.locator('#petstage .an-sock')).toBeVisible();
  await expect(page.locator('#petstage .an-duck')).toBeHidden();
  // ironing: stroke the sock and the creases fade
  const box = await page.locator('#petstage').boundingBox();
  await page.mouse.move(box.x + 60, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 0; i < 40; i++) await page.mouse.move(box.x + 60 + (i % 2) * 180, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  expect(Number(await page.locator('#sockZm').evaluate(e => e.style.opacity || '1'))).toBeLessThan(1);
  expect(errs).toEqual([]);
});

test('Безкінечний діджей: three engines play and the auto-DJ starts a transition', async ({ page }) => {
  const errs = watch(page);
  await page.goto('/dj.html');
  await page.locator('#sB').selectOption('perehavorka');
  await page.locator('#play').click();
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => VV_DJ.state().running)).toBe(true);
  await expect(page.locator('#iB')).toContainText(/Хайперпоп|Перехід|Подіум/);
  expect(errs).toEqual([]);
});

test('Рада безпеки вайбу: the session runs, votes come in', async ({ page }) => {
  const errs = watch(page);
  await page.goto('/radbez.html');
  await expect(page.locator('#aT')).not.toBeEmpty();
  await page.waitForTimeout(15000);
  expect(await page.evaluate(() => VV_RADBEZ.state().cur.votes.some(v => v !== null) || VV_RADBEZ.state().meet > 1)).toBe(true);
  expect(errs).toEqual([]);
});

test('Аудіотека: listening for all, studio only with Pro', async ({ page }) => {
  const errs = watch(page);
  await page.goto('/audioteka.html');
  await expect(page.locator('#lib .trk').first()).toBeVisible();
  await expect(page.locator('#studio')).toBeHidden();
  await page.evaluate(() => localStorage.setItem('polit-vet', '1'));
  await page.reload();
  await expect(page.locator('#studio')).toBeVisible();
  await expect(page.locator('#prompter')).toContainText('Реве та стогне Дніпр широкий');
  expect(errs).toEqual([]);
});

test('ШІ-перемовини: the public feed renders', async ({ page }) => {
  const errs = watch(page);
  await page.goto('/shi.html');
  await expect(page.locator('.m').first()).toBeVisible();
  expect(errs).toEqual([]);
});

test('Жіньмінь Жібао 97.7: the station plays on the radio and on the Рація', async ({ page }) => {
  const errs = watch(page);
  await page.goto('/index.html');
  await page.locator('.preset[data-s="akva"]').click();
  await expect(page.locator('#freq')).toContainText('97.7');
  await expect(page.locator('#akvalink a')).toHaveAttribute('href', 'https://dakhabrakha.com.ua/');
  await expect(page.locator('#show')).toContainText('Аква віта');
  await page.goto('/racia.html');
  await page.locator('#fm977').click();
  await expect(page.locator('#fm977')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.VV_FM977.on())).toBe(true);
  await page.waitForTimeout(1500);
  const inf = await page.evaluate(() => window.VV_FM977.info());
  expect(['Вода', 'Бубон', 'Злива']).toContain(inf.section);
  expect(errs).toEqual([]);
});

test('Бактеріофаг: theme, card skin, badge and грамота exist', async ({ page }) => {
  const errs = watch(page);
  await page.goto('/kotobank.html');
  await expect(page.getByText('Картка «Бактеріофаг»')).toBeVisible();
  await expect(page.getByText('Плюшевий фаг T4')).toBeVisible();
  await page.goto('/merch.html');
  await expect(page.getByRole('button', { name: /бактеріофагу T4/ })).toBeVisible();
  await page.goto('/index.html');
  await page.evaluate(() => { document.documentElement.dataset.skin = 'fag'; });
  const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bakelite').trim());
  expect(bg).toBe('#070d1a');
  expect(errs).toEqual([]);
});

test('Рація: «розбуди мене о…» parses the time for the next occurrence', async ({ page }) => {
  const errs = watch(page);
  await page.goto('/racia.html');
  const r = await page.evaluate(() => {
    const at = window.VV_WAKE.nextAt('08:00'), d = new Date(at);
    return { ok: at > Date.now() && at - Date.now() <= 864e5, h: d.getHours(), m: d.getMinutes(), bad: window.VV_WAKE.nextAt('25:99') };
  });
  expect(r).toEqual({ ok: true, h: 8, m: 0, bad: 0 });
  expect(errs).toEqual([]);
});

test('Дрон: 🔦 a gentle grainy torch with comforting words, three levels then off', async ({ page }) => {
  const errs = watch(page);
  await page.goto('/index.html#dron');
  const b = page.locator('#dtorch');
  await expect(b).toBeVisible();
  await b.click();
  await expect(b).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.VV_TORCH.level())).toBe(1);
  await expect(page.locator('#dcap')).toContainText('Ластівка-1 світить тобі', { timeout: 3000 });
  await b.click(); await b.click(); await b.click();
  expect(await page.evaluate(() => window.VV_TORCH.level())).toBe(0);
  await expect(b).toHaveAttribute('aria-pressed', 'false');
  expect(errs).toEqual([]);
});

test('GDPR: no page asks Google Fonts, the policy names the controller and rights', async ({ page }) => {
  const hits = [];
  page.on('request', r => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) hits.push(r.url()); });
  for (const p of ['/index.html', '/racia.html', '/merch.html', '/privacy.html']) { await page.goto(p); await page.waitForLoadState('load'); }
  expect(hits).toEqual([]);
  await expect(page.getByText('Контролер у розумінні')).toBeVisible();
  await expect(page.getByText('Autoriteit Persoonsgegevens').first()).toBeVisible();
});

test('Мої місця: far from saved places in the evening, the torch is offered; nothing leaves the phone', async ({ browser }) => {
  const ctx = await browser.newContext({ geolocation: { latitude: 52.25, longitude: 4.95 }, permissions: ['geolocation'] });
  const page = await ctx.newPage();
  const errs = watch(page);
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.setItem('vv-places', JSON.stringify([[50.45, 30.523]])));
  expect(await page.evaluate(() => Math.round(window.VV_PLACES.km([50.45, 30.523], [52.25, 4.95])))).toBeGreaterThan(1700);
  await page.evaluate(() => window.VV_PLACES.check(true));
  await expect(page.locator('#farask')).toBeVisible();
  await page.locator('#farask button').first().click();
  expect(await page.evaluate(() => window.VV_TORCH.level())).toBe(1);
  await ctx.close();
  expect(errs).toEqual([]);
});
