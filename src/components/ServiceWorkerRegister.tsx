"use client";

import { useEffect } from "react";

// Registers /public/sw.js once the page has loaded. Silently no-ops in any
// environment without service worker support (SSR, older browsers) instead
// of throwing - this is a progressive enhancement, not a requirement.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
