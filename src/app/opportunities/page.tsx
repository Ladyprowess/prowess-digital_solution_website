"use client";

import { useCallback, useEffect, useState } from "react";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { ListingCard, type ListingCardMeta } from "@/components/ListingCard";
import { Pagination } from "@/components/Pagination";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 24;

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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    supabase.from("opportunity_types").select("id, slug, name").order("name").then(({ data }) => setTypes(data || []));
  }, []);

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("opportunities")
      .select("id, slug, title, organisation_name, location_type, country, deadline_at, featured, opportunity_types(name)", { count: "exact" })
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (typeId) query = query.eq("type_id", typeId);
    if (search.trim()) query = query.ilike("title", `%${search.trim()}%`);

    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
    setOpportunities(((data as unknown as OpportunityCard[]) || []));
    setTotal(count || 0);
    setLoading(false);
  }, [typeId, search, page]);

  useEffect(() => {
    const t = setTimeout(loadOpportunities, 150);
    return () => clearTimeout(t);
  }, [loadOpportunities]);

  useEffect(() => { setPage(1); }, [typeId, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
            {opportunities.map((o) => {
              const meta: ListingCardMeta[] = [];
              if (locationLabel(o)) meta.push({ icon: "pin", text: locationLabel(o)! });

              return (
                <ListingCard
                  key={o.id}
                  href={`/opportunities/${o.slug}`}
                  icon="spark"
                  colorSeed={o.opportunity_types?.name || "Opportunity"}
                  eyebrow={o.opportunity_types?.name || "Opportunity"}
                  title={o.title}
                  subtitle={o.organisation_name}
                  meta={meta}
                  badge={o.featured ? "Featured" : null}
                  footer={o.deadline_at ? `Deadline: ${new Date(o.deadline_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : null}
                />
              );
            })}
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
