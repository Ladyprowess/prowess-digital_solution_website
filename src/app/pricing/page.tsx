import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import Button from "@/components/Button";
import { packages, addOns } from "@/content/site";

export default function PricingPage() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SectionTitle
          title="Pricing & Packages"
          desc="Clear packages with outcomes and investment ranges. No hype, just structure."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {packages.map((p) => (
            <div key={p.title} className="rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-slate-600">{p.purpose}</p>

              <div className="mt-4">
                <p className="font-medium">Deliverables</p>
                <ul className="mt-2 list-disc pl-5 text-slate-700">
                  {p.deliverables.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>

              <div className="mt-4">
                <p className="font-medium">Outcomes</p>
                <ul className="mt-2 list-disc pl-5 text-slate-700">
                  {p.outcomes.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>

              <p className="mt-4 text-sm">
                <span className="text-slate-500">Investment range: </span>
                <span className="font-semibold">{p.investment}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-slate-50 p-6">
          <h3 className="font-semibold">Optional add-ons</h3>
          <ul className="mt-3 list-disc pl-5 text-slate-700">
            {addOns.map((x) => <li key={x}>{x}</li>)}
          </ul>

          <div className="mt-6">
            <Button href="/contact">Discuss the Right Package</Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
