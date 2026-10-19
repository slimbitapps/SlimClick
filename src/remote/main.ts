/**
 * Handy-Seite: die Fernbedienung. Läuft im normalen Handy-Browser, keine App nötig.
 * Bewusst ohne Framework – lädt in einem Augenblick, auch über langsames WLAN.
 */
import './remote.css';
import NoSleep from 'nosleep.js';
import { hmacHex, pairMsg, keyMsg, authMsg, cmdMsg } from '../shared/hmac';
import { tr, lang } from './strings';

document.documentElement.lang = lang;

// ------------------------------------------------------------------ Speicher (pro Laptop-Adresse)
const store = {
  get(k: string) {
    try {
      return localStorage.getItem('slimclick.' + k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string | null) {
    try {
      if (v === null) localStorage.removeItem('slimclick.' + k);
      else localStorage.setItem('slimclick.' + k, v);
    } catch {
      /* privater Modus: dann eben ohne Speichern */
    }
  },
};

function randomId() {
  const b = new Uint8Array(12);
  crypto.getRandomValues(b);
  return 'p' + Array.from(b, (x) => x.toString(36).padStart(2, '0')).join('').slice(0, 20);
}

const deviceId = store.get('id') || randomId();
store.set('id', deviceId);
let deviceKey = store.get('key');

// Kopplungs-Code aus dem "#"-Teil holen und sofort aus der Adresszeile entfernen
let pairCode: string | null = new URLSearchParams(location.hash.slice(1)).get('p');
if (location.hash) history.replaceState(null, '', location.pathname);

const prefs = {
  haptics: store.get('haptics') !== '0',
  lefty: store.get('lefty') === '1',
};

function deviceName() {
  const ua = navigator.userAgent;
  const os = /iPad/.test(ua) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Handy';
  const br = /EdgA?\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /CriOS|Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : '';
  return br ? `${os} · ${br}` : os;
}

// ------------------------------------------------------------------ Symbole
const I = {
  next: '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  prev: '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  laser: '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="4" fill="currentColor"/><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".45"/></svg>',
  spot: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 3h18v18H3z" fill="currentColor" opacity=".25"/><circle cx="12" cy="12" r="5.5" fill="currentColor"/></svg>',
  black: '<svg viewBox="0 0 24 24" width="22" height="22"><rect x="3" y="5" width="18" height="13" rx="2.5" fill="currentColor"/><path d="M9 21h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  goto: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  more: '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>',
  timer: '<svg viewBox="0 0 24 24" width="17" height="17"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4l2.5 2M9.5 2.5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M20 12H8m4-6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  logo:
    '<svg viewBox="0 0 64 64" width="56" height="56"><defs><linearGradient id="rl-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a5c"/><stop offset="1" stop-color="#ff3d77"/></linearGradient><linearGradient id="rl-ink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb199"/><stop offset="1" stop-color="#ff7fa3"/></linearGradient><radialGradient id="rl-glow"><stop offset="0" stop-color="#ff2d55" stop-opacity="0.45"/><stop offset="1" stop-color="#ff2d55" stop-opacity="0"/></radialGradient></defs><rect width="64" height="64" rx="14.4" fill="url(#rl-bg)"/><rect x="10.3" y="13.4" width="15.6" height="29.4" rx="3.4" fill="#fff" opacity="0.36" transform="rotate(-12 18.1 28.1)"/><rect x="18.75" y="21.6" width="33.75" height="23.1" rx="4.1" fill="#fff"/><rect x="23.1" y="26.9" width="14.4" height="2.4" rx="1.2" fill="url(#rl-ink)"/><rect x="23.1" y="31.1" width="10" height="1.75" rx="0.9" fill="url(#rl-ink)" opacity="0.55"/><circle cx="43.1" cy="37.5" r="6.9" fill="url(#rl-glow)"/><circle cx="43.1" cy="37.5" r="2.9" fill="#ff2d55"/><circle cx="42.25" cy="36.6" r="0.95" fill="#fff" opacity="0.85"/></svg>',
};

// ------------------------------------------------------------------ Oberfläche
const app = document.getElementById('app')!;
app.innerHTML = `
  <div class="remote ${prefs.lefty ? 'lefty' : ''}" id="remote">
    <header class="top">
      <div class="conn"><i class="dot" id="dot"></i><span>SlimClick</span></div>
      <button class="pill" id="timerBtn" aria-label="${tr('timer')}">${I.timer}<span id="timerText">--:--</span></button>
      <button class="icon" id="moreBtn" aria-label="${tr('more')}">${I.more}</button>
    </header>
    <div class="banner" id="banner" hidden></div>
    <div class="preview" id="preview">
      <img id="pimg" alt="" draggable="false" />
      <div class="pmsg" id="pmsg">${tr('previewWait')}</div>
      <div class="pdot" id="pdot"></div>
      <div class="phint" id="phint" hidden>${tr('pointHint')}</div>
    </div>
    <div class="tools">
      <button class="tool" data-tool="laser">${I.laser}<span>${tr('laser')}</span></button>
      <button class="tool" data-tool="spot">${I.spot}<span>${tr('spot')}</span></button>
      <button class="tool" data-act="black">${I.black}<span>${tr('black')}</span></button>
      <button class="tool" id="gotoBtn">${I.goto}<span>${tr('goto')}</span></button>
    </div>
    <div class="nav">
      <button class="prev" data-act="prev" data-testid="prev">${I.prev}<span>${tr('prev')}</span></button>
      <button class="next" data-act="next" data-testid="next"><span>${tr('next')}</span>${I.next}</button>
    </div>
  </div>
  <div class="status" id="status" hidden>
    <div class="status-card">
      <div class="logo">${I.logo}</div>
      <div class="spinner" id="spin"></div>
      <h1 id="stTitle"></h1>
      <p id="stText"></p>
      <button class="btn" id="stBtn" hidden>${tr('retry')}</button>
    </div>
  </div>
  <div class="scrim" id="scrim" hidden></div>
  <div class="sheet" id="sheet" hidden></div>
  <div class="toast" id="toast" hidden></div>
  <div class="flash" id="flash"></div>
`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// ------------------------------------------------------------------ Verbindung
let ws: WebSocket | null = null;
let nonce = '';
let seq = 0;
let authed = false;
let fatal = false;
let retryMs = 400;
let retryTimer = 0;
let everConnected = false;
let failedTries = 0;

function setStatus(kind: 'connecting' | 'approval' | 'scan' | 'error' | null, text?: string, title?: string) {
  const st = $('status');
  if (!kind) {
    st.hidden = true;
    return;
  }
  st.hidden = false;
  $('spin').hidden = !(kind === 'connecting' || kind === 'approval');
  $('stTitle').textContent = title || (kind === 'scan' ? tr('scanTitle') : 'SlimClick');
  $('stText').textContent = text || '';
  $('stBtn').hidden = kind !== 'error';
}

function connect() {
  clearTimeout(retryTimer);
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  if (!pairCode && !deviceKey) {
    setStatus('scan', tr('scanText'));
    return;
  }
  if (!everConnected) setStatus('connecting', tr('connecting'));
  const sock = new WebSocket(`ws://${location.host}/ws`);
  ws = sock;
  authed = false;
  sock.onmessage = (ev) => {
    let m: any;
    try {
      m = JSON.parse(ev.data);
    } catch {
      return;
    }
    onMessage(m);
  };
  sock.onclose = () => {
    if (ws !== sock) return;
    authed = false;
    setConn(false);
    if (fatal) return;
    failedTries++;
    if (everConnected) showBanner(tr('reconnecting'));
    if (!everConnected && failedTries > 3) setStatus('error', tr('unreachable'), 'SlimClick');
    retryTimer = window.setTimeout(connect, retryMs);
    retryMs = Math.min(retryMs * 1.6, 4000);
  };
}

function onMessage(m: any) {
  switch (m.t) {
    case 'hello':
      nonce = m.nonce;
      seq = 0;
      if (pairCode) {
        ws?.send(JSON.stringify({ t: 'pair', id: deviceId, name: deviceName(), mac: hmacHex(pairCode, pairMsg(nonce, deviceId)) }));
        // Den Schlüssel leiten beide Seiten gleich ab – er wird nie gesendet.
        pendingKey = hmacHex(pairCode, keyMsg(nonce, deviceId));
      } else if (deviceKey) {
        ws?.send(JSON.stringify({ t: 'auth', id: deviceId, mac: hmacHex(deviceKey, authMsg(nonce)) }));
      }
      break;
    case 'pending':
      setStatus('approval', tr('waitApproval'));
      break;
    case 'paired':
      deviceKey = pendingKey;
      store.set('key', deviceKey);
      pairCode = null;
      break;
    case 'ok':
      authed = true;
      everConnected = true;
      fatal = false;
      failedTries = 0;
      retryMs = 400;
      setStatus(null);
      hideBanner();
      setConn(true);
      break;
    case 'error':
      onError(m.code);
      break;
    case 'timer':
      onTimer(m);
      break;
    case 'preview':
      onPreview(m);
      break;
    case 'config':
      if (typeof m.laser === 'string' && /^#[0-9a-f]{6}$/i.test(m.laser)) document.documentElement.style.setProperty('--laser', m.laser);
      if (m.preview === false && !$<HTMLImageElement>('pimg').src) onPreview({ off: 'disabled' });
      break;
  }
}
let pendingKey: string | null = null;

function onError(code: string) {
  if (code === 'bad-code' && deviceKey) {
    // Alter QR-Code, aber wir sind schon gekoppelt → normal anmelden
    pairCode = null;
    return;
  }
  if (code === 'bad-code' || code === 'unknown-device' || code === 'bad-auth' || code === 'removed') {
    deviceKey = null;
    store.set('key', null);
    pairCode = null;
    fatal = true;
    setStatus('scan', code === 'removed' ? tr('removed') : code === 'bad-code' ? tr('badCode') : tr('scanText'));
  } else if (code === 'denied') {
    fatal = true;
    pairCode = null;
    setStatus('scan', tr('denied'));
  } else if (code === 'blocked') {
    fatal = true;
    setStatus('error', tr('blocked'));
  }
}

function setConn(on: boolean) {
  $('dot').classList.toggle('on', on);
}

/** Befehl signiert an den Laptop senden */
function send(c: string, a: unknown = null) {
  if (!ws || !authed || ws.readyState !== WebSocket.OPEN) return false;
  seq += 1;
  ws.send(JSON.stringify({ t: 'cmd', s: seq, c, a, m: hmacHex(deviceKey!, cmdMsg(nonce, seq, c, a)) }));
  return true;
}

$('stBtn').onclick = () => {
  fatal = false;
  failedTries = 0;
  retryMs = 400;
  connect();
};
// Handy war gesperrt → beim Entsperren sofort neu verbinden
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !fatal) connect();
});
setInterval(() => authed && send('ping'), 20_000);

