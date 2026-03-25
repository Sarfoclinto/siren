import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  Loader2,
  Save,
  Volume2,
  Mic,
  ShieldCheck,
  Power,
} from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@frontend/hooks/useApi";
import type { AppSettings, TTSVoice, Sound } from "../../../../types";
import { useNavigate } from "react-router-dom";
import { cn } from "@frontend/lib/utils";

function Settings() {
  const api = useApi();
  const navigate = useNavigate();

  const [, setSettings] = useState<AppSettings | null>(null);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local form state
  const [volume, setVolume] = useState(80);
  const [ttsVoice, setTtsVoice] = useState("");
  const [ttsRate, setTtsRate] = useState(1.0);
  const [ttsPitch, setTtsPitch] = useState(1.0);
  const [defaultSound, setDefaultSound] = useState<number | null>(null);
  const [startOnBoot, setStartOnBoot] = useState(false);

  // PIN change
  const [curPin, setCurPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confPin, setConfPin] = useState("");
  const [pinSaving, setPinSaving] = useState(false);

  // TTS preview
  const [previewText, setPreviewText] = useState(
    "Good morning. Please proceed to the assembly hall.",
  );
  const [testingTts, setTestingTts] = useState(false);
  const [testingSound, setTestingSound] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([api.getSettings(), api.listVoices(), api.listSounds()])
      .then(([s, v, snd]) => {
        setSettings(s);
        setVoices(v);
        setSounds(snd);
        setVolume(s.defaultVolume);
        setTtsVoice(s.ttsVoice);
        setTtsRate(s.ttsRate);
        setTtsPitch(s.ttsPitch);
        setDefaultSound(s.defaultSoundId);
        setStartOnBoot(s.startOnBoot);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save settings ─────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      await api.saveSettings({
        defaultVolume: volume,
        ttsVoice,
        ttsRate,
        ttsPitch,
        defaultSoundId: defaultSound,
        startOnBoot,
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  // ── Change PIN ────────────────────────────────────────────────────────────────
  async function handlePinChange(e: React.FormEvent) {
    e.preventDefault();
    if (!curPin || !newPin || !confPin) {
      toast.error("Fill in all PIN fields");
      return;
    }
    if (newPin !== confPin) {
      toast.error("New PINs don't match");
      return;
    }
    if (!/^\d{4,8}$/.test(newPin)) {
      toast.error("PIN must be 4–8 digits");
      return;
    }

    setPinSaving(true);
    try {
      await api.setPin(curPin, newPin);
      toast.success("PIN updated successfully");
      setCurPin("");
      setNewPin("");
      setConfPin("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change PIN");
    } finally {
      setPinSaving(false);
    }
  }

  // ── Test TTS ──────────────────────────────────────────────────────────────────
  async function testTts() {
    if (!previewText.trim()) return;
    setTestingTts(true);
    try {
      await api.speak(previewText, {
        voice: ttsVoice,
        rate: ttsRate,
        pitch: ttsPitch,
        volume,
      });
    } catch {
      /* silent */
    } finally {
      setTestingTts(false);
    }
  }

  // ── Test sound ────────────────────────────────────────────────────────────────
  async function testSound() {
    const sound =
      sounds.find((s) => s.id === defaultSound) ??
      sounds.find((s) => s.isDefault);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="s-layout">
      {/* Header */}
      <div className="s-header">
        <button className="s-back" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="s-title">Settings</h1>
        <button
          className="flex items-center gap-2 py-2 px-4 rounded-md border-none bg-slate-900 text-slate-100 text-sm hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed transition-all duration-150"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 size={14} className="spin" /> Saving…
            </>
          ) : (
            <>
              <Save size={14} /> Save changes
            </>
          )}
        </button>
      </div>

      <div className="s-body">
        {/* ── Audio ── */}
        <Section icon={<Volume2 size={16} />} title="Audio" className="">
          <Field className="" label={`Default volume · ${volume}%`}>
            <div className="s-row">
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="sf-slider"
                style={{ flex: 1 }}
              />
              <button
                className="sf-icon-btn"
                onClick={testSound}
                disabled={testingSound}
                title="Test bell"
                type="button"
              >
                {testingSound ? (
                  <Loader2 size={13} className="spin" />
                ) : (
                  <Play size={13} />
                )}
              </button>
            </div>
          </Field>

          <Field className="" label="Default bell sound">
            <select
              className="sf-input"
              value={defaultSound ?? ""}
              onChange={(e) =>
                setDefaultSound(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Auto (first default)</option>
              {sounds.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.isDefault ? " ★" : ""}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        {/* ── TTS ── */}
        <Section icon={<Mic size={16} />} title="Text-to-Speech">
          <Field label="Voice">
            <select
              className="sf-input"
              value={ttsVoice}
              onChange={(e) => setTtsVoice(e.target.value)}
            >
              <option value="">OS default</option>
              {voices.map((v) => (
                <option key={v.uri} value={v.uri}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </Field>

          <div className="s-two-col">
            <Field label={`Speed · ${ttsRate.toFixed(1)}×`}>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={ttsRate}
                onChange={(e) => setTtsRate(Number(e.target.value))}
                className="sf-slider"
              />
            </Field>
            <Field label={`Pitch · ${ttsPitch.toFixed(1)}`}>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={ttsPitch}
                onChange={(e) => setTtsPitch(Number(e.target.value))}
                className="sf-slider"
              />
            </Field>
          </div>

          <Field label="Preview text">
            <div className="s-row">
              <input
                className="sf-input"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Type something to test…"
                style={{ flex: 1 }}
              />
              <button
                className="sf-icon-btn"
                onClick={testTts}
                disabled={testingTts || !previewText.trim()}
                title="Preview voice"
                type="button"
              >
                {testingTts ? (
                  <Loader2 size={13} className="spin" />
                ) : (
                  <Play size={13} />
                )}
              </button>
            </div>
          </Field>
        </Section>

        {/* ── System ── */}
        <Section icon={<Power size={16} />} title="System">
          <label className="s-check-row">
            <input
              type="checkbox"
              checked={startOnBoot}
              onChange={(e) => setStartOnBoot(e.target.checked)}
            />
            <div>
              <p className="s-check-label">Start on system boot</p>
              <p className="s-check-hint">
                School Siren will launch automatically when Windows starts
              </p>
            </div>
          </label>
        </Section>

        {/* ── Change PIN ── */}
        <Section icon={<ShieldCheck size={16} />} title="Change Admin PIN">
          <form onSubmit={handlePinChange} className="s-pin-form">
            <Field label="Current PIN">
              <input
                type="password"
                inputMode="numeric"
                className="sf-input"
                value={curPin}
                onChange={(e) =>
                  setCurPin(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                placeholder="Current PIN"
                autoComplete="current-password"
              />
            </Field>
            <Field label="New PIN">
              <input
                type="password"
                inputMode="numeric"
                className="sf-input"
                value={newPin}
                onChange={(e) =>
                  setNewPin(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                placeholder="4–8 digits"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new PIN">
              <input
                type="password"
                inputMode="numeric"
                className="sf-input"
                value={confPin}
                onChange={(e) =>
                  setConfPin(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                placeholder="Repeat new PIN"
                autoComplete="new-password"
              />
            </Field>
            <button
              type="submit"
              className="self-start rounded-md py-2 px-4 text-xs cursor-pointer transition-all duration-150 bg-slate-900 hover:bg-slate-800 disabled:cursor-not-allowed text-slate-200"
              disabled={pinSaving}
            >
              {pinSaving ? "Updating…" : "Update PIN"}
            </button>
          </form>
        </Section>

        {/* Spacer */}
        <div style={{ height: 40 }} />
      </div>

      <style>{`
        .s-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        .s-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 28px;
          background: var(--color-bg-card);
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .s-back {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: var(--radius-md);
          border: 1px solid var(--color-border); background: transparent;
          color: var(--color-text-secondary); font-size: 13px; cursor: pointer;
          transition: background 0.1s;
        }
        .s-back:hover { background: var(--color-bg-hover); }
        .s-title { font-size: 17px; font-weight: 600; flex: 1; }
        .s-save-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: var(--radius-md);
          border: none; background: var(--color-accent); color: #fff;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: background 0.15s;
        }
        .s-save-btn:hover:not(:disabled) { background: var(--color-accent-hover); }
        .s-save-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .s-body {
          flex: 1; overflow-y: auto;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 640px;
          width: 100%;
          margin: 0 auto;
        }

        .s-section {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          min-height: "fit-content";
          // overflow: hidden;
        }
        .s-section-header {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--color-border);
          font-size: 13px; font-weight: 600;
          color: var(--color-text-primary);
          background: var(--color-bg-hover);
        }
        .s-section-header svg { color: var(--color-accent); }
        .s-section-body {
          padding: 18px;
          display: flex; flex-direction: column; gap: 16px;
        }

        .s-row { display: flex; align-items: center; gap: 8px; }
        .s-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        .s-check-row {
          display: flex; align-items: flex-start; gap: 10px; cursor: pointer;
        }
        .s-check-row input { margin-top: 2px; accent-color: var(--color-accent); }
        .s-check-label { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
        .s-check-hint  { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }

        .s-pin-form { display: flex; flex-direction: column; gap: 14px; }
        .s-pin-btn {
          align-self: flex-start;
          padding: 8px 18px; border-radius: var(--radius-md);
          border: none; background: var(--color-accent); color: #fff;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: background 0.15s;
        }
        .s-pin-btn:hover:not(:disabled) { background: var(--color-accent-hover); }
        .s-pin-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Shared helpers reused from form */
        .sf-input {
          width: 100%; padding: 8px 10px; border-radius: var(--radius-md);
          border: 1px solid var(--color-border); background: var(--color-bg-page);
          color: var(--color-text-primary); font-size: 13px; outline: none;
          transition: border-color 0.15s;
        }
        .sf-input:focus { border-color: var(--color-accent); }
        .sf-slider { width: 100%; accent-color: var(--color-accent); cursor: pointer; }
        .sf-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: var(--radius-sm);
          border: 1px solid var(--color-border); background: transparent;
          color: var(--color-text-muted); cursor: pointer; flex-shrink: 0;
          transition: background 0.1s, color 0.1s;
        }
        .sf-icon-btn:hover:not(:disabled) { background: var(--color-accent-subtle); color: var(--color-accent); }
        .sf-icon-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .sf-field { display: flex; flex-direction: column; gap: 6px; }
        .sf-label { font-size: 12px; font-weight: 500; color: var(--color-text-secondary); }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}
export default Settings;
// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("s-section", className)}>
      <div className="s-section-header">
        {icon} {title}
      </div>
      <div className="s-section-body">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("sf-field", className)}>
      <span className="sf-label">{label}</span>
      {children}
    </div>
  );
}
