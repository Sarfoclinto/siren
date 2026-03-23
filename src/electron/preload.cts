import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "./data.cjs";
import type {
  IPCResult,
  Schedule,
  ScheduleCreate,
  ScheduleUpdate,
  Sound,
  AppSettings,
  TTSVoice,
  TTSSpeakOptions,
  TriggerEvent,
} from "../../types.js";

// ─── API object ───────────────────────────────────────────────────────────────
// This is the ONLY surface the renderer can use to talk to Electron.
// No Node.js APIs leak through — contextIsolation: true enforces this.

const api = {
  // Schedules
  scheduleList: () =>
    ipcRenderer.invoke(IPC.SCHEDULE_LIST) as Promise<IPCResult<Schedule[]>>,
  scheduleCreate: (d: ScheduleCreate) =>
    ipcRenderer.invoke(IPC.SCHEDULE_CREATE, d) as Promise<IPCResult<Schedule>>,
  scheduleUpdate: (d: ScheduleUpdate) =>
    ipcRenderer.invoke(IPC.SCHEDULE_UPDATE, d) as Promise<IPCResult<Schedule>>,
  scheduleDelete: (id: number) =>
    ipcRenderer.invoke(IPC.SCHEDULE_DELETE, id) as Promise<IPCResult>,
  scheduleToggle: (id: number, enabled: boolean) =>
    ipcRenderer.invoke(IPC.SCHEDULE_TOGGLE, id, enabled) as Promise<IPCResult>,

  // Sounds
  soundList: () =>
    ipcRenderer.invoke(IPC.SOUND_LIST) as Promise<IPCResult<Sound[]>>,
  soundAdd: (name: string) =>
    ipcRenderer.invoke(IPC.SOUND_ADD, name) as Promise<IPCResult<Sound>>,
  soundDelete: (id: number) =>
    ipcRenderer.invoke(IPC.SOUND_DELETE, id) as Promise<IPCResult>,
  soundTest: (filename: string, vol: number) =>
    ipcRenderer.invoke(IPC.SOUND_TEST, filename, vol) as Promise<IPCResult>,

  // TTS
  ttsSpeak: (text: string, opts: TTSSpeakOptions) =>
    ipcRenderer.invoke(IPC.TTS_SPEAK, text, opts) as Promise<IPCResult>,
  ttsVoices: () =>
    ipcRenderer.invoke(IPC.TTS_VOICES) as Promise<IPCResult<TTSVoice[]>>,

  // Settings
  settingsGet: () =>
    ipcRenderer.invoke(IPC.SETTINGS_GET) as Promise<IPCResult<AppSettings>>,
  settingsSave: (s: Partial<AppSettings>) =>
    ipcRenderer.invoke(IPC.SETTINGS_SAVE, s) as Promise<IPCResult>,
  verifyPin: (pin: string) =>
    ipcRenderer.invoke(IPC.SETTINGS_VERIFY_PIN, pin) as Promise<
      IPCResult<boolean>
    >,
  setPin: (cur: string, next: string) =>
    ipcRenderer.invoke(IPC.SETTINGS_SET_PIN, cur, next) as Promise<IPCResult>,

  // System
  minimize: () => ipcRenderer.invoke(IPC.APP_MINIMIZE) as Promise<void>,
  version: () => ipcRenderer.invoke(IPC.APP_VERSION) as Promise<string>,

  // Push events: main → renderer
  onTriggered: (cb: (e: TriggerEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, payload: TriggerEvent) =>
      cb(payload);
    ipcRenderer.on(IPC.EVENT_TRIGGERED, handler);
    return () => ipcRenderer.off(IPC.EVENT_TRIGGERED, handler);
  },
};

contextBridge.exposeInMainWorld("api", api);

export type ElectronAPI = typeof api;
