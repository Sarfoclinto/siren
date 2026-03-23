import { BrowserWindow } from "electron";
import { scheduleDb, soundDb, settingsDb } from "./database.js";
import { audioController } from "./audioController.js";
import { ttsEngine } from "./ttsEngine.js";
import { IPC } from "./data.cjs";
import type { Schedule, DayOfWeek, TriggerEvent } from "../../types.js";

// ─── Time helpers ─────────────────────────────────────────────────────────────

const DAY_MAP: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function todayDay(): DayOfWeek {
  return DAY_MAP[new Date().getDay()];
}

function todayYYYYMMDD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Scheduler ────────────────────────────────────────────────────────────────

export class Scheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private win: BrowserWindow | null = null;
  private triggering = new Set<number>(); // prevents concurrent triggers of same schedule

  setWindow(win: BrowserWindow): void {
    this.win = win;
  }

  start(): void {
    if (this.timer) return;
    console.log("[Scheduler] Starting (60s interval)");
    this.tick(); // run immediately on start
    this.timer = setInterval(() => this.tick(), 60_000);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("[Scheduler] Stopped");
    }
  }

  // ─── Core tick ──────────────────────────────────────────────────────────────

  private tick(): void {
    const time = nowHHMM();
    const day = todayDay();
    const date = todayYYYYMMDD();

    try {
      const due = scheduleDb.getDue(time, day);
      if (due.length > 0) {
        console.log(`[Scheduler] ${due.length} due at ${time}`);
      }
      for (const schedule of due) {
        if (!this.triggering.has(schedule.id)) {
          void this.trigger(schedule, date);
        }
      }
    } catch (err) {
      console.error("[Scheduler] Tick error:", err);
    }
  }

  // ─── Trigger a single schedule ───────────────────────────────────────────────

  private async trigger(schedule: Schedule, date: string): Promise<void> {
    this.triggering.add(schedule.id);

    try {
      console.log(`[Scheduler] Firing "${schedule.label}" (id=${schedule.id})`);

      // Mark triggered immediately — prevents double-fire if tick runs again
      scheduleDb.markTriggered(schedule.id, date);

      // Notify renderer → shows flash banner
      this.emit(schedule);

      // ── Sound ──────────────────────────────────────────────────────────────
      const settings = settingsDb.get();
      const soundId = schedule.soundId ?? settings.defaultSoundId;
      const sound =
        soundId !== null ? soundDb.getById(soundId) : soundDb.getDefault();

      if (sound) {
        await audioController.play(sound.filename, schedule.volume);
      }

      // ── TTS ────────────────────────────────────────────────────────────────
      if (schedule.ttsMessage.trim()) {
        if (schedule.ttsDelaySeconds > 0) {
          await sleep(schedule.ttsDelaySeconds * 1000);
        }
        await ttsEngine.speak(schedule.ttsMessage, {
          voice: settings.ttsVoice || undefined,
          rate: settings.ttsRate,
          pitch: settings.ttsPitch,
          volume: schedule.volume,
        });
      }
    } catch (err) {
      console.error(`[Scheduler] Error firing schedule ${schedule.id}:`, err);
    } finally {
      this.triggering.delete(schedule.id);
    }
  }

  private emit(schedule: Schedule): void {
    if (!this.win) return;
    const payload: TriggerEvent = {
      scheduleId: schedule.id,
      label: schedule.label,
      time: schedule.time,
    };
    this.win.webContents.send(IPC.EVENT_TRIGGERED, payload);
  }
}

export const scheduler = new Scheduler();
