import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import ResourcesBrowser from "@/components/resources/ResourcesBrowser";
import BusinessHelperTool from "@/components/resources/BusinessHelperTool";
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

       {/* BUSINESS HELPER SECTION */}
<section
  id="business-helper"
  className="mt-24 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 sm:p-12"
>
  {/* Header */}
  <div className="max-w-2xl">
    <div className="inline-flex items-center gap-2 rounded-full bg-[#507c80]/10 px-3 py-1 text-xs font-semibold text-[#507c80]">
      Free Resource
    </div>

    <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
      Business Helper
    </h2>

    <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
      Share what is happening in your business and get a simple diagnostic report.
    </p>
  </div>

  {/* Tool */}
  <div className="mt-10">
    <BusinessHelperTool />
  </div>

  {/* Small note */}
  <p className="mt-6 text-sm text-slate-500">
    This tool provides guidance only. For personalised support, book a clarity session.
  </p>
</section>


        {/* RESOURCE BROWSER */}
        <div className="mt-10">
          <ResourcesBrowser />
        </div>

       
        
      </Container>
    </section>
  );
}
