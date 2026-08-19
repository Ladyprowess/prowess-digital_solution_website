"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { ListingCard } from "@/components/ListingCard";
import { supabase } from "@/lib/supabase";
import { stripHtmlForMeta } from "@/lib/stripHtml";

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

  useEffect(() => {
    supabase
      .from("career_paths")
      .select("id, slug, title, description, access, price, price_currency, career_path_skill_map(skills(name))")
      .eq("status", "published")
      .order("title")
      .then(({ data }) => {
        setPaths((data as unknown as CareerPathCard[]) || []);
        setLoading(false);
      });
  }, []);

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
      </Container>
    </div>
  );
}
