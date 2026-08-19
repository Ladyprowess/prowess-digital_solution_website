"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { supabase } from "@/lib/supabase";

type CareerPathCard = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  access: "free" | "premium";
  price: number | null;
  price_currency: string | null;
};

export default function CareerPathsPage() {
  const [paths, setPaths] = useState<CareerPathCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("career_paths")
      .select("id, slug, title, description, access, price, price_currency")
      .eq("status", "published")
      .order("title")
      .then(({ data }) => {
        setPaths(data || []);
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
              <Link key={p.id} href={`/career-paths/${p.slug}`} className="group block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${p.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {p.access === "premium" ? "Premium" : "Free"}
                </span>
                <h3 className="mt-3 text-lg font-bold text-foreground">{p.title}</h3>
                {p.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
