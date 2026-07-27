import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ResultItem = { label?: string; value?: string };

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from("case_studies")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return notFound();

  const results: ResultItem[] = Array.isArray(data.results) ? data.results : [];

  return (
    <article className="mx-auto max-w-3xl px-4 py-24">
      <Reveal>
        <Link
          href="/case-studies"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80"
        >
          ← Back to Case Studies
        </Link>
        <h1 className="mt-4 text-4xl font-semibold text-foreground">{data.title}</h1>
      </Reveal>

      {data.image_url ? (
        <Reveal delay={60}>
          <div className="mt-8 overflow-hidden rounded-xl border border-border">
            <img src={data.image_url} alt={data.title} className="w-full object-cover" />
          </div>
        </Reveal>
      ) : null}

      <Reveal delay={100}>
        <section className="mt-12">
          <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">
            CHALLENGE
          </h2>
          <p className="mt-3 leading-relaxed text-foreground">{data.challenge}</p>
        </section>
      </Reveal>

      {data.solution ? (
        <Reveal delay={140}>
          <section className="mt-10">
            <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">
              SOLUTION
            </h2>
            <p className="mt-3 leading-relaxed text-foreground">{data.solution}</p>
          </section>
        </Reveal>
      ) : null}

      {data.before_state && data.after_state ? (
        <Reveal delay={180}>
          <section className="mt-10">
            <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">
              BEFORE AND AFTER
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Before</p>
                <p className="mt-2 leading-relaxed text-foreground">{data.before_state}</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">After</p>
                <p className="mt-2 leading-relaxed text-foreground">{data.after_state}</p>
              </div>
            </div>
          </section>
        </Reveal>
      ) : null}

      {results.length > 0 ? (
        <Reveal delay={220}>
          <section className="mt-10">
            <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">
              RESULTS ACHIEVED
            </h2>

            <div className="mt-4 grid gap-3">
              {results.map((r, idx) => (
                <div
                  key={`${r?.label || "result"}-${idx}`}
                  className="flex items-center justify-between rounded-xl bg-accent px-4 py-4"
                >
                  <span className="text-sm text-foreground">{r?.label}</span>
                  <span className="text-sm font-semibold text-primary">
                    {r?.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}

      {data.testimonial ? (
        <Reveal delay={260}>
          <div className="mt-10 rounded-xl border-l-4 border-primary bg-card px-5 py-4 text-foreground shadow-sm">
            <p className="italic leading-relaxed">"{data.testimonial}"</p>
          </div>
        </Reveal>
      ) : null}

      {typeof data.timeline_months === "number" ? (
        <div className="mt-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Timeline: {data.timeline_months} months
        </div>
      ) : null}
    </article>
  );
}
