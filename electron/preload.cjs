'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const invoke = (ch) => (...args) => ipcRenderer.invoke(ch, ...args);

contextBridge.exposeInMainWorld('api', {
  getSettings: invoke('settings:get'),
  setSettings: invoke('settings:set'),
  appInfo: invoke('app:info'),
  remoteInfo: invoke('remote:info'),
  newCode: invoke('remote:newCode'),
  disconnect: invoke('remote:disconnect'),
  removeDevice: invoke('devices:remove'),
  removeAllDevices: invoke('devices:removeAll'),
  answerApproval: invoke('approval:answer'),
  pendingApprovals: invoke('approval:pending'),
  timer: invoke('timer:cmd'),
  getTimer: invoke('timer:get'),
  lastAction: invoke('action:last'),
  getPreview: invoke('preview:get'),
  openDemo: invoke('demo:open'),
  permStatus: invoke('perm:status'),
  permRequest: invoke('perm:request'),
  displays: invoke('displays'),
  openExternal: invoke('shell:openExternal'),
  copy: invoke('clipboard:write'),
  setTheme: invoke('win:theme'),
  log: invoke('app:log'),
  platform: process.platform,
  on(channel, cb) {
    const fn = (_e, payload) => cb(payload);
    ipcRenderer.on(channel, fn);
    return () => ipcRenderer.removeListener(channel, fn);
  },
});
