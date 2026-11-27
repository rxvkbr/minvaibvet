// App Store screenshots for the EU listing, made on this Mac in WebKit (the Safari engine).
//   node tools/screens/eu.js            → ~/Downloads/AppStore-2026/eu/<lang>/{iphone,ipad}-N.png
// iPhone 6.9" = 1320×2868, iPad 13" = 2064×2752, uk/en/nl/de, captioned and framed.
const { webkit } = require('@playwright/test');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(os.homedir(), 'Downloads/AppStore-2026/eu');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.css': 'text/css', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };

const SHOTS = [
  { page: 'spravy.html', cap: {
    uk: ['Справи з дофаміном', 'Маленькі справи, великі «дзинь»'], en: ['Chores with dopamine', 'Small tasks, big dings'],
    nl: ['Klusjes met dopamine', 'Kleine klusjes, grote ping'], de: ['Aufgaben mit Dopamin', 'Kleine Aufgaben, großes Pling'] } },
  { page: 'polit.html', cap: {
    uk: ['Тестовий політ', 'Дрон летить від дитячого сміху'], en: ['Test Flight', 'A drone powered by kids’ laughter'],
    nl: ['Testvlucht', 'Een drone die vliegt op kinderlach'], de: ['Testflug', 'Eine Drohne, die mit Kinderlachen fliegt'] } },
  { page: 'fotored.html', cap: {
    uk: ['Фоторедакція', 'Сортуй знімки за посмішкою'], en: ['Photo Desk', 'Sort photos by smile and sharpness'],
    nl: ['Fotoredactie', 'Sorteer foto’s op glimlach'], de: ['Fotoredaktion', 'Sortiere Fotos nach Lächeln'] } },
  { page: 'racia.html', cap: {
    uk: ['Рація для своїх', 'Тільки добрі готові фрази'], en: ['A walkie-talkie for friends', 'Only kind, ready-made phrases'],
    nl: ['Portofoon voor vrienden', 'Alleen lieve, kant-en-klare zinnen'], de: ['Funkgerät für Freunde', 'Nur nette, fertige Sätze'] } },
];
const DEVICES = [
  { name: 'iphone', w: 440, h: 956, dpr: 3, outW: 1320, outH: 2868 },
  { name: 'ipad', w: 1032, h: 1376, dpr: 2, outW: 2064, outH: 2752 },
];
const LANGS = ['uk', 'en', 'nl', 'de'];

// a friend in Рація with a status, so the screen isn't empty
const SEED = () => {
  localStorage.setItem('vv-racia-friends', JSON.stringify({ ABCDEF: { cs: [3, 1, 512] }, QWERTY: { cs: [0, 5, 128] } }));
  localStorage.setItem('vv-racia-fst', JSON.stringify({ ABCDEF: { s: 1, t: Date.now() }, QWERTY: { s: 8, t: Date.now() } }));
  localStorage.setItem('vv-racia-st', '12');
  localStorage.setItem('onboarded', '1');
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});

function frame(img, d, title, sub) {
  const big = d.name === 'ipad';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:${d.outW}px;height:${d.outH}px;overflow:hidden}
  body{background:linear-gradient(160deg,#1a0f1f 0%,#3a1630 45%,#0b0b0d 100%);font-family:-apple-system,"SF Pro Display",Helvetica,sans-serif;color:#fff;display:flex;flex-direction:column;align-items:center}
  .cap{text-align:center;padding:${big ? 150 : 190}px 80px 0}
  h1{margin:0;font-size:${big ? 118 : 112}px;font-weight:800;letter-spacing:-2px;line-height:1.05;background:linear-gradient(90deg,#ff5f6d,#ffc371);-webkit-background-clip:text;color:transparent}
  p{margin:${big ? 30 : 34}px 0 0;font-size:${big ? 58 : 60}px;font-weight:600;color:#f1e7ff;line-height:1.2}
  .ua{display:inline-block;width:${big ? 66 : 72}px;height:${big ? 44 : 48}px;border-radius:8px;background:linear-gradient(#0057b7 50%,#ffd700 50%);vertical-align:middle;margin-left:18px}
  .ph{margin-top:${big ? 90 : 120}px;border-radius:${big ? 56 : 110}px;overflow:hidden;border:${big ? 14 : 18}px solid #1c1c22;box-shadow:0 40px 120px #000c;width:${Math.round(d.outW * (big ? 0.80 : 0.84))}px}
  .ph img{display:block;width:100%}
  </style></head><body><div class="cap"><h1>${title}</h1><p>${sub}<span class="ua"></span></p></div><div class="ph"><img src="data:image/png;base64,${img.toString('base64')}"></div></body></html>`;
}

(async () => {
  await new Promise(r => server.listen(8799, r));
  const browser = await webkit.launch();
  let n = 0;
  for (const lang of LANGS) for (const d of DEVICES) {
    fs.mkdirSync(path.join(OUT, lang), { recursive: true });
    const ctx = await browser.newContext({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: d.dpr, isMobile: d.name === 'iphone', hasTouch: true });
    await ctx.addInitScript(([l, seed]) => { localStorage.setItem('lang', l); eval('(' + seed + ')()'); }, [lang, SEED.toString()]);
    const page = await ctx.newPage();
    const comp = await browser.newPage({ viewport: { width: d.outW, height: d.outH }, deviceScaleFactor: 1 });
    for (let i = 0; i < SHOTS.length; i++) {
      const s = SHOTS[i];
      await page.goto(`http://localhost:8799/${s.page}`); await page.waitForTimeout(1500);
      const raw = await page.screenshot();
      const [t, sub] = s.cap[lang];
      await comp.setContent(frame(raw, d, t, sub)); await comp.waitForTimeout(200);
      const file = path.join(OUT, lang, `${d.name}-${i + 1}.png`);
      await comp.screenshot({ path: file }); n++;
      console.log(`✓ ${lang}/${d.name}-${i + 1}.png`);
    }
    await comp.close(); await ctx.close();
  }
  await browser.close(); server.close();
  console.log(`\nГотово: ${n} скриншотів у ${OUT}`);
  try { require('child_process').execSync(`open "${OUT}"`); } catch (e) {}
})();
