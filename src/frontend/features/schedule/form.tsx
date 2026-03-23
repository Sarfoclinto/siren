import { useState, useEffect } from "react";
import { X, Play, Loader2 } from "lucide-react";
import { useApi } from "@frontend/hooks/useApi";
import type {
  Schedule,
  ScheduleCreate,
  DayOfWeek,
  Sound,
} from "../../../../types";

const ALL_DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL: Record<DayOfWeek, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

interface Props {
  initial?: Schedule;
  onSave: (data: ScheduleCreate) => Promise<void>;
  onClose: () => void;
}

export function ScheduleForm({ initial, onSave, onClose }: Props) {
  const api = useApi();

  // ── Form state ───────────────────────────────────────────────────────────────
  const [label, setLabel] = useState(initial?.label ?? "");
  const [time, setTime] = useState(initial?.time ?? "08:00");
  const [days, setDays] = useState<DayOfWeek[]>(
    initial?.days ?? ["mon", "tue", "wed", "thu", "fri"],
  );
  const [soundId, setSoundId] = useState<number | null>(
    initial?.soundId ?? null,
  );
  const [ttsMessage, setTtsMessage] = useState(initial?.ttsMessage ?? "");
  const [ttsDelay, setTtsDelay] = useState(initial?.ttsDelaySeconds ?? 3);
  const [volume, setVolume] = useState(initial?.volume ?? 80);
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);

  // ── Async data ───────────────────────────────────────────────────────────────
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [saving, setSaving] = useState(false);
  const [testingTts, setTestingTts] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listSounds().then(setSounds).catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Day toggle ───────────────────────────────────────────────────────────────
  function toggleDay(d: DayOfWeek) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  function setPreset(preset: "weekdays" | "all" | "weekend") {
    if (preset === "weekdays") setDays(["mon", "tue", "wed", "thu", "fri"]);
    if (preset === "all") setDays([...ALL_DAYS]);
    if (preset === "weekend") setDays(["sat", "sun"]);
  }

  // ── Test actions ─────────────────────────────────────────────────────────────
  async function testSound() {
    const sound =
      sounds.find((s) => s.id === soundId) ?? sounds.find((s) => s.isDefault);
    if (!sound) return;
    setTestingSound(true);
    try {
      await api.testSound(sound.filename, volume);
    } catch {
      /* silent */
    } finally {
      setTestingSound(false);
    }
  }

  async function testTts() {
    if (!ttsMessage.trim()) return;
    setTestingTts(true);
    try {
      await api.speak(ttsMessage, { volume });
    } catch {
      /* silent */
    } finally {
      setTestingTts(false);
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    if (days.length === 0) {
      setError("Select at least one day");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({
        label: label.trim(),
        time,
        days,
        soundId,
        ttsMessage: ttsMessage.trim(),
        ttsDelaySeconds: ttsDelay,
        volume,
        enabled,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="sf-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sf-modal">
        {/* Header */}
        <div className="sf-header">
          <h2 className="sf-title">
            {initial ? "Edit Schedule" : "New Schedule"}
          </h2>
          <button className="sf-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="sf-body">
          {/* Label */}
          <Field label="Label" required>
            <input
              className="sf-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder='e.g. "Morning Assembly"'
              maxLength={80}
              autoFocus
            />
          </Field>

          {/* Time */}
          <Field label="Time" required>
            <input
              type="time"
              className="sf-input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>

          {/* Days */}
          <Field label="Days">
            <div className="sf-day-presets">
              {(["weekdays", "weekend", "all"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className="sf-preset"
                  onClick={() => setPreset(p)}
                >
                  {p === "weekdays"
                    ? "Weekdays"
                    : p === "weekend"
                      ? "Weekend"
                      : "Every day"}
                </button>
              ))}
            </div>
            <div className="sf-days">
              {ALL_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`sf-day ${days.includes(d) ? "active" : ""}`}
                  onClick={() => toggleDay(d)}
                >
                  {DAY_LABEL[d]}
                </button>
              ))}
            </div>
          </Field>

          {/* Sound */}
          <Field label="Sound">
            <div className="sf-row">
              <select
                className="sf-input sf-select"
                value={soundId ?? ""}
                onChange={(e) =>
                  setSoundId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Use default bell</option>
                {sounds.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="sf-icon-btn"
                onClick={testSound}
                disabled={testingSound}
                title="Test sound"
              >
                {testingSound ? (
                  <Loader2 size={14} className="spin" />
                ) : (
                  <Play size={14} />
                )}
              </button>
            </div>
          </Field>

          {/* Volume */}
          <Field label={`Volume · ${volume}%`}>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="sf-slider"
            />
          </Field>

          {/* TTS */}
          <Field label="Announcement (TTS)">
            <textarea
              className="sf-input sf-textarea"
              value={ttsMessage}
              onChange={(e) => setTtsMessage(e.target.value)}
              placeholder='e.g. "Attention students, please proceed to the assembly hall."'
              rows={3}
            />
            {ttsMessage.trim() && (
              <div className="sf-row" style={{ marginTop: 6 }}>
                <button
                  type="button"
                  className="sf-icon-btn"
                  onClick={testTts}
                  disabled={testingTts}
                  title="Preview announcement"
                >
                  {testingTts ? (
                    <Loader2 size={14} className="spin" />
                  ) : (
                    <Play size={14} />
                  )}
                </button>
                <span className="sf-hint">Preview TTS</span>
              </div>
            )}
          </Field>

          {/* TTS delay — only shown when there's a message */}
          {ttsMessage.trim() && (
            <Field label={`Delay after bell · ${ttsDelay}s`}>
              <input
                type="range"
                min={0}
                max={15}
                value={ttsDelay}
                onChange={(e) => setTtsDelay(Number(e.target.value))}
                className="sf-slider"
              />
              <p className="sf-hint">Seconds between bell and announcement</p>
            </Field>
          )}

          {/* Enabled */}
          <Field label="Status">
            <label className="sf-check-label">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Enable this schedule
            </label>
          </Field>

          {/* Error */}
          {error && <p className="sf-error">{error}</p>}

          {/* Footer */}
          <div className="sf-footer">
            <button type="button" className="sf-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="sf-btn-save" disabled={saving}>
              {saving
                ? "Saving…"
                : initial
                  ? "Save changes"
                  : "Create schedule"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .sf-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          backdrop-filter: blur(2px);
        }
        .sf-modal {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          width: 480px;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: sfIn 0.18s ease;
        }
        @keyframes sfIn {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        .sf-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px 14px;
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .sf-title { font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
        .sf-close {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: var(--radius-sm);
          border: none; background: transparent; color: var(--color-text-muted);
          cursor: pointer; transition: background 0.1s;
        }
        .sf-close:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
        .sf-body {
          overflow-y: auto;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sf-input {
          width: 100%;
          padding: 8px 10px;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: var(--color-bg-page);
          color: var(--color-text-primary);
          font-size: 13px;
          transition: border-color 0.15s;
          outline: none;
        }
        .sf-input:focus { border-color: var(--color-accent); }
        .sf-select { cursor: pointer; }
        .sf-textarea { resize: vertical; min-height: 72px; }
        .sf-slider { width: 100%; accent-color: var(--color-accent); cursor: pointer; }
        .sf-day-presets { display: flex; gap: 6px; margin-bottom: 8px; }
        .sf-preset {
          padding: 3px 10px; border-radius: var(--radius-sm);
          border: 1px solid var(--color-border); background: transparent;
          color: var(--color-text-muted); font-size: 11px; cursor: pointer;
          transition: background 0.1s, color 0.1s;
        }
        .sf-preset:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
        .sf-days { display: flex; gap: 5px; flex-wrap: wrap; }
        .sf-day {
          padding: 5px 9px; border-radius: var(--radius-sm);
          border: 1px solid var(--color-border); background: transparent;
          color: var(--color-text-muted); font-size: 12px; font-weight: 500; cursor: pointer;
          transition: all 0.1s;
        }
        .sf-day.active {
          background: var(--color-accent-subtle);
          border-color: var(--color-accent);
          color: var(--color-accent);
        }
        .sf-row { display: flex; align-items: center; gap: 8px; }
        .sf-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: var(--radius-sm);
          border: 1px solid var(--color-border); background: transparent;
          color: var(--color-text-muted); cursor: pointer; flex-shrink: 0;
          transition: background 0.1s, color 0.1s;
        }
        .sf-icon-btn:hover:not(:disabled) { background: var(--color-accent-subtle); color: var(--color-accent); }
        .sf-icon-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .sf-check-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: var(--color-text-secondary); cursor: pointer;
        }
        .sf-hint { font-size: 11px; color: var(--color-text-muted); margin-top: 4px; }
        .sf-error {
          font-size: 12px; color: var(--color-danger);
          padding: 8px 10px; background: var(--color-danger-subtle);
          border-radius: var(--radius-sm);
        }
        .sf-footer {
          display: flex; justify-content: flex-end; gap: 8px;
          padding-top: 8px; border-top: 1px solid var(--color-border);
          margin-top: 4px;
        }
        .sf-btn-cancel {
          padding: 8px 16px; border-radius: var(--radius-md);
          border: 1px solid var(--color-border); background: transparent;
          color: var(--color-text-secondary); font-size: 13px; cursor: pointer;
          transition: background 0.1s;
        }
        .sf-btn-cancel:hover { background: var(--color-bg-hover); }
        .sf-btn-save {
          padding: 8px 18px; border-radius: var(--radius-md);
          border: none; background: #0f172a;
          color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
          transition: background 0.15s;
        }
        .sf-btn-save:hover:not(:disabled) { background: var(--color-accent-hover); }
        .sf-btn-save:disabled { opacity: 0.45; cursor: not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="sf-field">
      <label className="sf-label">
        {label}
        {required && <span className="sf-req">*</span>}
      </label>
      {children}
      <style>{`
        .sf-field { display: flex; flex-direction: column; gap: 6px; }
        .sf-label { font-size: 12px; font-weight: 500; color: var(--color-text-secondary); }
        .sf-req { color: var(--color-danger); margin-left: 2px; }
      `}</style>
    </div>
  );
}
