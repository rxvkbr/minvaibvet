// Copies the site pages the desktop app needs into www/.
const fs = require("fs");
const path = require("path");
const site = path.join(__dirname, "..", "..");
const www = path.join(__dirname, "..", "www");
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
// every page of the site, so links from the radio tab (Тиха кімната, Гроші без паніки, колонки) open inside the app too
for (const f of fs.readdirSync(site)) {
  if (/\.(html|ics)$/.test(f)) fs.copyFileSync(path.join(site, f), path.join(www, f));
}
fs.cpSync(path.join(site, "img"), path.join(www, "img"), { recursive: true });
fs.cpSync(path.join(site, "vendor"), path.join(www, "vendor"), { recursive: true });
// build stamp (UTC yymmddhhmm): the app takes a downloaded content copy only if it is newer than this
const d = new Date(), p2 = (n) => String(n).padStart(2, "0");
const STAMP = process.env.BUNDLE_STAMP || `${String(d.getUTCFullYear()).slice(2)}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}`;
fs.writeFileSync(path.join(www, "bundle.json"), JSON.stringify({ stamp: Number(STAMP), deskApi: 1 }));
console.log("www ready:", fs.readdirSync(www).join(", "));
