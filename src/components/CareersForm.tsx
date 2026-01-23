"use client";

import { useState } from "react";
import Button from "@/components/Button";

export default function CareersForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await fetch("/api/careers", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      setStatus({ ok: false, msg: data.error || "Could not submit." });
      setLoading(false);
      return;
    }

    form.reset();
    setStatus({ ok: true, msg: "Submitted successfully. Thank you for joining our talent pool." });
    setLoading(false);
  }

  return (
    <form className="mt-4 space-y-4" onSubmit={onSubmit}>
      {/* Honeypot */}
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <div>
        <label className="text-sm font-medium">Name</label>
        <input name="full_name" className="mt-1 w-full rounded-lg border border-slate-200 p-3" placeholder="Your name" required />
      </div>

      <div>
        <label className="text-sm font-medium">Email</label>
        <input name="email" type="email" className="mt-1 w-full rounded-lg border border-slate-200 p-3" placeholder="Your email" required />
      </div>

      <div>
        <label className="text-sm font-medium">Area of interest</label>
        <input name="area_of_interest" className="mt-1 w-full rounded-lg border border-slate-200 p-3" placeholder="e.g. Operations, Content, Admin support" required />
      </div>

      <div>
        <label className="text-sm font-medium">CV upload (PDF/DOC/DOCX, max 5MB)</label>
        <input name="cv" type="file" accept=".pdf,.doc,.docx" className="mt-1 w-full rounded-lg border border-slate-200 p-3 bg-white" required />
      </div>

      <Button type="submit">{loading ? "Submitting..." : "Submit"}</Button>

      {status ? (
        <p className={`text-sm ${status.ok ? "text-emerald-700" : "text-red-700"}`}>
          {status.msg}
        </p>
      ) : null}
    </form>
  );
}
