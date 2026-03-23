import { useState, useEffect, useCallback } from "react";
import {
  BellRing,
  CalendarDays,
  Settings as SettingsIcon,
  CircleDot,
} from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@frontend/hooks/useApi";
import type { Schedule, ScheduleCreate, TriggerEvent } from "../../../../types";
import { ScheduleList } from "../schedule/list";
import { ScheduleForm } from "../schedule/form";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);

  const api = useApi();

  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      setSchedules(await api.listSchedules());
    } catch (err) {
      toast.error("Failed to load schedules");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
    const unsub = window.api.onTriggered((e: TriggerEvent) => {
      toast.success(`🔔 ${e.label}`, {
        description: `Fired at ${e.time}`,
        duration: 6000,
      });
    });
    return unsub;
  }, [load]);

  // ── CRUD handlers ────────────────────────────────────────────────────────────

  async function handleSave(data: ScheduleCreate) {
    try {
      if (editing) {
        const updated = await api.updateSchedule({ id: editing.id, ...data });
        setSchedules((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s)),
        );
        toast.success("Schedule updated");
      } else {
        const created = await api.createSchedule(data);
        setSchedules((prev) => [...prev, created]);
        toast.success("Schedule created");
      }
      closeForm();
    } catch (err) {
      toast.error(
        editing ? "Failed to update schedule" : "Failed to create schedule",
      );
      console.error(err);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      toast.success("Schedule deleted");
    } catch {
      toast.error("Failed to delete schedule");
    }
  }

  async function handleToggle(id: number, enabled: boolean) {
    try {
      await api.toggleSchedule(id, enabled);
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s)),
      );
    } catch {
      toast.error("Failed to update schedule");
    }
  }

  function openEdit(s: Schedule) {
    setEditing(s);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  const activeCount = schedules.filter((s) => s.enabled).length;

  return (
    <div className="db-layout">
      {/* ── Sidebar ── */}
      <aside className="db-sidebar">
        <div className="db-brand">
          <BellRing size={20} strokeWidth={1.5} className="text-slate-900" />
          <span className="text-slate-950">School Siren</span>
        </div>

        <nav className="db-nav">
          <button className="db-nav-item active text-slate-900!">
            <CalendarDays size={16} /> Schedules
          </button>
          <button className="db-nav-item" onClick={() => navigate("/settings")}>
            <SettingsIcon size={16} /> Settings
          </button>
        </nav>

        <div className="db-status">
          <CircleDot size={12} className="status-dot" />
          <span>Scheduler running</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="db-main">
        <header className="db-header">
          <div>
            <h1 className="db-title">Schedules</h1>
            <p className="db-subtitle">
              {loading
                ? "Loading…"
                : `${activeCount} active · ${schedules.length} total`}
            </p>
          </div>
          <button
            className="py-2 px-4 rounded-md border-none bg-slate-900 text-slate-100 cursor-pointer whitespace-nowrap transition-all hover:bg-slate-800"
            type="button"
            disabled={loading}
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            + New Schedule
          </button>
        </header>

        {loading ? (
          <div className="db-empty">Loading schedules…</div>
        ) : schedules.length === 0 ? (
          <div className="db-empty">
            <BellRing
              size={40}
              strokeWidth={1}
              style={{ opacity: 0.25, marginBottom: 12 }}
            />
            <p>No schedules yet.</p>
            <button
              className="py-2 px-4 rounded-md border-none bg-slate-900 text-slate-100 cursor-pointer whitespace-nowrap transition-all hover:bg-slate-800"
              style={{ marginTop: 16 }}
              onClick={() => setShowForm(true)}
            >
              Create your first schedule
            </button>
          </div>
        ) : (
          <ScheduleList
            schedules={schedules}
            onEdit={openEdit}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        )}
      </main>

      {/* ── Form modal ── */}
      {showForm && (
        <ScheduleForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      <style>{`
        .db-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        /* Sidebar */
        .db-sidebar {
          width: 210px;
          flex-shrink: 0;
          background: var(--color-bg-card);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          padding: 18px 10px;
        }
        .db-brand {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 4px 8px 14px;
          font-size: 15px;
          font-weight: 600;
          color: var(--color-accent);
          border-bottom: 1px solid var(--color-border);
          margin-bottom: 10px;
        }
        .db-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .db-nav-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 10px;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          color: var(--color-text-secondary);
          font-size: 13px;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: background 0.1s, color 0.1s;
        }
        .db-nav-item:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
        .db-nav-item.active {
          background: var(--color-accent-subtle);
          color: var(--color-accent);
          font-weight: 500;
        }
        .db-status {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 10px 2px;
          font-size: 11px;
          color: var(--color-text-muted);
          border-top: 1px solid var(--color-border);
        }
        .status-dot { color: #22c55e; }

        /* Main */
        .db-main {
          flex: 1;
          overflow-y: auto;
          padding: 28px 30px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .db-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .db-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 3px;
        }
        .db-subtitle { font-size: 13px; color: var(--color-text-muted); }
        .db-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          font-size: 14px;
          padding: 60px 0;
        }

        /* Shared button */
        .btn-primary {
          padding: 8px 16px;
          border-radius: var(--radius-md);
          border: none;
          background: var(--color-accent);
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: var(--color-accent-hover); }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

export default Dashboard;
