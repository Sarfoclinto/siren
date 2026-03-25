// ─── Domain types ─────────────────────────────────────────────────────────────

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface Schedule {
  id: number;
  label: string; // e.g. "Morning Assembly"
  time: string; // "HH:MM" 24-hour
  days: DayOfWeek[]; // which days it fires
  soundId: number | null; // null = use app default
  ttsMessage: string; // empty = no announcement
  ttsDelaySeconds: number; // pause between bell and announcement
  volume: number; // 0–100
  enabled: boolean;
  lastTriggeredDate: string | null; // "YYYY-MM-DD" — prevents double-fire
  createdAt: string;
}

export type ScheduleCreate = Omit<
  Schedule,
  "id" | "lastTriggeredDate" | "createdAt"
>;
export type ScheduleUpdate = Partial<ScheduleCreate> & { id: number };

export interface Sound {
  id: number;
  name: string;
  filename: string; // relative to assets/sounds/
  durationSeconds?: number | null; // populated when known
  isDefault: boolean;
  createdAt: string;
}

export interface AppSettings {
  adminPinHash: string; // SHA-256 hex
  defaultVolume: number; // 0–100
  startOnBoot: boolean;
  ttsVoice: string; // voiceURI from SpeechSynthesis, "" = OS default
  ttsRate: number; // 0.5–2.0
  ttsPitch: number; // 0–2.0
  defaultSoundId: number | null;
}

export interface TTSVoice {
  uri: string;
  name: string;
  lang: string;
}

export interface TTSSpeakOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}


// ─── IPC envelope ─────────────────────────────────────────────────────────────
// Every ipcMain.handle response is wrapped in this so the renderer always
// knows if the call succeeded and can extract data or show an error.

export interface IPCResult<T = void> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ─── Event payloads ───────────────────────────────────────────────────────────

export interface TriggerEvent {
  scheduleId: number;
  label: string;
  time: string;
}