// ------------------------------------------------------------------ Hinweise
let bannerTimer = 0;
function showBanner(text: string) {
  const b = $('banner');
  b.textContent = text;
  b.hidden = false;
}
function hideBanner() {
  $('banner').hidden = true;
}
function toast(text: string, ms = 2500) {
  const el = $('toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(bannerTimer);
  bannerTimer = window.setTimeout(() => (el.hidden = true), ms);
}
function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* nicht jedes Handy kann vibrieren (iPhone im Browser leider nicht) */
  }
}
function flash(kind: 'warn' | 'end') {
  const f = $('flash');
  f.className = 'flash ' + kind;
  void f.offsetWidth;
  f.classList.add('go');
}

// ------------------------------------------------------------------ Bildschirm wach halten
const noSleep = new NoSleep();
let awake = false;
function keepAwake() {
  if (awake) return;
  awake = true;
  noSleep.enable().catch(() => (awake = false));
}
document.addEventListener('pointerdown', keepAwake, { capture: true });

// ------------------------------------------------------------------ Knöpfe
function act(c: string, a: unknown = null) {
  if (send(c, a) && prefs.haptics) buzz(12);
  if (c === 'next' || c === 'prev') pulse(c);
}
function pulse(c: string) {
  const b = document.querySelector(`.nav .${c}`);
  b?.classList.remove('pulse');
  void (b as HTMLElement)?.offsetWidth;
  b?.classList.add('pulse');
}
document.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((b) => {
  b.addEventListener('click', () => act(b.dataset.act!));
});

