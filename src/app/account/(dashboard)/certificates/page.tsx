"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Download, ExternalLink, ShieldCheck } from "lucide-react";
import { Card, EmptyState } from "@/components/account/AccountUI";
import { supabase } from "@/lib/supabase";

type CertificateRow = { id: string; course_id: string | null; course_title: string; issued_at: string; verification_code: string };

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-4">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-2 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

async function downloadCertificate(id: string, courseTitle: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const res = await fetch(`/api/certificates/${id}/pdf`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${courseTitle.replace(/[^a-z0-9]+/gi, "_")}_Certificate.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("certificates")
        .select("id, course_id, course_title, issued_at, verification_code")
        .order("issued_at", { ascending: false });
      setCertificates(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
        <Award size={14} aria-hidden="true" />
        Credentials
      </div>
      <h1 className="mt-3 text-2xl font-bold text-foreground">Certificates</h1>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
        Certificates you&rsquo;ve earned by completing courses on Prowess Digital Solutions.
      </p>

      <div className="mt-6">
        <Card title="Your certificates">
          {loading ? (
            <LoadingRows />
          ) : certificates.length === 0 ? (
            <EmptyState text="Complete a course with certification enabled to earn your first certificate." ctaLabel="Browse courses" ctaHref="/learn" />
          ) : (
            <div className="grid gap-4">
              {certificates.map((c) => (
                <div key={c.id} className="overflow-hidden rounded-lg border border-border bg-background">
                  <div className="border-b border-border bg-primary/5 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <ShieldCheck size={22} aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-foreground">{c.course_title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Issued {new Date(c.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-card px-3 py-1 text-xs font-bold text-primary">Verified credential</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Verification code <span className="ml-2 text-foreground">{c.verification_code}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => downloadCertificate(c.id, c.course_title)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Download size={15} aria-hidden="true" />
                        Download PDF
                      </button>
                      <Link
                        href={`/certificates/verify/${c.verification_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        Verify
                        <ExternalLink size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
