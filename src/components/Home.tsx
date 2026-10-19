import { useEffect, useRef, useState } from 'react';
import { t, type TKey } from '../i18n';
import { useStore, openDialog } from '../store';
import type { TimerSnap } from '../types';
import { Logo } from './ui';
import {
  IconSettings, IconHelp, IconCheck, IconHotspot, IconRefresh, IconCopy, IconSlides, IconPlay, IconPause, IconAlert, IconPhone, IconWifi, IconLock,
} from '../icons';

export function Header() {
  return (
    <header className="header">
      <div className="brand">
        <Logo size={24} />
        SlimClick
      </div>
      <div className="spacer" />
      <button className="btn ghost sm" onClick={() => openDialog({ kind: 'hotspot' })} data-testid="open-hotspot">
        <IconHotspot size={16} />
        {t('home.trouble.btn')}
      </button>
      <button className="btn icon ghost" onClick={() => openDialog({ kind: 'settings', tab: 'help' })} aria-label={t('common.help')}>
        <IconHelp size={18} />
      </button>
      <button className="btn icon ghost" onClick={() => openDialog({ kind: 'settings' })} aria-label={t('common.settings')} data-testid="open-settings">
        <IconSettings size={18} />
      </button>
    </header>
  );
}

export function Home() {
  const perms = useStore((s) => s.perms);
  const isMac = window.api.platform === 'darwin';
  const needAcc = isMac && perms.accessibility !== 'granted';
  return (
    <div className="screen">
      <div className="home">
        {needAcc && <PermBanner />}
        <div className="home-grid">
          <ConnectCard />
          <div className="side">
            <StatusCard />
            <PreviewCard />
            <TimerCard />
            <DemoCard />
          </div>
        </div>
      </div>
    </div>
  );
}

