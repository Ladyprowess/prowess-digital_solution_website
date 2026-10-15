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
  href?: string | null; description?: string | null;
  formats: EbookFormat[]; download_url: string | null;
};

const FORMAT_LABELS: Record<EbookFormat, string> = { read: "Read Online", download: "Download", hardcopy: "Hard Copy" };

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  // Sent by the API, totalled there from every paid row. Not derived from
  // `purchases` on this page: that list is grouped one row per item, so an
  // ebook bought in two formats would only count the later payment.
  const [spent, setSpent] = useState<Record<string, number>>({});
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = token
        ? await fetch("/api/account/purchases", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null)
        : null;
      setPurchases(res?.ok ? res.items : []);
      setSpent(res?.ok ? res.spent || {} : {});
      setPurchaseCount(res?.ok ? res.purchaseCount || 0 : 0);
      setLoading(false);
    })();
  }, []);

  const spentEntries = Object.entries(spent).sort(([a], [b]) => (a === "USD" ? -1 : b === "USD" ? 1 : a.localeCompare(b)));

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">My Purchases</h1>
      <p className="mt-1 text-sm text-muted-foreground">Everything you&rsquo;ve bought, and how to read, download, or track it.</p>

      {/* Each currency stands on its own. No toggle here, unlike admin -
          this is somebody's own record of what they actually paid, and
          hiding half of it behind a switch would be the wrong call. */}
      {!loading && spentEntries.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total spent</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              {spentEntries.map(([code, amount]) => (
                <p key={code} className="text-2xl font-bold text-foreground">
                  {formatMoney(amount, code === "USD" ? "USD" : "NGN")}
                </p>
              ))}
            </div>
            {spentEntries.length > 1 && (
              <p className="mt-1 text-[11px] text-muted-foreground">Shown separately - these are different currencies.</p>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payments</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{purchaseCount}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Across {purchases.length} {purchases.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Card title="Purchases">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : purchases.length === 0 ? (
            <EmptyState text="No purchases yet." ctaLabel="Browse premium content" ctaHref="/resources" />
          ) : (
            <ul className="space-y-2">
              {purchases.map((p) => {
                const href = p.href || hrefFor(p.item_type, p.slug);
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
                    {p.description && <p className="mt-1 text-xs capitalize text-muted-foreground">{p.description}</p>}

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
