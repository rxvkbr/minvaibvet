// Вайбкет Офіс: a window that looks like a browser and works by itself.
const { app, BrowserWindow, shell, Menu, session, ipcMain, net } = require("electron");
// The tabs are real now: web pages open inside <webview> tags, each in a locked-down sandbox.
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const zlib = require("zlib");

// ---- content over the air: the pages (news, books, new tools) update from GitHub without rebuilding the app ----
// The workflow "App content bundle" publishes desk-d<API>-<stamp>-<sha256>.zip on the app-bundle release.
// We download the newest one, check its sha256 against its name, unpack it into userData/content/<stamp>
// and load office.html from the newest copy we have. The built-in www/ is always the fallback.
const DESK_API = 1;
const BUILT = path.join(__dirname, "www");
const contentRoot = () => path.join(app.getPath("userData"), "content");
function stampOf(dir) { try { return Number(JSON.parse(fs.readFileSync(path.join(dir, "bundle.json"), "utf8")).stamp) || 0; } catch (e) { return 0; } }
function wwwDir() {
  let best = BUILT, bs = stampOf(BUILT);
  try {
    for (const d of fs.readdirSync(contentRoot())) {
      const p = path.join(contentRoot(), d), s = stampOf(p);
      if (s > bs && fs.existsSync(path.join(p, "office.html"))) { best = p; bs = s; }
    }
  } catch (e) {}
  return best;
}
// a small, strict unzip (stored and deflated entries only, no paths outside the target)
function unzip(buf, dir) {
  let e = buf.length - 22;
  while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error("not a zip");
  const n = buf.readUInt16LE(e + 10);
  let p = buf.readUInt32LE(e + 16);
  const root = path.resolve(dir);
  for (let i = 0; i < n; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("broken zip");
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20);
    const nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nl);
    p += 46 + nl + xl + cl;
    const out = path.resolve(root, name);
    if (out !== root && !out.startsWith(root + path.sep)) throw new Error("unsafe path in zip");
    if (name.endsWith("/")) { fs.mkdirSync(out, { recursive: true }); continue; }
    const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
    const data = buf.subarray(start, start + csize);
    let body;
    if (method === 0) body = data; else if (method === 8) body = zlib.inflateRawSync(data); else throw new Error("zip method " + method);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, body);
  }
}
let updating = false;
async function checkContent(win) {
  if (updating) return; updating = true;
  try {
    const r = await net.fetch("https://api.github.com/repos/rxvkbr/minvaibvet/releases/tags/app-bundle", { headers: { Accept: "application/vnd.github+json" } });
    if (!r.ok) return;
    const rel = await r.json();
    const re = new RegExp("^desk-d" + DESK_API + "-(\\d{10})-([0-9a-f]{64})\\.zip$");
    const top = (rel.assets || []).map((a) => ({ a, m: re.exec(a.name || "") })).filter((x) => x.m).sort((x, y) => Number(y.m[1]) - Number(x.m[1]))[0];
    const cur = stampOf(wwwDir());
    if (!top || Number(top.m[1]) <= cur || top.a.size > 100 * 1024 * 1024) return;
    const z = await net.fetch(top.a.browser_download_url);
    if (!z.ok) return;
    const buf = Buffer.from(await z.arrayBuffer());
    if (crypto.createHash("sha256").update(buf).digest("hex") !== top.m[2]) return;
    const dest = path.join(contentRoot(), top.m[1]), tmp = dest + ".part";
    fs.rmSync(tmp, { recursive: true, force: true });
    unzip(buf, tmp);
    if (!fs.existsSync(path.join(tmp, "office.html")) || stampOf(tmp) !== Number(top.m[1])) { fs.rmSync(tmp, { recursive: true, force: true }); return; }
    fs.rmSync(dest, { recursive: true, force: true });
    fs.renameSync(tmp, dest);
    // keep the two newest copies
    const all = fs.readdirSync(contentRoot()).filter((d) => /^\d{10}$/.test(d)).sort().reverse();
    for (const old of all.slice(2)) fs.rmSync(path.join(contentRoot(), old), { recursive: true, force: true });
    if (win && !win.isDestroyed()) win.webContents.send("vv-update", Number(top.m[1]));
  } catch (e) {
    console.warn("content update:", e && e.message);
  } finally { updating = false; }
}

