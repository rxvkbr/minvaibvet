// Copies the site pages the desktop app needs into www/.
const fs = require("fs");
const path = require("path");
const site = path.join(__dirname, "..", "..");
const www = path.join(__dirname, "..", "www");
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
for (const f of ["office.html", "stil.html", "sova.html", "index.html", "privacy.html"]) {
  fs.copyFileSync(path.join(site, f), path.join(www, f));
}
fs.cpSync(path.join(site, "img"), path.join(www, "img"), { recursive: true });
fs.cpSync(path.join(site, "vendor"), path.join(www, "vendor"), { recursive: true });
console.log("www ready:", fs.readdirSync(www).join(", "));
