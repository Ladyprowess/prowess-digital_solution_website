"use client";

import { useMemo, useState } from "react";
import Container from "@/components/Container";
import Button from "@/components/Button";
import AgencyPageHeader from "@/components/AgencyPageHeader";
import { Reveal } from "@/components/Reveal";
import {
  Mail,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Info,
} from "lucide-react";

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  business_stage: string;
  inquiry_type: string;
  message: string;
  website: string; // honeypot
};

const BUSINESS_STAGES = ["Starting Out", "Growing", "Scaling"];
const INQUIRY_TYPES = [
  "General Enquiry",
  "Business Clarity Session",
  "Business Audit",
  "Business Setup & Systems",
  "Training & Mentorship",
  "Partnership",
  "Support",
];

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    phone: "",
    business_stage: "",
    inquiry_type: "",
    message: "",
    website: "",
  });

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@prowessdigitalsolutions.com";
  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+2348162174443";
  const WHATSAPP_NUMBER_CLEAN =
    (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_CLEAN || "").trim() || "2348162174443";
  const BUSINESS_LOCATION = process.env.NEXT_PUBLIC_BUSINESS_LOCATION || "Lagos, Nigeria";
  const BUSINESS_HOURS = process.env.NEXT_PUBLIC_BUSINESS_HOURS || "Mon–Fri, 9AM–5PM WAT";

  const set = (key: keyof FormState, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const whatsappText = useMemo(() => {
    const name = form.full_name.trim() || "Hi";
    const type = form.inquiry_type.trim() || "General enquiry";
    const stage = form.business_stage.trim() ? `Business stage: ${form.business_stage.trim()}\n` : "";
    const msg = form.message.trim() ? `\nMessage: ${form.message.trim()}` : "";
    return `Hello Prowess Digital Solutions,\n\nMy name is ${name}.\nInquiry type: ${type}\n${stage}${msg}\n\nThank you.`;
  }, [form.full_name, form.inquiry_type, form.business_stage, form.message]);

  const whatsappLink = useMemo(() => {
    const encoded = encodeURIComponent(whatsappText);
    return `https://wa.me/${WHATSAPP_NUMBER_CLEAN}?text=${encoded}`;
  }, [whatsappText, WHATSAPP_NUMBER_CLEAN]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSent(false);

    const full_name = form.full_name.trim();
    const email = form.email.trim();
    const inquiry_type = form.inquiry_type.trim();
    const message = form.message.trim();

    // required fields (match screenshot)
    if (!full_name || !email || !inquiry_type || !message) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name,
          email,
          phone: form.phone.trim(),
          business_stage: form.business_stage.trim(),
          inquiry_type,
          message,
          website: form.website, // honeypot
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setError(data?.error || "Something went wrong.");
        return;
      }

      setSent(true);
      setForm({
        full_name: "",
        email: "",
        phone: "",
        business_stage: "",
        inquiry_type: "",
        message: "",
        website: "",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      <AgencyPageHeader
        eyebrow="Contact Us"
        title={
          <>
            Let&apos;s start <span className="text-primary">a conversation.</span>
          </>
        }
        description="Nigeria based, globally accessible. Whether you are ready for a Business Clarity Session or have questions about our services, we are here to help."
        proof={[
          "Email, WhatsApp, and form support",
          "Clear next steps after you reach out",
          "Remote support for founders everywhere",
        ]}
      />

      {/* MAIN SECTION */}
      <section className="py-12 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* LEFT: FORM CARD */}
            <Reveal>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground">
                Send Us a Message
              </h2>

              <form onSubmit={onSubmit} className="mt-6 grid gap-5">
                {/* Honeypot */}
                <div className="hidden">
                  <label htmlFor="website" className="text-sm font-medium">
                    Website
                  </label>
                  <input
                    id="website"
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
                    autoComplete="off"
                    tabIndex={-1}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="h-12 w-full rounded-xl border border-border bg-card px-4 text-foreground outline-none ring-0 focus:border-primary"
                    placeholder="Your full name"
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="h-12 w-full rounded-xl border border-border bg-card px-4 text-foreground outline-none focus:border-primary"
                      placeholder="you@example.com"
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <input
                      className="h-12 w-full rounded-xl border border-border bg-card px-4 text-foreground outline-none focus:border-primary"
                      placeholder="+234 XXX XXX XXXX"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Business Stage</label>
                    <select
                      className="h-12 w-full rounded-xl border border-border bg-card px-4 text-foreground outline-none focus:border-primary"
                      value={form.business_stage}
                      onChange={(e) => set("business_stage", e.target.value)}
                    >
                      <option value="">Select stage</option>
                      {BUSINESS_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">
                      Inquiry Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="h-12 w-full rounded-xl border border-border bg-card px-4 text-foreground outline-none focus:border-primary"
                      value={form.inquiry_type}
                      onChange={(e) => set("inquiry_type", e.target.value)}
                    >
                      <option value="">Select type</option>
                      {INQUIRY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="min-h-[160px] w-full resize-y rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
                    placeholder="Tell us about your business challenges or questions..."
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                {sent ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Message sent. We will reply soon.
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  {loading ? "Sending..." : "Send Message"}
                </Button>

                <p className="text-sm text-muted-foreground">
                  We typically respond within 24 hours during business days (Mon–Fri, 9AM–5PM WAT)
                </p>
              </form>
            </div>
            </Reveal>

            {/* RIGHT: CONTACT OPTIONS */}
            <div className="space-y-6">
              <Reveal delay={80}>
                <div>
                  <h2 className="font-serif text-3xl font-semibold text-foreground">
                    Get In Touch
                  </h2>
                  <p className="mt-2 max-w-xl text-base leading-relaxed text-muted-foreground">
                    We&apos;re here to help you gain clarity and build a better business. Choose the
                    contact method that works best for you.
                  </p>
                </div>
              </Reveal>

              {/* Email */}
              <Reveal delay={140}>
              <div className="rounded-2xl border border-border bg-card p-6 transition hover:shadow-sm">
                <div className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">Email</h3>
                    <p className="mt-1 text-base font-medium text-foreground">{CONTACT_EMAIL}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Send us an email anytime. We respond within 24 hours.
                    </p>
                  </div>
                </div>
              </div>
              </Reveal>

              {/* WhatsApp */}
              <Reveal delay={200}>
              <div className="rounded-2xl border border-border bg-card p-6 transition hover:shadow-sm">
                <div className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-xl font-semibold text-foreground">WhatsApp</h3>
                    <p className="mt-1 text-base font-medium text-foreground">{WHATSAPP_NUMBER}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Quick questions? Chat with us on WhatsApp.
                    </p>

                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: "#4f7f60" }}
                    >
                      <MessageCircle className="h-5 w-5" />
                      Open WhatsApp Chat
                    </a>
                  </div>
                </div>
              </div>
              </Reveal>

              {/* Location */}
              <Reveal delay={260}>
              <div className="rounded-2xl border border-border bg-card p-6 transition hover:shadow-sm">
                <div className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">Location</h3>
                    <p className="mt-1 text-base font-medium text-foreground">{BUSINESS_LOCATION}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Based in Nigeria, with remote collaboration worldwide.
                    </p>
                  </div>
                </div>
              </div>
              </Reveal>

              {/* Business Hours */}
              <Reveal delay={320}>
              <div className="rounded-2xl border border-border bg-card p-6 transition hover:shadow-sm">
                <div className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">
                      Business Hours
                    </h3>
                    <p className="mt-1 text-base font-medium text-foreground">{BUSINESS_HOURS}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Available for consultations and support calls.
                    </p>
                  </div>
                </div>
              </div>
              </Reveal>

              {/* Info box like screenshot */}
              <Reveal delay={380}>
              <div className="rounded-2xl bg-primary/10 p-6">
                <div className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-card text-primary">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-semibold text-foreground">
                      Remote-Friendly Services
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      All our services are available remotely via video calls, with in-person options
                      available for Lagos-based clients. We work with founders across Africa and
                      internationally.
                    </p>
                  </div>
                </div>
              </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
