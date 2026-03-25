import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";
import crypto from "crypto";
import {
  Schedule,
  ScheduleCreate,
  ScheduleUpdate,
  Sound,
  AppSettings,
  DayOfWeek,
} from "../../types.js";

// ─── Connection ───────────────────────────────────────────────────────────────

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dbPath = path.join(app.getPath("userData"), "school-siren.db");
    _db = new Database(dbPath);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    runMigrations(_db);
  }
  return _db;
}

// ─── Migrations ───────────────────────────────────────────────────────────────

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      name    TEXT NOT NULL UNIQUE,
      ran_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    (db.prepare("SELECT name FROM migrations").all() as { name: string }[]).map(
      (r) => r.name,
    ),
  );

  const migrations: Record<string, string> = {
    "001_initial": `
      CREATE TABLE IF NOT EXISTS sounds (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        filename    TEXT NOT NULL UNIQUE,
        is_default  INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id                   INTEGER PRIMARY KEY AUTOINCREMENT,
        label                TEXT NOT NULL,
        time                 TEXT NOT NULL,
        days                 TEXT NOT NULL DEFAULT 'mon,tue,wed,thu,fri',
        sound_id             INTEGER REFERENCES sounds(id) ON DELETE SET NULL,
        tts_message          TEXT NOT NULL DEFAULT '',
        tts_delay_seconds    INTEGER NOT NULL DEFAULT 3,
        volume               INTEGER NOT NULL DEFAULT 80,
        enabled              INTEGER NOT NULL DEFAULT 1,
        last_triggered_date  TEXT,
        created_at           TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `,

    "002_default_settings": `
      INSERT OR IGNORE INTO settings (key, value) VALUES
        ('adminPinHash',    '${sha256("1234")}'),
        ('defaultVolume',   '80'),
        ('startOnBoot',     'false'),
        ('ttsVoice',        ''),
        ('ttsRate',         '1.0'),
        ('ttsPitch',        '1.0'),
        ('defaultSoundId',  'null');
    `,

    "003_default_sounds": `
      INSERT OR IGNORE INTO sounds (name, filename, is_default) VALUES
        ('School Bell', 'school-bell.wav', 1),
        ('Siren Short', 'siren-short.wav', 0),
        ('Buzzer',      'buzzer.wav',      0),
        ('Chime',       'chime.wav',       0);
    `,
  };

  for (const [name, sql] of Object.entries(migrations)) {
    if (applied.has(name)) continue;
    db.exec(sql);
    db.prepare("INSERT INTO migrations (name) VALUES (?)").run(name);
    console.log(`[DB] Migration applied: ${name}`);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

type Row = Record<string, unknown>;

function rowToSchedule(row: Row): Schedule {
  return {
    id: row.id as number,
    label: row.label as string,
    time: row.time as string,
    days: (row.days as string).split(",") as DayOfWeek[],
    soundId: row.sound_id as number | null,
    ttsMessage: row.tts_message as string,
    ttsDelaySeconds: row.tts_delay_seconds as number,
    volume: row.volume as number,
    enabled: (row.enabled as number) === 1,
    lastTriggeredDate: row.last_triggered_date as string | null,
    createdAt: row.created_at as string,
  };
}

function rowToSound(row: Row): Sound {
  return {
    id: row.id as number,
    name: row.name as string,
    filename: row.filename as string,
    isDefault: (row.is_default as number) === 1,
    createdAt: row.created_at as string,
  };
}

// ─── Schedule queries ─────────────────────────────────────────────────────────

export const scheduleDb = {
  list(): Schedule[] {
    return (
      getDb()
        .prepare("SELECT * FROM schedules ORDER BY time ASC")
        .all() as Row[]
    ).map(rowToSchedule);
  },

  getById(id: number): Schedule | null {
    const row = getDb()
      .prepare("SELECT * FROM schedules WHERE id = ?")
      .get(id) as Row | undefined;
    return row ? rowToSchedule(row) : null;
  },

  create(data: ScheduleCreate): Schedule {
    const result = getDb()
      .prepare(
        `INSERT INTO schedules
          (label, time, days, sound_id, tts_message, tts_delay_seconds, volume, enabled)
         VALUES
          (@label, @time, @days, @soundId, @ttsMessage, @ttsDelaySeconds, @volume, @enabled)`,
      )
      .run({
        label: data.label,
        time: data.time,
        days: data.days.join(","),
        soundId: data.soundId ?? null,
        ttsMessage: data.ttsMessage,
        ttsDelaySeconds: data.ttsDelaySeconds,
        volume: data.volume,
        enabled: data.enabled ? 1 : 0,
      });
    return scheduleDb.getById(result.lastInsertRowid as number)!;
  },

  update(data: ScheduleUpdate): Schedule | null {
    const fields: string[] = [];
    const params: Row = { id: data.id };

    if (data.label !== undefined) {
      fields.push("label = @label");
      params.label = data.label;
    }
    if (data.time !== undefined) {
      fields.push("time = @time");
      params.time = data.time;
    }
    if (data.days !== undefined) {
      fields.push("days = @days");
      params.days = data.days.join(",");
    }
    if (data.soundId !== undefined) {
      fields.push("sound_id = @soundId");
      params.soundId = data.soundId;
    }
    if (data.ttsMessage !== undefined) {
      fields.push("tts_message = @ttsMessage");
      params.ttsMessage = data.ttsMessage;
    }
    if (data.ttsDelaySeconds !== undefined) {
      fields.push("tts_delay_seconds = @ttsDelaySeconds");
      params.ttsDelaySeconds = data.ttsDelaySeconds;
    }
    if (data.volume !== undefined) {
      fields.push("volume = @volume");
      params.volume = data.volume;
    }
    if (data.enabled !== undefined) {
      fields.push("enabled = @enabled");
      params.enabled = data.enabled ? 1 : 0;
    }

    if (fields.length > 0) {
      getDb()
        .prepare(`UPDATE schedules SET ${fields.join(", ")} WHERE id = @id`)
        .run(params);
    }
    return scheduleDb.getById(data.id);
  },

  delete(id: number): void {
    getDb().prepare("DELETE FROM schedules WHERE id = ?").run(id);
  },

  toggle(id: number, enabled: boolean): void {
    getDb()
      .prepare("UPDATE schedules SET enabled = ? WHERE id = ?")
      .run(enabled ? 1 : 0, id);
  },

  markTriggered(id: number, date: string): void {
    getDb()
      .prepare("UPDATE schedules SET last_triggered_date = ? WHERE id = ?")
      .run(date, id);
  },

  /** Returns enabled schedules due at the given HH:MM on the given day,
   *  that haven't already fired today. */
  getDue(timeHHMM: string, day: DayOfWeek): Schedule[] {
    const rows = getDb()
      .prepare(
        `SELECT * FROM schedules
         WHERE enabled = 1
           AND time = ?
           AND (last_triggered_date IS NULL OR last_triggered_date != date('now'))`,
      )
      .all(timeHHMM) as Row[];

    return rows.map(rowToSchedule).filter((s) => s.days.includes(day));
  },
};

// ─── Sound queries ────────────────────────────────────────────────────────────

export const soundDb = {
  list(): Sound[] {
    return (
      getDb()
        .prepare("SELECT * FROM sounds ORDER BY is_default DESC, name ASC")
        .all() as Row[]
    ).map(rowToSound);
  },

  getById(id: number): Sound | null {
    const row = getDb().prepare("SELECT * FROM sounds WHERE id = ?").get(id) as
      | Row
      | undefined;
    return row ? rowToSound(row) : null;
  },

  getDefault(): Sound | null {
    const row = getDb()
      .prepare("SELECT * FROM sounds WHERE is_default = 1 LIMIT 1")
      .get() as Row | undefined;
    return row ? rowToSound(row) : null;
  },

  add(name: string, filename: string): Sound {
    const result = getDb()
      .prepare("INSERT INTO sounds (name, filename) VALUES (?, ?)")
      .run(name, filename);
    return soundDb.getById(result.lastInsertRowid as number)!;
  },

  delete(id: number): void {
    // Protect built-in default sounds from deletion
    getDb()
      .prepare("DELETE FROM sounds WHERE id = ? AND is_default = 0")
      .run(id);
  },

  setDefault(id: number): void {
    const db = getDb();
    const tx = db.transaction(() => {
      db.prepare("UPDATE sounds SET is_default = 0").run();
      db.prepare("UPDATE sounds SET is_default = 1 WHERE id = ?").run(id);
    });
    tx();
  },
};

// ─── Settings queries ─────────────────────────────────────────────────────────

export const settingsDb = {
  get(): AppSettings {
    const rows = getDb().prepare("SELECT key, value FROM settings").all() as {
      key: string;
      value: string;
    }[];
    const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    return {
      adminPinHash: m.adminPinHash ?? sha256("1234"),
      defaultVolume: parseInt(m.defaultVolume ?? "80", 10),
      startOnBoot: m.startOnBoot === "true",
      ttsVoice: m.ttsVoice ?? "",
      ttsRate: parseFloat(m.ttsRate ?? "1.0"),
      ttsPitch: parseFloat(m.ttsPitch ?? "1.0"),
      defaultSoundId:
        m.defaultSoundId === "null" || m.defaultSoundId === undefined
          ? null
          : parseInt(m.defaultSoundId, 10),
    };
  },

  save(patch: Partial<AppSettings>): void {
    const upsert = getDb().prepare(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    );
    const run = getDb().transaction((entries: [string, string][]) => {
      for (const [k, v] of entries) upsert.run(k, v);
    });

    const entries: [string, string][] = [];
    if (patch.adminPinHash !== undefined)
      entries.push(["adminPinHash", patch.adminPinHash]);
    if (patch.defaultVolume !== undefined)
      entries.push(["defaultVolume", String(patch.defaultVolume)]);
    if (patch.startOnBoot !== undefined)
      entries.push(["startOnBoot", String(patch.startOnBoot)]);
    if (patch.ttsVoice !== undefined)
      entries.push(["ttsVoice", patch.ttsVoice]);
    if (patch.ttsRate !== undefined)
      entries.push(["ttsRate", String(patch.ttsRate)]);
    if (patch.ttsPitch !== undefined)
      entries.push(["ttsPitch", String(patch.ttsPitch)]);
    if (patch.defaultSoundId !== undefined)
      entries.push([
        "defaultSoundId",
        patch.defaultSoundId === null ? "null" : String(patch.defaultSoundId),
      ]);

    run(entries);
  },

  verifyPin(pin: string): boolean {
    return sha256(pin) === settingsDb.get().adminPinHash;
  },

  setPin(newPin: string): void {
    settingsDb.save({ adminPinHash: sha256(newPin) });
  },
};
