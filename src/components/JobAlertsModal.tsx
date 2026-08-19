"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

export function JobAlertsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, preference: "jobs", source: "navbar-modal" }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("ok");
        setMessage("You're on the list. We'll email you when new jobs go live.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong.");
    }
  };

  return (
    <Modal open={open} title="Get Job Alerts" onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        Enter your email and we&rsquo;ll let you know the moment new jobs are added to Prowess Digital Solutions.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full min-w-0 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 disabled:opacity-60"
        >
          {status === "loading" ? "Joining…" : "Notify Me"}
        </button>
      </form>
      {message && (
        <p className={`mt-3 text-sm ${status === "ok" ? "text-primary" : "text-red-600"}`}>{message}</p>
      )}
    </Modal>
  );
}
