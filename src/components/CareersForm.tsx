"use client";

import { useMemo, useState } from "react";

type FormState = {
  full_name: string;
  email: string;
  role_interest: string;
  location: string;
  linkedin_url: string;
  portfolio_url: string;
  message: string;
  resume: File | null;
};

export default function CareersForm() {
  const [submitting, setSubmitting] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    role_interest: "",
    location: "",
    linkedin_url: "",
    portfolio_url: "",
    message: "",
    resume: null,
  });

  const canSubmit = useMemo(() => {
    return (
      form.full_name.trim().length >= 2 &&
      form.email.trim().includes("@") &&
      form.role_interest.trim().length >= 2 &&
      !!form.resume
    );
  }, [form]);

  const onChange = (key: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOkMsg(null);
    setErrMsg(null);

    if (!canSubmit) {
      setErrMsg("Please fill in the required fields and upload your CV.");
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("full_name", form.full_name.trim());
      fd.append("email", form.email.trim());
      fd.append("role_interest", form.role_interest.trim());
      fd.append("location", form.location.trim());
      fd.append("linkedin_url", form.linkedin_url.trim());
      fd.append("portfolio_url", form.portfolio_url.trim());
      fd.append("message", form.message.trim());
      if (form.resume) fd.append("resume", form.resume);

      const res = await fetch("/api/careers", {
        method: "POST",
        body: fd,
      });

      const text = await res.text();
      let json: any = null;

      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Request failed (${res.status}).`);
      }

      setOkMsg("Submitted successfully. We will reach out when there is a match.");
      setForm({
        full_name: "",
        email: "",
        role_interest: "",
        location: "",
        linkedin_url: "",
        portfolio_url: "",
        message: "",
        resume: null,
      });

      // Clear file input (simple way)
      const fileInput = document.getElementById("resume") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      setErrMsg(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Alerts */}
      {okMsg ? (
        <div className="rounded-xl border border-[#dbe9e8] bg-[#f7fcfc] p-4 text-sm text-[#223433]">
          {okMsg}
        </div>
      ) : null}

      {errMsg ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errMsg}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
            FULL NAME *
          </label>
          <input
            value={form.full_name}
            onChange={(e) => onChange("full_name", e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm text-[#223433]"
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
            EMAIL *
          </label>
          <input
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm text-[#223433]"
            placeholder="you@email.com"
            type="email"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
            ROLE YOU WANT *
          </label>
          <input
            value={form.role_interest}
            onChange={(e) => onChange("role_interest", e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm text-[#223433]"
            placeholder="e.g. Content Writer, Designer, Developer"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
            LOCATION
          </label>
          <input
            value={form.location}
            onChange={(e) => onChange("location", e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm text-[#223433]"
            placeholder="e.g. Lagos, Abuja, Remote"
          />
        </div>

        <div>
          <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
            LINKEDIN (OPTIONAL)
          </label>
          <input
            value={form.linkedin_url}
            onChange={(e) => onChange("linkedin_url", e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm text-[#223433]"
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <div>
          <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
            PORTFOLIO (OPTIONAL)
          </label>
          <input
            value={form.portfolio_url}
            onChange={(e) => onChange("portfolio_url", e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm text-[#223433]"
            placeholder="https://..."
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
          MESSAGE (OPTIONAL)
        </label>
        <textarea
          value={form.message}
          onChange={(e) => onChange("message", e.target.value)}
          className="mt-2 min-h-[120px] w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm text-[#223433]"
          placeholder="Tell us briefly about your experience and what you want to do."
        />
      </div>

      <div>
        <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
          UPLOAD CV (PDF/DOC/DOCX) *
        </label>
        <input
          id="resume"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => onChange("resume", e.target.files?.[0] || null)}
          className="mt-2 w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm text-[#223433]"
          required
        />
        <p className="mt-2 text-xs text-[#6b7d7b]">
          Keep it simple. PDF is best.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#6b7d7b]">
          By submitting, you agree we can store your details for recruitment.
        </p>

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="rounded-lg bg-[#507c80] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[#3d5f62]"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
}
