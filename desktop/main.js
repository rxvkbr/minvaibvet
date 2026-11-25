// Вайбвет Офіс: a window that looks like a browser and works by itself.
const { app, BrowserWindow, shell, Menu, session, ipcMain } = require("electron");
// The tabs are real now: web pages open inside <webview> tags, each in a locked-down sandbox.
const path = require("path");
const fs = require("fs");
const os = require("os");

const isMac = process.platform === "darwin";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: "#0d0f0a",
    title: "Вайбвет Офіс",
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
  win.loadFile(path.join(__dirname, "www", "office.html"));
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
  ipcMain.on("vv-external", (_e, url) => { if (/^https?:\/\//.test(String(url))) shell.openExternal(String(url)); });
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (!isMac) app.quit(); });
