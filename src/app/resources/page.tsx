import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import ResourcesBrowser from "@/components/resources/ResourcesBrowser";
import Link from "next/link";

const youtubeUrl = "https://www.youtube.com/@ProwessDigitalSolutions";

export default function ResourcesPage() { return ( <section className="py-12 sm:py-16 bg-slate-50/40"> <Container> 
  {/* TITLE SECTION (narrow is fine) */} 
<div className="max-w-3xl"> 
  <SectionTitle 
  title="Resources" 
  desc="Guides, templates, and practical materials to support clear business thinking." /> 
  </div>

        {/* CARDS SECTION (FULL WIDTH) */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Blog */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Blog</h3>
            <p className="mt-2 text-slate-600">
              Articles that help you build structure, make better decisions, and think long-term.
            </p>
            <div className="mt-4">
            <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                View Blog
              </Link>
            </div>
          </div>

          {/* Videos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Videos</h3>
            <p className="mt-2 text-slate-600">
              Short and practical videos explaining business structure and clarity.
            </p>
            <div className="mt-4">
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                Visit YouTube
              </a>
            </div>
          </div>

          {/* Events */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Events</h3>
            <p className="mt-2 text-slate-600">
              Workshops, sessions, and learning events for business owners.
            </p>
            <div className="mt-4">
              <Link
                href="/events"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                View Events
              </Link>
            </div>
          </div>
        </div>

        {/* RESOURCE BROWSER */}
        <div className="mt-10">
          <ResourcesBrowser />
        </div>
      </Container>
    </section>
  );
}
