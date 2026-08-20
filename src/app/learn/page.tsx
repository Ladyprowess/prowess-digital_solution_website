"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Pagination } from "@/components/Pagination";
import { supabase } from "@/lib/supabase";
import { stripHtmlForMeta } from "@/lib/stripHtml";

const PAGE_SIZE = 24;

type CourseCard = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: string | null;
  access: "free" | "premium";
  price: number | null;
  price_currency: string | null;
};

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const selectCls = "rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground";

export default function LearnPage() {
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [accessFilter, setAccessFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("courses")
      .select("id, slug, title, description, level, access, price, price_currency", { count: "exact" })
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (level) query = query.eq("level", level);
    if (accessFilter) query = query.eq("access", accessFilter);
    if (search.trim()) query = query.ilike("title", `%${search.trim()}%`);

    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
    setCourses(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [level, accessFilter, search, page]);

  useEffect(() => {
    const t = setTimeout(load, 150);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => { setPage(1); }, [level, accessFilter, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background py-16">
      <Container>
        <Reveal>
          <div className="mb-10 text-center">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Learn</div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Learn something useful</h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Short, practical courses. Some free, some premium - always clearly marked.</p>
          </div>
        </Reveal>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…" className={`${selectCls} w-full sm:w-64`} />
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectCls}>
            <option value="">All levels</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>)}
          </select>
          <select value={accessFilter} onChange={(e) => setAccessFilter(e.target.value)} className={selectCls}>
            <option value="">Free &amp; premium</option>
            <option value="free">Free only</option>
            <option value="premium">Premium only</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : courses.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="text-foreground font-semibold">No courses match right now.</p>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing a filter, or check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link key={c.id} href={`/learn/${c.slug}`} className="group block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {c.access === "premium" ? `Premium${c.price ? ` - ${c.price_currency || "NGN"} ${c.price}` : ""}` : "Free"}
                </span>
                <h3 className="mt-3 text-lg font-bold text-foreground">{c.title}</h3>
                {c.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{stripHtmlForMeta(c.description, 140)}</p>}
                {c.level && <p className="mt-3 text-xs text-muted-foreground">{c.level[0].toUpperCase() + c.level.slice(1)}</p>}
              </Link>
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
