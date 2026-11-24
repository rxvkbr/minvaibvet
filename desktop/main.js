// Вайбвет Офіс: a window that looks like a browser and works by itself.
const { app, BrowserWindow, shell, Menu } = require("electron");
// The tabs are real now: web pages open inside <webview> tags, each in a locked-down sandbox.
const path = require("path");

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
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (!isMac) app.quit(); });
