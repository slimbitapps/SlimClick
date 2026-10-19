'use strict';
// Tests für Tasten, Netzwerk-Auswahl, Timer und Einstellungen.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { keysFor, KeySender, isValidSpec, linuxKey, MAC_CODES, WIN_CODES, WIN_SCRIPT } = require('../electron/core/keys.cjs');
const { listAddresses, pickAddress } = require('../electron/core/network.cjs');
const { Timer, crossedWarnings } = require('../electron/core/timer.cjs');
const { SettingsStore } = require('../electron/core/settings.cjs');
const { Pairing, cleanName } = require('../electron/core/auth.cjs');

test('Tasten: Weiter/Zurück je nach Schema', () => {
  assert.deepEqual(keysFor('next', null, { platform: 'win32' }), ['right']);
  assert.deepEqual(keysFor('prev', null, { platform: 'darwin' }), ['left']);
  assert.deepEqual(keysFor('next', null, { platform: 'darwin', scheme: 'pages' }), ['pagedown']);
  assert.deepEqual(keysFor('prev', null, { platform: 'win32', scheme: 'pages' }), ['pageup']);
});

test('Tasten: Gehe zu Folie tippt Ziffern + Enter, ungültige Nummern nicht', () => {
  assert.deepEqual(keysFor('goto', { n: 12 }, { platform: 'win32' }), ['d1', 'd2', 'enter']);
  assert.equal(keysFor('goto', { n: 0 }, { platform: 'win32' }), null);
  assert.equal(keysFor('goto', { n: 'abc' }, { platform: 'win32' }), null);
  assert.equal(keysFor('goto', { n: 1e9 }, { platform: 'win32' }), null);
});

test('Tasten: Präsentation starten pro Programm und System', () => {
  assert.deepEqual(keysFor('start', { app: 'powerpoint' }, { platform: 'win32' }), ['f5']);
  assert.deepEqual(keysFor('start', { app: 'powerpoint' }, { platform: 'darwin' }), ['enter:cmd,shift']);
  assert.deepEqual(keysFor('start', { app: 'keynote' }, { platform: 'darwin' }), ['p:alt,cmd']);
  assert.deepEqual(keysFor('start', { app: 'google' }, { platform: 'win32' }), ['enter:ctrl']);
  assert.deepEqual(keysFor('start', { app: 'evil' }, { platform: 'win32' }), ['f5']);
  assert.equal(keysFor('rm', null, { platform: 'win32' }), null);
});

test('Tasten: Jede erzeugte Taste ist auf Mac und Windows bekannt', () => {
  const actions = [['next'], ['prev'], ['first'], ['last'], ['black'], ['white'], ['end'], ['goto', { n: 1234567 % 9999 }]];
  for (const app of ['powerpoint', 'keynote', 'google', 'pdf']) actions.push(['start', { app }]);
  for (const platform of ['darwin', 'win32', 'linux'])
    for (const scheme of ['arrows', 'pages'])
      for (const [a, args] of actions) {
        for (const spec of keysFor(a, args, { platform, scheme })) {
          assert.ok(isValidSpec(spec), spec);
          const k = spec.split(':')[0];
          assert.ok(k in MAC_CODES && k in WIN_CODES, k);
          assert.ok(linuxKey(spec), spec);
        }
      }
});

test('Tasten: Nur gültige Beschreibungen gehen an das Hilfsprogramm (keine Befehls-Einschleusung)', () => {
  for (const bad of ['right; rm -rf /', 'right\nleft', '$(x)', 'right:sudo', 'zz', '', 'RIGHT', 'right:cmd;x']) assert.ok(!isValidSpec(bad), bad);
  const ks = new KeySender({ backend: 'record' });
  assert.equal(ks.send(['right\nevil', 'left']), true);
  assert.deepEqual(ks.recorded, ['left']);
  assert.equal(ks.send(['nope']), false);
});

test('Tasten: Hilfsprozess wird einmal gestartet und bekommt Zeilen', () => {
  const lines = [];
  let spawned = 0;
  const fake = () => {
    spawned++;
    const p = new EventEmitter();
    p.stdin = { write: (s) => lines.push(s), end() {} };
    p.stdout = new EventEmitter();
    p.stderr = new EventEmitter();
    p.exitCode = null;
    p.kill = () => {};
    return p;
  };
  const ks = new KeySender({ platform: 'win32', spawnFn: fake });
  ks.send(['right']);
  ks.send(['d1', 'd2', 'enter']);
  assert.equal(spawned, 1);
  assert.deepEqual(lines, ['right\n', 'd1 d2 enter\n']);
});

test('Windows-Skript enthält alle Tasten', () => {
  for (const k of Object.keys(WIN_CODES)) assert.ok(WIN_SCRIPT.includes(`'${k}'=`), k);
});

