import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import AccessGate from "@/components/tools/AccessGate";
import {
  StartupCalculator,
  ProfitTracker,
  CustomerServiceGuide,
  BusinessStarter,
} from "@/components/tools/ToolFrames";

export default function ToolsPage() {
  return (
    <section className="py-12 sm:py-16 bg-slate-50/40">
      <Container>

        <div className="max-w-3xl">
          <SectionTitle
            title="Business Tools"
            desc="Practical tools built for African entrepreneurs. Free tools are open to everyone. The Calculator and Tracker require an access code."
          />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { emoji:"🧮", title:"Startup Calculator", desc:"Calculate startup costs, break-even point, and the right pricing for your service or product.", href:"#calculator" },
            { emoji:"📊", title:"Profit & Cashflow Tracker", desc:"Track income and expenses monthly, see category breakdowns, and forecast your cashflow.", href:"#tracker" },
            { emoji:"💬", title:"Customer Service Guide", desc:"200+ complaint scenarios with word-for-word response scripts for the African market.", href:"#customer-service" },
            { emoji:"🚀", title:"Business Starter", desc:"Enter your budget and get matching business ideas with costs in your local currency.", href:"#business-starter" },
          ].map(c => (
            <div key={c.href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-2xl mb-3">{c.emoji}</div>
              <h3 className="text-base font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
              <div className="mt-4">
                <a href={c.href} className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white hover:opacity-90" style={{ background:"var(--steel-teal)" }}>
                  Open Tool
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* STARTUP CALCULATOR */}
        <section id="calculator" className="mt-24 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 sm:p-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#507c80]/10 px-3 py-1 text-xs font-semibold text-[#507c80]">Access Required</div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Startup Calculator</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">Calculate exactly what your business will cost to start, when you will break even, how to price correctly, and where your funding gap is.</p>
          </div>
          <div className="mt-10">
            <AccessGate toolKey="calculator" toolName="Startup Calculator">
              {(code) => <StartupCalculator code={code} />}
            </AccessGate>
          </div>
          <p className="mt-6 text-sm text-slate-500">Your data syncs across all your devices automatically.</p>
        </section>

        {/* PROFIT TRACKER */}
        <section id="tracker" className="mt-24 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 sm:p-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#507c80]/10 px-3 py-1 text-xs font-semibold text-[#507c80]">Access Required</div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Profit & Cashflow Tracker</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">Track every naira, cedi, shilling or rand coming in and going out. Monthly breakdowns, annual summary, cashflow forecast.</p>
          </div>
          <div className="mt-10">
            <AccessGate toolKey="tracker" toolName="Profit & Cashflow Tracker">
              {(code) => <ProfitTracker code={code} />}
            </AccessGate>
          </div>
          <p className="mt-6 text-sm text-slate-500">Your data syncs across all your devices automatically.</p>
        </section>

        {/* CUSTOMER SERVICE */}
        <section id="customer-service" className="mt-24 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 sm:p-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Free Tool</div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Customer Service Guide</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">200+ real complaint scenarios with word-for-word scripts. Covers everything from angry customers to delivery failures. Written for the African market.</p>
          </div>
          <div className="mt-10"><CustomerServiceGuide /></div>
        </section>

        {/* BUSINESS STARTER */}
        <section id="business-starter" className="mt-24 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 sm:p-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Free Tool</div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Business Starter</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">Enter your budget and get every business you can start right now across 54 African countries, with costs in your local currency and a full setup checklist.</p>
          </div>
          <div className="mt-10"><BusinessStarter /></div>
        </section>

      </Container>
    </section>
  );
}
