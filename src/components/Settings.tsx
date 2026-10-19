import { useEffect, useState, type ReactNode } from 'react';
import { t, LANGS, getLocale, type TKey } from '../i18n';
import { useStore, updateSettings, updatePrefs, closeDialog, showIntroAgain } from '../store';
import type { AppInfo, DisplayInfo, Lang, Prefs } from '../types';
import { Group, Logo, Row, Seg, Switch } from './ui';
import {
  IconClose, IconSettings, IconKeyboard, IconLaser, IconShield, IconNet, IconHelp, IconInfo, IconLock, IconCheck, IconPhone, IconTrash, IconRefresh,
} from '../icons';
import slimbitMark from '../assets/slimbit-mark.png';

const WEBSITE_URL = 'https://slimbitapps.github.io/';
const EMAIL = 'SlimBitApps@gmail.com';
type Tab = 'general' | 'control' | 'laser' | 'security' | 'network' | 'help' | 'about';

export function SettingsDialog({ tab: initial }: { tab?: string }) {
  const p = useStore((s) => s.settings.prefs);
  const expert = p.mode === 'expert';
  const [tab, setTab] = useState<Tab>((initial as Tab) || 'general');
  const all: [Tab, string, ReactNode, boolean][] = [
    ['general', t('settings.general'), <IconSettings size={17} key="g" />, true],
    ['control', t('settings.control'), <IconKeyboard size={17} key="c" />, true],
    ['laser', t('settings.laser'), <IconLaser size={17} key="l" />, true],
    ['security', t('settings.security'), <IconShield size={17} key="s" />, true],
    ['network', t('settings.network'), <IconNet size={17} key="n" />, expert],
    ['help', t('settings.help'), <IconHelp size={17} key="h" />, true],
    ['about', t('settings.about'), <IconInfo size={17} key="a" />, true],
  ];
  const nav = all.filter((x) => x[3]);
  useEffect(() => {
    if (!nav.some((x) => x[0] === tab)) setTab('general');
  });
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && closeDialog();
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, []);

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeDialog()}>
      <div className="dialog xwide" role="dialog" aria-label={t('common.settings')} data-testid="settings">
        <div className="settings">
          <nav className="settings-nav">
            <h2>{t('common.settings')}</h2>
            {nav.map(([id, label, icon]) => (
              <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)} data-testid={`settings-${id}`}>
                {icon}
                {label}
              </button>
            ))}
          </nav>
          <div className="settings-main">
            <button className="btn icon ghost sm close-x" onClick={closeDialog} aria-label={t('common.close')}>
              <IconClose size={16} />
            </button>
            {tab === 'general' && <GeneralTab />}
            {tab === 'control' && <ControlTab />}
            {tab === 'laser' && <LaserTab />}
            {tab === 'security' && <SecurityTab />}
            {tab === 'network' && <NetworkTab />}
            {tab === 'help' && <HelpTab />}
            {tab === 'about' && <AboutTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Head({ title, sub }: { title: TKey; sub: TKey }) {
  return (
    <>
      <h3>{t(title)}</h3>
      <p className="sub">{t(sub)}</p>
    </>
  );
}

function GeneralTab() {
  const p = useStore((s) => s.settings.prefs);
  return (
    <>
      <Head title="settings.general" sub="settings.general.sub" />
      <Group>
        <Row label={t('settings.lang')}>
          <select className="select" value={p.lang} onChange={(e) => updatePrefs({ lang: e.target.value as Lang })} data-testid="lang-select">
            {LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </Row>
        <Row label={t('settings.theme')}>
          <Seg<Prefs['theme']>
            value={p.theme}
            onChange={(theme) => updatePrefs({ theme })}
            options={[
              ['light', t('theme.light')],
              ['dark', t('theme.dark')],
              ['system', t('theme.system')],
            ]}
          />
        </Row>
        <Row label={t('settings.mode')} desc={t('settings.mode.desc')}>
          <Seg<Prefs['mode']>
            value={p.mode}
            onChange={(mode) => updatePrefs({ mode })}
            options={[
              ['simple', t('mode.simple')],
              ['expert', t('mode.expert')],
            ]}
          />
        </Row>
      </Group>
      <button className="btn ghost sm" onClick={showIntroAgain}>
        {t('settings.intro')}
      </button>
    </>
  );
}

function ControlTab() {
  const s = useStore((x) => x.settings);
  const expert = s.prefs.mode === 'expert';
  const set = (control: Partial<typeof s.control>) => updateSettings({ control });
  return (
    <>
      <Head title="settings.control" sub="settings.control.sub" />
      <Group>
        <Row label={t('set.preview')} desc={t('set.preview.desc')}>
          <Switch on={s.control.preview} onChange={(preview) => set({ preview })} testId="preview-switch" />
        </Row>
        <Row label={t('set.keepAwake')} desc={t('set.keepAwake.desc')}>
          <Switch on={s.control.keepAwake} onChange={(keepAwake) => set({ keepAwake })} />
        </Row>
        {expert && (
          <Row label={t('set.scheme')} desc={t('set.scheme.desc')}>
            <Seg
              value={s.control.scheme}
              onChange={(scheme) => set({ scheme })}
              options={[
                ['arrows', t('set.scheme.arrows')],
                ['pages', t('set.scheme.pages')],
              ]}
            />
          </Row>
        )}
      </Group>
    </>
  );
}

const COLORS = ['#ff3b30', '#33c37a', '#3f8cff', '#f6b03c', '#ff3df0'];

function LaserTab() {
  const s = useStore((x) => x.settings);
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  useEffect(() => {
    window.api.displays().then(setDisplays);
  }, []);
  const set = (laser: Partial<typeof s.laser>) => updateSettings({ laser });
  return (
    <>
      <Head title="settings.laser" sub="settings.laser.sub" />
      <Group>
        <Row label={t('set.laser.color')}>
          <div className="colors">
            {COLORS.map((c) => (
              <button key={c} className={s.laser.color === c ? 'on' : ''} style={{ background: c }} onClick={() => set({ color: c })} aria-label={c} />
            ))}
          </div>
        </Row>
        <Row label={t('set.laser.size')}>
          <Seg
            value={s.laser.size}
            onChange={(size) => set({ size })}
            options={[
              ['s', t('set.size.s')],
              ['m', t('set.size.m')],
              ['l', t('set.size.l')],
            ]}
          />
        </Row>
        <Row label={t('set.laser.display')} desc={t('set.laser.display.desc')}>
          <select className="select" value={s.laser.display} onChange={(e) => set({ display: e.target.value })}>
            <option value="auto">{t('set.display.auto')}</option>
            {displays.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} · {d.w}×{d.h}
                {d.primary ? ` (${t('set.display.primary')})` : ''}
              </option>
            ))}
          </select>
        </Row>
      </Group>
    </>
  );
}

