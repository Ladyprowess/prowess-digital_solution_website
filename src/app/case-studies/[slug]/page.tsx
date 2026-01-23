import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: { slug: string };
}

export default async function CaseStudyPage({ params }: PageProps) {
  const { data, error } = await supabase
    .from("case_studies")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl py-24 text-center">
        <h1 className="text-2xl font-semibold">Case study not found</h1>
      </div>
    );
  }

  const results = Array.isArray(data.results) ? data.results : [];

  return (
    <article className="mx-auto max-w-3xl px-4 py-24">
      <h1 className="text-4xl font-semibold text-[#223433]">{data.title}</h1>

      {data.image_url ? (
        <div className="mt-8 overflow-hidden rounded-xl">
          <img
            src={data.image_url}
            alt={data.title}
            className="w-full object-cover"
          />
        </div>
      ) : null}

      <section className="mt-12">
        <h2 className="text-sm font-semibold tracking-widest text-[#6b7d7b]">
          CHALLENGE
        </h2>
        <p className="mt-3 leading-relaxed text-[#4d5f5e]">{data.challenge}</p>
      </section>

      {data.solution ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold tracking-widest text-[#6b7d7b]">
            SOLUTION
          </h2>
          <p className="mt-3 leading-relaxed text-[#4d5f5e]">{data.solution}</p>
        </section>
      ) : null}

      {results.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold tracking-widest text-[#6b7d7b]">
            RESULTS ACHIEVED
          </h2>

          <div className="mt-4 grid gap-3">
            {results.map((r: any, idx: number) => (
              <div
                key={`${r?.label || "result"}-${idx}`}
                className="flex items-center justify-between rounded-xl bg-[#eaf6f6] px-4 py-4"
              >
                <span className="text-sm text-[#223433]">{r?.label}</span>
                <span className="text-sm font-semibold text-[#507c80]">
                  {r?.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.testimonial ? (
        <div className="mt-10 rounded-xl border-l-4 border-[#507c80] bg-white px-5 py-4 text-[#223433]">
          <p className="italic leading-relaxed">“{data.testimonial}”</p>
        </div>
      ) : null}

      {typeof data.timeline_months === "number" ? (
        <div className="mt-6 text-sm text-[#4d5f5e]">
          🕒 Timeline: {data.timeline_months} months
        </div>
      ) : null}
    </article>
  );
}
