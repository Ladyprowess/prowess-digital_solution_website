"use client";

import { useState } from "react";
import Container from "@/components/Container";

export default function AdminCareersPage() {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [level, setLevel] = useState("Mid");
  const [summary, setSummary] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    setMsg("");

    if (!title.trim()) {
      setErr("Title is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/careers/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          location,
          job_type: jobType,
          level,
          summary,
          responsibilities,
          requirements,
          apply_url: applyUrl,
          is_published: isPublished,
        }),
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

      setMsg("Role saved ✅");

      setTitle("");
      setLocation("");
      setJobType("Full-time");
      setLevel("Mid");
      setSummary("");
      setResponsibilities("");
      setRequirements("");
      setApplyUrl("");
      setIsPublished(true);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#eaf6f6] py-16">
      <Container>
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#dbe9e8] bg-white p-8">
          <h1 className="text-3xl font-semibold text-[#223433]">
            Add Open Role
          </h1>
          <p className="mt-2 text-sm text-[#4d5f5e]">
            Create a role here and publish it to show on the Careers page.
          </p>

          <div className="mt-8 grid gap-4">
            <Field label="Role title *">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-[#dbe9e8] px-4 py-3 text-sm"
                placeholder="e.g. Operations Assistant"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Location">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-[#dbe9e8] px-4 py-3 text-sm"
                  placeholder="e.g. Remote"
                />
              </Field>

              <Field label="Job type">
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full rounded-xl border border-[#dbe9e8] bg-white px-4 py-3 text-sm"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </Field>

              <Field label="Level">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full rounded-xl border border-[#dbe9e8] bg-white px-4 py-3 text-sm"
                >
                  <option>Junior</option>
                  <option>Mid</option>
                  <option>Senior</option>
                </select>
              </Field>
            </div>

            <Field label="Short summary">
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="min-h-[90px] w-full rounded-xl border border-[#dbe9e8] px-4 py-3 text-sm"
                placeholder="A short paragraph about the role..."
              />
            </Field>

            <Field label="Responsibilities">
              <textarea
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                className="min-h-[120px] w-full rounded-xl border border-[#dbe9e8] px-4 py-3 text-sm"
                placeholder="Write responsibilities..."
              />
            </Field>

            <Field label="Requirements">
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="min-h-[120px] w-full rounded-xl border border-[#dbe9e8] px-4 py-3 text-sm"
                placeholder="Write requirements..."
              />
            </Field>

            <Field label="Apply link (URL)">
              <input
                value={applyUrl}
                onChange={(e) => setApplyUrl(e.target.value)}
                className="w-full rounded-xl border border-[#dbe9e8] px-4 py-3 text-sm"
                placeholder="e.g. https://forms.gle/..."
              />
            </Field>

            <label className="mt-2 flex items-center gap-3 text-sm font-semibold text-[#223433]">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              Publish immediately
            </label>

            {err ? <p className="text-sm text-red-600">{err}</p> : null}
            {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#507c80] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[#3d5f62]"
            >
              {loading ? "Saving..." : "Save role"}
            </button>
          </div>
        </div>
      </Container>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
        {label.toUpperCase()}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
