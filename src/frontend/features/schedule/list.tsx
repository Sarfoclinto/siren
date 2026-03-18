import {
  Clock,
  Pencil,
  Trash2,
  Volume2,
  MessageSquareText,
} from "lucide-react";
import type { Schedule } from "@shared/types";

const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

interface Props {
  schedules: Schedule[];
  onEdit: (s: Schedule) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, enabled: boolean) => void;
}

export function ScheduleList({ schedules, onEdit, onDelete, onToggle }: Props) {
  return (
    <div className="sl-wrap">
      <table className="sl-table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Time</th>
            <th>Days</th>
            <th>Features</th>
            <th>Vol</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s) => (
            <ScheduleRow
              key={s.id}
              schedule={s}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))}
        </tbody>
      </table>

      <style>{`
        .sl-wrap {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .sl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .sl-table thead tr {
          background: var(--color-bg-hover);
          border-bottom: 1px solid var(--color-border);
        }
        .sl-table th {
          padding: 10px 14px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          white-space: nowrap;
        }
        .sl-table tbody tr {
          border-bottom: 1px solid var(--color-border);
          transition: background 0.1s;
        }
        .sl-table tbody tr:last-child { border-bottom: none; }
        .sl-table tbody tr:hover { background: var(--color-bg-hover); }
        .sl-table td {
          padding: 12px 14px;
          vertical-align: middle;
          color: var(--color-text-primary);
        }
      `}</style>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ScheduleRow({
  schedule: s,
  onEdit,
  onDelete,
  onToggle,
}: {
  schedule: Schedule;
  onEdit: (s: Schedule) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, enabled: boolean) => void;
}) {
  function handleDelete() {
    if (window.confirm(`Delete "${s.label}"?`)) onDelete(s.id);
  }

  return (
    <tr style={{ opacity: s.enabled ? 1 : 0.5 }}>
      {/* Label */}
      <td>
        <span style={{ fontWeight: 500 }}>{s.label}</span>
      </td>

      {/* Time */}
      <td>
        <span className="sl-badge sl-badge-time">
          <Clock size={11} />
          {s.time}
        </span>
      </td>

      {/* Days */}
      <td>
        <div className="sl-days">
          {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map(
            (d) => (
              <span
                key={d}
                className={`sl-day ${s.days.includes(d) ? "active" : ""}`}
              >
                {DAY_LABELS[d]}
              </span>
            ),
          )}
        </div>
      </td>

      {/* Feature icons */}
      <td>
        <div className="sl-features">
          <span
            className={`sl-feature ${s.soundId !== null ? "on" : ""}`}
            title="Custom sound"
          >
            <Volume2 size={13} />
          </span>
          <span
            className={`sl-feature ${s.ttsMessage ? "on" : ""}`}
            title={s.ttsMessage || "No announcement"}
          >
            <MessageSquareText size={13} />
          </span>
        </div>
      </td>

      {/* Volume */}
      <td>
        <span className="sl-vol">{s.volume}%</span>
      </td>

      {/* Toggle */}
      <td>
        <Toggle checked={s.enabled} onChange={(v) => onToggle(s.id, v)} />
      </td>

      {/* Actions */}
      <td>
        <div className="sl-actions">
          <button
            className="sl-action-btn"
            onClick={() => onEdit(s)}
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            className="sl-action-btn danger"
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>

      <style>{`
        .sl-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 500;
        }
        .sl-badge-time {
          background: var(--color-accent-subtle);
          color: var(--color-accent);
        }
        .sl-days { display: flex; gap: 3px; flex-wrap: wrap; }
        .sl-day {
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
          background: var(--color-bg-hover);
          color: var(--color-text-muted);
        }
        .sl-day.active {
          background: var(--color-accent-subtle);
          color: var(--color-accent);
        }
        .sl-features { display: flex; gap: 6px; }
        .sl-feature { color: var(--color-border-strong); }
        .sl-feature.on { color: var(--color-accent); }
        .sl-vol { font-size: 12px; color: var(--color-text-muted); }
        .sl-actions { display: flex; gap: 4px; }
        .sl-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
          background: transparent;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: background 0.1s, color 0.1s, border-color 0.1s;
        }
        .sl-action-btn:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
        .sl-action-btn.danger:hover { background: var(--color-danger-subtle); color: var(--color-danger); border-color: var(--color-danger); }
      `}</style>
    </tr>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle" title={checked ? "Enabled" : "Disabled"}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ display: "none" }}
      />
      <span className={`toggle-track ${checked ? "on" : ""}`}>
        <span className="toggle-thumb" />
      </span>
      <style>{`
        .toggle { cursor: pointer; display: inline-flex; }
        .toggle-track {
          width: 34px; height: 18px;
          border-radius: 9px;
          background: var(--color-border-strong);
          position: relative;
          transition: background 0.2s;
          display: flex;
          align-items: center;
        }
        .toggle-track.on { background: var(--color-accent); }
        .toggle-thumb {
          width: 12px; height: 12px;
          border-radius: 50%;
          background: #fff;
          position: absolute;
          left: 3px;
          transition: transform 0.2s;
        }
        .toggle-track.on .toggle-thumb { transform: translateX(16px); }
      `}</style>
    </label>
  );
}
