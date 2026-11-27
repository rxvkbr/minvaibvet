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
  const testCard = page.locator('.card', { hasText: 'Тестова Авторка' });
  await expect(testCard).toHaveClass(/locked/);
  await expect(testCard.getByRole('button', { name: '🎁 Подарувати другові' })).toHaveCount(0);
  await testCard.getByRole('button', { name: 'Відкрити за 3 🐾' }).click();
  await expect(testCard.locator('.tx')).toHaveText('Тестовий опис.');
  await expect(testCard.getByRole('button', { name: '🎁 Подарувати другові' })).toBeVisible();
  expect(await bal()).toBe(start - 3);
  await testCard.getByRole('button', { name: 'Прочитав ✓ +1 🐾' }).click();
  await expect(testCard.getByRole('button', { name: 'прочитано ✓' })).toBeVisible();
  expect(await bal()).toBe(start - 2);
  expect(errs).toEqual([]);
});

test('Бібліотека: Kalytenko is the first author card, no portrait', async ({ page }) => {
  const errs = watch(page);
  await lang(page, 'uk');
  await page.goto('/biblioteka.html');
  await page.evaluate(() => VV_KOTO.earn(5, 'test', true));
  await page.getByRole('button', { name: '🃏 Авторки' }).click();
  const card = page.locator('.card', { hasText: 'Тетяна (Таня) Калитенко' });
  await expect(card).toHaveCount(1);
  await expect(card).toHaveClass(/locked/);
  await expect(card.locator('img')).toHaveCount(0);
  await expect(card.locator('.em')).toHaveText('❧');
  await expect(card.getByRole('button', { name: '🎁 Подарувати другові' })).toHaveCount(0);
  await card.getByRole('button', { name: 'Відкрити за 3 🐾' }).click();
  await expect(card.locator('.tx')).toContainText('Антеро');
  await expect(card.locator('.wk')).toContainText('2020');
  await expect(card.locator('.y')).toContainText('Київ');
  await expect(card.locator('.y')).toContainText('українська');
  await expect(card.getByRole('link', { name: '🔎 Джерело' })).toHaveAttribute('href', 'https://tempora.com.ua/shop/antero');
  expect(errs).toEqual([]);
});

for (const [l, open] of [['nl', 'Openen voor 3 🐾'], ['ru', 'Открыть за 3 🐾']]) {
  test(`Бібліотека: author cards speak ${l}`, async ({ page }) => {
    await lang(page, l);
    await page.goto('/biblioteka.html');
    await page.getByRole('button', { name: /Auteurs|Авторки/ }).click();
    await expect(page.getByRole('button', { name: open })).toBeVisible();
    await expect(page.locator('.card', { hasText: 'Tetiana (Tania) Kalytenko' })).toBeVisible();
  });
}

test('Котобанк: card picker is absent until you own a card, then ticks', async ({ page }) => {
  const errs = watch(page);
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'uk');
    localStorage.setItem('kotobank-day', new Date().toISOString().slice(0, 10));
    const md = navigator.mediaDevices || {};
    md.getUserMedia = () => Promise.reject(new Error('no-cam'));
    navigator.mediaDevices = md;
  });
  await page.goto('/kotobank.html');
  await page.getByRole('button', { name: '📤 Надіслати' }).click();
  await expect(page.locator('#pk')).toHaveCount(0);
  await page.evaluate(() => {
    VV_CARDS.grant('kalytenko');
    const orig = window.VV_TAPTIC;
    window.__h = [];
    function w(k) { window.__h.push(k); return orig(k); }
    w.on = orig.on; w.set = orig.set;
    window.VV_TAPTIC = w;
    window.__sent = [];
    VV_KOTOPAY.send = (to, a, card) => { window.__sent.push({ to, a, card: card || null }); return Promise.resolve({ ok: true, id: 't' }); };
  });
  await page.getByRole('button', { name: '📤 Надіслати' }).click();
  await expect(page.locator('#pk option')).toHaveCount(2);
  await page.locator('#pc').fill('BBBBBB');
  await page.locator('#pa').fill('4');
  await page.locator('#ps').click();
  await expect(page.locator('#toast')).toContainText('Надіслано 4');
  await page.getByRole('button', { name: '📤 Надіслати' }).click();
  await page.locator('#pc').fill('BBBBBB');
  await page.locator('#pa').fill('4');
  await page.locator('#pk').selectOption('kalytenko');
  await page.locator('#ps').click();
  const sent = await page.evaluate(() => window.__sent);
  expect(sent).toEqual([{ to: 'BBBBBB', a: 4, card: null }, { to: 'BBBBBB', a: 4, card: 'kalytenko' }]);
  const haptic = await page.evaluate(() => window.__h);
  expect(haptic).toContain('tick');
  expect(haptic).toContain('success');
  await expect(page.locator('#toast')).toContainText('Калитенко');
  expect(errs).toEqual([]);
});

const MQTT_STUB = `
window.__pub = [];
window.mqtt = { connect: function () {
  var c = { connected: true, subscribe: function () {}, publish: function (t, p) { window.__pub.push({ t: t, p: String(p) }); },
    on: function (ev, fn) { if (ev === "message") window.__onMsg = fn; }, once: function (ev, fn) { this.on(ev, fn); } };
  return c;
}};
`;

