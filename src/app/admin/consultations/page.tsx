"use client";

import { useEffect, useMemo, useState } from "react";
import Container from "@/components/Container";

type BookingRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  scheduled_date: string;
  scheduled_time: string;
  timezone: string;
  payment_status: "free" | "pending" | "paid" | "failed";
  paystack_reference: string | null;
  flutterwave_reference: string | null;
  created_at: string;
  service_id: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminConsultationsPage() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const stats = useMemo(() => {
    const total = rows.length;
    const paid = rows.filter((r) => r.payment_status === "paid").length;
    const pending = rows.filter((r) => r.payment_status === "pending").length;
    return { total, paid, pending };
  }, [rows]);

  async function load() {
    setLoading(true);
    setMsg("");

    const res = await fetch("/api/consultations/admin/bookings", { cache: "no-store" });
    const json = await res.json().catch(() => null);

    setLoading(false);

    if (!res.ok) {
      setMsg(json?.error || "Failed to load bookings");
      setRows([]);
      return;
    }

    setRows((json?.items || []) as BookingRow[]);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin - Consultation Bookings</h1>
            <p className="mt-1 text-sm text-slate-600">View all bookings and payment status.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-medium text-slate-500">Total</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{stats.total}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-medium text-slate-500">Paid</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{stats.paid}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-medium text-slate-500">Pending</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{stats.pending}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <p className={cn("text-sm", msg ? "text-rose-700" : "text-slate-600")}>
              {msg || "Latest bookings appear first."}
            </p>

            <button
              type="button"
              onClick={load}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading ? <p className="mt-4 text-sm text-slate-600">Loading…</p> : null}

          <div className="mt-5 space-y-3">
            {!loading && rows.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No bookings yet.
              </div>
            ) : null}

            {rows.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{r.full_name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{r.email} {r.phone ? `• ${r.phone}` : ""}</p>
                  </div>

                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      r.payment_status === "paid"
                        ? "bg-emerald-50 text-emerald-700"
                        : r.payment_status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : r.payment_status === "failed"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {r.payment_status}
                  </span>
                </div>

                <div className="mt-3 grid gap-1 text-sm text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="shrink-0 text-slate-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    {r.scheduled_date} • {String(r.scheduled_time).slice(0,5)} ({r.timezone})
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="shrink-0 text-slate-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                    Ref: {r.flutterwave_reference || r.paystack_reference || "-"}
                  </div>
                  <div className="text-xs text-slate-500">Created: {new Date(r.created_at).toLocaleString("en-GB")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}