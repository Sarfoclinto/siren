import { BrowserWindow } from "electron";
import type { TTSVoice, TTSSpeakOptions } from "../../types.js";

// ─── Interface ────────────────────────────────────────────────────────────────
// Swap RendererTTSEngine for PiperTTSEngine (stub below) when you're ready
// to upgrade to high-quality offline voices.

export interface TTSEngine {
  speak(text: string, options?: TTSSpeakOptions): Promise<void>;
  getVoices(): Promise<TTSVoice[]>;
}

// ─── RendererTTSEngine ────────────────────────────────────────────────────────
// Delegates to the Web SpeechSynthesis API running in Electron's renderer.
// Uses Windows SAPI voices — fully offline, zero dependencies.

export class RendererTTSEngine implements TTSEngine {
  private win: BrowserWindow | null = null;

  setWindow(win: BrowserWindow): void {
    this.win = win;
  }

  async speak(text: string, options: TTSSpeakOptions = {}): Promise<void> {
    if (!this.win) {
      console.error("[TTS] No window set");
      return;
    }

    const { voice = "", rate = 1.0, pitch = 1.0, volume = 80 } = options;

    // executeJavaScript returns a Promise that resolves when the utterance ends.
    const script = `
      new Promise((resolve, reject) => {
        const u = new SpeechSynthesisUtterance(${JSON.stringify(text)});
        u.rate   = ${rate};
        u.pitch  = ${pitch};
        u.volume = ${volume / 100};

        const voiceURI = ${JSON.stringify(voice)};
        if (voiceURI) {
          const match = speechSynthesis.getVoices().find(
            v => v.voiceURI === voiceURI || v.name === voiceURI
          );
          if (match) u.voice = match;
        }

        u.onend   = () => resolve('ok');
        u.onerror = (e) => reject(e.error);

        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      })
    `;

    try {
      await this.win.webContents.executeJavaScript(script);
      console.log(`[TTS] Spoke: "${text.slice(0, 60)}"`);
    } catch (err) {
      console.error("[TTS] Speech error:", err);
    }
  }

  async getVoices(): Promise<TTSVoice[]> {
    if (!this.win) return [];

    try {
      return (await this.win.webContents.executeJavaScript(`
        new Promise(resolve => {
          const voices = speechSynthesis.getVoices();
          if (voices.length) {
            resolve(voices.map(v => ({ uri: v.voiceURI, name: v.name, lang: v.lang })));
          } else {
            speechSynthesis.onvoiceschanged = () =>
              resolve(speechSynthesis.getVoices()
                .map(v => ({ uri: v.voiceURI, name: v.name, lang: v.lang })));
            setTimeout(() => resolve([]), 3000);
          }
        })
      `)) as TTSVoice[];
    } catch {
      return [];
    }
  }
}

// ─── PiperTTSEngine stub ──────────────────────────────────────────────────────
// Uncomment and implement when ready to upgrade to Piper TTS.
// Download: https://github.com/rhasspy/piper/releases
// Bundle piper.exe + a .onnx model in resources/piper/
//
// import { execFile } from "child_process";
// import os from "os";
// import { audioController } from "./audioController.js";
//
// export class PiperTTSEngine implements TTSEngine {
//   async speak(text: string, options: TTSSpeakOptions = {}): Promise<void> {
//     const piperExe  = path.join(process.resourcesPath, "piper", "piper.exe");
//     const modelFile = path.join(process.resourcesPath, "piper", "en_US-lessac-medium.onnx");
//     const outWav    = path.join(os.tmpdir(), "siren-tts.wav");
//
//     await new Promise<void>((res, rej) =>
//       execFile(piperExe, ["--model", modelFile, "--output_file", outWav],
//         { input: text }, err => (err ? rej(err) : res()))
//     );
//     await audioController.play(outWav, options.volume ?? 80);
//   }
//   async getVoices(): Promise<TTSVoice[]> { return []; }
// }

// ─── Singleton ────────────────────────────────────────────────────────────────

export const ttsEngine = new RendererTTSEngine();
