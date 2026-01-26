import Container from "@/components/Container";
import Link from "next/link";
import { brand, contact } from "@/content/site";

export default function Footer() {
  return (
    <footer className="mt-24 bg-[#507c80]/10 border-t border-slate-200">
      <Container>
        <div className="py-12 grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {brand.name}
            </p>
            <p className="mt-2 text-sm text-slate-600 max-w-sm">
              Clarity, structure, and guidance for people building businesses
              that last.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-900">
              Explore
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/services" className="text-slate-600 hover:text-slate-900">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-slate-600 hover:text-slate-900">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-slate-600 hover:text-slate-900">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-600 hover:text-slate-900">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-900">
              Contact
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>Email: {contact.email}</p>
              <p>WhatsApp: {contact.whatsapp}</p>
              <p>Location: {contact.location}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 py-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>

          <p className="text-xs text-slate-500">
            Business guidance • Structure • Long-term thinking
          </p>
        </div>
      </Container>
    </footer>
  );
}