function SecurityTab() {
  const s = useStore((x) => x.settings);
  const info = useStore((x) => x.info);
  const online = new Set(info?.clients.map((c) => c.id));
  const devices = info?.devices ?? s.devices;
  const fmt = (ms?: number) => (ms ? new Date(ms).toLocaleString(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }) : '–');
  return (
    <>
      <Head title="settings.security" sub="settings.security.sub" />
      <Group>
        <Row label={t('set.approve')} desc={t('set.approve.desc')}>
          <Switch on={s.security.approveNew} onChange={(approveNew) => updateSettings({ security: { approveNew } })} />
        </Row>
        <Row label={t('set.newCode')} desc={t('set.newCode.desc')}>
          <button className="btn sm" onClick={() => window.api.newCode()}>
            <IconRefresh size={15} />
            {t('home.newCode')}
          </button>
        </Row>
      </Group>
      <Group label={t('set.devices')}>
        {devices.length === 0 && <div className="setting-row faint">{t('set.devices.none')}</div>}
        {devices.map((d) => (
          <div className="setting-row" key={d.id} data-testid="device-row">
            <IconPhone size={18} className="faint" />
            <div className="lbl">
              <div className="t">
                {d.name} {online.has(d.id) && <span className="badge success">{t('set.devices.online')}</span>}
              </div>
              <div className="d">{t('set.devices.seen', { date: fmt(d.lastSeen) })}</div>
            </div>
            <button className="btn sm ghost" onClick={() => window.api.removeDevice(d.id)} aria-label={t('common.remove')}>
              <IconTrash size={15} />
              {t('common.remove')}
            </button>
          </div>
        ))}
      </Group>
      {devices.length > 1 && (
        <button className="btn sm danger" onClick={() => window.api.removeAllDevices()}>
          {t('set.devices.removeAll')}
        </button>
      )}
      <div className="section-label" style={{ marginTop: 22 }}>
        {t('set.how.title')}
      </div>
      <ul className="how-list">
        {(['set.how.1', 'set.how.2', 'set.how.3'] as const).map((k) => (
          <li key={k}>
            <IconCheck size={15} strokeWidth={2.6} />
            {t(k)}
          </li>
        ))}
      </ul>
    </>
  );
}

