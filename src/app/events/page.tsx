import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import Button from "@/components/Button";
import { events } from "@/content/site";

export default function EventsPage() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SectionTitle
          title="Events"
          desc="Webinars, training sessions, and business clinics. Clear topics, clear outcomes."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {events.map((e) => (
            <div key={e.topic} className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold">{e.topic}</h3>
              <p className="mt-2 text-sm text-slate-600">
                <span className="text-slate-500">Date:</span> {e.date}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                <span className="text-slate-500">Format:</span> {e.format}
              </p>
              <div className="mt-5">
                <Button href="/contact">Register</Button>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
