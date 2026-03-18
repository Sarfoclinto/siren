import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  dialog,
  nativeImage,
} from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { scheduleDb, soundDb, settingsDb } from "./database.js";
import { audioController } from "./audioController.js";
import { ttsEngine } from "./ttsEngine.js";
import { scheduler } from "./scheduler.js";
import { IPC } from "@shared/types.js";
import type {
  ScheduleCreate,
  ScheduleUpdate,
  AppSettings,
  TTSSpeakOptions,
} from "@shared/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;

// ─── State ────────────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 700,
    minWidth: 800,
    minHeight: 580,
    title: "School Siren",
    icon: getIconPath(),
    show: false, // revealed in ready-to-show to avoid white flash
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for preload to access ipcRenderer
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  // Close button → hide to tray, not quit
  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  // Wire subsystems to the window
  audioController.setWindow(mainWindow);
  ttsEngine.setWindow(mainWindow);
  scheduler.setWindow(mainWindow);
}

// ─── Tray ─────────────────────────────────────────────────────────────────────

function createTray(): void {
  const iconPath = getIconPath();
  const icon = iconPath
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip("School Siren");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Open School Siren",
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on("double-click", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function getIconPath(): string {
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, "assets", "icon.png")]
    : [
        path.join(app.getAppPath(), "resources", "icon.png"),
        path.join(app.getAppPath(), "assets", "icon.png"),
      ];

  return candidates.find((p) => fs.existsSync(p)) ?? "";
}

// ─── IPC result wrapper ───────────────────────────────────────────────────────

async function wrap<T>(fn: () => T | Promise<T>) {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[IPC]", error);
    return { ok: false, error };
  }
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────

function registerHandlers(): void {
  // Schedules ──────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.SCHEDULE_LIST, () => wrap(() => scheduleDb.list()));
  ipcMain.handle(IPC.SCHEDULE_CREATE, (_e, d: ScheduleCreate) =>
    wrap(() => scheduleDb.create(d)),
  );
  ipcMain.handle(IPC.SCHEDULE_UPDATE, (_e, d: ScheduleUpdate) =>
    wrap(() => scheduleDb.update(d)),
  );
  ipcMain.handle(IPC.SCHEDULE_DELETE, (_e, id: number) =>
    wrap(() => scheduleDb.delete(id)),
  );
  ipcMain.handle(IPC.SCHEDULE_TOGGLE, (_e, id: number, en: boolean) =>
    wrap(() => scheduleDb.toggle(id, en)),
  );

  // Sounds ─────────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.SOUND_LIST, () => wrap(() => soundDb.list()));
  ipcMain.handle(IPC.SOUND_DELETE, (_e, id: number) =>
    wrap(() => soundDb.delete(id)),
  );
  ipcMain.handle(IPC.SOUND_TEST, (_e, filename: string, vol: number) =>
    wrap(() => audioController.play(filename, vol)),
  );

  ipcMain.handle(IPC.SOUND_ADD, async (_e, name: string) =>
    wrap(async () => {
      const result = await dialog.showOpenDialog(mainWindow!, {
        title: "Select Sound File",
        buttonLabel: "Add Sound",
        filters: [{ name: "Audio", extensions: ["wav", "mp3", "ogg"] }],
        properties: ["openFile"],
      });
      if (result.canceled || !result.filePaths[0]) throw new Error("Cancelled");

      const src = result.filePaths[0];
      const filename = path.basename(src);
      const dir = app.isPackaged
        ? path.join(process.resourcesPath, "assets", "sounds")
        : path.join(app.getAppPath(), "assets", "sounds");

      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(src, path.join(dir, filename));
      return soundDb.add(name, filename);
    }),
  );

  // TTS ────────────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.TTS_SPEAK, (_e, text: string, opts: TTSSpeakOptions) =>
    wrap(() => ttsEngine.speak(text, opts)),
  );
  ipcMain.handle(IPC.TTS_VOICES, () => wrap(() => ttsEngine.getVoices()));

  // Settings ───────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.SETTINGS_GET, () => wrap(() => settingsDb.get()));

  ipcMain.handle(IPC.SETTINGS_SAVE, (_e, patch: Partial<AppSettings>) =>
    wrap(() => {
      settingsDb.save(patch);
      // Apply boot-on-startup immediately
      app.setLoginItemSettings({ openAtLogin: settingsDb.get().startOnBoot });
    }),
  );

  ipcMain.handle(IPC.SETTINGS_VERIFY_PIN, (_e, pin: string) =>
    wrap(() => settingsDb.verifyPin(pin)),
  );

  ipcMain.handle(IPC.SETTINGS_SET_PIN, (_e, cur: string, next: string) =>
    wrap(() => {
      if (!settingsDb.verifyPin(cur)) throw new Error("Incorrect current PIN");
      settingsDb.setPin(next);
    }),
  );

  // System ─────────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.APP_MINIMIZE, () => {
    mainWindow?.hide();
  });
  ipcMain.handle(IPC.APP_VERSION, () => app.getVersion());
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  registerHandlers();
  createWindow();
  createTray();
  scheduler.start();
});

app.on("window-all-closed", () => {
  // Intentionally do nothing — app lives in the tray
});

app.on("before-quit", () => {
  isQuitting = true;
  scheduler.stop();
});

app.on("activate", () => {
  // macOS: re-show when dock icon clicked
  if(mainWindow){
    mainWindow.show();
    mainWindow.focus(); //optional
  }else{
    createWindow();
  }
});