test('Netzwerk: WLAN wird vor virtuellen Adaptern gewählt', () => {
  const list = listAddresses({
    'vEthernet (WSL)': [{ family: 'IPv4', address: '172.18.0.1', internal: false }],
    'WLAN': [{ family: 'IPv4', address: '192.168.178.23', internal: false }],
    lo: [{ family: 'IPv4', address: '127.0.0.1', internal: true }],
    docker0: [{ family: 'IPv4', address: '172.17.0.1', internal: false }],
    Ethernet: [{ family: 'IPv4', address: '169.254.10.2', internal: false }],
    tun0: [{ family: 'IPv4', address: '8.8.4.4', internal: false }],
  });
  assert.equal(list[0].address, '192.168.178.23');
  assert.equal(list[0].kind, 'wifi');
  assert.ok(!list.some((a) => a.address === '8.8.4.4' || a.address === '127.0.0.1'));
  assert.equal(pickAddress(list, '172.17.0.1').address, '172.17.0.1');
  assert.equal(pickAddress(list, 'gibts-nicht').address, '192.168.178.23');
  assert.equal(pickAddress([], 'auto'), null);
});

test('Netzwerk: iPhone-Hotspot wird erkannt', () => {
  const [a] = listAddresses({ en0: [{ family: 'IPv4', address: '172.20.10.4', internal: false }] });
  assert.equal(a.kind, 'iphone-hotspot');
});

test('Timer: Countdown, Pause, Überziehung', () => {
  const tm = new Timer({ durationMs: 5 * 60_000 });
  tm.start(1000);
  assert.equal(tm.snapshot(61_000).remaining, 4 * 60_000);
  tm.pause(61_000);
  assert.equal(tm.snapshot(999_999).remaining, 4 * 60_000);
  tm.toggle(100_000);
  assert.equal(tm.snapshot(100_000 + 5 * 60_000).remaining, -60_000);
  tm.reset();
  assert.equal(tm.snapshot(0).elapsed, 0);
  assert.equal(tm.running, false);
});

test('Timer: Grenzen und Befehle', () => {
  const tm = new Timer();
  tm.apply('set', { durationMs: 5 });
  assert.equal(tm.durationMs, 60_000);
  tm.apply('add', { ms: 120_000 });
  assert.equal(tm.durationMs, 180_000);
  tm.apply('set', { mode: 'stopwatch', warnings: [60, 'x', 60, -1, 300] });
  assert.equal(tm.mode, 'stopwatch');
  assert.deepEqual(tm.warnings, [300, 60]);
  assert.equal(tm.apply('hack'), false);
});

test('Timer: überschrittene Warnungen', () => {
  assert.deepEqual(crossedWarnings(121_000, 119_000, [120, 60, 0]), [120]);
  assert.deepEqual(crossedWarnings(61_000, -1, [120, 60, 0]), [60, 0]);
  assert.deepEqual(crossedWarnings(50_000, 40_000, [120, 60, 0]), []);
});

test('Einstellungen: Standardwerte, Speichern, Geräte-Schlüssel bleiben geheim', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'slimclick-set-')), 'settings.json');
  const s = new SettingsStore(file);
  assert.equal(s.data.control.scheme, 'arrows');
  s.update({ prefs: { lang: 'de' }, devices: [{ id: 'x', key: 'hack' }] });
  assert.deepEqual(s.data.devices, [], 'Oberfläche darf keine Geräte einschleusen');
  s.data.devices = [{ id: 'phone-12345678', name: 'iPhone', key: 'secret' }];
  s.save();
  const s2 = new SettingsStore(file);
  assert.equal(s2.data.prefs.lang, 'de');
  assert.equal(s2.data.prefs.theme, 'system');
  assert.equal(s2.public().devices[0].key, undefined);
  assert.equal(s2.public().devices[0].name, 'iPhone');
});

test('Gerätenamen werden gesäubert', () => {
  assert.equal(cleanName('<script>alert(1)</script>'), 'scriptalert(1)script');
  assert.equal(cleanName(''), 'Handy');
  assert.equal(cleanName('iPhone · Safari'), 'iPhone · Safari');
  assert.equal(cleanName('x'.repeat(100)).length, 40);
});

test('Kopplung: Geräte entfernen wechselt nicht die Schlüssel der anderen', () => {
  const p = new Pairing();
  p.addDevice('phone-aaaaaaaa', 'A', 'ka');
  p.addDevice('phone-bbbbbbbb', 'B', 'kb');
  p.remove('phone-aaaaaaaa');
  assert.equal(p.find('phone-aaaaaaaa'), null);
  assert.equal(p.find('phone-bbbbbbbb').key, 'kb');
  const before = p.code;
  p.removeAll();
  assert.equal(p.devices.length, 0);
  assert.notEqual(p.code, before);
});
