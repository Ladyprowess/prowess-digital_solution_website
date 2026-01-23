import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import ResourcesBrowser from "@/components/resources/ResourcesBrowser";
import { blogUrl } from "@/content/site";

export default function ResourcesPage() {
  return (
    <section className="py-12 sm:py-16 bg-slate-50/40">
      <Container>
        <div className="max-w-3xl">
          <SectionTitle
            title="Resources"
            desc="Guides, templates, and practical materials to support clear business thinking."
          />

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Blog</h3>
            <p className="mt-2 text-slate-600">
              Articles that help you build structure, make better decisions, and think long-term.
            </p>
            <div className="mt-4">
              <a
                href={blogUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                Visit the Blog
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <ResourcesBrowser />
        </div>
      </Container>
    </section>
  );
}
