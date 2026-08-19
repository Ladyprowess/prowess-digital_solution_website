"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Purchase = {
  id: string;
  email: string;
  item_type: "resource" | "course" | "career_path";
  item_id: string;
  amount: number;
  currency: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  flutterwave_reference: string | null;
  created_at: string;
};

const STATUS_OPTIONS = ["", "paid", "pending", "failed", "refunded"] as const;
const ITEM_TYPE_OPTIONS = ["", "resource", "course", "career_path"] as const;
const ITEM_TABLE: Record<Purchase["item_type"], string> = {
  resource: "resources",
  course: "courses",
  career_path: "career_paths",
};
const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-slate-200 text-slate-700",
};

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [total, setTotal] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("");
  const [itemType, setItemType] = useState<(typeof ITEM_TYPE_OPTIONS)[number]>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    let query = supabase.from("purchases").select("*", { count: "exact" });
    if (status) query = query.eq("payment_status", status);
    if (itemType) query = query.eq("item_type", itemType);
    if (search.trim()) query = query.ilike("email", `%${search.trim()}%`);

    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);

    const rows = (data as Purchase[]) || [];
    setPurchases(rows);
    setTotal(count || 0);

    // Revenue total respects the current filters, not just the current page.
    let revenueQuery = supabase.from("purchases").select("amount").eq("payment_status", "paid");
    if (itemType) revenueQuery = revenueQuery.eq("item_type", itemType);
    if (search.trim()) revenueQuery = revenueQuery.ilike("email", `%${search.trim()}%`);
    const { data: revenueRows } = await revenueQuery;
    setTotalRevenue(((revenueRows as { amount: number }[]) || []).reduce((sum, r) => sum + Number(r.amount || 0), 0));

    const idsByType: Record<string, Set<string>> = { resource: new Set(), course: new Set(), career_path: new Set() };
    for (const p of rows) idsByType[p.item_type]?.add(p.item_id);

    const titleResults = await Promise.all(
      (Object.entries(idsByType) as [Purchase["item_type"], Set<string>][])
        .filter(([, ids]) => ids.size > 0)
        .map(([type, ids]) => supabase.from(ITEM_TABLE[type]).select("id, title").in("id", Array.from(ids)))
    );
    const titleMap: Record<string, string> = {};
    for (const r of titleResults) {
      for (const row of (r.data as { id: string; title: string }[] | null) || []) titleMap[row.id] = row.title;
    }
    setTitles(titleMap);

    setLoading(false);
  }, [page, status, itemType, search]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => { setPage(1); }, [status, itemType, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Purchases</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every premium content purchase across Prowess Digital Solutions.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Paid Revenue</p>
          <p className="mt-2 text-2xl font-bold text-foreground">₦{totalRevenue.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Always paid only - ignores the status filter below</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Matching purchases</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{total}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email..."
          className="w-full max-w-xs rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={itemType} onChange={(e) => setItemType(e.target.value as typeof itemType)} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground">
          <option value="">All item types</option>
          {ITEM_TYPE_OPTIONS.filter(Boolean).map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
        </select>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : purchases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No purchases match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Item</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 font-medium text-foreground">{titles[p.item_id] || "Untitled"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{p.item_type.replace("_", " ")}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{p.email}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{p.currency} {Number(p.amount).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLES[p.payment_status] || "bg-muted text-muted-foreground"}`}>
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-muted"
          >
            ← Previous
          </button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-muted"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