test('two phones: bucks and the card arrive together; unowned is refused; a duplicate is not copied', async ({ browser }) => {
  const day = new Date().toISOString().slice(0, 10);
  async function phone() {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.addInitScript(d => localStorage.setItem('kotobank-day', d), day);
    await page.route('**/mqtt-5.16.1.min.js', route => route.fulfill({ contentType: 'application/javascript', body: MQTT_STUB }));
    await page.goto('/kotobank.html');
    await page.waitForFunction(() => window.__onMsg && window.VV_CARDS && window.VV_KOTOPAY);
    return { ctx, page };
  }
  const A = await phone();
  const B = await phone();
  try {
    const prep = await A.page.evaluate(async () => {
      await VV_KOTO.earn(40, 'test', true);
      const me = VV_KOTOPAY.me();
      const stranger = await VV_KOTOPAY.send(me === 'AAAAAA' ? 'BBBBBB' : 'AAAAAA', 5, 'kalytenko');
      return { bal: VV_KOTO.balance(), stranger, owns: VV_CARDS.owns('kalytenko') };
    });
    expect(prep.stranger).toEqual({ ok: false, why: 'card' });
    expect(prep.owns).toBe(false);
    expect(prep.bal).toBe(40);

    const codes = await Promise.all([A.page.evaluate(() => VV_KOTOPAY.me()), B.page.evaluate(() => VV_KOTOPAY.me())]);
    expect(codes[0]).not.toBe(codes[1]);
    await A.page.evaluate(() => VV_CARDS.grant('kalytenko'));

    async function pubs() { return A.page.evaluate(() => window.__pub.filter(x => x.p.startsWith('{'))); }
    const beforePlain = (await pubs()).length;
    const plain = await A.page.evaluate(to => VV_KOTOPAY.send(to, 5), codes[1]);
    expect(plain.ok).toBe(true);
    const plainMsg = (await pubs()).slice(beforePlain).map(x => JSON.parse(x.p)).find(m => m.a === 5);
    expect(plainMsg.c).toBeUndefined();
    expect(await A.page.evaluate(() => VV_KOTO.balance())).toBe(35);

    await B.page.evaluate(() => {
      const orig = window.VV_TAPTIC;
      window.__h = [];
      function w(k) { window.__h.push(k); return orig(k); }
      w.on = orig.on; w.set = orig.set;
      window.VV_TAPTIC = w;
    });
    await B.page.evaluate(p => window.__onMsg('vaibvet/koto/v1/' + VV_KOTOPAY.me() + '/' + p.id, JSON.stringify(p)), plainMsg);
    await B.page.waitForFunction(() => VV_KOTO.balance() === 5);
    expect(await B.page.evaluate(() => VV_CARDS.owns('kalytenko'))).toBe(false);
    await expect(B.page.locator('#toast')).toContainText('+5');
    await expect(B.page.locator('#toast')).not.toContainText('Калитенко');

    const beforeCard = (await pubs()).length;
    const withCard = await A.page.evaluate(to => VV_KOTOPAY.send(to, 6, 'kalytenko'), codes[1]);
    expect(withCard.ok).toBe(true);
    expect(await A.page.evaluate(() => VV_CARDS.owns('kalytenko'))).toBe(true);
    expect(await A.page.evaluate(() => VV_KOTO.balance())).toBe(29);
    const cardMsg = (await pubs()).slice(beforeCard).map(x => JSON.parse(x.p)).find(m => m.c === 'kalytenko');
    expect(cardMsg.a).toBe(6);
    expect(JSON.stringify(cardMsg).length).toBeLessThan(200);
    await B.page.evaluate(p => window.__onMsg('vaibvet/koto/v1/' + VV_KOTOPAY.me() + '/' + p.id, JSON.stringify(p)), cardMsg);
    await B.page.waitForFunction(() => VV_KOTO.balance() === 11);
    expect(await B.page.evaluate(() => VV_CARDS.owned().map(c => c.id))).toEqual(['kalytenko']);
    await expect(B.page.locator('#toast')).toContainText('Калитенко');
    expect(await B.page.evaluate(() => window.__h)).toContain('success');

    const beforeDup = (await pubs()).length;
    const dupSend = await A.page.evaluate(to => VV_KOTOPAY.send(to, 2, 'kalytenko'), codes[1]);
    expect(dupSend.ok).toBe(true);
    expect(await A.page.evaluate(() => VV_KOTO.balance())).toBe(27);
    const dupMsg = (await pubs()).slice(beforeDup).map(x => JSON.parse(x.p)).find(m => m.a === 2 && m.c === 'kalytenko');
    await B.page.evaluate(p => window.__onMsg('vaibvet/koto/v1/' + VV_KOTOPAY.me() + '/' + p.id, JSON.stringify(p)), dupMsg);
    await B.page.waitForFunction(() => VV_KOTO.balance() === 13);
    expect(await B.page.evaluate(() => VV_CARDS.owned().filter(c => c.id === 'kalytenko').length)).toBe(1);
    await expect(B.page.locator('#toast')).toContainText('уже в колекції');
    expect(await B.page.evaluate(() => window.__h)).toContain('warning');

    await B.page.goto('/biblioteka.html');
    await B.page.getByRole('button', { name: '🃏 Авторки' }).click();
    const got = B.page.locator('.card', { hasText: 'Тетяна (Таня) Калитенко' });
    await expect(got).not.toHaveClass(/locked/);
    await expect(got.locator('.tx')).toContainText('Фінляндію');
    await expect(got.locator('img')).toHaveCount(0);
  } finally {
    await A.ctx.close();
    await B.ctx.close();
  }
});
