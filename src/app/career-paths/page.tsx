"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { ListingCard } from "@/components/ListingCard";
import { Pagination } from "@/components/Pagination";
import { supabase } from "@/lib/supabase";
import { stripHtmlForMeta } from "@/lib/stripHtml";

const PAGE_SIZE = 24;

type CareerPathCard = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  access: "free" | "premium";
  price: number | null;
  price_currency: string | null;
  career_path_skill_map: { skills: { name: string } | null }[];
};

export default function CareerPathsPage() {
  const [paths, setPaths] = useState<CareerPathCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    supabase
      .from("career_paths")
      .select("id, slug, title, description, access, price, price_currency, career_path_skill_map(skills(name))", { count: "exact" })
      .eq("status", "published")
      .order("title")
      .range(from, from + PAGE_SIZE - 1)
      .then(({ data, count }) => {
        setPaths((data as unknown as CareerPathCard[]) || []);
        setTotal(count || 0);
        setLoading(false);
      });
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background py-16">
      <Container>
        <Reveal>
          <div className="mb-12 text-center">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Career Paths</div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Where do you want your career to go?</h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Each path connects the skills you need to the courses, resources, jobs and opportunities that build them.</p>
          </div>
        </Reveal>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : paths.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="text-foreground font-semibold">No career paths published yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paths.map((p) => (
              <ListingCard
                key={p.id}
                href={`/career-paths/${p.slug}`}
                icon="path"
                colorSeed={p.title}
                eyebrow={p.access === "premium" ? "Premium" : "Free"}
                title={p.title}
                description={p.description ? stripHtmlForMeta(p.description, 120) : null}
                tags={p.career_path_skill_map.map((m) => m.skills?.name).filter((n): n is string => Boolean(n))}
              />
            ))}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        />
      </Container>
    </div>
  );
}
