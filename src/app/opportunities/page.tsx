"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { supabase } from "@/lib/supabase";

type Lookup = { id: string; slug: string; name: string };

type OpportunityCard = {
  id: string;
  slug: string;
  title: string;
  organisation_name: string | null;
  location_type: "remote" | "hybrid" | "on_site" | "any" | null;
  country: string | null;
  deadline_at: string | null;
  featured: boolean;
  opportunity_types: { name: string } | null;
};

const selectCls = "rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground";

function locationLabel(o: OpportunityCard) {
  if (!o.location_type || o.location_type === "any") return null;
  if (o.location_type === "remote") return "Remote";
  return [o.location_type === "hybrid" ? "Hybrid" : "On-site", o.country].filter(Boolean).join(" · ");
}

export default function OpportunitiesPage() {
  const [types, setTypes] = useState<Lookup[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeId, setTypeId] = useState("");

  useEffect(() => {
    supabase.from("opportunity_types").select("id, slug, name").order("name").then(({ data }) => setTypes(data || []));
  }, []);

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("opportunities")
      .select("id, slug, title, organisation_name, location_type, country, deadline_at, featured, opportunity_types(name)")
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (typeId) query = query.eq("type_id", typeId);
    if (search.trim()) query = query.ilike("title", `%${search.trim()}%`);

    const { data } = await query.limit(30);
    setOpportunities(((data as unknown as OpportunityCard[]) || []));
    setLoading(false);
  }, [typeId, search]);

  useEffect(() => { loadOpportunities(); }, [loadOpportunities]);

  return (
    <div className="min-h-screen bg-background py-16">
      <Container>
        <Reveal>
          <div className="mb-10 text-center">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Opportunities</div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Beyond jobs</h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Internships, scholarships, grants, fellowships and competitions worth knowing about.</p>
          </div>
        </Reveal>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities…"
            className={`${selectCls} w-full sm:w-64`}
          />
          <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={selectCls}>
            <option value="">All types</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : opportunities.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="text-foreground font-semibold">No opportunities match right now.</p>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing a filter, or check back soon - new opportunities are added regularly.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((o) => (
              <Link key={o.id} href={`/opportunities/${o.slug}`} className="group block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-primary">{o.opportunity_types?.name || "Opportunity"}</span>
                  {o.featured && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Featured</span>}
                </div>
                <h3 className="mt-2 text-lg font-bold text-foreground">{o.title}</h3>
                {o.organisation_name && <p className="mt-1 text-sm text-muted-foreground">{o.organisation_name}</p>}
                {locationLabel(o) && <p className="mt-3 text-xs text-muted-foreground">{locationLabel(o)}</p>}
                {o.deadline_at && (
                  <p className="mt-2 text-xs text-muted-foreground">Deadline: {new Date(o.deadline_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