const isMac = process.platform === "darwin";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: "#0d0f0a",
    title: "Вайбкет Офіс",
    titleBarStyle: "hidden",
    ...(isMac
      ? { trafficLightPosition: { x: 14, y: 15 } }
      : { titleBarOverlay: { color: "#171a12", symbolColor: "#d8d2b4", height: 42 } }),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      webviewTag: true,
    },
  });
  win.loadFile(path.join(wwwDir(), "office.html"));
  setTimeout(() => checkContent(win), 4000);
  const every = setInterval(() => checkContent(win), 2 * 60 * 60 * 1000);
  win.on("closed", () => clearInterval(every));
  // links that leave the app (Monobank jar, Play, TestFlight) open in the real browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  // a web page inside a tab never gets node, preloads or anything but http(s)
  win.webContents.on("will-attach-webview", (e, prefs, params) => {
    delete prefs.preload;
    prefs.nodeIntegration = false;
    prefs.contextIsolation = true;
    prefs.sandbox = true;
    if (!/^https?:/.test(params.src || "")) e.preventDefault();
  });
  win.webContents.on("before-input-event", (e, input) => tabKeys(win, e, input));
  win.webContents.on("will-navigate", (e, url) => {
    if (/^https?:/.test(url)) { e.preventDefault(); shell.openExternal(url); }
  });
}

// browser shortcuts work even while a web page in a tab has focus
function tabKeys(win, e, input) {
  if (input.type !== "keyDown" || !(input.control || input.meta) || input.alt) return;
  const code = (input.code || "").replace(/^Key|^Digit/, "").toLowerCase();
  const k = input.key === "Tab" ? "tab" : code;
  if (!/^(t|w|l|tab|[1-9])$/.test(k)) return;
  e.preventDefault();
  if (!win.isDestroyed()) win.webContents.send("vv-key", k, !!input.shift);
}

app.on("web-contents-created", (_e, wc) => {
  if (wc.getType() !== "webview") return;
  wc.on("before-input-event", (e, input) => {
    const host = wc.hostWebContents && BrowserWindow.fromWebContents(wc.hostWebContents);
    if (host) tabKeys(host, e, input);
  });
  // target=_blank and window.open become new tabs, not new windows
  wc.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url) && wc.hostWebContents) wc.hostWebContents.send("vv-open", url);
    return { action: "deny" };
  });
});

if (isMac) {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: "appMenu" }, { role: "editMenu" }, { role: "viewMenu" }, { role: "windowMenu" },
  ]));
} else {
  Menu.setApplicationMenu(null);
}

app.whenReady().then(() => {
  // Web tabs present themselves as plain Chrome. With "Electron" in the user agent, Google and others
  // refuse to sign in ("this browser may not be secure").
  const web = session.fromPartition("persist:vvweb");
  web.setUserAgent(web.getUserAgent().replace(/\(KHTML, like Gecko\)\s+.*?(?=Chrome\/)/, "(KHTML, like Gecko) ").replace(/\s*Electron\/\S+/, ""));
  // "Open in your browser" for things a tab can't do (passkeys, some sign-ins)
  // Стіл sync: an encrypted file in the listener's iCloud Drive (Mac, or iCloud for Windows). Ciphertext only.
  const syncFile = () => {
    const roots = [path.join(os.homedir(), "Library", "Mobile Documents", "com~apple~CloudDocs"), path.join(os.homedir(), "iCloudDrive")];
    const root = roots.find((r) => { try { return fs.statSync(r).isDirectory(); } catch (e) { return false; } });
    return root ? path.join(root, "Вайбвет", "stil.vvsync") : null;
  };
  ipcMain.handle("vv-sync", async (_e, op, data) => {
    const f = syncFile();
    if (op === "where") return f;
    if (!f) throw new Error("iCloud Drive не знайдено на цьому комп'ютері");
    if (op === "read") { try { return fs.readFileSync(f, "utf8"); } catch (e) { return null; } }
    if (op === "write") {
      if (typeof data !== "string" || data.length > 50 * 1024 * 1024 || !data.startsWith('{"app":"vaibvet-stil-sync"')) throw new Error("not a sync file");
      fs.mkdirSync(path.dirname(f), { recursive: true });
      const tmp = f + ".tmp"; fs.writeFileSync(tmp, data, "utf8"); fs.renameSync(tmp, f); return true;
    }
    throw new Error("unknown op");
  });
  ipcMain.on("vv-reload-content", (e) => {
    const w = BrowserWindow.fromWebContents(e.sender);
    if (w) w.loadFile(path.join(wwwDir(), "office.html"));
  });
  ipcMain.on("vv-external", (_e, url) => { if (/^https?:\/\//.test(String(url))) shell.openExternal(String(url)); });
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (!isMac) app.quit(); });