// ------------------------------------------------------------------ Laser & Spotlight auf der Vorschau
let tool: 'laser' | 'spot' | null = null;
document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((b) => {
  b.addEventListener('click', () => {
    const t = b.dataset.tool as 'laser' | 'spot';
    tool = tool === t ? null : t;
    document.querySelectorAll('[data-tool]').forEach((x) => x.classList.toggle('on', (x as HTMLElement).dataset.tool === tool));
    $('preview').classList.toggle('pointing', !!tool);
    $('phint').hidden = !tool;
    if (prefs.haptics) buzz(8);
  });
});

/** Position auf dem sichtbaren Bild (Bild ist "contain" eingepasst) → 0..1 */
function imageBox() {
  const pv = $('preview').getBoundingClientRect();
  const img = $<HTMLImageElement>('pimg');
  const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 16 / 9;
  let w = pv.width;
  let h = w / ratio;
  if (h > pv.height) {
    h = pv.height;
    w = h * ratio;
  }
  return { left: pv.left + (pv.width - w) / 2, top: pv.top + (pv.height - h) / 2, width: w, height: h, pv };
}

let lastSent = 0;
let queued: { x: number; y: number; down: boolean } | null = null;
let raf = 0;
function sendPointer(p: { x: number; y: number; down: boolean }) {
  queued = p;
  if (!p.down) {
    flushPointer();
    return;
  }
  if (!raf) raf = requestAnimationFrame(flushPointer);
}
function flushPointer() {
  raf = 0;
  if (!queued || !tool) return;
  const now = performance.now();
  if (queued.down && now - lastSent < 14) {
    raf = requestAnimationFrame(flushPointer);
    return;
  }
  lastSent = now;
  send('pointer', { x: round(queued.x), y: round(queued.y), down: queued.down, mode: tool });
  queued = null;
}
const round = (n: number) => Math.round(n * 10000) / 10000;

