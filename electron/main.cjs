'use strict';
const {
  app, BrowserWindow, ipcMain, shell, nativeTheme, nativeImage, screen, desktopCapturer, systemPreferences, powerSaveBlocker, clipboard, Menu,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const QRCode = require('qrcode');
const { SettingsStore } = require('./core/settings.cjs');
const { Pairing } = require('./core/auth.cjs');
const { RemoteServer } = require('./core/server.cjs');
const { KeySender, keysFor } = require('./core/keys.cjs');
const { listAddresses, pickAddress } = require('./core/network.cjs');
const { Timer } = require('./core/timer.cjs');

const isDev = !!process.env.VITE_DEV_SERVER_URL;
const isTest = !!process.env.SLIMCLICK_TEST;
const isMac = process.platform === 'darwin';
if (process.env.SLIMCLICK_USERDATA) app.setPath('userData', process.env.SLIMCLICK_USERDATA);

const DIST = path.join(__dirname, '..', 'dist');
const HEADER_H = 52;
const THEMES = {
  dark: { bg: '#121316', header: '#121316', symbols: '#e9eaee' },
  light: { bg: '#f5f5f7', header: '#f5f5f7', symbols: '#1c1c1e' },
};

// Einfaches Fehlerprotokoll (bleibt lokal) – hilft bei der Fehlersuche.
function log(...args) {
  try {
    const line = `[${new Date().toISOString()}] ${args.map((a) => (a instanceof Error ? a.stack : typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}\n`;
    fs.appendFileSync(path.join(app.getPath('userData'), 'app.log'), line);
  } catch {
    /* ignorieren */
  }
}
process.on('uncaughtException', (e) => log('uncaughtException', e));
process.on('unhandledRejection', (e) => log('unhandledRejection', e));

// Nur eine SlimClick-Instanz (sonst streiten sich zwei Server um den Port)
if (!isTest && !app.requestSingleInstanceLock()) app.quit();

const settings = new SettingsStore(path.join(app.getPath('userData'), 'settings.json'));
const pairing = new Pairing({
  devices: settings.data.devices,
  onChange: (devices) => {
    settings.data.devices = devices;
    settings.save();
    pushInfo();
  },
});
const keys = new KeySender({ backend: isTest ? 'record' : 'auto' });
keys.on('log', (s) => log('keys', s));
const timer = new Timer(settings.data.timer);

let win = null;
let overlay = null;
let demo = null;
let server = null;
let addresses = [];
let blocker = null;
let lastAction = null;
let previewHash = '';
let previewData = null;
let overlayHideTimer = null;
const pendingApprovals = new Map();

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}
function isDark(theme) {
  return theme === 'dark' || (theme !== 'light' && nativeTheme.shouldUseDarkColors);
}

// ------------------------------------------------------------------ Hauptfenster
function createWindow() {
  const saved = settings.data.window || {};
  const { workAreaSize } = screen.getPrimaryDisplay();
  const colors = THEMES[isDark(settings.data.prefs.theme) ? 'dark' : 'light'];
  win = new BrowserWindow({
    width: Math.min(saved.width || 1120, workAreaSize.width),
    height: Math.min(saved.height || 740, workAreaSize.height),
    x: saved.x,
    y: saved.y,
    minWidth: 860,
    minHeight: 600,
    backgroundColor: colors.bg,
    title: 'SlimClick',
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    ...(isMac
      ? { trafficLightPosition: { x: 18, y: 18 } }
      : { titleBarOverlay: { color: colors.header, symbolColor: colors.symbols, height: HEADER_H } }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  win.once('ready-to-show', () => win.show());
  const remember = () => {
    if (!win || win.isDestroyed() || win.isMaximized() || win.isMinimized()) return;
    settings.data.window = win.getBounds();
    settings.save();
  };
  win.on('resized', remember);
  win.on('moved', remember);
  win.on('closed', () => {
    win = null;
    if (!isMac || isTest) app.quit();
  });
  // Links (z. B. zur Website) im normalen Browser öffnen, nie im App-Fenster
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  load(win, 'index.html');
}

function load(w, page, query) {
  if (isDev) {
    const u = new URL(page, process.env.VITE_DEV_SERVER_URL);
    for (const [k, v] of Object.entries(query || {})) u.searchParams.set(k, v);
    w.loadURL(u.toString());
  } else w.loadFile(path.join(DIST, page), { query });
}

// ------------------------------------------------------------------ Server & QR-Code
function remoteUrl() {
  const a = pickAddress(addresses, settings.data.network.address);
  const host = a ? a.address : '127.0.0.1';
  return { url: `http://${host}:${server ? server.port : 0}/#p=${pairing.code}`, base: `http://${host}:${server ? server.port : 0}`, address: a };
}

async function info() {
  const { url, base, address } = remoteUrl();
  const qr = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } });
  return {
    url,
    base,
    qr,
    address,
    addresses,
    port: server ? server.port : 0,
    clients: server ? server.clients() : [],
    devices: settings.public().devices,
    lastHit: server ? server.lastHit : 0,
  };
}

