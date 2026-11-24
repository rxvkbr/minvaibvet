// Tells the page it runs in the desktop app and on which system, so it can make room for the window buttons.
const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("VV_DESKTOP", process.platform);
