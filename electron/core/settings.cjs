'use strict';
/** Einstellungen als JSON-Datei im Benutzerordner. Schreibt sicher (erst Temp-Datei, dann umbenennen). */
const fs = require('node:fs');
const path = require('node:path');

const DEFAULTS = {
  version: 1,
  onboarded: false,
  prefs: { lang: '', theme: 'system', mode: 'simple' },
  control: { scheme: 'arrows', preview: true, keepAwake: true },
  laser: { color: '#ff3b30', size: 'm', display: 'auto' },
  security: { approveNew: true },
  network: { address: 'auto', port: 8642 },
  timer: { durationMs: 10 * 60_000, mode: 'countdown', warnings: [300, 120, 60, 0] },
  devices: [],
  window: {},
};

function isObj(x) {
  return x && typeof x === 'object' && !Array.isArray(x);
}
/** Gespeicherte Werte über die Standardwerte legen (fehlende Felder bleiben Standard). */
function merge(base, over) {
  if (!isObj(over)) return structuredClone(base);
  const out = structuredClone(base);
  for (const [k, v] of Object.entries(over)) {
    if (isObj(base[k]) && isObj(v)) out[k] = merge(base[k], v);
    else if (v !== undefined) out[k] = v;
  }
  return out;
}

class SettingsStore {
  constructor(file) {
    this.file = file;
    this.data = merge(DEFAULTS, readJson(file));
  }
  save() {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = this.file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
      fs.renameSync(tmp, this.file);
    } catch {
      /* nächster Versuch beim nächsten Speichern */
    }
  }
  /** Teil-Update aus der Oberfläche. Geräte-Schlüssel können von dort nicht verändert werden. */
  update(partial) {
    const { devices, ...rest } = partial || {};
    void devices;
    this.data = merge(this.data, rest);
    this.save();
    return this.data;
  }
  /** Version für die Oberfläche – ohne geheime Geräte-Schlüssel. */
  public() {
    const { devices, ...rest } = this.data;
    return { ...rest, devices: devices.map(({ key, ...d }) => (void key, d)) };
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

module.exports = { SettingsStore, DEFAULTS, merge };
