"use client";

import { useSyncExternalStore } from "react";

// One currency choice shared by every admin screen, remembered in the
// browser. USD and NGN are separate books - nothing here converts between
// them - so the admin picks which book to look at and every page follows.
//
// Read through useSyncExternalStore rather than a state-plus-effect: the
// value lives outside React (localStorage), the server render has no access
// to it, and this is the one pattern that handles both without a hydration
// mismatch or a setState inside an effect.

export type AdminCurrency = "USD" | "NGN";

const STORAGE_KEY = "prowess:admin-currency";
const listeners = new Set<() => void>();

// getSnapshot must return a stable value between renders, so the parsed
// choice is held here rather than re-read from storage on every call.
let cached: AdminCurrency | null = null;
let stored = false;

function read(): AdminCurrency {
  if (cached) return cached;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    stored = raw === "USD" || raw === "NGN";
    cached = raw === "USD" ? "USD" : "NGN";
  } catch {
    // A browser with site data blocked simply does not remember the choice.
    stored = false;
    cached = "NGN";
  }
  return cached;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function setAdminCurrency(next: AdminCurrency) {
  cached = next;
  stored = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Ignored - the choice still applies for this session.
  }
  for (const listener of listeners) listener();
}

/** True once someone has actually chosen, as opposed to sitting on the default. */
export function hasChosenAdminCurrency() {
  read();
  return stored;
}

/**
 * Sets the currency only if nobody has chosen one yet. Lets a page open on
 * the currency that actually has money in it, instead of showing a
 * confident zero in the other one, without overriding a real choice.
 */
export function suggestAdminCurrency(next: AdminCurrency) {
  if (hasChosenAdminCurrency()) return;
  cached = next;
  for (const listener of listeners) listener();
}

export function useAdminCurrency(): AdminCurrency {
  return useSyncExternalStore(subscribe, read, () => "NGN" as AdminCurrency);
}

export function AdminCurrencyToggle({ className = "" }: { className?: string }) {
  const currency = useAdminCurrency();
  return (
    <div className={`flex items-center gap-1 rounded-lg border border-border bg-card p-0.5 ${className}`}>
      {(["NGN", "USD"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setAdminCurrency(code)}
          aria-pressed={code === currency}
          className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
            code === currency ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {code === "USD" ? "$ USD" : "₦ NGN"}
        </button>
      ))}
    </div>
  );
}