function NetworkTab() {
  const s = useStore((x) => x.settings);
  const info = useStore((x) => x.info);
  const [port, setPort] = useState(String(s.network.port));
  return (
    <>
      <Head title="settings.network" sub="settings.network.sub" />
      <Group>
        <Row label={t('set.address')} desc={t('set.address.desc')}>
          <select className="select" value={s.network.address} onChange={(e) => updateSettings({ network: { address: e.target.value } })}>
            <option value="auto">{t('set.address.auto')}</option>
            {info?.addresses.map((a) => (
              <option key={a.address} value={a.address}>
                {a.address} · {a.name}
              </option>
            ))}
          </select>
        </Row>
        <Row label={t('set.port')} desc={t('set.port.desc')}>
          <div className="row">
            <input className="input" style={{ width: 90 }} value={port} onChange={(e) => setPort(e.target.value.replace(/\D/g, '').slice(0, 5))} />
            <button
              className="btn sm"
              disabled={Number(port) === s.network.port || Number(port) > 65535}
              onClick={() => updateSettings({ network: { port: Number(port) } })}
            >
              {t('set.port.apply')}
            </button>
          </div>
        </Row>
      </Group>
      <p className="mono faint">{info?.base}</p>
    </>
  );
}

function HelpTab() {
  const [open, setOpen] = useState<number | null>(1);
  return (
    <>
      <Head title="settings.help" sub="settings.help.sub" />
      <div className="faq">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n} className={`faq-item ${open === n ? 'open' : ''}`}>
            <button onClick={() => setOpen(open === n ? null : n)}>{t(`faq.${n}.q` as TKey)}</button>
            {open === n && <p>{t(`faq.${n}.a` as TKey)}</p>}
          </div>
        ))}
      </div>
    </>
  );
}

function AboutTab() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  useEffect(() => {
    window.api.appInfo().then(setInfo);
  }, []);
  return (
    <>
      <div className="row" style={{ gap: 16, marginBottom: 20 }}>
        <Logo size={64} />
        <div>
          <h3 style={{ marginBottom: 0 }}>{t('app.name')}</h3>
          <div className="muted">{t('about.version', { v: info?.version || '…' })}</div>
          <div className="faint small">{t('app.tagline')}</div>
        </div>
      </div>
      <Group>
        <Row label={t('about.privacy.title')} desc={t('about.privacy')}>
          <IconLock size={18} className="faint" />
        </Row>
      </Group>

      <div className="section-label">{t('about.more')}</div>
      <button className="app-card link" style={{ marginBottom: 14 }} onClick={() => window.api.openExternal(WEBSITE_URL)} data-testid="website-link">
        <div className="row" style={{ gap: 12 }}>
          <img src={slimbitMark} alt="" width={36} height={36} />
          <div className="grow">
            <div style={{ fontWeight: 620 }}>{t('about.website')}</div>
            <div className="small faint">{t('about.website.desc')}</div>
          </div>
          <span className="small" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            {WEBSITE_URL.replace(/^https:\/\//, '').replace(/\/$/, '')} ↗
          </span>
        </div>
      </button>
      <p className="small muted">
        {t('about.contact', { mail: '' })}
        <button className="link" onClick={() => window.api.openExternal('mailto:' + EMAIL)}>
          {EMAIL}
        </button>
      </p>
      <div className="row small faint" style={{ justifyContent: 'space-between' }}>
        <span>{t('about.copyright', { year: new Date().getFullYear() })}</span>
        <span>
          Electron {info?.electron} · {info?.platform}
        </span>
      </div>
    </>
  );
}
