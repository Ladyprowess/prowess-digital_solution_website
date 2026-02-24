"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  start_at: string;
  end_at: string;
  notes: string | null;
  payment_status: string;
  paystack_reference: string | null;
  amount_ngn: number;
  google_event_id: string | null;
};

export default function AdminConsultationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setMsg("");

    const { data, error } = await supabase
      .from("consultation_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      setRows([]);
      return;
    }

    setRows((data || []) as Row[]);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin — Consultations</h1>
            <p className="mt-1 text-sm text-slate-600">All bookings and payment status.</p>
          </div>

          <button
            onClick={load}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading ? <p className="mt-6 text-sm text-slate-600">Loading…</p> : null}
        {msg ? <p className="mt-6 text-sm text-rose-700">{msg}</p> : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{r.full_name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{r.email}</p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    r.payment_status === "paid"
                      ? "bg-emerald-50 text-emerald-700"
                      : r.payment_status === "failed"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {r.payment_status}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                <div>📅 {new Date(r.start_at).toLocaleString("en-GB")} → {new Date(r.end_at).toLocaleTimeString("en-GB")}</div>
                <div>💰 ₦{Number(r.amount_ngn || 0).toLocaleString()}</div>
                <div>📌 Ref: {r.paystack_reference || "—"}</div>
                <div>📞 {r.phone || "—"}</div>
              </div>

              {r.notes ? (
                <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                  {r.notes}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {!loading && rows.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No bookings yet.
          </div>
        ) : null}
      </Container>
    </div>
  );
}