let pushPending = false;
function pushInfo() {
  if (pushPending) return;
  pushPending = true;
  setTimeout(async () => {
    pushPending = false;
    try {
      send('remote:update', await info());
    } catch (e) {
      log(e);
    }
  }, 30);
}

async function startServer() {
  server = new RemoteServer({
    root: DIST,
    pairing,
    port: Number(process.env.SLIMCLICK_PORT ?? settings.data.network.port) || 0,
    allowAnyIp: false,
    needsApproval: () => settings.data.security.approveNew,
  });
  server.on('code', pushInfo);
  server.on('clients', (list) => {
    pushInfo();
    updateBlocker(list.length > 0);
    if (list.length) schedulePreview([200]);
  });
  server.on('joined', (deviceId) => {
    server.sendTo(deviceId, { t: 'timer', ...timer.snapshot() });
    server.sendTo(deviceId, { t: 'config', laser: settings.data.laser.color, preview: previewEnabled() });
    if (previewData) server.sendTo(deviceId, { t: 'preview', img: previewData });
    else if (!previewEnabled()) server.sendTo(deviceId, { t: 'preview', off: previewOffReason() });
  });
  server.on('approval', (req) => {
    pendingApprovals.set(req.id, req);
    send('approval', req);
    if (win && !win.isDestroyed()) {
      if (win.isMinimized()) win.restore();
      win.flashFrame(true);
    }
  });
  server.on('approval-done', (id) => {
    pendingApprovals.delete(id);
    send('approval-done', id);
  });
  server.on('command', onCommand);
  await server.start();
  log('server on port', server.port);
}

function refreshAddresses() {
  const next = listAddresses();
  if (JSON.stringify(next) !== JSON.stringify(addresses)) {
    addresses = next;
    pushInfo();
  }
}

// ------------------------------------------------------------------ Befehle vom Handy
const NAV = new Set(['next', 'prev', 'first', 'last', 'black', 'white', 'end', 'start', 'goto']);

function onCommand({ c, a, name }) {
  if (NAV.has(c)) {
    const specs = keysFor(c, a, { platform: process.platform, scheme: settings.data.control.scheme });
    if (!specs) return;
    if (isTest) sendToDemo(specs);
    else keys.send(specs);
    hidePointer();
    lastAction = { c, a, name, at: Date.now() };
    send('action', lastAction);
    schedulePreview([380, 1100]);
  } else if (c === 'pointer') {
    pointer(a);
  } else if (c === 'timer') {
    if (a && timer.apply(String(a.op), a.arg)) {
      settings.data.timer = { durationMs: timer.durationMs, mode: timer.mode, warnings: timer.warnings };
      settings.save();
      broadcastTimer();
    }
  } else if (c === 'preview') {
    previewHash = '';
    schedulePreview([0]);
  }
}

function broadcastTimer() {
  const snap = timer.snapshot();
  server?.broadcast({ t: 'timer', ...snap });
  send('timer', snap);
}