const pv = $('preview');
let swipe: { x: number; y: number; t: number } | null = null;
pv.addEventListener('pointerdown', (e) => {
  pv.setPointerCapture(e.pointerId);
  if (tool) {
    pointAt(e, true);
  } else {
    swipe = { x: e.clientX, y: e.clientY, t: Date.now() };
  }
});
pv.addEventListener('pointermove', (e) => {
  if (tool && e.buttons) pointAt(e, true);
});
const end = (e: PointerEvent) => {
  if (tool) {
    pointAt(e, false);
    return;
  }
  if (swipe) {
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4 && Date.now() - swipe.t < 800) act(dx < 0 ? 'next' : 'prev');
    swipe = null;
  }
};
pv.addEventListener('pointerup', end);
pv.addEventListener('pointercancel', end);

function pointAt(e: PointerEvent, down: boolean) {
  const b = imageBox();
  const x = Math.min(1, Math.max(0, (e.clientX - b.left) / b.width));
  const y = Math.min(1, Math.max(0, (e.clientY - b.top) / b.height));
  const dot = $('pdot');
  dot.style.left = `${b.left - b.pv.left + x * b.width}px`;
  dot.style.top = `${b.top - b.pv.top + y * b.height}px`;
  dot.className = 'pdot ' + (down ? 'on ' : '') + (tool || '');
  sendPointer({ x, y, down });
}

