import { create } from 'zustand';
import type { Action, Perms, RemoteInfo, Settings, TimerSnap, Prefs, Lang } from './types';
import { setLang } from './i18n';

type Dialog = { kind: 'settings'; tab?: string } | { kind: 'hotspot' } | null;

interface State {
  ready: boolean;
  settings: Settings;
  info: RemoteInfo | null;
  timer: TimerSnap | null;
  last: Action | null;
  preview: string | null;
  perms: Perms;
  approvals: { id: string; name: string }[];
  dialog: Dialog;
  showIntro: boolean;
}

export const useStore = create<State>(() => ({
  ready: false,
  settings: null as unknown as Settings,
  info: null,
  timer: null,
  last: null,
  preview: null,
  perms: { accessibility: 'granted', screen: 'granted' },
  approvals: [],
  dialog: null,
  showIntro: false,
}));
const set = useStore.setState;
const get = useStore.getState;

/** Sprache des Computers erraten (nur beim ersten Start) */
function guessLang(locale: string): Lang {
  const l = (locale || navigator.language || 'en').slice(0, 2).toLowerCase();
  return (['de', 'en', 'fr', 'es', 'it'] as const).includes(l as Lang) ? (l as Lang) : 'en';
}

export function applyTheme(theme: Prefs['theme']) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  window.api.setTheme(theme);
}

export async function init() {
  const [settings, info, timer, last, preview, perms, approvals, appInfo] = await Promise.all([
    window.api.getSettings(),
    window.api.remoteInfo(),
    window.api.getTimer(),
    window.api.lastAction(),
    window.api.getPreview(),
    window.api.permStatus(),
    window.api.pendingApprovals(),
    window.api.appInfo(),
  ]);
  if (!settings.prefs.lang) settings.prefs.lang = guessLang(appInfo.locale);
  setLang(settings.prefs.lang as Lang);
  applyTheme(settings.prefs.theme);
  document.documentElement.classList.add('platform-' + window.api.platform);
  set({ ready: true, settings, info, timer, last, preview, perms, approvals });

  window.api.on('remote:update', (info: RemoteInfo) => set({ info }));
  window.api.on('timer', (timer: TimerSnap) => set({ timer }));
  window.api.on('action', (last: Action) => set({ last }));
  window.api.on('preview', (preview: string | null) => set({ preview }));
  window.api.on('approval', (req: { id: string; name: string }) => set({ approvals: [...get().approvals.filter((a) => a.id !== req.id), req] }));
  window.api.on('approval-done', (id: string) => set({ approvals: get().approvals.filter((a) => a.id !== id) }));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(get().settings.prefs.theme));
  // Berechtigungen können sich in den Systemeinstellungen ändern → regelmäßig nachsehen
  setInterval(async () => set({ perms: await window.api.permStatus() }), 3000);
}

export async function updateSettings(partial: Partial<Settings> | Record<string, unknown>) {
  const s = await window.api.setSettings(partial);
  set({ settings: s });
  return s;
}

export async function updatePrefs(p: Partial<Prefs>) {
  const s = await updateSettings({ prefs: p });
  if (p.lang) setLang(p.lang as Lang);
  if (p.theme) applyTheme(s.prefs.theme);
  set({ settings: { ...s } });
}

export async function finishOnboarding() {
  await updateSettings({ onboarded: true, prefs: get().settings.prefs });
  set({ showIntro: false });
}

export function openDialog(d: Dialog) {
  set({ dialog: d });
}
export function closeDialog() {
  set({ dialog: null });
}
export function showIntroAgain() {
  set({ showIntro: true, dialog: null });
}
export async function refreshPerms() {
  set({ perms: await window.api.permStatus() });
}