/** Laptop während des Vortrags wach halten */
function updateBlocker(on) {
  const want = on && settings.data.control.keepAwake;
  if (want && blocker === null) blocker = powerSaveBlocker.start('prevent-display-sleep');
  if (!want && blocker !== null) {
    powerSaveBlocker.stop(blocker);
    blocker = null;
  }
}

// ------------------------------------------------------------------ Laserpointer / Spotlight
function targetDisplay() {
  const all = screen.getAllDisplays();
  const want = settings.data.laser.display;
  if (want && want !== 'auto') {
    const hit = all.find((d) => String(d.id) === String(want));
    if (hit) return hit;
  }
  // Automatisch: Beamer/zweiter Bildschirm, sonst der eingebaute
  const primary = screen.getPrimaryDisplay();
  return all.find((d) => d.id !== primary.id) || primary;
}

function ensureOverlay() {
  const d = targetDisplay();
  if (overlay && !overlay.isDestroyed()) {
    const b = overlay.getBounds();
    if (b.x !== d.bounds.x || b.y !== d.bounds.y || b.width !== d.bounds.width || b.height !== d.bounds.height) overlay.setBounds(d.bounds);
    return overlay;
  }
  overlay = new BrowserWindow({
    ...d.bounds,
    transparent: true,
    frame: false,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    fullscreenable: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true },
  });
  overlay.setIgnoreMouseEvents(true);
  overlay.setAlwaysOnTop(true, 'screen-saver');
  if (isMac) overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlay.on('closed', () => (overlay = null));
  load(overlay, 'overlay.html');
  return overlay;
}

let overlayState = { x: 0.5, y: 0.5, visible: false, mode: 'laser' };
function pointer(a) {
  if (!a || typeof a !== 'object') return;
  const x = Math.min(1, Math.max(0, Number(a.x)));
  const y = Math.min(1, Math.max(0, Number(a.y)));
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const mode = a.mode === 'spot' ? 'spot' : 'laser';
  const o = ensureOverlay();
  overlayState = { x, y, visible: !!a.down, mode, color: settings.data.laser.color, size: settings.data.laser.size };
  o.webContents.send('overlay:state', overlayState);
  clearTimeout(overlayHideTimer);
  if (a.down) {
    if (!o.isVisible()) o.showInactive();
  } else {
    overlayHideTimer = setTimeout(() => o.isDestroyed() || o.hide(), 700);
  }
}
function hidePointer() {
  if (overlay && !overlay.isDestroyed() && overlay.isVisible()) {
    overlayState = { ...overlayState, visible: false };
    overlay.webContents.send('overlay:state', overlayState);
    overlay.hide();
  }
}

// ------------------------------------------------------------------ Folienvorschau
function previewOffReason() {
  if (!settings.data.control.preview) return 'disabled';
  if (permissions().screen !== 'granted') return 'permission';
  return null;
}
function previewEnabled() {
  return previewOffReason() === null;
}

/** Bildschirm nach kurzen Pausen abfotografieren (Folienübergänge abwarten). */
function schedulePreview(delays) {
  if (!server || !server.clients().length) return;
  for (const d of delays) setTimeout(capturePreview, d);
}

let capturing = false;
async function capturePreview() {
  if (capturing || !server || !server.clients().length) return;
  const off = previewOffReason();
  if (off) {
    if (previewData !== null || previewHash !== 'off:' + off) {
      previewData = null;
      previewHash = 'off:' + off;
      server.broadcast({ t: 'preview', off });
      send('preview', null);
    }
    return;
  }
  capturing = true;
  try {
    let img;
    if (isTest) {
      // Im Test nur die Testfolien abfotografieren (keine Systemerlaubnis nötig)
      if (!demo || demo.isDestroyed()) return;
      const dbg = demo.webContents.debugger;
      if (!dbg.isAttached()) dbg.attach('1.3');
      const { data } = await dbg.sendCommand('Page.captureScreenshot', { format: 'png' });
      img = nativeImage.createFromBuffer(Buffer.from(data, 'base64')).resize({ width: 960 });
    } else {
      const d = targetDisplay();
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 960, height: 600 } });
      const src = sources.find((s) => String(s.display_id) === String(d.id)) || sources[0];
      if (!src) return;
      img = src.thumbnail;
    }
    if (img.isEmpty()) return;
    const jpg = img.toJPEG(70);
    const hash = crypto.createHash('sha1').update(jpg).digest('hex');
    if (hash === previewHash) return;
    previewHash = hash;
    previewData = 'data:image/jpeg;base64,' + jpg.toString('base64');
    server.broadcast({ t: 'preview', img: previewData });
    send('preview', previewData);
  } catch (e) {
    log('preview', e);
  } finally {
    capturing = false;
  }
}

