"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, EmptyState } from "@/components/account/AccountUI";
import { hrefFor } from "@/lib/account/itemLinks";
import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/formatMoney";

type EbookFormat = "read" | "download" | "hardcopy";
type Purchase = {
  id: string; item_type: string; item_id: string; amount: number; currency: string;
  title: string; slug: string | null; created_at: string;
  formats: EbookFormat[]; download_url: string | null;
};

const FORMAT_LABELS: Record<EbookFormat, string> = { read: "Read Online", download: "Download", hardcopy: "Hard Copy" };

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = token
        ? await fetch("/api/account/purchases", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null)
        : null;
      setPurchases(res?.ok ? res.items : []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">My Purchases</h1>
      <p className="mt-1 text-sm text-muted-foreground">Everything you&rsquo;ve bought, and how to read, download, or track it.</p>

      <div className="mt-6">
        <Card title="Purchases">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : purchases.length === 0 ? (
            <EmptyState text="No purchases yet." ctaLabel="Browse premium content" ctaHref="/resources" />
          ) : (
            <ul className="space-y-2">
              {purchases.map((p) => {
                const href = hrefFor(p.item_type, p.slug);
                const hasFormats = p.formats && p.formats.length > 0;
                return (
                  <li key={p.id} className="rounded-xl border border-border/60 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      {href ? (
                        <Link href={href} className="font-medium text-foreground hover:text-primary hover:underline">{p.title}</Link>
                      ) : (
                        <span className="font-medium text-foreground">{p.title}</span>
                      )}
                      <span className="flex-shrink-0 text-xs text-muted-foreground">{formatMoney(Number(p.amount), (p.currency || "NGN").toUpperCase() === "USD" ? "USD" : "NGN")}</span>
                    </div>

                    {hasFormats && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          You own: {p.formats.map((f) => FORMAT_LABELS[f]).join(" · ")}
                        </span>
                      </div>
                    )}

                    {hasFormats && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {p.formats.includes("read") && href && (
                          <Link href={href} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
                            Read online →
                          </Link>
                        )}
                        {p.formats.includes("download") && p.download_url && (
                          <a href={p.download_url} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
                            Download →
                          </a>
                        )}
                        {p.formats.includes("hardcopy") && (
                          <span className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                            Hard copy ordered
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
