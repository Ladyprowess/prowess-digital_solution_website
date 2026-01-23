import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: {
    slug: string;
  };
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

  return (
    <article className="mx-auto max-w-3xl px-4 py-24">
      <h1 className="text-4xl font-semibold text-[#223433]">
        {data.title}
      </h1>

      {data.image_url && (
        <div className="mt-8 overflow-hidden rounded-xl">
          <img
            src={data.image_url}
            alt={data.title}
            className="w-full object-cover"
          />
        </div>
      )}

      <section className="mt-12">
        <h2 className="text-sm font-semibold tracking-widest text-[#6b7d7b]">
          CHALLENGE
        </h2>
        <p className="mt-3 leading-relaxed text-[#4d5f5e]">
          {data.challenge}
        </p>
      </section>

      {data.solution && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold tracking-widest text-[#6b7d7b]">
            SOLUTION
          </h2>
          <p className="mt-3 leading-relaxed text-[#4d5f5e]">
            {data.solution}
          </p>
        </section>
      )}
    </article>
  );
}
