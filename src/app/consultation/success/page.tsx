// src/app/consultation/success/page.tsx

export const dynamic = "error"; // keep this page 100% static (important for Netlify export)

export default function ConsultationSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-xl px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Booking received
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Thank you. If your payment went through, you will receive a confirmation email shortly.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            If you do not see the email in a few minutes, please check your spam/junk folder.
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="/consultation"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Back to consultation page
            </a>

            <a
              href="/"
              className="rounded-2xl bg-[var(--steel-teal)] px-5 py-3 text-center text-sm font-semibold text-white hover:opacity-90"
            >
              Go to homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}