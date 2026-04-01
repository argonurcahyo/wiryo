"use client";

import { useEffect } from "react";

export default function ServiceWorkerInit() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    } else {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
    }
  }, []);

  return null;
}
