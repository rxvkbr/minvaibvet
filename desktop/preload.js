// Tells the page it runs in the desktop app and on which system, so it can make room for the window buttons.
// Also passes browser shortcuts and "open in new tab" requests from web pages inside the tabs.
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("VV_DESKTOP", process.platform);
contextBridge.exposeInMainWorld("VV_IPC", {
  onOpen: (cb) => ipcRenderer.on("vv-open", (_e, url) => cb(String(url))),
  onKey: (cb) => ipcRenderer.on("vv-key", (_e, k, shift) => cb(String(k), !!shift)),
  external: (url) => ipcRenderer.send("vv-external", String(url)),
  sync: (op, data) => ipcRenderer.invoke("vv-sync", String(op), data == null ? null : String(data)),
});
