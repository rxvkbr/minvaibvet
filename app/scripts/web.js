// Copies the site into www/ for the app and adds Capacitor's plugin runtime,
// which the page needs to reach native plugins (notifications, haptics).
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const www = path.join(root, "www");
fs.mkdirSync(www, { recursive: true });

fs.copyFileSync(
  path.join(root, "node_modules/@capacitor/core/dist/capacitor.js"),
  path.join(www, "capacitor.js")
);

const marker = '<script type="application/json" id="i18n">';
let html = fs.readFileSync(path.join(root, "..", "index.html"), "utf8");
if (html.split(marker).length !== 2) {
  throw new Error("index.html: expected exactly one translations block to anchor the runtime script");
}
html = html.replace(marker, '<script src="capacitor.js"></script>\n' + marker);
fs.writeFileSync(path.join(www, "index.html"), html);
console.log("www/ ready: index.html + capacitor.js");
