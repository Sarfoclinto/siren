import { useState, useEffect } from "react";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";
import { Toaster } from "sonner";
import type { TriggerEvent } from "@shared/types";

type Page = "dashboard" | "settings";

export function App() {
  const [authed, setAuthed]   = useState(false);
  const [page, setPage]       = useState<Page>("dashboard");

  // Listen for trigger events to display toast notifications
  useEffect(() => {
    if (!authed) return;
    const unsub = window.api.onTriggered((e: TriggerEvent) => {
      // Toast is shown inside Dashboard, but we handle it here too
      // so it works even when Settings page is open
      console.log("[App] Triggered:", e.label);
    });
    return unsub;
  }, [authed]);

  if (!authed) {
    return (
      <>
        <Login onSuccess={() => setAuthed(true)} />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <>
      {page === "dashboard" && (
        <Dashboard onNavigate={setPage} />
      )}
      {page === "settings" && (
        <Settings onNavigate={setPage} />
      )}
      <Toaster position="top-right" richColors />
    </>
  );
}
