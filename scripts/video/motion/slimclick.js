// SlimClick-Bausteine für die Videos: Beispiel-Präsentation, Handy-Fernbedienung, Laptop, Beamer-Leinwand,
// Handy-Kamera mit QR-Code, Hotspot-Netzwerk. Wird nach core.js eingebunden.

const CORAL = '#ff7a59', PINK = '#ff3d77', LASER = '#ff2d2d';
const GRAD = `linear-gradient(135deg, ${CORAL}, ${PINK})`;

// ---------- Beispiel-Präsentation (ein Schulreferat), als SVG in jeder Größe
const SLIDES = [
  { bg: ['#1d4ed8', '#0ea5e9'], title: 'The Water Cycle', sub: 'Biology · Class 9b', art: 'waves' },
  { bg: ['#ea580c', '#f59e0b'], title: '1 · Evaporation', sub: 'The sun heats the water', art: 'sun' },
  { bg: ['#475569', '#94a3b8'], title: '2 · Condensation', sub: 'Vapour turns into clouds', art: 'cloud' },
  { bg: ['#0f766e', '#22c55e'], title: '3 · Precipitation', sub: 'Rain, snow and hail', art: 'rain' },
  { bg: ['#7c3aed', '#ec4899'], title: 'Thanks!', sub: 'Questions?', art: 'stars' },
];
let SVG_N = 0;
function slideSVG(i) {
  const gid = 'sg' + SVG_N++; // eindeutig je Folie, sonst verschwinden Farbverläufe
  const s = SLIDES[((i % SLIDES.length) + SLIDES.length) % SLIDES.length];
  const art = {
    waves: `<path d="M0 760 Q200 700 400 760 T800 760 T1200 760 T1600 760 V900 H0Z" fill="rgba(255,255,255,.22)"/><path d="M0 810 Q200 750 400 810 T800 810 T1200 810 T1600 810 V900 H0Z" fill="rgba(255,255,255,.3)"/>`,
    sun: `<circle cx="1220" cy="330" r="150" fill="#fde047"/><g stroke="#fde047" stroke-width="22" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const r = (a * Math.PI) / 180; return `<line x1="${1220 + Math.cos(r) * 200}" y1="${330 + Math.sin(r) * 200}" x2="${1220 + Math.cos(r) * 260}" y2="${330 + Math.sin(r) * 260}"/>`; }).join('')}</g><g stroke="rgba(255,255,255,.75)" stroke-width="14" fill="none" stroke-linecap="round"><path d="M1060 800 q-30 -60 0 -120 t0 -120"/><path d="M1220 800 q-30 -60 0 -120 t0 -120"/><path d="M1380 800 q-30 -60 0 -120 t0 -120"/></g>`,
    cloud: `<g fill="#fff"><circle cx="1130" cy="380" r="120"/><circle cx="1270" cy="330" r="150"/><circle cx="1400" cy="400" r="110"/><rect x="1020" y="380" width="480" height="130" rx="65"/></g>`,
    rain: `<g fill="#fff" opacity=".9"><circle cx="1180" cy="300" r="100"/><circle cx="1300" cy="260" r="125"/><rect x="1090" y="300" width="330" height="110" rx="55"/></g><g stroke="#bfdbfe" stroke-width="16" stroke-linecap="round">${[0, 1, 2, 3, 4, 5].map((k) => `<line x1="${1110 + k * 60}" y1="${470 + (k % 2) * 40}" x2="${1090 + k * 60}" y2="${540 + (k % 2) * 40}"/>`).join('')}</g>`,
    stars: `<g fill="#fde68a">${[[1150, 300, 50], [1350, 220, 34], [1300, 420, 26], [1460, 360, 40]].map(([x, y, r]) => `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z"/>`).join('')}</g>`,
  }[s.art];
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.bg[0]}"/><stop offset="1" stop-color="${s.bg[1]}"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#${gid})"/>${art}
    <text x="110" y="380" fill="#fff" font-family="Inter, -apple-system, Helvetica, Arial" font-weight="800" font-size="120" letter-spacing="-3">${s.title}</text>
    <text x="114" y="470" fill="rgba(255,255,255,.85)" font-family="Inter, -apple-system, Helvetica, Arial" font-weight="500" font-size="54">${s.sub}</text>
    <rect x="114" y="560" width="420" height="22" rx="11" fill="rgba(255,255,255,.4)"/><rect x="114" y="610" width="300" height="22" rx="11" fill="rgba(255,255,255,.3)"/>
    <text x="1500" y="850" fill="rgba(255,255,255,.7)" font-family="Inter, -apple-system, Helvetica, Arial" font-weight="700" font-size="34" text-anchor="end">${i + 1}/5</text>
  </svg>`;
}
/** Folien-Fläche, die beim Wechsel sanft weitergleitet. set(t, index, wechselZeit) */
function deck(parent, style = {}) {
  const box = el('div', 'abs', parent);
  css(box, { overflow: 'hidden', background: '#000', ...style });
  const a = el('div', 'abs', box), b = el('div', 'abs', box);
  css(a, { inset: 0 });
  css(b, { inset: 0 });
  const cache = {};
  const svg = (i) => (cache[i] ??= slideSVG(i)); // je Fläche eigene Kopie
  return {
    box,
    /** Zeigt Folie `idx`; ist `since` (Sekunden seit dem Wechsel) klein, gleitet die alte Folie raus */
    show(idx, since = 9, from = idx - 1, dir = 1) {
      const k = E.io(clamp(since / 0.45));
      if (a._i !== idx) { a.innerHTML = svg(idx); a._i = idx; }
      if (k < 1 && from !== idx) {
        if (b._i !== from) { b.innerHTML = svg(from); b._i = from; }
        b.style.display = 'block';
        b.style.transform = `translateX(${-dir * k * 100}%)`;
        a.style.transform = `translateX(${dir * (1 - k) * 100}%)`;
      } else {
        b.style.display = 'none';
        a.style.transform = 'none';
      }
    },
  };
}
/** Folgt einer Liste von Wechselzeiten: [{ t, idx }] → zeigt passende Folie mit Übergang */
function showTimeline(dk, lt, changes, first = 0) {
  let idx = first, at = -9, from = first;
  for (const c of changes) if (lt >= c.t) { from = idx; idx = c.idx; at = c.t; }
  dk.show(idx, lt - at, from, idx >= from ? 1 : -1);
  return idx;
}

// ---------- Handy mit der SlimClick-Fernbedienung (gebaut auf 390×812, dann skaliert)
function phone(parent, { x, y, w = 420, ui = 'remote' } = {}) {
  const sc = w / 390;
  const rig = el('div', 'abs', parent);
  css(rig, { left: x + 'px', top: y + 'px', width: '390px', height: '812px', transformOrigin: '0 0', transform: `scale(${sc})` });
  const body = el('div', 'abs', rig);
  css(body, { inset: 0, borderRadius: '58px', background: '#050506', boxShadow: '0 50px 120px rgba(0,0,0,.65), 0 0 0 3px #2a2b31, inset 0 0 0 2px #1a1b1f' });
  const scr = el('div', 'abs', rig);
  css(scr, { left: '12px', top: '12px', right: '12px', bottom: '12px', borderRadius: '47px', background: '#0f1013', overflow: 'hidden' });
  const island = el('div', 'abs', rig);
  css(island, { left: '145px', top: '24px', width: '100px', height: '30px', borderRadius: '20px', background: '#000', zIndex: 5 });
  const o = { rig, scr, sc, w, x, y };
  const R = el('div', 'abs', scr);
  css(R, { inset: 0 });
  o.remote = R;
  // Kopfzeile
  const top = el('div', 'abs', R, `<div style="display:flex;align-items:center;gap:8px;font:650 17px Inter,-apple-system,sans-serif;color:#fff"><i class="pdot" style="width:9px;height:9px;border-radius:50%;background:#33c37a;box-shadow:0 0 0 4px rgba(51,195,122,.18);display:inline-block"></i>SlimClick</div>`);
  css(top, { left: '20px', top: '66px' });
  o.timer = el('div', 'abs', R, '10:00');
  css(o.timer, { right: '18px', top: '58px', height: '38px', padding: '0 14px', borderRadius: '999px', background: '#1b1c21', border: '1px solid rgba(255,255,255,.08)',
    font: '650 17px Inter,-apple-system,sans-serif', color: '#fff', display: 'flex', alignItems: 'center', fontVariantNumeric: 'tabular-nums' });
  // Vorschau
  o.pv = el('div', 'abs', R);
  css(o.pv, { left: '14px', top: '112px', width: '338px', height: '211px', borderRadius: '16px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,.08)' });
  o.deck = deck(o.pv, { inset: 0 });
  o.spotMask = el('div', 'abs', o.pv);
  css(o.spotMask, { inset: 0, opacity: 0 });
  o.dot = el('div', 'abs', o.pv);
  css(o.dot, { width: '16px', height: '16px', margin: '-8px 0 0 -8px', borderRadius: '50%', background: LASER, boxShadow: `0 0 12px 4px rgba(255,45,45,.6)`, opacity: 0 });
  o.ring = el('div', 'abs', o.pv);
  css(o.ring, { inset: 0, borderRadius: '16px', boxShadow: `inset 0 0 0 2px ${LASER}`, opacity: 0 });
  // Werkzeuge
  const tools = [['Laser', '●'], ['Spotlight', '◉'], ['Black', '▬'], ['Go to', '#']];
  o.tools = tools.map(([n, ic], i) => {
    const t = el('div', 'abs', R, `<div style="font-size:20px;line-height:1">${ic}</div><div>${n}</div>`);
    css(t, { left: 14 + i * 87 + 'px', top: '336px', width: '78px', height: '62px', borderRadius: '16px', background: '#1b1c21', border: '1px solid rgba(255,255,255,.08)',
      color: '#a6aab3', font: '600 12.5px Inter,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' });
    return t;
  });
  // Weiter / Zurück
  o.prev = el('div', 'abs', R, '<div style="font-size:30px;line-height:1">‹</div><div>Back</div>');
  css(o.prev, { left: '14px', top: '410px', width: '108px', height: '354px', borderRadius: '22px', background: '#24252b', border: '1px solid rgba(255,255,255,.08)',
    color: '#a6aab3', font: '700 16px Inter,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' });
  o.next = el('div', 'abs', R, 'Next&nbsp;›');
  css(o.next, { left: '132px', top: '410px', width: '220px', height: '354px', borderRadius: '22px', background: GRAD, color: '#fff', font: '700 27px Inter,-apple-system,sans-serif',
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(255,77,109,.3)' });
  o.flash = el('div', 'abs', scr);
  css(o.flash, { inset: 0, opacity: 0, zIndex: 8, pointerEvents: 'none' });
  // Finger-Tipp (Kreis, der aufploppt)
  o.tap = el('div', 'abs', rig);
  css(o.tap, { width: '90px', height: '90px', margin: '-45px 0 0 -45px', borderRadius: '50%', background: 'rgba(255,255,255,.35)', border: '3px solid rgba(255,255,255,.85)', opacity: 0, zIndex: 9 });
  // Andere Bildschirme (Kamera, Hotspot …) liegen darüber
  o.alt = el('div', 'abs', scr);
  css(o.alt, { inset: 0, display: 'none', zIndex: 6, background: '#000' });
  o.place = (px, py, s = 1, rot = 0, op = 1) => {
    rig.style.transform = `translate(${px - x}px, ${py - y}px) rotate(${rot}deg) scale(${sc * s})`;
    rig.style.opacity = op;
  };
  return o;
}
/** Finger tippt auf Punkt (Koordinaten im 390er-Handy). k = Zeit seit dem Tipp */
function tapAt(o, px, py, since) {
  const k = clamp(since / 0.45);
  const on = since >= -0.12 && since < 0.45;
  css(o.tap, { left: px + 'px', top: py + 'px', opacity: on ? (since < 0 ? 0.9 : 0.9 * (1 - k)) : 0, transform: `scale(${since < 0 ? 0.8 : 0.8 + k * 0.7})` });
}
/** Knopf drücken: kurzes Einsinken + Aufleuchten */
function pressBtn(btn, since) {
  const k = since >= 0 && since < 0.35 ? Math.sin((since / 0.35) * Math.PI) : 0;
  btn.style.transform = `scale(${1 - 0.05 * k})`;
  btn.style.filter = `brightness(${1 + 0.35 * k})`;
}
function toolOn(o, i, on) {
  o.tools.forEach((t, k) => {
    const a = k === i && on;
    t.style.background = a ? LASER : '#1b1c21';
    t.style.color = a ? '#fff' : '#a6aab3';
  });
}

// ---------- Laptop mit eigener Bildfläche (Folien oder Screenshot)
function laptop(parent, w, cx, cy) {
  const o = laptopWin(parent, w, cx, cy);
  o.img.style.display = 'none';
  o.view = el('div', 'abs', o.img.parentNode);
  css(o.view, { inset: 0 });
  o.deck = deck(o.view, { inset: 0 });
  o.shot = el('img', 'abs', o.img.parentNode);
  css(o.shot, { inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 0', display: 'none' });
  o.useShot = (name) => { o.shot.src = SHOT(name); o.shot.style.display = 'block'; };
  return o;
}

// ---------- Beamer-Leinwand mit Laserpunkt und Spotlight
function screenWall(parent, { x, y, w }) {
  const h = Math.round((w * 9) / 16);
  const o = { w, h, x, y };
  o.root = el('div', 'abs', parent);
  css(o.root, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  const glow = el('div', 'abs', o.root);
  css(glow, { inset: '-80px', background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.12), transparent 70%)', filter: 'blur(10px)' });
  o.frame = el('div', 'abs', o.root);
  css(o.frame, { inset: 0, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 0 0 8px #e9e9ee, 0 40px 120px rgba(0,0,0,.6)' });
  o.deck = deck(o.frame, { inset: 0 });
  o.spot = el('div', 'abs', o.frame);
  css(o.spot, { inset: 0, opacity: 0 });
  o.trail = [0, 1, 2, 3, 4].map(() => {
    const d = el('div', 'abs', o.frame);
    css(d, { borderRadius: '50%', background: LASER, opacity: 0 });
    return d;
  });
  o.dot = el('div', 'abs', o.frame);
  css(o.dot, { width: '34px', height: '34px', margin: '-17px 0 0 -17px', borderRadius: '50%', background: `radial-gradient(circle, #fff 0 22%, ${LASER} 30%)`,
    boxShadow: '0 0 30px 12px rgba(255,45,45,.55)', opacity: 0 });
  o.hist = [];
  /** Laser bei (u, v) in 0..1 zeigen */
  o.laser = (u, v, op) => {
    css(o.dot, { left: u * w + 'px', top: v * h + 'px', opacity: op });
    o.hist.unshift([u, v]);
    o.hist.length = 6;
    o.trail.forEach((d, i) => {
      const q = o.hist[i + 1] || [u, v];
      const r = 26 - i * 4;
      css(d, { left: q[0] * w - r / 2 + 'px', top: q[1] * h - r / 2 + 'px', width: r + 'px', height: r + 'px', opacity: op * (0.3 - i * 0.05) });
    });
  };
  o.spotlight = (u, v, op) => {
    o.spot.style.opacity = op;
    o.spot.style.background = `radial-gradient(circle at ${u * 100}% ${v * 100}%, transparent 0, transparent ${h * 0.16}px, rgba(0,0,0,.78) ${h * 0.19}px)`;
  };
  return o;
}
/** Spotlight in der Handy-Vorschau */
function phoneSpot(o, u, v, op) {
  o.spotMask.style.opacity = op;
  o.spotMask.style.background = `radial-gradient(circle at ${u * 100}% ${v * 100}%, transparent 0, transparent 30px, rgba(0,0,0,.75) 36px)`;
}
function phoneLaser(o, u, v, op) {
  css(o.dot, { left: u * 338 + 'px', top: v * 211 + 'px', opacity: op });
}

