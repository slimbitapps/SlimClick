'use strict';
/**
 * Tastendrücke an das Programm im Vordergrund schicken (PowerPoint, Keynote, Browser, PDF …).
 * Ohne native Zusatzmodule: Auf dem Mac läuft ein kleines JavaScript über "osascript",
 * auf Windows ein PowerShell-Skript. Beide bleiben im Hintergrund offen → kaum Verzögerung.
 *
 * Eine Taste wird als Text beschrieben: "right", "f5", "enter:cmd,shift" (Taste:Zusatztasten).
 */
const { spawn } = require('node:child_process');
const { EventEmitter } = require('node:events');

/** Programme für "Präsentation starten" */
const START_APPS = ['powerpoint', 'keynote', 'google', 'pdf'];

/**
 * Aktion vom Handy → Tasten.
 * @param {string} action
 * @param {any} args
 * @param {{platform: string, scheme?: 'arrows'|'pages'}} opts
 * @returns {string[] | null}
 */
function keysFor(action, args, { platform, scheme = 'arrows' }) {
  const mac = platform === 'darwin';
  const mod = mac ? 'cmd' : 'ctrl';
  switch (action) {
    case 'next':
      return [scheme === 'pages' ? 'pagedown' : 'right'];
    case 'prev':
      return [scheme === 'pages' ? 'pageup' : 'left'];
    case 'first':
      return ['home'];
    case 'last':
      return ['end'];
    case 'black':
      return ['b'];
    case 'white':
      return ['w'];
    case 'end':
      return ['escape'];
    case 'goto': {
      const n = Math.floor(Number(args?.n));
      if (!Number.isFinite(n) || n < 1 || n > 9999) return null;
      return [...String(n)].map((d) => 'd' + d).concat('enter');
    }
    case 'start': {
      const app = START_APPS.includes(args?.app) ? args.app : 'powerpoint';
      if (app === 'powerpoint') return [mac ? 'enter:cmd,shift' : 'f5'];
      if (app === 'keynote') return ['p:alt,cmd'];
      if (app === 'google') return [`enter:${mod}`];
      if (app === 'pdf') return [mac ? 'f:cmd,shift' : 'l:ctrl'];
      return null;
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------- Mac (JavaScript for Automation)
const MAC_CODES = {
  right: 124, left: 123, down: 125, up: 126, pagedown: 121, pageup: 116, home: 115, end: 119,
  escape: 53, enter: 36, space: 49, b: 11, w: 13, l: 37, f: 3, p: 35, f5: 96, f11: 103,
  d0: 29, d1: 18, d2: 19, d3: 20, d4: 21, d5: 23, d6: 22, d7: 26, d8: 28, d9: 25,
};
const MAC_SCRIPT = `
ObjC.import('Foundation'); ObjC.import('CoreGraphics');
var KC = ${JSON.stringify(MAC_CODES)};
var FL = { cmd: 0x100000, shift: 0x20000, alt: 0x80000, ctrl: 0x40000 };
var out = $.NSFileHandle.fileHandleWithStandardOutput;
function say(s) { out.writeData($(s + '\\n').dataUsingEncoding($.NSUTF8StringEncoding)); }
function press(spec) {
  var p = spec.split(':'); var kc = KC[p[0]]; if (kc === undefined) return;
  var flags = 0; (p[1] || '').split(',').forEach(function (m) { if (FL[m]) flags |= FL[m]; });
  var d = $.CGEventCreateKeyboardEvent(null, kc, true);
  var u = $.CGEventCreateKeyboardEvent(null, kc, false);
  $.CGEventSetFlags(d, flags); $.CGEventSetFlags(u, flags);
  $.CGEventPost(0, d); delay(0.008); $.CGEventPost(0, u);
}
var inp = $.NSFileHandle.fileHandleWithStandardInput; var buf = '';
say('ready');
while (true) {
  var data = inp.availableData; if (data.length == 0) break;
  buf += $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding).js;
  var lines = buf.split('\\n'); buf = lines.pop();
  lines.forEach(function (l) { l.trim().split(' ').forEach(function (s) { if (s) { press(s); delay(0.02); } }); say('ok'); });
}
`;

// ---------------------------------------------------------------- Windows (PowerShell + user32)
const WIN_CODES = {
  right: 0x27, left: 0x25, up: 0x26, down: 0x28, pagedown: 0x22, pageup: 0x21, home: 0x24, end: 0x23,
  escape: 0x1b, enter: 0x0d, space: 0x20, b: 0x42, w: 0x57, l: 0x4c, f: 0x46, p: 0x50, f5: 0x74, f11: 0x7a,
  d0: 0x30, d1: 0x31, d2: 0x32, d3: 0x33, d4: 0x34, d5: 0x35, d6: 0x36, d7: 0x37, d8: 0x38, d9: 0x39,
};
const WIN_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public static class SlimKeys { [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra); }
"@
$VK = @{ ${Object.entries(WIN_CODES).map(([k, v]) => `'${k}'=${v}`).join('; ')} }
$EXT = @('right','left','up','down','home','end','pageup','pagedown')
$MOD = @{ 'ctrl'=0x11; 'cmd'=0x11; 'shift'=0x10; 'alt'=0x12 }
function Press([string]$spec) {
  $p = $spec.Split(':'); $k = $p[0]
  if (-not $VK.ContainsKey($k)) { return }
  $mods = @(); if ($p.Length -gt 1 -and $p[1]) { $mods = @($p[1].Split(',') | ForEach-Object { $MOD[$_] } | Where-Object { $_ }) }
  foreach ($m in $mods) { [SlimKeys]::keybd_event([byte]$m, 0, 0, [UIntPtr]::Zero) }
  $f = 0; if ($EXT -contains $k) { $f = 1 }
  [SlimKeys]::keybd_event([byte]$VK[$k], 0, $f, [UIntPtr]::Zero)
  Start-Sleep -Milliseconds 8
  [SlimKeys]::keybd_event([byte]$VK[$k], 0, ($f -bor 2), [UIntPtr]::Zero)
  [array]::Reverse($mods); foreach ($m in $mods) { [SlimKeys]::keybd_event([byte]$m, 0, 2, [UIntPtr]::Zero) }
}
[Console]::Out.WriteLine('ready'); [Console]::Out.Flush()
while ($null -ne ($line = [Console]::In.ReadLine())) {
  foreach ($s in $line.Trim().Split(' ')) { if ($s) { Press $s; Start-Sleep -Milliseconds 20 } }
  [Console]::Out.WriteLine('ok'); [Console]::Out.Flush()
}
`;

const LINUX_NAMES = {
  right: 'Right', left: 'Left', up: 'Up', down: 'Down', pagedown: 'Next', pageup: 'Prior', home: 'Home', end: 'End',
  escape: 'Escape', enter: 'Return', space: 'space', b: 'b', w: 'w', l: 'l', f: 'f', p: 'p', f5: 'F5', f11: 'F11',
};
function linuxKey(spec) {
  const [k, mods] = spec.split(':');
  const name = /^d\d$/.test(k) ? k.slice(1) : LINUX_NAMES[k];
  if (!name) return null;
  const m = (mods || '').split(',').filter(Boolean).map((x) => (x === 'cmd' ? 'super' : x));
  return [...m, name].join('+');
}

/** Prüft eine Tastenbeschreibung, bevor sie an ein Hilfsprogramm geht. */
function isValidSpec(spec) {
  return typeof spec === 'string' && /^[a-z0-9]+(:(cmd|ctrl|shift|alt)(,(cmd|ctrl|shift|alt))*)?$/.test(spec) && spec.split(':')[0] in MAC_CODES;
}

class KeySender extends EventEmitter {
  /**
   * @param {{platform?: string, backend?: 'auto'|'record', spawnFn?: typeof spawn}} opts
   */
  constructor({ platform = process.platform, backend = 'auto', spawnFn = spawn } = {}) {
    super();
    this.platform = platform;
    this.backend = backend;
    this.spawn = spawnFn;
    this.proc = null;
    this.recorded = [];
    this.failures = 0;
  }

  /** Hilfsprozess schon beim Start hochfahren, damit der erste Klick sofort wirkt. */
  warmUp() {
    if (this.backend === 'auto' && (this.platform === 'darwin' || this.platform === 'win32')) this.ensureProc();
  }

  ensureProc() {
    if (this.proc && !this.proc.killed && this.proc.exitCode === null) return this.proc;
    let p;
    if (this.platform === 'darwin') {
      p = this.spawn('/usr/bin/osascript', ['-l', 'JavaScript', '-e', MAC_SCRIPT], { stdio: ['pipe', 'pipe', 'pipe'] });
    } else {
      const enc = Buffer.from(WIN_SCRIPT, 'utf16le').toString('base64');
      p = this.spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', enc], {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });
    }
    p.stdout?.on('data', (d) => {
      if (String(d).includes('ready')) this.emit('ready');
    });
    p.stderr?.on('data', (d) => this.emit('log', String(d)));
    p.on('error', (e) => this.emit('log', String(e)));
    p.on('exit', (code) => {
      if (this.proc === p) this.proc = null;
      this.emit('log', `key helper exited (${code})`);
    });
    this.proc = p;
    return p;
  }

  /** @param {string[]} specs */
  send(specs) {
    const list = (specs || []).filter(isValidSpec);
    if (!list.length) return false;
    if (this.backend === 'record') {
      this.recorded.push(...list);
      this.emit('sent', list);
      return true;
    }
    if (this.platform === 'linux') {
      for (const s of list) {
        const k = linuxKey(s);
        if (k) this.spawn('xdotool', ['key', '--clearmodifiers', k], { stdio: 'ignore' }).on('error', () => this.emit('log', 'xdotool missing'));
      }
      this.emit('sent', list);
      return true;
    }
    try {
      const p = this.ensureProc();
      p.stdin.write(list.join(' ') + '\n');
      this.emit('sent', list);
      return true;
    } catch (e) {
      this.emit('log', String(e));
      return false;
    }
  }

  stop() {
    if (this.proc) {
      try {
        this.proc.stdin.end();
        this.proc.kill();
      } catch {
        /* egal */
      }
      this.proc = null;
    }
  }
}

module.exports = { keysFor, KeySender, isValidSpec, linuxKey, START_APPS, MAC_SCRIPT, WIN_SCRIPT, MAC_CODES, WIN_CODES };
