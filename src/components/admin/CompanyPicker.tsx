"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";

export type Company = { id: string; slug: string; name: string; logo_url: string | null; verified: boolean };

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

async function getUniqueCompanySlug(base: string): Promise<string> {
  let candidate = base;
  let suffix = 1;
  while (true) {
    const { data } = await supabase.from("companies").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

// The company equivalent of SkillPicker's type-to-create-or-select pattern,
// but single-select and search-then-confirm rather than silent
// create-on-exact-slug-match - company names collide more easily ("Acme"
// vs "Acme Inc") than skill names, so picking from real search results
// (or explicitly confirming a new one) avoids silent duplicate companies.
export function CompanyPicker({
  value,
  onChange,
  onCompanyCreated,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  onCompanyCreated?: (company: Company) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const loadedValueRef = useRef<string | null>(null);

  // Edit mode: `value` arrives as an id with no display name attached.
  // Fetch it once so the input shows the company's real name instead of
  // sitting blank next to a filled-in picker.
  useEffect(() => {
    if (!value || loadedValueRef.current === value) return;
    loadedValueRef.current = value;
    supabase.from("companies").select("id, slug, name, logo_url, verified").eq("id", value).maybeSingle()
      .then(({ data }) => { if (data) setQuery(data.name); });
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await supabase.from("companies").select("id, slug, name, logo_url, verified").ilike("name", `%${q}%`).order("name").limit(8);
      setResults(data || []);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  function select(company: Company) {
    setQuery(company.name);
    loadedValueRef.current = company.id;
    onChange(company.id);
    setOpen(false);
  }

  async function createCompany() {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    setErr("");
    try {
      const slug = await getUniqueCompanySlug(slugify(name));
      const { data: created, error } = await supabase
        .from("companies")
        .insert({ slug, name })
        .select("id, slug, name, logo_url, verified")
        .single();
      if (error || !created) throw new Error(error?.message || "Could not create the company.");
      loadedValueRef.current = created.id;
      onChange(created.id);
      onCompanyCreated?.(created);
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create the company.");
    } finally {
      setCreating(false);
    }
  }

  const exactMatch = results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange(null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={inputCls}
        placeholder="Search for a company or create one..."
      />
      {open && query.trim() && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {loading ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Searching…</p>
          ) : (
            <>
              {results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(c)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted"
                >
                  {c.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logo_url} alt="" className="h-6 w-6 flex-shrink-0 rounded object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                      {c.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="text-foreground">{c.name}</span>
                  {c.verified && <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-primary">Verified</span>}
                </button>
              ))}
              {!exactMatch && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={createCompany}
                  disabled={creating}
                  className="w-full border-t border-border px-4 py-2.5 text-left text-sm font-semibold text-primary hover:bg-muted disabled:opacity-60"
                >
                  {creating ? "Creating…" : `+ Create "${query.trim()}" as a new company`}
                </button>
              )}
            </>
          )}
        </div>
      )}
      {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
    </div>
  );
}