// ------------------------------------------------------------------ Vorschau
function onPreview(m: { img?: string; off?: string }) {
  const img = $<HTMLImageElement>('pimg');
  const msg = $('pmsg');
  if (m.img && /^data:image\/jpeg;base64,/.test(m.img)) {
    img.src = m.img;
    img.hidden = false;
    msg.hidden = true;
    if (!store.get('swipeHint')) {
      store.set('swipeHint', '1');
      setTimeout(() => toast(tr('swipeHint'), 4000), 800);
    }
  } else if (m.off) {
    img.removeAttribute('src');
    img.hidden = true;
    msg.hidden = false;
    msg.textContent = m.off === 'permission' ? tr('previewPermission') : tr('previewOff');
  }
}

// ------------------------------------------------------------------ Timer
type TimerSnap = { mode: 'countdown' | 'stopwatch'; running: boolean; durationMs: number; elapsed: number; remaining: number; warnings: number[]; at: number };
let tsnap: TimerSnap | null = null;
let tRecv = 0;
let prevRemaining = Infinity;

function onTimer(m: TimerSnap) {
  tsnap = m;
  tRecv = performance.now();
  prevRemaining = currentRemaining();
  renderTimer();
}
function currentElapsed() {
  if (!tsnap) return 0;
  return tsnap.elapsed + (tsnap.running ? performance.now() - tRecv : 0);
}
function currentRemaining() {
  return tsnap ? tsnap.durationMs - currentElapsed() : Infinity;
}
function fmt(ms: number) {
  const neg = ms < 0;
  const s = Math.floor(Math.abs(ms) / 1000 + (neg ? 0 : 0.999));
  const h = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const body = h ? `${h}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  return (neg ? '+' : '') + body;
}
function timerText() {
  if (!tsnap) return '--:--';
  return tsnap.mode === 'stopwatch' ? fmt(currentElapsed()) : fmt(currentRemaining());
}
function renderTimer() {
  const el = $('timerText');
  el.textContent = timerText();
  const btn = $('timerBtn');
  const rem = currentRemaining();
  const cd = tsnap?.mode === 'countdown';
  btn.classList.toggle('running', !!tsnap?.running);
  btn.classList.toggle('warn', cd && rem <= 120_000 && rem > 0);
  btn.classList.toggle('over', cd && rem <= 0);
  const big = document.getElementById('bigTime');
  if (big) {
    big.textContent = timerText();
    big.className = 'big-time ' + (cd && rem <= 0 ? 'over' : cd && rem <= 120_000 ? 'warn' : '');
  }
  const tb = document.getElementById('tToggle');
  if (tb) tb.textContent = tsnap?.running ? tr('pause') : tr('start');
}
setInterval(() => {
  if (!tsnap) return;
  if (tsnap.running && tsnap.mode === 'countdown') {
    const now = currentRemaining();
    const hit = tsnap.warnings.filter((s) => prevRemaining > s * 1000 && now <= s * 1000);
    prevRemaining = now;
    if (hit.length) {
      const last = Math.min(...hit);
      if (last === 0) {
        buzz([500, 200, 500, 200, 800]);
        flash('end');
        toast(tr('timeUp'), 4000);
      } else {
        buzz([180, 120, 180]);
        flash('warn');
        toast(tr('timeLeft', { m: Math.round(last / 60) }), 3000);
      }
    }
  }
  renderTimer();
}, 250);

// ------------------------------------------------------------------ Untere Blätter (Timer, Mehr, Gehe zu)
function openSheet(html: string, onMount?: (el: HTMLElement) => void) {
  const sh = $('sheet');
  sh.innerHTML = `<div class="grab"></div>${html}`;
  sh.hidden = false;
  $('scrim').hidden = false;
  requestAnimationFrame(() => sh.classList.add('open'));
  sh.querySelectorAll<HTMLElement>('[data-close]').forEach((b) => (b.onclick = closeSheet));
  onMount?.(sh);
}
function closeSheet() {
  const sh = $('sheet');
  sh.classList.remove('open');
  $('scrim').hidden = true;
  setTimeout(() => (sh.hidden = true), 180);
}
$('scrim').onclick = closeSheet;

function sheetHead(title: string) {
  return `<div class="sheet-head"><h2>${title}</h2><button class="icon" data-close aria-label="${tr('close')}">${I.close}</button></div>`;
}

$('timerBtn').onclick = () => {
  const s = tsnap;
  const mins = s ? Math.round(s.durationMs / 60000) : 10;
  const warn = s?.warnings ?? [300, 120, 60, 0];
  openSheet(
    `${sheetHead(tr('timer'))}
    <div class="seg" id="tMode">
      <button data-mode="countdown" class="${s?.mode !== 'stopwatch' ? 'on' : ''}">${tr('countdown')}</button>
      <button data-mode="stopwatch" class="${s?.mode === 'stopwatch' ? 'on' : ''}">${tr('stopwatch')}</button>
    </div>
    <div id="bigTime" class="big-time">${timerText()}</div>
    <div class="cd-only ${s?.mode === 'stopwatch' ? 'hide' : ''}">
      <div class="stepper"><button data-add="-60000">−1</button><span>${mins} ${tr('minutes')}</span><button data-add="60000">+1</button></div>
      <div class="chips">${[5, 10, 15, 20, 30, 45, 60].map((m) => `<button data-min="${m}" class="${m === mins ? 'on' : ''}">${m}</button>`).join('')}</div>
      <div class="label">${tr('warnAt')}</div>
      <div class="chips warn">${[300, 120, 60, 0].map((w) => `<button data-warn="${w}" class="${warn.includes(w) ? 'on' : ''}">${w ? w / 60 + ' ' + tr('minutes') : '0:00'}</button>`).join('')}</div>
    </div>
    <div class="row2">
      <button class="btn ghost" id="tReset">${tr('reset')}</button>
      <button class="btn primary" id="tToggle">${s?.running ? tr('pause') : tr('start')}</button>
    </div>`,
    (el) => {
      el.querySelectorAll<HTMLElement>('[data-mode]').forEach((b) => (b.onclick = () => (send('timer', { op: 'set', arg: { mode: b.dataset.mode } }), reopenTimerSoon())));
      el.querySelectorAll<HTMLElement>('[data-min]').forEach((b) => (b.onclick = () => (send('timer', { op: 'set', arg: { durationMs: Number(b.dataset.min) * 60000 } }), reopenTimerSoon())));
      el.querySelectorAll<HTMLElement>('[data-add]').forEach((b) => (b.onclick = () => (send('timer', { op: 'add', arg: { ms: Number(b.dataset.add) } }), reopenTimerSoon())));
      el.querySelectorAll<HTMLElement>('[data-warn]').forEach(
        (b) =>
          (b.onclick = () => {
            const w = Number(b.dataset.warn);
            const cur = tsnap?.warnings ?? [];
            const next = cur.includes(w) ? cur.filter((x) => x !== w) : [...cur, w];
            send('timer', { op: 'set', arg: { warnings: next } });
            reopenTimerSoon();
          }),
      );
      $('tToggle').onclick = () => {
        send('timer', { op: 'toggle' });
        if (prefs.haptics) buzz(15);
      };
      $('tReset').onclick = () => send('timer', { op: 'reset' });
    },
  );
};
function reopenTimerSoon() {
  // Nach der Antwort des Laptops das Blatt mit neuen Werten neu zeichnen
  setTimeout(() => {
    if (!$('sheet').hidden && document.getElementById('tMode')) {
      const scroll = $('sheet').scrollTop;
      ($('timerBtn') as HTMLButtonElement).click();
      $('sheet').scrollTop = scroll;
    }
  }, 160);
}

$('gotoBtn').onclick = () => {
  let num = '';
  openSheet(
    `${sheetHead(tr('gotoTitle'))}
    <div class="num-display" id="numDisp">–</div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-n="${n}">${n}</button>`).join('')}
      <button data-n="del" aria-label="⌫">${I.back}</button><button data-n="0">0</button><button data-n="go" class="primary">${tr('go')}</button></div>`,
    (el) => {
      el.querySelectorAll<HTMLElement>('[data-n]').forEach(
        (b) =>
          (b.onclick = () => {
            const n = b.dataset.n!;
            if (n === 'del') num = num.slice(0, -1);
            else if (n === 'go') {
              if (num) act('goto', { n: Number(num) });
              closeSheet();
              return;
            } else if (num.length < 4) num += n;
            $('numDisp').textContent = num || '–';
            if (prefs.haptics) buzz(6);
          }),
      );
    },
  );
};

