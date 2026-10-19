export type Lang = 'de' | 'en' | 'fr' | 'es' | 'it';

export interface Prefs {
  lang: Lang | '';
  theme: 'light' | 'dark' | 'system';
  mode: 'simple' | 'expert';
}

export interface Device {
  id: string;
  name: string;
  added: number;
  lastSeen?: number;
}

export interface Settings {
  version: number;
  onboarded: boolean;
  prefs: Prefs;
  control: { scheme: 'arrows' | 'pages'; preview: boolean; keepAwake: boolean };
  laser: { color: string; size: 's' | 'm' | 'l'; display: string };
  security: { approveNew: boolean };
  network: { address: string; port: number };
  timer: { durationMs: number; mode: 'countdown' | 'stopwatch'; warnings: number[] };
  devices: Device[];
}

export interface Address {
  name: string;
  address: string;
  kind: 'wifi' | 'ethernet' | 'hotspot' | 'iphone-hotspot' | 'other';
  score: number;
}

export interface RemoteInfo {
  url: string;
  base: string;
  qr: string;
  address: Address | null;
  addresses: Address[];
  port: number;
  clients: { id: string; name: string; ip: string }[];
  devices: Device[];
  lastHit: number;
}

export interface TimerSnap {
  mode: 'countdown' | 'stopwatch';
  running: boolean;
  durationMs: number;
  elapsed: number;
  remaining: number;
  warnings: number[];
  at: number;
}

export interface Action {
  c: string;
  a: unknown;
  name: string;
  at: number;
}

export interface AppInfo {
  version: string;
  electron: string;
  platform: string;
  locale: string;
}

export interface Perms {
  accessibility: string;
  screen: string;
}

export interface DisplayInfo {
  id: string;
  label: string;
  primary: boolean;
  w: number;
  h: number;
}

export interface Api {
  getSettings(): Promise<Settings>;
  setSettings(p: Partial<Settings> | Record<string, unknown>): Promise<Settings>;
  appInfo(): Promise<AppInfo>;
  remoteInfo(): Promise<RemoteInfo>;
  newCode(): Promise<void>;
  disconnect(id: string): Promise<void>;
  removeDevice(id: string): Promise<void>;
  removeAllDevices(): Promise<void>;
  answerApproval(id: string, ok: boolean): Promise<void>;
  pendingApprovals(): Promise<{ id: string; name: string }[]>;
  timer(op: string, arg?: unknown): Promise<TimerSnap>;
  getTimer(): Promise<TimerSnap>;
  lastAction(): Promise<Action | null>;
  getPreview(): Promise<string | null>;
  openDemo(): Promise<void>;
  permStatus(): Promise<Perms>;
  permRequest(kind: 'accessibility' | 'screen'): Promise<Perms>;
  displays(): Promise<DisplayInfo[]>;
  openExternal(url: string): Promise<void>;
  copy(text: string): Promise<void>;
  setTheme(theme: string): Promise<void>;
  log(...a: unknown[]): Promise<void>;
  platform: string;
  on(channel: string, cb: (payload: any) => void): () => void;
}
