'use strict';
/**
 * Thumbnails für YouTube/TikTok/Instagram: großer Text + echtes Motiv aus der App.
 *   node scripts/video/thumbnails.cjs AUSGABEORDNER
 * Intro: 1280×720 · Shorts: 1080×1920
 */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'video-out'));
const RAW = 'file://' + path.join(ROOT, 'marketing', 'raw', 'en');
const ICON = 'file://' + path.join(ROOT, 'build', 'icon.png');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const base = (w, h) => `<style>*{box-sizing:border-box}body{margin:0;width:${w}px;height:${h}px;overflow:hidden;font-family:Inter,-apple-system,'SF Pro Display',sans-serif;color:#fff;
  background:radial-gradient(900px 600px at 80% 10%,rgba(255,77,109,.55),transparent 60%),radial-gradient(800px 600px at 0% 100%,rgba(139,92,246,.45),transparent 60%),#0d0a10}
  .g{background:linear-gradient(90deg,#ff9a5a,#ff4d6d 55%,#c26bff);-webkit-background-clip:text;background-clip:text;color:transparent}
  .ph{position:absolute;border-radius:48px;box-shadow:0 40px 100px rgba(0,0,0,.6),0 0 0 12px #050506,0 0 0 15px #2a2b31}
  .t{position:absolute;z-index:5;font-weight:900;letter-spacing:-3px;line-height:.98;text-shadow:0 10px 40px rgba(0,0,0,.55)}
  .b{position:absolute;z-index:5;padding:16px 28px;border-radius:999px;font-weight:800;background:linear-gradient(135deg,#ff7a59,#ff3d77);box-shadow:0 16px 40px rgba(255,61,119,.45)}
  .dot{position:absolute;border-radius:50%;background:radial-gradient(circle,#fff 0 18%,#ff2d2d 26%);box-shadow:0 0 60px 30px rgba(255,45,45,.6)}
  </style>`;

// Jedes Thumbnail: [Breite, Höhe, HTML, Skript mit den Video-Bausteinen (phone, screenWall …)]
const THUMBS = {
  'SlimClick-Thumbnail.jpg': [1280, 720, `
    <div class="t" style="left:60px;top:80px;font-size:118px">Your <span class="g">phone</span><br>is the<br>clicker.</div>
    <div class="b" style="left:64px;top:530px;font-size:34px">FREE · no app needed</div>
    <img src="${ICON}" style="position:absolute;left:1130px;top:575px;width:120px;z-index:5">`,
    `const o = phone(stage, { x: 790, y: 50, w: 300 }); o.deck.show(1); toolOn(o, 0, true); o.ring.style.opacity = 1; phoneLaser(o, .72, .4, 1);
     o.rig.style.transform += ' rotate(6deg)';`],
  'SlimClick-Short1-Thumbnail.jpg': [1080, 1920, `
    <div class="t" style="left:70px;right:70px;top:140px;font-size:150px;text-align:center">Forgot your<br>clicker?</div>
    <div class="t" style="left:0;right:0;top:1700px;font-size:110px;text-align:center"><span class="g">Use your phone.</span></div>`,
    `const o = phone(stage, { x: 300, y: 560, w: 480 }); o.deck.show(0); o.next.style.filter = 'brightness(1.15)';
     css(o.tap, { left: '242px', top: '590px', opacity: .9, transform: 'scale(.9)' }); o.rig.style.transform += ' rotate(-4deg)';`],
  'SlimClick-Short2-Thumbnail.jpg': [1080, 1920, `
    <div class="t" style="left:70px;right:70px;top:120px;font-size:140px;text-align:center">No laser<br>pointer?</div>
    <div class="t" style="left:0;right:0;top:1720px;font-size:104px;text-align:center"><span class="g">Tap. Point. Done.</span></div>`,
    `const w = screenWall(stage, { x: 90, y: 480, w: 900 }); w.deck.show(1); w.laser(.74, .38, 1);
     const o = phone(stage, { x: 380, y: 1030, w: 320 }); o.deck.show(1); toolOn(o, 0, true); o.ring.style.opacity = 1; phoneLaser(o, .74, .38, 1);`],
  'SlimClick-Short3-Thumbnail.jpg': [1080, 1920, `
    <div class="t" style="left:60px;right:60px;top:140px;font-size:136px;text-align:center">School Wi-Fi<br>blocks it?</div>
    ${[0, 1, 2].map((i) => `<div style="position:absolute;left:${540 - 300 - i * 130}px;top:${1000 - 300 - i * 130}px;width:${600 + i * 260}px;height:${600 + i * 260}px;border-radius:50%;border:10px solid rgba(51,195,122,${0.8 - i * 0.25})"></div>`).join('')}
    <div class="b" style="left:50%;transform:translateX(-50%);top:1480px;font-size:60px;white-space:nowrap">📶 Hotspot = fixed</div>
    <div class="t" style="left:0;right:0;top:1700px;font-size:110px;text-align:center"><span class="g">10-second fix</span></div>`,
    `const o = phone(stage, { x: 390, y: 690, w: 300 }); o.deck.show(0);`],
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--allow-file-access-from-files'] });
  const M = path.join(__dirname, 'motion');
  for (const [name, [w, h, body, js]] of Object.entries(THUMBS)) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.addInitScript((c) => (window.CONFIG = c), { w, h, durations: [1], captions: [], shots: RAW, icon: ICON });
    const tmp = path.join(M, '_thumb.html'); // neben den Bausteinen, damit ../assets/qr.svg gefunden wird
    fs.writeFileSync(tmp, `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../shorts/style.css">${base(w, h)}<body><div id="stage" style="position:absolute;inset:0"></div>${body}
      <script src="core.js"></script><script src="slimclick.js"></script><script>bg.style.display='none';${js}</script></body>`);
    await page.goto('file://' + tmp);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 90 });
    await page.close();
    fs.unlinkSync(tmp);
    console.log('✓', name);
  }
  await browser.close();
})();