// ---------- Handy-Kamera, die einen QR-Code erkennt
function cameraView(o) {
  o.alt.innerHTML = '';
  const cam = el('div', 'abs', o.alt);
  css(cam, { inset: 0, background: 'radial-gradient(ellipse at 50% 40%, #3a3532 0%, #1a1715 70%)' });
  const sh = el('div', 'abs', cam);
  css(sh, { left: '40px', top: '180px', width: '286px', height: '420px', borderRadius: '10px', background: '#24262c', boxShadow: '0 0 0 6px #33363d' });
  const qr = el('div', 'abs', cam, QR);
  css(qr, { left: '93px', top: '290px', width: '180px', height: '180px', padding: '10px', background: '#fff', borderRadius: '8px' });
  const box = el('div', 'abs', cam);
  css(box, { left: '78px', top: '275px', width: '210px', height: '210px', border: '4px solid #ffd60a', borderRadius: '18px', opacity: 0 });
  const banner = el('div', 'abs', cam, `<div style="width:34px;height:34px;border-radius:9px;background:${GRAD};flex:none"></div><div><div style="font-weight:700">Open in browser</div><div style="opacity:.7;font-size:13px">192.168.1.23 · SlimClick</div></div>`);
  css(banner, { left: '24px', right: '24px', top: '78px', padding: '12px 14px', borderRadius: '18px', background: 'rgba(30,30,32,.92)', color: '#fff',
    font: '500 15px Inter,-apple-system,sans-serif', display: 'flex', gap: '12px', alignItems: 'center', opacity: 0 });
  const shutter = el('div', 'abs', cam);
  css(shutter, { left: '150px', bottom: '40px', width: '66px', height: '66px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 5px rgba(255,255,255,.35)' });
  return { box, banner, qr };
}
const QR = (() => {
  try {
    const x = new XMLHttpRequest();
    x.open('GET', new URL('../assets/qr.svg', document.currentScript ? document.currentScript.src : location.href).href, false);
    x.send();
    return x.responseText.replace('<svg ', '<svg style="width:100%;height:100%;display:block" ');
  } catch {
    return '';
  }
})();

