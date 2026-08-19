"use client";

import { useCallback, useEffect, useState } from "react";
import Container from "@/components/Container";
import { AdminGate } from "@/components/admin/AdminGate";
import { AccessPriceFields } from "@/components/admin/AccessPriceFields";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";

type ResourceRow = {
  id: string;
  slug: string;
  title: string;
  resource_type: string | null;
  category: string | null;
  audience: "consumer" | "business" | "both";
  access: "free" | "premium";
  price: number | null;
  status: "draft" | "published" | "archived";
};

const RESOURCE_TYPES = ["article", "guide", "checklist", "template", "ebook", "video", "podcast", "external_course", "business_guide"] as const;
type Source = "prowess" | "youtube" | "external";
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const AUDIENCES = ["consumer", "business", "both"] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function ResourcesAdmin() {
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("consumer");
  const [resourceType, setResourceType] = useState<(typeof RESOURCE_TYPES)[number]>("guide");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number] | "">("");
  const [source, setSource] = useState<Source>("prowess");
  const [externalUrl, setExternalUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [access, setAccess] = useState<"free" | "premium">("free");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [featured, setFeatured] = useState(false);
  const [publishNow, setPublishNow] = useState(true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadResources = useCallback(async () => {
    setLoadingList(true);
    const { data } = await supabase
      .from("resources")
      .select("id, slug, title, resource_type, category, audience, access, price, status")
      .order("created_at", { ascending: false });
    setResources(data || []);
    setLoadingList(false);
  }, []);

  useEffect(() => { loadResources(); }, [loadResources]);

  async function getUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (true) {
      const { data } = await supabase.from("resources").select("id").eq("slug", candidate).maybeSingle();
      if (!data) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  const resetForm = () => {
    setTitle(""); setAudience("consumer"); setResourceType("guide"); setCategory(""); setLevel("");
    setSource("prowess"); setExternalUrl(""); setThumbnailUrl("");
    setSummary(""); setContent(""); setFileUrl("");
    setAccess("free"); setPrice(""); setFeatured(false); setPublishNow(true);
  };

  const submit = async () => {
    setErr(""); setMsg("");
    if (!title.trim()) return setErr("Title is required.");
    if (source !== "prowess" && !externalUrl.trim()) return setErr("External link is required for a YouTube/external resource.");

    setSaving(true);
    try {
      const slug = await getUniqueSlug(slugify(title));
      const now = new Date().toISOString();
      const { error } = await supabase.from("resources").insert({
        slug,
        title: title.trim(),
        audience,
        resource_type: resourceType,
        category: category.trim() || null,
        level: level || null,
        source,
        external_url: source !== "prowess" ? externalUrl.trim() : null,
        thumbnail_url: thumbnailUrl.trim() || null,
        summary: summary.trim() || null,
        content: content.trim() || null,
        file_url: fileUrl.trim() || null,
        access,
        price: access === "premium" && price ? Number(price) : null,
        price_currency: access === "premium" && price ? currency : null,
        featured,
        status: publishNow ? "published" : "draft",
        is_published: publishNow,
        published_at: publishNow ? now : null,
      });
      if (error) throw new Error(error.message);

      setMsg("Resource saved.");
      resetForm();
      loadResources();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  async function setResourceStatus(id: string, status: ResourceRow["status"]) {
    await supabase
      .from("resources")
      .update({ status, is_published: status === "published", updated_at: new Date().toISOString() })
      .eq("id", id);
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  async function deleteResource(id: string) {
    if (!confirm("Delete this resource? This can't be undone.")) return;
    await supabase.from("resources").delete().eq("id", id);
    setResources((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <main className="bg-muted py-16">
      <Container>
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h1 className="text-3xl font-semibold text-foreground">Add Resource</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Articles, e-books, videos, podcasts, guides, checklists, templates and curated external courses.
          </p>

          <div className="mt-8 grid gap-4">
            <Field label="Title *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. How to Write a CV With No Experience" />
            </Field>

            <Field label="Audience">
              <select value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)} className={inputCls}>
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>{a === "consumer" ? "Consumer (individuals)" : a[0].toUpperCase() + a.slice(1)}</option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Type">
                <select value={resourceType} onChange={(e) => setResourceType(e.target.value as typeof resourceType)} className={inputCls}>
                  {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} placeholder="e.g. Digital Marketing" />
              </Field>
              <Field label="Level">
                <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className={inputCls}>
                  <option value="">Not specified</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Source">
                <select value={source} onChange={(e) => setSource(e.target.value as typeof source)} className={inputCls}>
                  <option value="prowess">Prowess Digital Solutions</option>
                  <option value="youtube">YouTube</option>
                  <option value="external">External site</option>
                </select>
              </Field>
              {source !== "prowess" && (
                <Field label="External link *">
                  <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} className={inputCls} placeholder="https://..." />
                </Field>
              )}
            </div>

            <Field label="Thumbnail image (URL, optional)">
              <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className={inputCls} placeholder="https://..." />
            </Field>

            <Field label="Summary">
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} className={`${inputCls} min-h-[80px]`} />
            </Field>

            {source === "prowess" && (
              <>
                <Field label="Content">
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} className={`${inputCls} min-h-[140px]`} />
                </Field>
                <Field label="File link (for downloadable templates, optional)">
                  <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className={inputCls} placeholder="https://..." />
                </Field>
              </>
            )}

            <AccessPriceFields
              access={access} onAccessChange={setAccess}
              price={price} onPriceChange={setPrice}
              currency={currency} onCurrencyChange={setCurrency}
            />

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
              {saving ? "Saving..." : "Save resource"}
            </button>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h2 className="text-xl font-semibold text-foreground">All Resources</h2>
          {loadingList ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : resources.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No resources yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Audience</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Access</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr key={r.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 font-medium text-foreground">{r.title}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{r.audience}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{r.resource_type ? r.resource_type.replace("_", " ") : "—"}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {r.access === "premium" ? `Premium${r.price ? ` (${r.price})` : ""}` : "Free"}
                      </td>
                      <td className="py-2 pr-4">
                        <select
                          value={r.status}
                          onChange={(e) => setResourceStatus(r.id, e.target.value as ResourceRow["status"])}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>
                      <td className="py-2 pr-4">
                        <button onClick={() => deleteResource(r.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
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

export default function AdminResourcesPage() {
  return (
    <AdminGate>
      <ResourcesAdmin />
    </AdminGate>
  );
}
