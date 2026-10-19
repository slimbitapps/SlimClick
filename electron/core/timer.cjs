'use strict';
/**
 * Vortrags-Timer. Läuft auf dem Laptop, damit er weiterläuft, wenn das Handy kurz die
 * Verbindung verliert. Das Handy bekommt nur Momentaufnahmen und rechnet selbst weiter.
 */
class Timer {
  constructor({ durationMs = 10 * 60_000, mode = 'countdown', warnings = [120, 60, 0] } = {}) {
    this.mode = mode; // 'countdown' | 'stopwatch'
    this.durationMs = clampDuration(durationMs);
    this.warnings = cleanWarnings(warnings);
    this.startedAt = null; // Zeitpunkt des letzten Starts
    this.accumulated = 0; // gelaufene Zeit vor dem letzten Start
  }

  get running() {
    return this.startedAt !== null;
  }

  elapsed(now = Date.now()) {
    return this.accumulated + (this.startedAt !== null ? Math.max(0, now - this.startedAt) : 0);
  }

  start(now = Date.now()) {
    if (this.startedAt === null) this.startedAt = now;
  }

  pause(now = Date.now()) {
    if (this.startedAt !== null) {
      this.accumulated = this.elapsed(now);
      this.startedAt = null;
    }
  }

  toggle(now = Date.now()) {
    if (this.running) this.pause(now);
    else this.start(now);
  }

  reset() {
    this.startedAt = null;
    this.accumulated = 0;
  }

  set({ durationMs, mode, warnings } = {}) {
    if (durationMs !== undefined) this.durationMs = clampDuration(durationMs);
    if (mode === 'countdown' || mode === 'stopwatch') this.mode = mode;
    if (warnings !== undefined) this.warnings = cleanWarnings(warnings);
  }

  /** Befehl vom Handy oder aus der App ausführen. */
  apply(op, arg = {}, now = Date.now()) {
    if (op === 'start') this.start(now);
    else if (op === 'pause') this.pause(now);
    else if (op === 'toggle') this.toggle(now);
    else if (op === 'reset') this.reset();
    else if (op === 'set') this.set(arg || {});
    else if (op === 'add') this.durationMs = clampDuration(this.durationMs + Number(arg?.ms || 0));
    else return false;
    return true;
  }

  snapshot(now = Date.now()) {
    const elapsed = this.elapsed(now);
    return {
      mode: this.mode,
      running: this.running,
      durationMs: this.durationMs,
      elapsed,
      remaining: this.durationMs - elapsed, // darf negativ werden (Überziehung)
      warnings: this.warnings,
      at: now,
    };
  }
}

function clampDuration(ms) {
  const n = Math.round(Number(ms) || 0);
  return Math.min(Math.max(n, 60_000), 5 * 3600_000);
}
function cleanWarnings(w) {
  if (!Array.isArray(w)) return [120, 60, 0];
  return [...new Set(w.map(Number).filter((n) => Number.isFinite(n) && n >= 0 && n <= 3600))].sort((a, b) => b - a);
}

/** Welche Warnschwellen (Sekunden) wurden zwischen zwei Restzeiten überschritten? */
function crossedWarnings(prevRemainingMs, nowRemainingMs, warnings) {
  return warnings.filter((s) => prevRemainingMs > s * 1000 && nowRemainingMs <= s * 1000);
}

module.exports = { Timer, crossedWarnings };
