"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/formatMoney";
import { AdminCurrencyToggle, useAdminCurrency } from "@/components/admin/AdminCurrency";

type AdminUser = {
  id: string;
  email: string | null | undefined;
  created_at: string;
  last_sign_in_at: string | null | undefined;
  banned: boolean;
  full_name: string | null;
  headline: string | null;
  purchase_count: number;
  spent_by_currency: Record<string, number>;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const currency = useAdminCurrency();
  const PAGE_SIZE = 20;

  const load = useCallback(async (pageToLoad: number, q: string) => {
    setLoading(true);
    setErr("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Your session expired - refresh and try again.");

      const params = new URLSearchParams({ page: String(pageToLoad) });
      if (q) params.set("q", q);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Could not load users.");
      setUsers(body.users || []);
      setTotal(body.total ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(page, search), 250);
    return () => clearTimeout(t);
  }, [page, search, load]);

  const totalPages = total ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : null;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <AdminCurrencyToggle />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Everyone with a Prowess Digital Solutions member account.</p>

      <input
        value={search}
        onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        placeholder="Search by name or email..."
        className="mt-6 w-full max-w-md rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
      />

      {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Joined</th>
                  <th className="py-2 pr-4">Last sign-in</th>
                  <th className="py-2 pr-4">Purchases</th>
                  <th className="py-2 pr-4">Spent ({currency})</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 font-medium text-foreground">{u.full_name || "-"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {u.email}
                      {u.banned && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">Banned</span>}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{u.purchase_count}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{(u.spent_by_currency || {})[currency] ? formatMoney(u.spent_by_currency[currency], currency) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(totalPages === null ? users.length === PAGE_SIZE : totalPages > 1) && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-muted"
          >
            ← Previous
          </button>
          <span className="text-sm text-muted-foreground">Page {page}{totalPages ? ` of ${totalPages}` : ""}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={totalPages !== null && page >= totalPages}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-muted"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
