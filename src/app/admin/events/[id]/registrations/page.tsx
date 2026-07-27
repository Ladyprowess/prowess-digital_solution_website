"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type RegRow = {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  payment_status: "free" | "paid";
  paystack_reference: string | null;
  created_at: string;
};

export default function AdminEventRegistrationsPage() {
  const params = useParams();
  const eventId = String(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<RegRow[]>([]);

  async function load() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("event_registrations")
      .select("id,event_id,full_name,email,phone,payment_status,paystack_reference,created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setRows((data || []) as RegRow[]);
  }

  useEffect(() => {
    load();
  }, [eventId]);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Registrants</h1>
            <p className="mt-1 text-sm text-slate-600">
              Event ID: <span className="font-semibold">{eventId}</span>
            </p>
          </div>

          <button
            onClick={load}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {/* States */}
        {loading && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading registrations…
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No registrations yet.
          </div>
        )}

        {/* List */}
        <div className="mt-6 grid gap-4">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {r.full_name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Registered {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    r.payment_status === "paid"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {r.payment_status === "paid" ? "Paid" : "Free"}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                <div className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="shrink-0 text-slate-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {r.email}
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="shrink-0 text-slate-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  {r.phone || "No phone provided"}
                </div>

                {r.paystack_reference && (
                  <div className="text-xs text-slate-500">
                    Ref: {r.paystack_reference}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}