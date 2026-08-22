"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 20;

type CareerPathRow = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  featured: boolean;
  status: "draft" | "published";
};

function CareerPathsAdmin() {
  const [paths, setPaths] = useState<CareerPathRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | CareerPathRow["status"]>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("career_paths")
      .select("id, slug, title, category, featured, status", { count: "exact" });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (search.trim()) query = query.ilike("title", `%${search.trim()}%`);

    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    setPaths(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateStatusFilter(value: typeof statusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function deletePath(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    await supabase.from("career_paths").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Career Paths</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each career path connects skills to the roadmap, roles, learning, jobs, opportunities, tools and projects that build toward it.
          </p>
        </div>
        <Link
          href="/admin/career-paths/new"
          className="flex-shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Add Career Path
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder="Search title..."
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => updateStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : paths.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No career paths match this filter.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Featured</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {paths.map((p) => (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 font-medium text-foreground">{p.title}</td>
                    <td className="py-2 pr-4 capitalize text-muted-foreground">{p.category || "-"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{p.featured ? "Yes" : "-"}</td>
                    <td className="py-2 pr-4 capitalize text-muted-foreground">{p.status}</td>
                    <td className="py-2 pr-4">
                      <Link href={`/admin/career-paths/${p.id}`} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</Link>
                      <button onClick={() => deletePath(p.id, p.title)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">{total} career path{total === 1 ? "" : "s"} total</p>
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default function AdminCareerPathsPage() {
  return <CareerPathsAdmin />;
}
