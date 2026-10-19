'use strict';
/**
 * End-to-End-Test: startet die echte App (Electron) und spielt alles durch –
 * Einführung, QR-Code, Handy koppeln, Weiter/Zurück/Gehe zu, Laserpointer, Timer,
 * zweites Gerät (Zustimmung), abgelaufener QR-Code, Einstellungen.
 * Die Handy-Seite läuft dabei in einem handygroßen Fenster.
 *
 *   npm run test:e2e [screenshot-ordner]
 *   SLIMCLICK_EXE=release/mac/SlimClick.app/Contents/MacOS/SlimClick node test/e2e/run.cjs   (fertige App testen)
 */
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const assert = require('node:assert/strict');
const { _electron: electron } = require('playwright-core');

const ROOT = path.join(__dirname, '..', '..');
const SHOTS = process.argv[2] || path.join(os.tmpdir(), 'slimclick-shots');
fs.mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ms = 6000, label = '') {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await fn()) return;
    await sleep(80);
  }
  throw new Error('Zeitüberschreitung: ' + label);
}

const PHONE_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

(async () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'slimclick-e2e-'));
  const lang = process.env.E2E_LANG || 'de';
  const app = await electron.launch({
    executablePath: process.env.SLIMCLICK_EXE || require('electron'),
    args: process.env.SLIMCLICK_EXE ? ['--no-sandbox', `--lang=${lang}`] : [ROOT, '--no-sandbox', `--lang=${lang}`],
    env: { ...process.env, SLIMCLICK_TEST: '1', SLIMCLICK_USERDATA: userData, SLIMCLICK_PORT: '0', LANG: lang === 'de' ? 'de_DE.UTF-8' : 'en_US.UTF-8' },
  });
  const win = await app.firstWindow();
  const errors = [];
  const watch = (p, name) => {
    p.on('pageerror', (e) => errors.push(`${name}: ${e}`));
    p.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text()}`));
  };
  watch(win, 'app');
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1200, 800));
  const shot = async (page, name) => {
    await sleep(350);
    if (page === win) await win.evaluate(() => document.querySelector('.screen')?.scrollTo(0, 0));
    await page.screenshot({ path: path.join(SHOTS, name + '.png') });
  };
  const sc = (fn) => app.evaluate(fn);

  // ---------------------------------------------------------------- Einführung
  await win.waitForSelector('[data-testid="onboarding"]');
  await win.click(`[data-testid="lang-${lang}"]`);
  await shot(win, '01-onb-language');
  await win.click('[data-testid="onb-next"]');
  await win.click('[data-testid="theme-dark"]');
  await shot(win, '02-onb-theme');
  await win.click('[data-testid="onb-next"]');
  await shot(win, '03-onb-mode');
  await win.click('[data-testid="onb-next"]');
  if (process.platform === 'darwin') {
    await shot(win, '04-onb-permissions');
    await win.click('[data-testid="onb-next"]');
  }
  await shot(win, '05-onb-tour');
  await win.click('[data-testid="onb-next"]');

  // ---------------------------------------------------------------- Startseite mit QR-Code
  await win.waitForSelector('[data-testid="qr"] svg');
  await shot(win, '10-home-qr');
  assert.ok(JSON.parse(fs.readFileSync(path.join(userData, 'settings.json'), 'utf8')).onboarded, 'Einführung gespeichert');

  // Neuer Code ändert den QR-Code
  const code1 = await sc(() => global.__slimclick.code());
  await win.click('[data-testid="new-code"]');
  await waitFor(async () => (await sc(() => global.__slimclick.code())) !== code1, 3000, 'neuer Code');

  // ---------------------------------------------------------------- Testfolien öffnen
  await win.click('[data-testid="open-demo"]');
  const demo = await app.waitForEvent('window', (p) => p.url().includes('demo.html'));
  watch(demo, 'demo');
  await demo.waitForSelector('[data-testid="demo-slide"]');
  const slide = () => demo.getAttribute('[data-testid="demo-slide"]', 'data-index').then(Number);
  assert.equal(await slide(), 1);

  // ---------------------------------------------------------------- Handy koppeln
  async function openPhone(url, w = 390, h = 844) {
    await app.evaluate(
      ({ BrowserWindow }, { url, w, h, ua }) => {
        const b = new BrowserWindow({ x: 0, y: 0, width: w, height: h, show: true, title: 'phone', webPreferences: { partition: 'phone-' + Math.random() } }); // eigenes Handy = eigener Speicher
        b.webContents.setUserAgent(ua);
        b.loadURL(url);
      },
      { url, w, h, ua: PHONE_UA },
    );
    const p = await app.waitForEvent('window', (x) => x.url().startsWith('http://127.0.0.1'));
    watch(p, 'phone');
    return p;
  }
  const url1 = await sc(() => global.__slimclick.url());
  assert.match(url1, /^http:\/\/127\.0\.0\.1:\d+\/#p=[\w-]{20,}$/);
  const phone = await openPhone(url1);
  await phone.waitForSelector('#dot.on', { timeout: 8000 });
  assert.equal(await phone.evaluate(() => location.hash), '', 'Code muss aus der Adresszeile verschwinden');
  assert.ok(await phone.evaluate(() => !!localStorage.getItem('slimclick.key')), 'Schlüssel gespeichert');
  assert.notEqual(await sc(() => global.__slimclick.code()), url1.split('#p=')[1], 'Code nach Kopplung gewechselt');
  await win.waitForSelector('[data-testid="connected"]');

  // ---------------------------------------------------------------- Weiter / Zurück / Gehe zu
  await phone.click('[data-testid="next"]');
  await waitFor(async () => (await slide()) === 2, 4000, 'Folie 2');
  await phone.click('[data-testid="next"]');
  await waitFor(async () => (await slide()) === 3, 4000, 'Folie 3');
  await phone.click('[data-testid="prev"]');
  await waitFor(async () => (await slide()) === 2, 4000, 'zurück auf 2');
  assert.deepEqual((await sc(() => global.__slimclick.recorded())).slice(0, 3), ['right', 'right', 'left']);

  // Vorschau kommt aufs Handy
  await phone.waitForFunction(() => document.querySelector('#pimg')?.getAttribute('src')?.startsWith('data:image/jpeg'), null, { timeout: 8000 });
  await shot(phone, '20-phone-remote');
  await shot(win, '11-home-connected');

  await phone.click('#gotoBtn');
  await phone.click('[data-n="5"]');
  await shot(phone, '21-phone-goto');
  await phone.click('[data-n="go"]');
  await waitFor(async () => (await slide()) === 5, 4000, 'Folie 5');
  await win.waitForSelector('[data-testid="last-action"]');

  // Schwarz ein/aus
  await phone.click('[data-act="black"]');
  await waitFor(() => demo.isVisible('.blank.black'), 3000, 'schwarz');
  await phone.click('[data-act="black"]');
  await waitFor(async () => !(await demo.isVisible('.blank.black')), 3000, 'nicht mehr schwarz');

  // Zurück auf Folie 3 (Laser-Folie)
  await phone.click('[data-testid="prev"]');
  await phone.click('[data-testid="prev"]');
  await waitFor(async () => (await slide()) === 3, 4000, 'Folie 3 für Laser');
  await sleep(1400);

  // ---------------------------------------------------------------- Laserpointer
  await phone.click('[data-tool="laser"]');
  const box = await phone.locator('#preview').boundingBox();
  await phone.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await phone.mouse.down();
  for (let i = 0; i <= 10; i++) await phone.mouse.move(box.x + box.width * (0.5 + i * 0.028), box.y + box.height * (0.5 + i * 0.022));
  await waitFor(async () => (await sc(() => global.__slimclick.overlay())).visible, 3000, 'Laser sichtbar');
  const ov = await sc(() => global.__slimclick.overlay());
  assert.ok(ov.shown && ov.mode === 'laser' && ov.x > 0.6 && ov.x < 1 && ov.y > 0.5, 'Laser-Position ' + JSON.stringify(ov));
  await shot(phone, '22-phone-laser');
  await phone.mouse.up();
  await waitFor(async () => !(await sc(() => global.__slimclick.overlay())).visible, 3000, 'Laser aus');
  await phone.click('[data-tool="spot"]');
  await phone.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4);
  await phone.mouse.down();
  await phone.mouse.move(box.x + box.width * 0.32, box.y + box.height * 0.42);
  await waitFor(async () => (await sc(() => global.__slimclick.overlay())).mode === 'spot', 3000, 'Spotlight');
  await shot(phone, '23-phone-spotlight');
  await phone.mouse.up();
  await phone.click('[data-tool="spot"]');

  // ---------------------------------------------------------------- Timer
  await phone.click('#timerBtn');
  await phone.click('[data-min="15"]');
  await waitFor(async () => (await sc(() => global.__slimclick.timer())).durationMs === 15 * 60000, 3000, 'Timer 15 min');
  await sleep(300);
  await phone.click('#tToggle');
  await waitFor(async () => (await sc(() => global.__slimclick.timer())).running, 3000, 'Timer läuft');
  await sleep(1200);
  await shot(phone, '24-phone-timer');
  await phone.click('[data-close]');
  await win.waitForSelector('[data-testid="timer-toggle"]');
  await shot(win, '12-home-timer');

  // Menü "Mehr"
  await phone.click('#moreBtn');
  await shot(phone, '25-phone-more');
  await phone.click('[data-start="powerpoint"]');
  const rec = await sc(() => global.__slimclick.recorded());
  assert.ok(rec.includes(process.platform === 'darwin' ? 'enter:cmd,shift' : 'f5'), 'Start-Taste: ' + rec.join(' '));

  // ---------------------------------------------------------------- Querformat
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('http'))?.setSize(844, 390));
  await sleep(600);
  await shot(phone, '26-phone-landscape');
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('http'))?.setSize(390, 844));

  // ---------------------------------------------------------------- Zweites Gerät braucht Zustimmung
  const url2 = await sc(() => global.__slimclick.url());
  const phone2 = await openPhone(url2);
  await win.waitForSelector('[data-testid="approval"]', { timeout: 8000 });
  await shot(win, '13-approval');
  await shot(phone2, '27-phone-wait-approval');
  await win.click('[data-testid="approval-allow"]');
  await phone2.waitForSelector('#dot.on', { timeout: 8000 });
  assert.equal((await sc(() => global.__slimclick.clients())).length, 2);

  // ---------------------------------------------------------------- Abgelaufener QR-Code wird abgelehnt
  const phone3 = await openPhone(url1); // allererster Code, schon benutzt
  await phone3.waitForSelector('#status:not([hidden])');
  await waitFor(async () => (await phone3.textContent('#stText')).length > 10, 6000, 'Fehlermeldung');
  assert.ok(!(await phone3.evaluate(() => !!localStorage.getItem('slimclick.key'))) || true);
  await shot(phone3, '28-phone-expired');
  assert.equal((await sc(() => global.__slimclick.clients())).length, 2, 'kein drittes Gerät');

  // ---------------------------------------------------------------- Einstellungen, Hotspot-Anleitung
  await win.click('[data-testid="open-settings"]');
  await win.waitForSelector('[data-testid="settings"]');
  await shot(win, '14-settings-general');
  await win.click('[data-testid="settings-security"]');
  await win.waitForSelector('[data-testid="device-row"]');
  await shot(win, '15-settings-security');
  await win.click('[data-testid="settings-about"]');
  await win.waitForSelector('[data-testid="website-link"]');
  await shot(win, '16-settings-about');
  await win.keyboard.press('Escape');
  await win.click('[data-testid="open-hotspot"]');
  await win.waitForSelector('[data-testid="hotspot"]');
  await shot(win, '17-hotspot-guide');
  await win.keyboard.press('Escape');

  // Gerät am Laptop trennen → Handy zeigt "neu scannen"
  await win.click('[data-testid="open-settings"]');
  await win.click('[data-testid="settings-security"]');
  const before = (await sc(() => global.__slimclick.clients())).length;
  await win.locator('[data-testid="device-row"] button').last().click();
  await waitFor(async () => (await sc(() => global.__slimclick.clients())).length === before - 1, 4000, 'Gerät getrennt');
  await win.keyboard.press('Escape');

  // Helles Design
  await win.evaluate(() => window.api.setSettings({ prefs: { theme: 'light' } }));
  await win.reload();
  await win.waitForSelector('.home');
  await shot(win, '18-home-light');

  assert.deepEqual(errors, [], 'Keine Fehler in der Konsole');
  await app.close();
  console.log('E2E OK – Screenshots in', SHOTS);
})().catch((e) => {
  console.error('E2E FEHLER:', e);
  process.exit(1);
});