function PermBanner() {
  return (
    <div className="banner warn" data-testid="perm-banner">
      <IconAlert size={18} />
      <div className="grow">
        <b>{t('home.perm.title')}</b> {t('home.perm.acc')}
      </div>
      <button className="btn primary sm" onClick={() => window.api.permRequest('accessibility')}>
        {t('home.perm.btn')}
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ Verbinden (QR-Code)
function ConnectCard() {
  const info = useStore((s) => s.info);
  const expert = useStore((s) => s.settings.prefs.mode === 'expert');
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const shownAt = useRef(Date.now());
  const [stuck, setStuck] = useState(false);
  const clients = info?.clients ?? [];
  const connected = clients.length > 0;

  // Kommt nach 40 s niemand auf die Seite, ist das WLAN vermutlich der Grund → Hotspot-Tipp
  useEffect(() => {
    if (connected) {
      setShowQr(false);
      setStuck(false);
      return;
    }
    shownAt.current = Date.now();
    const id = setInterval(() => {
      const hit = useStore.getState().info?.lastHit ?? 0;
      setStuck(Date.now() - shownAt.current > 40_000 && hit < shownAt.current);
    }, 2000);
    return () => clearInterval(id);
  }, [connected]);

  if (!info) return <section className="card connect-card" />;

  if (!info.address) {
    return (
      <section className="card connect-card center">
        <div className="big-ic warn">
          <IconWifi size={30} />
        </div>
        <h2>{t('home.noNetwork.title')}</h2>
        <p className="muted">{t('home.noNetwork.text')}</p>
        <button className="btn primary" onClick={() => openDialog({ kind: 'hotspot' })}>
          <IconHotspot size={16} />
          {t('home.trouble.btn')}
        </button>
      </section>
    );
  }

  if (connected && !showQr) {
    return (
      <section className="card connect-card center" data-testid="connected">
        <div className="big-ic ok">
          <IconCheck size={34} strokeWidth={2.6} />
        </div>
        <h2>{t('home.connected')}</h2>
        <div className="client-list">
          {clients.map((c) => (
            <div className="client" key={c.id}>
              <IconPhone size={18} />
              <span className="grow ellipsis">{c.name}</span>
              <button className="btn sm ghost" onClick={() => window.api.disconnect(c.id)}>
                {t('home.disconnect')}
              </button>
            </div>
          ))}
        </div>
        <NetChip />
        <button className="btn ghost sm" style={{ marginTop: 14 }} onClick={() => setShowQr(true)} data-testid="add-device">
          {t('home.addDevice')}
        </button>
      </section>
    );
  }

  return (
    <section className="card connect-card" data-testid="connect">
      <h2>{t('home.connect.title')}</h2>
      <div className="qr-wrap">
        <div className="qr" data-testid="qr" dangerouslySetInnerHTML={{ __html: info.qr }} />
      </div>
      <ol className="steps">
        <li>
          <span className="num">1</span>
          {t('home.step1')}
        </li>
        <li>
          <span className="num">2</span>
          {t('home.step2')}
        </li>
        <li>
          <span className="num">3</span>
          {t('home.step3')}
        </li>
      </ol>
      <div className="qr-meta">
        <IconLock size={13} />
        {t('home.oneTime')}
      </div>
      <div className="row qr-actions">
        <NetChip />
        <div className="spacer" />
        <button className="btn sm ghost" onClick={() => window.api.newCode()} data-testid="new-code">
          <IconRefresh size={15} />
          {t('home.newCode')}
        </button>
        {expert && (
          <button
            className="btn sm ghost"
            onClick={() => {
              window.api.copy(info.url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            <IconCopy size={15} />
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        )}
        {connected && (
          <button className="btn sm ghost" onClick={() => setShowQr(false)}>
            {t('home.hideQr')}
          </button>
        )}
      </div>
      {stuck ? (
        <div className="stuck" data-testid="stuck">
          <IconAlert size={18} />
          <div className="grow">{t('home.stuck')}</div>
          <button className="btn primary sm" onClick={() => openDialog({ kind: 'hotspot' })}>
            {t('home.trouble.btn')}
          </button>
        </div>
      ) : (
        <div className="trouble">
          {t('home.sameWifi')}{' '}
          <button className="link" onClick={() => openDialog({ kind: 'hotspot' })}>
            {t('home.trouble')}
          </button>
        </div>
      )}
    </section>
  );
}

export function NetChip() {
  const a = useStore((s) => s.info?.address);
  if (!a) return null;
  return (
    <span className={`net-chip ${a.kind}`} title={a.name}>
      {a.kind.includes('hotspot') ? <IconHotspot size={14} /> : <IconWifi size={14} />}
      {t(`net.${a.kind}` as TKey)} · <span className="mono">{a.address}</span>
    </span>
  );
}

// ------------------------------------------------------------------ Status / zuletzt gedrückt
function actionLabel(c: string, a: unknown) {
  if (c === 'goto') return t('action.goto', { n: (a as { n?: number })?.n ?? '?' });
  return t(`action.${c}` as TKey);
}

function StatusCard() {
  const info = useStore((s) => s.info);
  const last = useStore((s) => s.last);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!last) return;
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(id);
  }, [last]);
  const connected = (info?.clients.length ?? 0) > 0;
  return (
    <section className="card pad status-card" data-testid="status">
      <div className="row">
        <i className={`dot ${connected ? 'on' : ''}`} />
        <b className="grow">{connected ? `${t('home.connected')} · ${info!.clients.map((c) => c.name).join(', ')}` : t('home.waiting')}</b>
      </div>
      {last && (
        <div className={`last-action ${flash ? 'flash' : ''}`} data-testid="last-action">
          <span className="faint small">{t('home.last')}</span>
          <span className="pill">{actionLabel(last.c, last.a)}</span>
        </div>
      )}
      {!last && (
        <ol className="howto">
          <li>{t('home.howto.1')}</li>
          <li>{t('home.howto.2')}</li>
          <li>{t('home.howto.3')}</li>
        </ol>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ Vorschau
function PreviewCard() {
  const preview = useStore((s) => s.preview);
  const settings = useStore((s) => s.settings);
  const perms = useStore((s) => s.perms);
  const connected = useStore((s) => (s.info?.clients.length ?? 0) > 0);
  let msg = '';
  if (!settings.control.preview) msg = t('home.preview.off');
  else if (window.api.platform === 'darwin' && perms.screen !== 'granted') msg = t('home.preview.perm');
  else if (!connected || !preview) msg = t('home.preview.none');
  return (
    <section className="card pad">
      <div className="card-title">{t('home.preview.title')}</div>
      <div className="mini-preview">
        {preview && !msg ? <img src={preview} alt="" /> : <span className="faint small">{msg}</span>}
        {msg === t('home.preview.perm') && (
          <button className="btn sm" style={{ marginTop: 8 }} onClick={() => window.api.permRequest('screen')}>
            {t('home.perm.btn')}
          </button>
        )}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Timer
export function useTimerText(snap: TimerSnap | null) {
  const [, tick] = useState(0);
  const recv = useRef({ snap, at: performance.now() });
  if (recv.current.snap !== snap) recv.current = { snap, at: performance.now() };
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);
  if (!snap) return { text: '--:--', remaining: Infinity };
  const elapsed = snap.elapsed + (snap.running ? performance.now() - recv.current.at : 0);
  const remaining = snap.durationMs - elapsed;
  const ms = snap.mode === 'stopwatch' ? elapsed : remaining;
  const neg = ms < 0;
  const s = Math.floor(Math.abs(ms) / 1000 + (neg || snap.mode === 'stopwatch' ? 0 : 0.999));
  const text = `${neg ? '+' : ''}${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return { text, remaining };
}

function TimerCard() {
  const snap = useStore((s) => s.timer);
  const { text, remaining } = useTimerText(snap);
  const cd = snap?.mode !== 'stopwatch';
  const mins = snap ? Math.round(snap.durationMs / 60000) : 10;
  const cls = cd && remaining <= 0 ? 'over' : cd && remaining <= 120_000 ? 'warn' : '';
  return (
    <section className="card pad">
      <div className="row">
        <div className="card-title grow">{t('home.timer')}</div>
        <div className="seg sm">
          <button className={cd ? 'on' : ''} onClick={() => window.api.timer('set', { mode: 'countdown' })}>
            {t('timer.countdown')}
          </button>
          <button className={!cd ? 'on' : ''} onClick={() => window.api.timer('set', { mode: 'stopwatch' })}>
            {t('timer.stopwatch')}
          </button>
        </div>
      </div>
      <div className="row timer-row">
        <div className={`timer-big ${cls}`} data-testid="timer">
          {text}
        </div>
        <div className="spacer" />
        <button className="btn icon" onClick={() => window.api.timer('reset')} aria-label={t('timer.reset')}>
          <IconRefresh size={16} />
        </button>
        <button className="btn primary" onClick={() => window.api.timer('toggle')} data-testid="timer-toggle">
          {snap?.running ? <IconPause size={16} /> : <IconPlay size={16} />}
          {snap?.running ? t('timer.pause') : t('timer.start')}
        </button>
      </div>
      {cd && (
        <div className="chips">
          {[5, 10, 15, 20, 30, 45].map((m) => (
            <button key={m} className={m === mins ? 'on' : ''} onClick={() => window.api.timer('set', { durationMs: m * 60000 })}>
              {t('timer.minutes', { n: m })}
            </button>
          ))}
        </div>
      )}
      <p className="faint small" style={{ margin: '10px 0 0' }}>
        {t('timer.hint')}
      </p>
    </section>
  );
}

function DemoCard() {
  return (
    <section className="card pad demo-card">
      <div className="demo-ic">
        <IconSlides size={22} />
      </div>
      <div className="grow">
        <div className="card-title" style={{ margin: 0 }}>
          {t('home.demo.title')}
        </div>
        <div className="small muted">{t('home.demo.text')}</div>
      </div>
      <button className="btn" onClick={() => window.api.openDemo()} data-testid="open-demo">
        {t('home.demo.btn')}
      </button>
    </section>
  );
}
