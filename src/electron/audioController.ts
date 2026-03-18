import path from "path";
import fs from "fs";
import { app, BrowserWindow } from "electron";
import { createRequire } from "module";

// ─── node-speaker (lazy load) ─────────────────────────────────────────────────
// Loaded lazily so the app still boots if the native addon wasn't compiled.
// Run `pnpm rebuild-native` to compile it after install.

let speakerAvailable = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SpeakerCtor: any = null;

try {
  // createRequire is needed because the Electron main is ESM but
  // native addons must be loaded via require()
  const require = createRequire(import.meta.url);
  SpeakerCtor = require("speaker");
  speakerAvailable = true;
  console.log("[Audio] node-speaker loaded");
} catch (err) {
  console.warn(
    "[Audio] node-speaker unavailable, will use HTML5 fallback:",
    err,
  );
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

function getSoundsDir(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "assets", "sounds")
    : path.join(app.getAppPath(), "assets", "sounds");
}

// ─── Minimal WAV parser ───────────────────────────────────────────────────────
// node-speaker needs raw PCM + format metadata from the WAV header.

interface WavMeta {
  channels: number;
  sampleRate: number;
  bitDepth: number;
  dataOffset: number;
}

function parseWav(buf: Buffer): WavMeta | null {
  try {
    if (buf.toString("ascii", 0, 4) !== "RIFF") return null;
    if (buf.toString("ascii", 8, 12) !== "WAVE") return null;

    let offset = 12;
    while (offset < buf.length - 8) {
      const id = buf.toString("ascii", offset, offset + 4);
      const size = buf.readUInt32LE(offset + 4);

      if (id === "fmt ") {
        const channels = buf.readUInt16LE(offset + 10);
        const sampleRate = buf.readUInt32LE(offset + 12);
        const bitDepth = buf.readUInt16LE(offset + 22);

        // Find the data chunk
        let dataOff = offset + 8 + size;
        while (dataOff < buf.length - 8) {
          if (buf.toString("ascii", dataOff, dataOff + 4) === "data") {
            return { channels, sampleRate, bitDepth, dataOffset: dataOff + 8 };
          }
          dataOff += 8 + buf.readUInt32LE(dataOff + 4);
        }
      }
      offset += 8 + size;
    }
  } catch {
    // fall through
  }
  return null;
}

// ─── Volume scaling ───────────────────────────────────────────────────────────

function applyVolume(pcm: Buffer, bitDepth: number, volume: number): Buffer {
  const factor = volume / 100;
  const out = Buffer.allocUnsafe(pcm.length);

  if (bitDepth === 16) {
    for (let i = 0; i + 1 < pcm.length; i += 2) {
      out.writeInt16LE(Math.round(pcm.readInt16LE(i) * factor), i);
    }
  } else if (bitDepth === 8) {
    for (let i = 0; i < pcm.length; i++) {
      out.writeUInt8(Math.round((pcm.readUInt8(i) - 128) * factor) + 128, i);
    }
  } else {
    pcm.copy(out);
  }
  return out;
}

// ─── Playback strategies ──────────────────────────────────────────────────────

async function playViaSpeaker(
  soundPath: string,
  volume: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const buf = fs.readFileSync(soundPath);
    const meta = parseWav(buf);
    if (!meta) return reject(new Error("Cannot parse WAV header"));

    const speaker = new SpeakerCtor({
      channels: meta.channels,
      bitDepth: meta.bitDepth,
      sampleRate: meta.sampleRate,
    });

    speaker.on("close", resolve);
    speaker.on("error", reject);

    const pcm = applyVolume(
      buf.subarray(meta.dataOffset),
      meta.bitDepth,
      volume,
    );
    speaker.write(pcm);
    speaker.end();
  });
}

function playViaRenderer(
  soundPath: string,
  volume: number,
  win: BrowserWindow,
): void {
  const fileUrl = `file://${soundPath.replace(/\\/g, "/")}`;
  win.webContents
    .executeJavaScript(
      `
    (() => {
      const a = new Audio(${JSON.stringify(fileUrl)});
      a.volume = ${volume / 100};
      a.play().catch(console.error);
    })();
  `,
    )
    .catch(console.error);
}

// ─── AudioController ──────────────────────────────────────────────────────────

export class AudioController {
  private win: BrowserWindow | null = null;

  setWindow(win: BrowserWindow): void {
    this.win = win;
  }

  async play(filename: string, volume = 80): Promise<void> {
    const soundPath = path.join(getSoundsDir(), filename);

    if (!fs.existsSync(soundPath)) {
      console.warn(`[Audio] File not found: ${soundPath}`);
      return;
    }

    console.log(`[Audio] Playing "${filename}" vol=${volume}`);

    if (speakerAvailable) {
      try {
        await playViaSpeaker(soundPath, volume);
        return;
      } catch (err) {
        console.warn(
          "[Audio] node-speaker failed, falling back to renderer:",
          err,
        );
      }
    }

    if (this.win) {
      playViaRenderer(soundPath, volume, this.win);
    } else {
      console.error("[Audio] No playback method available");
    }
  }

  get nativeSpeakerAvailable(): boolean {
    return speakerAvailable;
  }
}

export const audioController = new AudioController();