// ------------------------------------------------------------------ Testfolien
function openDemo() {
  if (demo && !demo.isDestroyed()) {
    demo.show();
    demo.focus();
    return;
  }
  demo = new BrowserWindow({
    width: 960,
    height: 600,
    title: 'SlimClick – Test slides',
    backgroundColor: '#101114',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, backgroundThrottling: false },
  });
  if (isTest) demo.setPosition(420, 40); // im Test nicht vom Handy-Fenster verdecken lassen
  demo.on('closed', () => (demo = null));
  load(demo, 'demo.html', { lang: settings.data.prefs.lang || 'en' });
}

/** Im Test: Tasten direkt an die Testfolien statt an das Betriebssystem. */
const ELECTRON_KEYS = { right: 'Right', left: 'Left', pagedown: 'PageDown', pageup: 'PageUp', home: 'Home', end: 'End', escape: 'Escape', enter: 'Return', b: 'B', w: 'W' };
function sendToDemo(specs) {
  keys.send(specs);
  if (!demo || demo.isDestroyed()) return;
  for (const s of specs) {
    const [k] = s.split(':');
    const keyCode = /^d\d$/.test(k) ? k.slice(1) : ELECTRON_KEYS[k];
    if (!keyCode) continue;
    demo.webContents.sendInputEvent({ type: 'keyDown', keyCode });
    demo.webContents.sendInputEvent({ type: 'keyUp', keyCode });
  }
}

// ------------------------------------------------------------------ Berechtigungen (Mac)
function permissions() {
  if (!isMac) return { accessibility: 'granted', screen: 'granted' };
  return {
    accessibility: isTest || systemPreferences.isTrustedAccessibilityClient(false) ? 'granted' : 'denied',
    screen: isTest ? 'granted' : systemPreferences.getMediaAccessStatus('screen'),
  };
}
async function requestPermission(kind) {
  if (!isMac) return permissions();
  if (kind === 'accessibility') {
    // Zeigt die Systemabfrage "SlimClick möchte diesen Computer steuern"
    if (!systemPreferences.isTrustedAccessibilityClient(true)) {
      shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
    }
  } else if (kind === 'screen') {
    // Ein erster Aufnahme-Versuch trägt SlimClick in die Liste der Systemeinstellungen ein.
    try {
      await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 16, height: 16 } });
    } catch {
      /* egal */
    }
    if (systemPreferences.getMediaAccessStatus('screen') !== 'granted') {
      shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
    }
  }
  return permissions();
}

// ------------------------------------------------------------------ IPC
const handle = (ch, fn) =>
  ipcMain.handle(ch, async (_e, ...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      log('ipc', ch, e);
      throw e;
    }
  });

