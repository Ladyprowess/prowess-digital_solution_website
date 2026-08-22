"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Android/Chrome/Edge fire `beforeinstallprompt` and let us trigger the
// native install dialog programmatically. iOS Safari never fires that event
// and has no programmatic install API at all - "Add to Home Screen" only
// exists inside the manual Share sheet, so iOS gets instructions instead of
// a button. Dismissal is remembered for a couple weeks rather than forever,
// since someone who says "not now" today may want it later.
const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 14;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function wasDismissedRecently() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_DAYS * 86_400_000;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (isStandalone() || wasDismissedRecently()) return;
    } catch {
      return;
    }

    if (isIos()) {
      setShowIosHint(true);
      setVisible(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Private browsing / storage disabled - just hide for this session.
    }
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === "accepted") setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Install app"
      className="fixed inset-x-3 bottom-3 z-40 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 flex-shrink-0 rounded-xl border border-border"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Install Prowess Digital Solutions</p>
          {showIosHint ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tap <span className="font-semibold text-foreground">Share</span> then{" "}
              <span className="font-semibold text-foreground">Add to Home Screen</span>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">Add the app to your home screen for quick access.</p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {!showIosHint && (
            <button
              type="button"
              onClick={install}
              className="flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Install
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
