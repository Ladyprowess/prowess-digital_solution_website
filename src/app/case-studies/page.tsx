"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type CaseStudy = {
  id: string;
  title: string;
  slug: string;
  category: string;
  business_size: string;
  challenge: string;
  solution?: string | null;
  image_url?: string | null;
  is_published: boolean;
  created_at: string;
};

export default function CaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const [size, setSize] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("case_studies")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load case studies:", error.message);
        setCaseStudies([]);
        setLoading(false);
        return;
      }

      setCaseStudies((data as CaseStudy[]) || []);
      setLoading(false);
    };

    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(caseStudies.map((c) => c.category));
    return ["All", ...Array.from(set)];
  }, [caseStudies]);

  const sizes = useMemo(() => {
    const set = new Set(caseStudies.map((c) => c.business_size));
    return ["All", ...Array.from(set)];
  }, [caseStudies]);

  const filtered = useMemo(() => {
    return caseStudies.filter((c) => {
      return (
        (category === "All" || c.category === category) &&
        (size === "All" || c.business_size === size)
      );
    });
  }, [caseStudies, category, size]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      {/* Filter (collapsed by default) */}
      <div className="mb-8 rounded-2xl border border-[#dbe9e8] bg-white shadow-sm">
        <button
          onClick={() => setIsFilterOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-6 py-5 text-left font-semibold text-[#223433]"
        >
          <span className="flex items-center gap-3">
            <span className="text-[#507c80]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 5h16l-6 7v6l-4 2v-8L4 5z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </span>
            Filter Case Studies
          </span>

          <svg
            className={`h-5 w-5 transition-transform ${
              isFilterOpen ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {isFilterOpen && (
          <div className="border-t border-[#dbe9e8] px-6 py-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
                  CATEGORY
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm text-[#223433]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
                  BUSINESS SIZE
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm text-[#223433]"
                >
                  {sizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-3">
                <button
                  onClick={() => {
                    setCategory("All");
                    setSize("All");
                  }}
                  className="w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm font-semibold text-[#223433] hover:bg-[#f6fbfb]"
                >
                  Clear
                </button>

                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full rounded-lg bg-[#507c80] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3d5f62]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <p className="text-sm text-[#4d5f5e]">Loading case studies…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#dbe9e8] bg-white p-10 text-center">
          <h3 className="text-xl font-semibold text-[#223433]">No case studies found</h3>
          <p className="mt-2 text-sm text-[#4d5f5e]">
            Try changing the filters or clear them.
          </p>
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          {filtered.map((cs) => (
            <article key={cs.id} className="overflow-hidden rounded-2xl border border-[#dbe9e8] bg-white">
              <div className="relative h-56 w-full bg-[#eaf6f6]">
                {cs.image_url ? (
                  <Image
                    src={cs.image_url}
                    alt={cs.title}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="p-6">
                <h2 className="text-xl font-semibold text-[#223433]">{cs.title}</h2>
                <p className="mt-3 text-sm text-[#4d5f5e]">{cs.challenge}</p>

                <Link
                  href={`/case-studies/${cs.slug}`}
                  className="mt-4 inline-block font-semibold text-[#507c80]"
                >
                  View Case Study →
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
