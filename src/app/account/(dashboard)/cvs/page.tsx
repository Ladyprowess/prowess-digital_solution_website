"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, EmptyState } from "@/components/account/AccountUI";
import { supabase } from "@/lib/supabase";

type CvRow = { id: string; title: string; template: string; updated_at: string };

export default function CvsPage() {
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = token
        ? await fetch("/api/cv-builder/save", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null)
        : null;
      setCvs(res?.ok ? res.cvs : []);
      setLoading(false);
    })();
  }, []);

  async function download(cv: CvRow) {
    setError("");
    setDownloadingId(cv.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError("Please sign in to continue."); return; }

      const res = await fetch("/api/cv-builder/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // Server loads the real saved data/template itself from cv.id -
        // this only tells it which CV and which of its own template to
        // export, never sends CV content.
        body: JSON.stringify({ cvId: cv.id, template: cv.template }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.error || "Could not generate your PDF.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(cv.title || "CV").replace(/[^a-z0-9]+/gi, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">My CVs</h1>
      <p className="mt-1 text-sm text-muted-foreground">CVs you&rsquo;ve built - keep editing them or download a fresh PDF any time.</p>

      <div className="mt-6">
        <Card title="CVs" action={<Link href="/tools/cv-builder" className="text-sm font-semibold text-primary hover:underline">New CV →</Link>}>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : cvs.length === 0 ? (
            <EmptyState text="No CVs yet." ctaLabel="Build your first CV" ctaHref="/tools/cv-builder" />
          ) : (
            <ul className="space-y-2">
              {cvs.map((cv) => (
                <li key={cv.id} className="rounded-xl border border-border/60 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{cv.title}</p>
                      <p className="text-xs text-muted-foreground">Updated {new Date(cv.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href={`/tools/cv-builder/editor?id=${cv.id}&template=${cv.template}`} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
                      Edit →
                    </Link>
                    <button
                      type="button"
                      onClick={() => download(cv)}
                      disabled={downloadingId === cv.id}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60"
                    >
                      {downloadingId === cv.id ? "Preparing…" : "Download →"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