handle('settings:get', () => settings.public());
handle('settings:set', async (partial) => {
  const before = JSON.stringify(settings.data.network);
  settings.update(partial);
  if (partial && partial.timer) timer.set(partial.timer);
  if (partial && partial.timer) broadcastTimer();
  if (partial && partial.control) {
    updateBlocker(!!server && server.clients().length > 0);
    previewHash = '';
    server?.broadcast({ t: 'config', laser: settings.data.laser.color, preview: previewEnabled() });
    schedulePreview([50]);
  }
  if (partial && partial.laser) server?.broadcast({ t: 'config', laser: settings.data.laser.color, preview: previewEnabled() });
  if (JSON.stringify(settings.data.network) !== before) {
    if (partial.network && partial.network.port !== undefined && server) {
      await server.stop();
      await startServer();
    }
    pushInfo();
  }
  return settings.public();
});
handle('app:info', () => ({
  version: app.getVersion(),
  electron: process.versions.electron,
  platform: process.platform,
  locale: app.getLocale(),
}));
handle('remote:info', () => info());
handle('remote:newCode', () => {
  pairing.rotate();
  pushInfo();
});
handle('remote:disconnect', (id) => server?.disconnect(String(id)));
handle('devices:remove', (id) => {
  server?.disconnect(String(id));
  pairing.remove(String(id));
});
handle('devices:removeAll', () => {
  for (const d of pairing.devices) server?.disconnect(d.id);
  pairing.removeAll();
});
handle('approval:answer', (id, ok) => server?.answerApproval(String(id), !!ok));
handle('approval:pending', () => [...pendingApprovals.values()]);
handle('timer:cmd', (op, arg) => {
  if (timer.apply(String(op), arg)) {
    settings.data.timer = { durationMs: timer.durationMs, mode: timer.mode, warnings: timer.warnings };
    settings.save();
    broadcastTimer();
  }
  return timer.snapshot();
});
handle('timer:get', () => timer.snapshot());
handle('action:last', () => lastAction);
handle('preview:get', () => previewData);
handle('demo:open', () => openDemo());
handle('perm:status', () => permissions());
handle('perm:request', (kind) => requestPermission(kind));
handle('displays', () =>
  screen.getAllDisplays().map((d, i) => ({ id: String(d.id), label: d.label || `Display ${i + 1}`, primary: d.id === screen.getPrimaryDisplay().id, w: d.size.width, h: d.size.height })),
);
handle('shell:openExternal', (url) => {
  if (typeof url === 'string' && /^https:\/\/|^mailto:/.test(url)) shell.openExternal(url);
});
handle('clipboard:write', (text) => clipboard.writeText(String(text)));
handle('win:theme', (theme) => {
  if (!win || win.isDestroyed() || isMac) return;
  const c = THEMES[isDark(theme) ? 'dark' : 'light'];
  win.setBackgroundColor(c.bg);
  try {
    win.setTitleBarOverlay({ color: c.header, symbolColor: c.symbols, height: HEADER_H });
  } catch {
    /* ältere Systeme */
  }
});
handle('app:log', (...a) => log('renderer', ...a));

// Test-Zugriff für den End-to-End-Test
if (isTest) {
  global.__slimclick = {
    url: () => remoteUrl().url.replace(/\/\/[^/:]+:/, '//127.0.0.1:'),
    recorded: () => keys.recorded.slice(),
    overlay: () => ({ ...overlayState, shown: !!(overlay && !overlay.isDestroyed() && overlay.isVisible()) }),
    clients: () => (server ? server.clients() : []),
    code: () => pairing.code,
    timer: () => timer.snapshot(),
  };
}

// ------------------------------------------------------------------ Start
app.whenReady().then(async () => {
  if (isMac && !isTest) Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }]));
  else Menu.setApplicationMenu(null);
  addresses = listAddresses();
  try {
    await startServer();
  } catch (e) {
    log('server start failed', e);
  }
  keys.warmUp();
  createWindow();
  setInterval(refreshAddresses, 4000); // WLAN gewechselt / Hotspot an → QR-Code passt sich an
  setInterval(() => schedulePreview([0]), 3000);
  setInterval(() => server && server.clients().length && broadcastTimer(), 15000);
  screen.on('display-added', () => overlay && ensureOverlay());
  screen.on('display-removed', () => overlay && ensureOverlay());
});

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});
app.on('activate', () => {
  if (!win) createWindow();
});
app.on('window-all-closed', () => {
  if (!isMac || isTest) app.quit();
});
app.on('before-quit', () => {
  keys.stop();
  server?.stop();
});
