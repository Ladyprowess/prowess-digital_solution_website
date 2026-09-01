"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award } from "lucide-react";
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
            <ul className="space-y-3">
              {certificates.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-foreground">{c.course_title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Issued {new Date(c.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · {c.verification_code}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-4">
                    <button
                      type="button"
                      onClick={() => downloadCertificate(c.id, c.course_title)}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Download PDF
                    </button>
                    <Link
                      href={`/certificates/verify/${c.verification_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-muted-foreground hover:text-primary hover:underline"
                    >
                      Verify
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
