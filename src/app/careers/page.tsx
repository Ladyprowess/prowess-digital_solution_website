import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import CareersForm from "@/components/CareersForm";

export default function CareersPage() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="max-w-3xl">
          <SectionTitle
            title="Careers"
            desc="We value structured thinkers—people who care about clarity, quality, and long-term work."
          />

          <div className="rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold">Current openings</h3>
            <p className="mt-2 text-slate-600">
              No open roles at the moment. You can join our talent pool below.
            </p>
          </div>

          <div className="mt-8 rounded-xl bg-slate-50 p-6">
            <h3 className="font-semibold">Join Our Talent Pool</h3>
            <CareersForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
