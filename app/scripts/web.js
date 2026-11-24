// Builds www/ for the app from the site:
// - adds Capacitor's plugin runtime, which the page needs to reach native plugins;
// - swaps Google Fonts for bundled copies, so the app makes no network requests for fonts;
// - copies the privacy policy, which the page links to.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const site = path.join(root, "..");
const www = path.join(root, "www");
const fontsOut = path.join(www, "fonts");
fs.mkdirSync(fontsOut, { recursive: true });

fs.copyFileSync(path.join(root, "node_modules/@capacitor/core/dist/capacitor.js"), path.join(www, "capacitor.js"));
fs.copyFileSync(path.join(site, "privacy.html"), path.join(www, "privacy.html"));
fs.copyFileSync(path.join(site, "office.html"), path.join(www, "office.html"));
fs.copyFileSync(path.join(site, "sova.html"), path.join(www, "sova.html"));
fs.cpSync(path.join(site, "vendor"), path.join(www, "vendor"), { recursive: true });
// extra pages: bundled fonts instead of Google Fonts, so the app makes no font requests
for (const f of fs.readdirSync(site)) if (/^(kolonka-.*|kurs|mriya|merch|vidnovlennia|finansy|stil|prosvita-.*)\.html$/.test(f)) {
  let page = fs.readFileSync(path.join(site, f), "utf8");
  page = page.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*<link href="https:\/\/fonts\.googleapis\.com\/css2[^"]*" rel="stylesheet">/, '<link rel="stylesheet" href="fonts.css">');
  fs.writeFileSync(path.join(www, f), page);
}
fs.cpSync(path.join(site, "img"), path.join(www, "img"), { recursive: true });

// family package -> stylesheets for the weights the page uses
const FONTS = {
  "lobster": ["400.css"],
  "yeseva-one": ["400.css"],
  "pt-mono": ["400.css"],
  "pt-serif": ["400.css", "400-italic.css", "700.css"],
  "unbounded": ["500.css", "800.css"],
};
let css = "";
for (const [pkg, sheets] of Object.entries(FONTS)) {
  const dir = path.join(root, "node_modules/@fontsource", pkg);
  for (const sheet of sheets) {
    let text = fs.readFileSync(path.join(dir, sheet), "utf8");
    // keep Cyrillic and Latin faces only; others are unused here
    text = text.replace(/\/\*[^*]*\*\/\s*@font-face\s*\{[^}]*\}/g, (block) =>
      /(cyrillic|latin)-(?!ext)|cyrillic-ext|latin-ext/.test(block) ? block : "");
    text = text.replace(/url\(\.\/files\/([^)]+)\)/g, (m, file) => {
      if (file.endsWith(".woff2")) fs.copyFileSync(path.join(dir, "files", file), path.join(fontsOut, file));
      return `url(./fonts/${file})`;
    });
    text = text.replace(/,\s*url\(\.\/fonts\/[^)]+\.woff\)\s*format\('woff'\)/g, "");
    css += text + "\n";
  }
}
fs.writeFileSync(path.join(www, "fonts.css"), css);

let html = fs.readFileSync(path.join(site, "index.html"), "utf8");
const marker = '<script type="application/json" id="i18n">';
const remote = /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*<link href="https:\/\/fonts\.googleapis\.com\/css2[^"]*" rel="stylesheet">/;
if (html.split(marker).length !== 2) throw new Error("index.html: expected one translations block");
if (!remote.test(html)) throw new Error("index.html: Google Fonts links not found where expected");
// every bundle carries its build stamp; the app swaps in a newer one from GitHub without a store update.
// NATIVE_API goes up only when the native shell changes in a way old bundles can't handle.
const NATIVE_API = 1;
const d = new Date();
const p2 = (n) => String(n).padStart(2, "0");
const STAMP = process.env.BUNDLE_STAMP || `${String(d.getUTCFullYear()).slice(2)}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}`;
fs.writeFileSync(path.join(www, "bundle.json"), JSON.stringify({ stamp: Number(STAMP), nativeApi: NATIVE_API }));
html = html.replace(remote, `<link rel="stylesheet" href="fonts.css">\n<script>window.NO_REMOTE_FONTS=true;window.VV_APP=true;window.VV_BUNDLE=${Number(STAMP)};window.VV_NATIVE_API=${NATIVE_API};</script>`);
html = html.replace(marker, '<script src="capacitor.js"></script>\n' + marker);
fs.writeFileSync(path.join(www, "index.html"), html);
console.log("www/ ready:", fs.readdirSync(fontsOut).length, "font files bundled");