// ---------- Schlussbild: echte App + Logo + Link
function ctaScene(r, s, { vertical = true, link = 'Link in profile ↗' } = {}) {
  s.handheld = 0.7;
  if (vertical) {
    s.a = laptopWin(r, 880, 540, 470);
    s.a.img.src = SHOT('11-home-connected');
    s.ph = el('img', 'abs', r);
    s.ph.src = SHOT('20-phone-remote');
    css(s.ph, { left: '690px', top: '330px', width: '300px', borderRadius: '40px', boxShadow: '0 30px 80px rgba(0,0,0,.6), 0 0 0 10px #050506, 0 0 0 12px #2a2b31' });
    s.lbl = el('div', 'chip', r, '✓ The real app');
    css(s.lbl, { left: '50%', top: '150px', fontSize: '38px' });
    s.icon = el('img', 'abs', r);
    s.icon.src = ICON;
    css(s.icon, { left: '450px', top: '930px', width: '180px', height: '180px' });
    s.name = el('div', 'abs head', r, 'Slim<span class="grad">Click</span>');
    css(s.name, { top: '1110px', fontSize: '140px', letterSpacing: '-4px' });
    s.free = el('div', 'abs head', r, 'Free · Windows &amp; Mac');
    css(s.free, { top: '1280px', fontSize: '54px', fontWeight: 600, color: '#d6cfd6', letterSpacing: 0 });
    s.btn = el('div', 'abs', r, link);
    css(s.btn, { left: '240px', width: '600px', top: '1400px', textAlign: 'center', padding: '28px 0', borderRadius: '28px', fontSize: '56px', fontWeight: 800,
      background: GRAD, boxShadow: '0 16px 50px rgba(255,61,119,.5)' });
  } else {
    s.a = laptopWin(r, 980, 640, 470);
    s.a.img.src = SHOT('11-home-connected');
    s.ph = el('img', 'abs', r);
    s.ph.src = SHOT('20-phone-remote');
    css(s.ph, { left: '980px', top: '300px', width: '260px', borderRadius: '36px', boxShadow: '0 30px 80px rgba(0,0,0,.6), 0 0 0 9px #050506, 0 0 0 11px #2a2b31' });
    s.icon = el('img', 'abs', r);
    s.icon.src = ICON;
    css(s.icon, { left: '1350px', top: '250px', width: '170px', height: '170px' });
    s.name = el('div', 'abs', r, 'Slim<span class="grad">Click</span>');
    css(s.name, { left: '1350px', top: '420px', fontSize: '110px', fontWeight: 900, letterSpacing: '-3px' });
    s.free = el('div', 'abs', r, 'Free · Windows &amp; Mac');
    css(s.free, { left: '1355px', top: '560px', fontSize: '40px', fontWeight: 600, color: '#d6cfd6' });
    s.btn = el('div', 'abs', r, link);
    css(s.btn, { left: '1350px', top: '640px', padding: '22px 34px', borderRadius: '24px', fontSize: '40px', fontWeight: 800, background: GRAD, boxShadow: '0 16px 50px rgba(255,61,119,.5)' });
    s.lbl = el('div', 'chip', r, '✓ The real app');
    css(s.lbl, { left: '640px', top: '110px', fontSize: '30px' });
  }
}
function ctaDraw(s, lt, vertical = true) {
  const k = E.out(p(lt, 0, 0.7));
  place(s.a, { s: 0.92 + 0.06 * k, ry: -12 * (1 - k), y: 30 * (1 - k) });
  const kp = E.back(p(lt, 0.25, 0.6));
  s.ph.style.transform = `translateY(${(1 - kp) * 120}px) rotate(${4 - 4 * kp}deg)`;
  s.ph.style.opacity = p(lt, 0.25, 0.3);
  s.lbl.style.opacity = p(lt, 0.2, 0.3);
  s.lbl.style.transform = 'translateX(-50%)';
  const ki = E.back(p(lt, 0.5, 0.5));
  s.icon.style.transform = `scale(${ki})`;
  [s.name, s.free, s.btn].forEach((e, i) => {
    const kk = E.out(p(lt, 0.7 + i * 0.2, 0.5));
    e.style.opacity = kk;
    e.style.transform = `translateY(${(1 - kk) * 40}px)` + (i === 2 ? ` scale(${1 + 0.035 * Math.sin(lt * 5) * p(lt, 1.7, 0.3)})` : '');
  });
}

/** Große Überschrift, Wort für Wort */
function headline(r, html, top, size = 96, extra = {}) {
  const e = words(r, html, { left: '40px', right: '40px', top: top + 'px', fontSize: size + 'px', ...extra });
  e.className += ' head';
  return e;
}
