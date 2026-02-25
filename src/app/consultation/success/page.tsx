import { Suspense } from "react";
import ConsultationSuccessClient from "./ConsultationSuccessClient";

// ✅ stops Netlify/Next from trying to pre-render this page at build time
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ConsultationSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <h1 className="text-2xl font-semibold text-slate-900">Booking received</h1>
            <p className="mt-4 text-sm text-slate-700">Confirming your booking…</p>
          </div>
        </div>
      }
    >
      <ConsultationSuccessClient />
    </Suspense>
  );
}