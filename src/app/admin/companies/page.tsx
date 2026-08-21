"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";
import { AdminPagination } from "@/components/admin/AdminPagination";

const PAGE_SIZE = 20;

type Company = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  industry: string | null;
  company_size: string | null;
  verified: boolean;
};

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

async function getUniqueCompanySlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  let suffix = 1;
  while (true) {
    let q = supabase.from("companies").select("id").eq("slug", candidate);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

function CompaniesAdmin() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [verified, setVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("companies")
      .select("id, slug, name, logo_url, website, description, industry, company_size, verified")
      .order("name");
    setCompanies(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, search]);

  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return filtered.slice(from, from + PAGE_SIZE);
  }, [filtered, page]);

  function resetForm() {
    setEditingId(null);
    setName(""); setLogoUrl(""); setWebsite(""); setDescription("");
    setIndustry(""); setCompanySize(""); setVerified(false);
  }

  function startEdit(c: Company) {
    setEditingId(c.id);
    setName(c.name);
    setLogoUrl(c.logo_url || "");
    setWebsite(c.website || "");
    setDescription(c.description || "");
    setIndustry(c.industry || "");
    setCompanySize(c.company_size || "");
    setVerified(c.verified);
    setMsg(""); setErr("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setErr(""); setMsg("");
    if (!name.trim()) return setErr("Company name is required.");
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        logo_url: logoUrl.trim() || null,
        website: website.trim() || null,
        description: description.trim() || null,
        industry: industry.trim() || null,
        company_size: companySize.trim() || null,
        verified,
      };
      if (editingId) {
        const { error } = await supabase.from("companies").update(payload).eq("id", editingId);
        if (error) throw new Error(error.message);
      } else {
        const slug = await getUniqueCompanySlug(slugify(name));
        const { error } = await supabase.from("companies").insert({ ...payload, slug });
        if (error) throw new Error(error.message);
      }
      setMsg(editingId ? "Company updated." : "Company added.");
      resetForm();
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleVerified(c: Company) {
    const next = !c.verified;
    setCompanies((prev) => prev.map((row) => (row.id === c.id ? { ...row, verified: next } : row)));
    await supabase.from("companies").update({ verified: next }).eq("id", c.id);
  }

  async function deleteCompany(id: string, name: string) {
    const { count } = await supabase.from("jobs").select("id", { count: "exact", head: true }).eq("company_id", id);
    if (count && count > 0) {
      setErr(`Can't delete "${name}" - it still has ${count} job${count === 1 ? "" : "s"} attached.`);
      return;
    }
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    await supabase.from("companies").delete().eq("id", id);
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Companies</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Company profiles used by job listings - logo, verification, and optional details shown on the site.
      </p>

      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border bg-card p-8">
        <h2 className="text-xl font-semibold text-foreground">{editingId ? "Edit Company" : "Add Company"}</h2>
        <div className="mt-6 grid gap-4">
          <Field label="Name *">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Flutterwave" />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Logo URL">
              <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className={inputCls} placeholder="https://..." />
            </Field>
            <Field label="Website">
              <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://..." />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Industry">
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputCls} placeholder="e.g. Fintech" />
            </Field>
            <Field label="Company size">
              <input value={companySize} onChange={(e) => setCompanySize(e.target.value)} className={inputCls} placeholder="e.g. 51-200 employees" />
            </Field>
          </div>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} min-h-24`} placeholder="What the company does..." />
          </Field>
          <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
            <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
            Verified
          </label>

          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
            >
              {saving ? "Saving..." : editingId ? "Update company" : "Add company"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="flex-shrink-0 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground">All Companies</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
          />
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : paged.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{companies.length === 0 ? "No companies yet." : "No companies match your search."}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Industry</th>
                  <th className="py-2 pr-4">Size</th>
                  <th className="py-2 pr-4">Verified</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c) => (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        {c.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.logo_url} alt="" className="h-6 w-6 flex-shrink-0 rounded object-cover" />
                        ) : (
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                            {c.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <button onClick={() => startEdit(c)} className="font-medium text-foreground hover:underline">{c.name}</button>
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{c.industry || "-"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{c.company_size || "-"}</td>
                    <td className="py-2 pr-4">
                      <input type="checkbox" checked={c.verified} onChange={() => toggleVerified(c)} />
                    </td>
                    <td className="py-2 pr-4">
                      <button onClick={() => startEdit(c)} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</button>
                      <button onClick={() => deleteCompany(c.id, c.name)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-center text-xs text-muted-foreground">{filtered.length} compan{filtered.length === 1 ? "y" : "ies"}</p>
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default function AdminCompaniesPage() {
  return <CompaniesAdmin />;
}