$('moreBtn').onclick = () => {
  openSheet(
    `${sheetHead(tr('more'))}
    <div class="label">${tr('startWith')}</div>
    <div class="grid2">
      <button class="btn" data-start="powerpoint">PowerPoint</button>
      <button class="btn" data-start="keynote">Keynote</button>
      <button class="btn" data-start="google">Google Slides</button>
      <button class="btn" data-start="pdf">${tr('pdf')}</button>
    </div>
    <div class="label">${tr('present')}</div>
    <div class="grid2">
      <button class="btn" data-a="first">${tr('first')}</button>
      <button class="btn" data-a="last">${tr('last')}</button>
      <button class="btn" data-a="white">${tr('white')}</button>
      <button class="btn danger-soft" data-a="end">${tr('endPres')}</button>
    </div>
    <div class="label">${tr('options')}</div>
    <label class="switch"><span>${tr('haptics')}</span><input type="checkbox" id="optHaptics" ${prefs.haptics ? 'checked' : ''}/></label>
    <label class="switch"><span>${tr('lefty')}</span><input type="checkbox" id="optLefty" ${prefs.lefty ? 'checked' : ''}/></label>
    <button class="btn ghost danger" id="forget">${tr('forget')}</button>`,
    (el) => {
      el.querySelectorAll<HTMLElement>('[data-start]').forEach((b) => (b.onclick = () => (act('start', { app: b.dataset.start }), closeSheet())));
      el.querySelectorAll<HTMLElement>('[data-a]').forEach((b) => (b.onclick = () => (act(b.dataset.a!), closeSheet())));
      $<HTMLInputElement>('optHaptics').onchange = (e) => {
        prefs.haptics = (e.target as HTMLInputElement).checked;
        store.set('haptics', prefs.haptics ? '1' : '0');
      };
      $<HTMLInputElement>('optLefty').onchange = (e) => {
        prefs.lefty = (e.target as HTMLInputElement).checked;
        store.set('lefty', prefs.lefty ? '1' : '0');
        $('remote').classList.toggle('lefty', prefs.lefty);
      };
      $('forget').onclick = () => {
        if (!confirm(tr('forgetConfirm'))) return;
        store.set('key', null);
        deviceKey = null;
        fatal = true;
        ws?.close();
        closeSheet();
        setStatus('scan', tr('scanText'));
      };
    },
  );
};

// Tastatur (z. B. Bluetooth-Tastatur am Tablet) funktioniert auch
document.addEventListener('keydown', (e) => {
  if (!$('sheet').hidden) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') act('next');
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') act('prev');
});

connect();
