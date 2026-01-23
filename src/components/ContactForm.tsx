"use client";

import { useState } from "react";
import Button from "@/components/Button";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      topic: formData.get("topic"),
      message: formData.get("message"),
      website: formData.get("website"), // honeypot
    };

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      setStatus({ ok: false, msg: data.error || "Could not send message." });
      setLoading(false);
      return;
    }

    form.reset();
    setStatus({ ok: true, msg: "Message received. We will get back to you soon." });
    setLoading(false);
  }

  return (
    <form className="mt-4 space-y-4" onSubmit={onSubmit}>
      {/* Honeypot */}
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <div>
        <label className="text-sm font-medium">Full name</label>
        <input name="full_name" className="mt-1 w-full rounded-lg border border-slate-200 p-3" placeholder="Your name" required />
      </div>

      <div>
        <label className="text-sm font-medium">Email</label>
        <input name="email" type="email" className="mt-1 w-full rounded-lg border border-slate-200 p-3" placeholder="Your email" required />
      </div>

      <div>
        <label className="text-sm font-medium">What do you need help with?</label>
        <select name="topic" className="mt-1 w-full rounded-lg border border-slate-200 p-3 bg-white" required>
          <option>Business Clarity Session</option>
          <option>Business Audit & Review</option>
          <option>Business Setup & Structure</option>
          <option>Brand Foundation</option>
          <option>Systems & Operations</option>
          <option>Training & Mentorship</option>
          <option>Retainer support</option>
          <option>Other enquiry</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Message</label>
        <textarea name="message" className="mt-1 w-full rounded-lg border border-slate-200 p-3" rows={5} placeholder="Write your message..." required />
      </div>

      <Button type="submit">{loading ? "Sending..." : "Send"}</Button>

      {status ? (
        <p className={`text-sm ${status.ok ? "text-emerald-700" : "text-red-700"}`}>
          {status.msg}
        </p>
      ) : null}
    </form>
  );
}
