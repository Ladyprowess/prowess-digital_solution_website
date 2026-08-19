"use client";

import { useCallback, useEffect, useState } from "react";
import Container from "@/components/Container";
import { AdminGate } from "@/components/admin/AdminGate";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";

type Lookup = { id: string; slug: string; name: string };

type OpportunityRow = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "closed" | "expired";
  organisation_name: string | null;
  deadline_at: string | null;
  opportunity_types: { name: string } | null;
};

const LOCATION_TYPES = ["remote", "hybrid", "on_site", "any"] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function OpportunitiesAdmin() {
  const [types, setTypes] = useState<Lookup[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [title, setTitle] = useState("");
  const [typeId, setTypeId] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [description, setDescription] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [benefits, setBenefits] = useState("");
  const [locationType, setLocationType] = useState<(typeof LOCATION_TYPES)[number]>("any");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [remoteRegions, setRemoteRegions] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [featured, setFeatured] = useState(false);
  const [publishNow, setPublishNow] = useState(true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadLists = useCallback(async () => {
    setLoadingLists(true);
    const [{ data: typeRows }, { data: oppRows }] = await Promise.all([
      supabase.from("opportunity_types").select("id, slug, name").order("name"),
      supabase
        .from("opportunities")
        .select("id, slug, title, status, organisation_name, deadline_at, opportunity_types(name)")
        .order("created_at", { ascending: false }),
    ]);
    setTypes(typeRows || []);
    setOpportunities(((oppRows as unknown as OpportunityRow[]) || []));
    setLoadingLists(false);
  }, []);

  useEffect(() => { loadLists(); }, [loadLists]);

  async function getUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (true) {
      const { data } = await supabase.from("opportunities").select("id").eq("slug", candidate).maybeSingle();
      if (!data) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  async function getManualSourceId(): Promise<string> {
    const { data, error } = await supabase.from("job_sources").select("id").eq("slug", "manual").single();
    if (error || !data) throw new Error("The 'manual' job source is missing. Run supabase/jobs_opportunities_seed.sql first.");
    return data.id;
  }

  const resetForm = () => {
    setTitle(""); setTypeId(""); setOrganisationName(""); setDescription("");
    setEligibility(""); setBenefits(""); setLocationType("any"); setCountry("");
    setCity(""); setRemoteRegions(""); setApplyUrl(""); setDeadlineAt(""); setFeatured(false); setPublishNow(true);
  };

  const submit = async () => {
    setErr(""); setMsg("");
    if (!title.trim()) return setErr("Title is required.");
    if (!typeId) return setErr("Type is required.");
    if (!applyUrl.trim()) return setErr("Apply link is required.");

    setSaving(true);
    try {
      const [sourceId, slug] = await Promise.all([
        getManualSourceId(),
        getUniqueSlug(slugify(title)),
      ]);

      const now = new Date().toISOString();
      const { error } = await supabase.from("opportunities").insert({
        slug,
        title: title.trim(),
        type_id: typeId,
        organisation_name: organisationName.trim() || null,
        description: description.trim() || null,
        eligibility: eligibility.trim() || null,
        benefits: benefits.trim() || null,
        location_type: locationType,
        country: country.trim() || null,
        city: city.trim() || null,
        remote_regions: remoteRegions.trim() ? remoteRegions.split(",").map((r) => r.trim()).filter(Boolean) : null,
        apply_url: applyUrl.trim(),
        source_id: sourceId,
        featured,
        status: publishNow ? "published" : "draft",
        published_at: publishNow ? now : null,
        deadline_at: deadlineAt || null,
      });
      if (error) throw new Error(error.message);

      setMsg("Opportunity saved.");
      resetForm();
      loadLists();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  async function setOppStatus(id: string, status: OpportunityRow["status"]) {
    await supabase.from("opportunities").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  async function deleteOpp(id: string) {
    if (!confirm("Delete this opportunity? This can't be undone.")) return;
    await supabase.from("opportunities").delete().eq("id", id);
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
  }

  return (
    <main className="bg-muted py-16">
      <Container>
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h1 className="text-3xl font-semibold text-foreground">Add Opportunity</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Scholarships, grants, fellowships, internships, competitions and more.
          </p>

          <div className="mt-8 grid gap-4">
            <Field label="Title *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. 2026 Mastercard Foundation Scholarship" />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Type *">
                <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={inputCls} disabled={loadingLists}>
                  <option value="">Select a type</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
              <Field label="Organisation">
                <input value={organisationName} onChange={(e) => setOrganisationName(e.target.value)} className={inputCls} placeholder="e.g. Mastercard Foundation" />
              </Field>
            </div>

            <Field label="Apply link (URL) *">
              <input value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} className={inputCls} placeholder="https://..." />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Location type">
                <select value={locationType} onChange={(e) => setLocationType(e.target.value as typeof locationType)} className={inputCls}>
                  {LOCATION_TYPES.map((lt) => (
                    <option key={lt} value={lt}>{lt === "on_site" ? "On-site" : lt[0].toUpperCase() + lt.slice(1)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Country">
                <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls} placeholder="e.g. Nigeria" />
              </Field>
              <Field label="City">
                <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="Optional" />
              </Field>
            </div>

            <Field label="Remote regions (comma-separated, optional)">
              <input value={remoteRegions} onChange={(e) => setRemoteRegions(e.target.value)} className={inputCls} placeholder="e.g. Africa, International" />
            </Field>

            <Field label="Who can apply / eligibility">
              <textarea value={eligibility} onChange={(e) => setEligibility(e.target.value)} className={`${inputCls} min-h-[90px]`} />
            </Field>
            <Field label="Benefits">
              <textarea value={benefits} onChange={(e) => setBenefits(e.target.value)} className={`${inputCls} min-h-[90px]`} />
            </Field>
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} min-h-[100px]`} />
            </Field>

            <Field label="Deadline">
              <input value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} className={inputCls} type="date" />
            </Field>

            <div className="mt-2 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
                Publish immediately
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                Featured
              </label>
            </div>

            {err ? <p className="text-sm text-red-600">{err}</p> : null}
            {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="mt-2 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
            >
              {saving ? "Saving..." : "Save opportunity"}
            </button>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h2 className="text-xl font-semibold text-foreground">All Opportunities</h2>
          {loadingLists ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : opportunities.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No opportunities yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Deadline</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((o) => (
                    <tr key={o.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 font-medium text-foreground">{o.title}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{o.opportunity_types?.name || "—"}</td>
                      <td className="py-2 pr-4">
                        <select
                          value={o.status}
                          onChange={(e) => setOppStatus(o.id, e.target.value as OpportunityRow["status"])}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="closed">Closed</option>
                          <option value="expired">Expired</option>
                        </select>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{o.deadline_at ? new Date(o.deadline_at).toLocaleDateString() : "—"}</td>
                      <td className="py-2 pr-4">
                        <button onClick={() => deleteOpp(o.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}

export default function AdminOpportunitiesPage() {
  return (
    <AdminGate>
      <OpportunitiesAdmin />
    </AdminGate>
  );
}
