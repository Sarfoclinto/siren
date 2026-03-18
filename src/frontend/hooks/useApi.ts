import type {
  Schedule,
  ScheduleCreate,
  ScheduleUpdate,
  Sound,
  AppSettings,
  TTSVoice,
  TTSSpeakOptions,
} from "@shared/types";

// Unwrap the IPCResult envelope and throw on error so callers
// only deal with the happy-path data type.
async function call<T>(
  fn: () => Promise<{ ok: boolean; data?: T; error?: string }>,
): Promise<T> {
  const res = await fn();
  if (!res.ok) throw new Error(res.error ?? "IPC call failed");
  return res.data as T;
}

export function useApi() {
  return {
    // Schedules
    listSchedules: (): Promise<Schedule[]> =>
      call(() => window.api.scheduleList()),
    createSchedule: (d: ScheduleCreate) =>
      call<Schedule>(() => window.api.scheduleCreate(d)),
    updateSchedule: (d: ScheduleUpdate) =>
      call<Schedule>(() => window.api.scheduleUpdate(d)),
    deleteSchedule: (id: number) =>
      call<void>(() => window.api.scheduleDelete(id)),
    toggleSchedule: (id: number, enabled: boolean) =>
      call<void>(() => window.api.scheduleToggle(id, enabled)),

    // Sounds
    listSounds: (): Promise<Sound[]> => call(() => window.api.soundList()),
    addSound: (name: string) => call<Sound>(() => window.api.soundAdd(name)),
    deleteSound: (id: number) => call<void>(() => window.api.soundDelete(id)),
    testSound: (filename: string, vol: number) =>
      call<void>(() => window.api.soundTest(filename, vol)),

    // TTS
    speak: (text: string, opts?: TTSSpeakOptions) =>
      call<void>(() => window.api.ttsSpeak(text, opts ?? {})),
    listVoices: (): Promise<TTSVoice[]> => call(() => window.api.ttsVoices()),

    // Settings
    getSettings: (): Promise<AppSettings> =>
      call(() => window.api.settingsGet()),
    saveSettings: (s: Partial<AppSettings>) =>
      call<void>(() => window.api.settingsSave(s)),
    verifyPin: (pin: string): Promise<boolean> =>
      call(() => window.api.verifyPin(pin)),
    setPin: (cur: string, next: string) =>
      call<void>(() => window.api.setPin(cur, next)),

    // System
    minimize: () => window.api.minimize(),
    version: () => window.api.version(),
  };
}
