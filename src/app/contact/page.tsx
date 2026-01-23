import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import Button from "@/components/Button";
import { contact } from "@/content/site";
import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionTitle
              title="Contact Us"
              desc="Start with a Business Clarity Session, or send an enquiry."
            />

            <div className="space-y-3 text-slate-700">
              <p>
                <span className="text-slate-500">Email:</span> {contact.email}
              </p>
              <p>
                <span className="text-slate-500">WhatsApp:</span> {contact.whatsapp}
              </p>
              <p>
                <span className="text-slate-500">Location:</span> {contact.location}
              </p>
            </div>

            <div className="mt-6">
              <Button href="/services" variant="secondary">
                See services
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-6">
            <h3 className="font-semibold">Send a message</h3>
            <ContactForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
