import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Play,
  Pause,
  Trash2,
  Star,
  Music2,
  Loader2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@frontend/hooks/useApi";
import type { Sound } from "../../../../types";

export function Sounds() {
  const api = useApi();

  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [volume, setVolume] = useState(80);

  // Which sound is currently playing (by id)
  const [playingId, setPlayingId] = useState<number | null>(null);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setSounds(await api.listSounds());
    } catch {
      toast.error("Failed to load sounds");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    load();
  }, [load]);

useEffect(() => {
  window.api.playSound(
    async (data: { buffer: ArrayBuffer; volume: number }) => {
      const blob = new Blob([data.buffer]);
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audio.volume = data.volume / 100;

      audio.play().catch(console.error);
    },
  );
}, []);

  // ── Upload ─────────────────────────────────────────────────────────────────────
  async function handleUpload() {
    const name = nameInput.trim();
    if (!name) {
      toast.error("Give this sound a name first");
      return;
    }

    setUploading(true);
    try {
      // window.api.soundAdd opens the file-picker dialog in main process
      const sound = await api.addSound(name);
      setSounds((p) => [...p, sound]);
      setNameInput("");
      setShowAdd(false);
      toast.success(`"${sound.name}" added`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg !== "Cancelled") toast.error(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  }

  // ── Preview ────────────────────────────────────────────────────────────────────
  async function handlePlay(sound: Sound) {
    if (playingId === sound.id) {
      // Already playing — stop it (optimistic UI only, no real stop for now)
      setPlayingId(null);
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      return;
    }

    setPlayingId(sound.id);
    if (playTimerRef.current) clearTimeout(playTimerRef.current);

    try {
      await api.testSound(sound.filename, volume);
    } catch {
      toast.error("Failed to play sound");
    } finally {
      setPlayingId(null);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────────
  async function handleDelete(sound: Sound) {
    if (sound.isDefault) {
      toast.error("Cannot delete a built-in default sound");
      return;
    }
    if (!window.confirm(`Delete "${sound.name}"? This can't be undone.`))
      return;
    try {
      await api.deleteSound(sound.id);
      setSounds((p) => p.filter((s) => s.id !== sound.id));
      toast.success(`"${sound.name}" deleted`);
    } catch {
      toast.error("Failed to delete sound");
    }
  }

  // ── Set default ────────────────────────────────────────────────────────────────
  async function handleSetDefault(sound: Sound) {
    if (sound.isDefault) return;
    try {
      await api.setDefaultSound(sound.id);
      setSounds((p) => p.map((s) => ({ ...s, isDefault: s.id === sound.id })));
      toast.success(`"${sound.name}" set as default`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update default");
    }
  }

  const builtIn = sounds.filter((s) => s.isDefault);
  const custom = sounds.filter((s) => !s.isDefault);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--color-page)" }}
    >
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5 border-b"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <div>
            <h1
              className="text-lg font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Sounds
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              {loading
                ? "Loading…"
                : `${sounds.length} sound${sounds.length !== 1 ? "s" : ""} · ${custom.length} custom`}
            </p>
          </div>

          {/* Volume control + upload button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Volume2 size={14} style={{ color: "var(--color-text-muted)" }} />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-24 cursor-pointer"
                style={{ accentColor: "var(--color-brand)" }}
                title={`Preview volume: ${volume}%`}
              />
              <span
                className="text-xs font-mono w-8"
                style={{ color: "var(--color-text-muted)" }}
              >
                {volume}%
              </span>
            </div>

            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 h-9 bg-slate-900 rounded-lg text-sm font-semibold text-white transition-all active:scale-95 cursor-pointer"
              //   style={{ background: "var(--color-brand)" }}
              //   onMouseEnter={(e) =>
              //     (e.currentTarget.style.background = "var(--color-brand-hover)")
              //   }
              //   onMouseLeave={(e) =>
              //     (e.currentTarget.style.background = "var(--color-brand)")
              //   }
            >
              <Plus size={15} /> Upload Sound
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-6">
          {/* Upload card — shown when Add is open */}
          {showAdd && (
            <UploadCard
              name={nameInput}
              onNameChange={setNameInput}
              onUpload={handleUpload}
              onCancel={() => {
                setShowAdd(false);
                setNameInput("");
              }}
              uploading={uploading}
            />
          )}

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2
                className="animate-spin"
                size={22}
                style={{ color: "var(--color-text-muted)" }}
              />
            </div>
          ) : (
            <>
              {/* Custom sounds */}
              <SoundSection
                title="Custom sounds"
                subtitle="Uploaded by you"
                empty={custom.length === 0}
                emptyHint='Click "Upload Sound" to add your first custom bell'
              >
                {custom.map((s) => (
                  <SoundRow
                    key={s.id}
                    sound={s}
                    isPlaying={playingId === s.id}
                    onPlay={() => handlePlay(s)}
                    onDelete={() => handleDelete(s)}
                    onSetDefault={() => handleSetDefault(s)}
                  />
                ))}
              </SoundSection>

              {/* Built-in sounds */}
              <SoundSection
                title="Built-in sounds"
                subtitle="Included with School Siren"
              >
                {builtIn.map((s) => (
                  <SoundRow
                    key={s.id}
                    sound={s}
                    isPlaying={playingId === s.id}
                    onPlay={() => handlePlay(s)}
                    onDelete={() => handleDelete(s)}
                    onSetDefault={() => handleSetDefault(s)}
                  />
                ))}
              </SoundSection>

              {/* Info card */}
              <InfoCard />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Sounds;

// ─── Upload card ──────────────────────────────────────────────────────────────

function UploadCard({
  name,
  onNameChange,
  onUpload,
  onCancel,
  uploading,
}: {
  name: string;
  onNameChange: (v: string) => void;
  onUpload: () => void;
  onCancel: () => void;
  uploading: boolean;
}) {
  return (
    <div
      className="rounded-xl border-2 border-dashed p-6"
      style={{
        borderColor: "var(--color-brand-border)",
        background: "var(--color-brand-light)",
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "var(--color-brand)",
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? (
            <Loader2 size={18} className="text-slate-800 animate-spin" />
          ) : (
            <Upload size={18} className="text-slate-800" />
          )}
        </div>

        <div className="flex-1">
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            Add a sound file
          </p>
          <p
            className="text-xs mb-4"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Supported formats: WAV, MP3, OGG. Give it a name, then choose the
            file.
          </p>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onUpload()}
              placeholder='e.g. "Morning Bell"'
              maxLength={60}
              autoFocus
              disabled={uploading}
              className="flex-1 h-9 px-3 rounded-lg text-sm border bg-white focus:outline-none transition-colors"
              style={{
                borderColor: "var(--color-brand-border)",
                color: "var(--color-text-primary)",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--color-brand)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--color-brand-border)")
              }
            />
            <button
              onClick={onUpload}
              disabled={uploading || !name.trim()}
              className="flex items-center bg-slate-900! disabled:cursor-not-allowed gap-2 px-4 h-9 rounded-lg text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
            >
              {uploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Upload size={13} />
              )}
              {uploading ? "Choosing…" : "Choose file"}
            </button>
            <button
              onClick={onCancel}
              disabled={uploading}
              className="h-9 px-3 rounded-lg text-sm border transition-all"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
                background: "white",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SoundSection({
  title,
  subtitle,
  empty,
  emptyHint,
  children,
}: {
  title: string;
  subtitle?: string;
  empty?: boolean;
  emptyHint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-baseline gap-2 mb-3">
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h2>
        {subtitle && (
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {empty ? (
        <div
          className="rounded-xl border border-dashed flex flex-col items-center justify-center py-10 gap-2"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <Music2 size={28} strokeWidth={1.2} style={{ opacity: 0.35 }} />
          <p className="text-sm">{emptyHint ?? "No sounds yet"}</p>
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-card)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Sound row ────────────────────────────────────────────────────────────────

function SoundRow({
  sound,
  isPlaying,
  onPlay,
  onDelete,
  onSetDefault,
}: {
  sound: Sound;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div
      className="group flex items-center gap-4 px-5 py-3.5 border-b last:border-b-0 transition-colors"
      style={{
        borderColor: "var(--color-border)",
        background: isPlaying ? "var(--color-brand-light)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!isPlaying)
          e.currentTarget.style.background = "var(--color-card-alt)";
      }}
      onMouseLeave={(e) => {
        if (!isPlaying) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Play button */}
      <button
        onClick={onPlay}
        title={isPlaying ? "Playing…" : "Preview"}
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
        style={{
          background: isPlaying
            ? "var(--color-brand)"
            : "var(--color-card-alt)",
          color: isPlaying ? "white" : "var(--color-text-secondary)",
          border: `1px solid ${isPlaying ? "transparent" : "var(--color-border)"}`,
        }}
        onMouseEnter={(e) => {
          if (!isPlaying) {
            e.currentTarget.style.background = "var(--color-brand-light)";
            e.currentTarget.style.color = "var(--color-brand)";
            e.currentTarget.style.borderColor = "var(--color-brand-border)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isPlaying) {
            e.currentTarget.style.background = "var(--color-card-alt)";
            e.currentTarget.style.color = "var(--color-text-secondary)";
            e.currentTarget.style.borderColor = "var(--color-border)";
          }
        }}
      >
        {isPlaying ? <Pause size={13} /> : <Play size={13} />}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium truncate"
            style={{ color: "var(--color-text-primary)" }}
          >
            {sound.name}
          </span>
          {sound.isDefault && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: "#fef9c3",
                color: "#854d0e",
              }}
            >
              <Star size={9} fill="currentColor" /> Default
            </span>
          )}
        </div>
        <p
          className="text-xs mt-0.5 truncate font-mono"
          style={{ color: "var(--color-text-muted)" }}
        >
          {sound.filename}
        </p>
      </div>

      {/* Actions — always visible for default badge clarity, hover for others */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Set as default */}
        {!sound.isDefault && (
          <button
            onClick={onSetDefault}
            title="Set as default bell"
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border transition-all opacity-0 group-hover:opacity-100"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#fde047";
              e.currentTarget.style.color = "#854d0e";
              e.currentTarget.style.background = "#fefce8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-text-muted)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Star size={11} /> Set default
          </button>
        )}

        {sound.isDefault && (
          <span
            className="flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-medium"
            style={{ color: "#16a34a", background: "#f0fdf4" }}
          >
            <CheckCircle2 size={11} /> In use
          </span>
        )}

        {/* Delete — only custom sounds */}
        {!sound.isDefault ? (
          <button
            onClick={onDelete}
            title="Delete"
            className="w-7 h-7 rounded-md flex items-center justify-center border transition-all opacity-0 group-hover:opacity-100"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-danger-light)";
              e.currentTarget.style.color = "var(--color-danger)";
              e.currentTarget.style.borderColor = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-muted)";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          >
            <Trash2 size={13} />
          </button>
        ) : (
          /* Lock icon placeholder to keep layout consistent */
          <div className="w-7 h-7" />
        )}
      </div>
    </div>
  );
}

// ─── Info card ────────────────────────────────────────────────────────────────

function InfoCard() {
  return (
    <div
      className="flex items-start gap-3 rounded-xl p-4 border"
      style={{
        background: "#f0f9ff",
        borderColor: "#bae6fd",
        color: "#0369a1",
      }}
    >
      <AlertCircle size={15} className="shrink-0 mt-0.5" />
      <div className="text-xs leading-relaxed">
        <strong className="font-semibold">How sounds work:</strong> The{" "}
        <strong>default</strong> sound plays for any schedule that doesn't have
        a custom sound assigned. To assign a specific sound to a schedule, edit
        the schedule and pick from the Sound dropdown. Built-in sounds cannot be
        deleted.
      </div>
    </div>
  );
}
