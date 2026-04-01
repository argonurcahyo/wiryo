"use client";

import { useEffect, useState } from "react";

export default function ServiceWorkerInit() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // In dev, unregister any stale SW so it never interferes
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      return;
    }

    // ── Register ────────────────────────────────────────────────────────────
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        // Detect a new SW installing while a page is already controlled
        reg.addEventListener("updatefound", () => {
          const next = reg.installing;
          if (!next) return;
          next.addEventListener("statechange", () => {
            if (next.state === "installed" && navigator.serviceWorker.controller) {
              // A new version is waiting — show the banner
              setUpdateReady(true);
            }
          });
        });

        // Also poll every 60 s so long-lived tabs catch updates
        setInterval(() => reg.update(), 60_000);
      });

    // The SW itself broadcasts NEW_VERSION when it activates fresh
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (e.data?.type === "NEW_VERSION") setUpdateReady(true);
    });

    // After skipWaiting the controller changes — reload to pick up new SW
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  // ── Send skipWaiting then the controllerchange listener reloads ──────────
  const handleUpdate = () => {
    navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
  };

  if (!updateReady) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 px-2 w-full max-w-sm">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/90 px-4 py-3 shadow-xl backdrop-blur-md text-sm text-emerald-100">
        <span>🔄 Update tersedia</span>
        <div className="flex gap-2">
          <button
            onClick={() => setUpdateReady(false)}
            className="rounded-lg px-3 py-1.5 text-emerald-300 hover:bg-emerald-800/60 transition-colors"
          >
            Nanti
          </button>
          <button
            onClick={handleUpdate}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 font-semibold text-white hover:bg-emerald-400 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
