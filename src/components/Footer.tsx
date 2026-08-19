import Container from "@/components/Container";
import Link from "next/link";
import { brand, contact } from "@/content/site";

const socials = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/prowess-digital-solutions",
    path: "M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.83v1.98h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.1V23h-4v-6.75c0-1.61-.03-3.68-2.24-3.68-2.25 0-2.59 1.76-2.59 3.57V23h-4V8.5z",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/prowessdigitalsolutions",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    name: "X",
    href: "https://twitter.com/prowessDS",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  // YouTube omitted: no real channel URL found in the codebase to link to.
  // Add one here once a real handle exists.
];

export default function Footer() {
  return (
    <footer className="mt-24 bg-[#507c80]/10 border-t border-slate-200">
      <Container>
        <div className="py-12 grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {brand.name}
            </p>
            <p className="mt-2 text-sm text-slate-600 max-w-sm">
              Discover opportunities, learn useful skills, build your career, and connect with people moving in the same direction.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:border-[#507c80] hover:text-[#507c80]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* For Individuals */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-900">
              For Individuals
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/jobs" className="text-slate-600 hover:text-slate-900">Work</Link></li>
              <li><Link href="/opportunities" className="text-slate-600 hover:text-slate-900">Opportunities</Link></li>
              <li><Link href="/career-paths" className="text-slate-600 hover:text-slate-900">Career Paths</Link></li>
              <li><Link href="/learn" className="text-slate-600 hover:text-slate-900">Learn</Link></li>
              <li><Link href="/resources" className="text-slate-600 hover:text-slate-900">Resources</Link></li>
              <li><Link href="/tools" className="text-slate-600 hover:text-slate-900">Tools</Link></li>
              <li><Link href="/events" className="text-slate-600 hover:text-slate-900">Events</Link></li>
            </ul>
          </div>

          {/* For Businesses */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-900">
              For Businesses
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/tools" className="text-slate-600 hover:text-slate-900">Business Tools</Link></li>
              <li><Link href="/resources" className="text-slate-600 hover:text-slate-900">Business Resources</Link></li>
              <li><Link href="/services" className="text-slate-600 hover:text-slate-900">Services</Link></li>
              <li><Link href="/case-studies" className="text-slate-600 hover:text-slate-900">Case Studies</Link></li>
              <li><Link href="/consultation" className="text-slate-600 hover:text-slate-900">Consultation</Link></li>
              <li><Link href="/contact" className="text-slate-600 hover:text-slate-900">Contact</Link></li>
            </ul>
          </div>

          {/* Prowess Digital Solutions */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-900">
              {brand.name}
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/about" className="text-slate-600 hover:text-slate-900">About</Link></li>
              <li><Link href="/blog" className="text-slate-600 hover:text-slate-900">Blog</Link></li>
              <li><Link href="/careers" className="text-slate-600 hover:text-slate-900">Work With Us</Link></li>
              <li><Link href="/privacy-policy" className="text-slate-600 hover:text-slate-900">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-slate-600 hover:text-slate-900">Terms of Service</Link></li>
            </ul>
            <div className="mt-4 space-y-1 text-xs text-slate-500">
              <p>{contact.email}</p>
              <p>{contact.whatsapp}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 py-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link href="/privacy-policy" className="hover:text-slate-900">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-slate-900">Terms of Service</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
