"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lookup = { id: string; slug: string; name: string };

type SourceRow = {
  id: string;
  slug: string;
  name: string;
  connector: string | null;
  feed_url: string | null;
  active: boolean;
  auto_publish: boolean;
  import_frequency_minutes: number;
  last_imported_at: string | null;
  last_import_error: string | null;
  last_import_count: number | null;
};

// Shared by Admin > Jobs > Sources and Admin > Opportunities > Sources -
// job_sources is one table feeding both, split only by which `connector`
// values each import API route recognizes (see CONNECTORS in
// /api/admin/jobs/import and /api/admin/opportunities/import).
export function SourcesPanel({
  title,
  importApiPath,
  connectorOptions,
  categoryOptions,
  typeOptions,
}: {
  title: string;
  importApiPath: string;
  connectorOptions: { value: string; label: string }[];
  categoryOptions?: Lookup[];
  typeOptions: Lookup[];
}) {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingSlug, setImportingSlug] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newConnector, setNewConnector] = useState(connectorOptions[0]?.value || "");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newTypeSlug, setNewTypeSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const connectorValues = connectorOptions.map((c) => c.value);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("job_sources")
      .select("id, slug, name, connector, feed_url, active, auto_publish, import_frequency_minutes, last_imported_at, last_import_error, last_import_count")
      .eq("source_type", "external")
      .in("connector", connectorValues)
      .order("name");
    setSources((data as SourceRow[] | null) || []);
    setLoading(false);
    // connectorValues is derived from a prop that's a new array every
    // render - comparing its contents, not the reference, would need a
    // second effect just to memoize it, which is more code than it saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importApiPath]);

  useEffect(() => { load(); }, [load]);

  async function toggleField(id: string, field: "active" | "auto_publish", value: boolean) {
    await supabase.from("job_sources").update({ [field]: value }).eq("id", id);
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  async function importNow(slug: string) {
    setImportingSlug(slug);
    setMsg(""); setErr("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Your session expired - refresh and try again.");

      const res = await fetch(importApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sourceSlug: slug }),
      });
      const body = await res.json();
      const result = body?.results?.[0];
      if (!res.ok || result?.error) throw new Error(result?.error || body?.error || "Import failed.");

      setMsg(`${result.source}: fetched ${result.fetched}, imported ${result.imported} new, ${result.skippedExisting} already had, ${result.errors} skipped with errors.`);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImportingSlug(null);
    }
  }

  async function addSource() {
    setErr(""); setMsg("");
    if (!newName.trim()) return setErr("Name is required.");
    if (!newFeedUrl.trim()) return setErr("Feed/API URL is required.");

    setSaving(true);
    try {
      const slugBase = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const { error } = await supabase.from("job_sources").insert({
        slug: `${slugBase}-${Date.now().toString(36)}`,
        name: newName.trim(),
        source_type: "external",
        connector: newConnector,
        feed_url: newFeedUrl.trim(),
        default_category_slug: newCategorySlug || null,
        default_type_slug: newTypeSlug || null,
        active: false,
        auto_publish: false,
      });
      if (error) throw new Error(error.message);

      setNewName(""); setNewFeedUrl(""); setNewCategorySlug(""); setNewTypeSlug("");
      setShowAddForm(false);
      setMsg("Source added - test it with Import now before turning it on.");
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not add the source.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Imported items land as drafts for you to review - turn on &ldquo;Auto-publish&rdquo; only once you trust a source.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex-shrink-0 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
        >
          {showAddForm ? "Cancel" : "+ Add Source"}
        </button>
      </div>

      {showAddForm && (
        <div className="mt-4 space-y-3 rounded-xl border border-border p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name, e.g. Acme (Greenhouse)" className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
            <select value={newConnector} onChange={(e) => setNewConnector(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
              {connectorOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <input value={newFeedUrl} onChange={(e) => setNewFeedUrl(e.target.value)} placeholder="Feed or API URL" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
          <div className="grid gap-3 md:grid-cols-2">
            {categoryOptions && (
              <select value={newCategorySlug} onChange={(e) => setNewCategorySlug(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option value="">Default category (optional)</option>
                {categoryOptions.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            )}
            <select value={newTypeSlug} onChange={(e) => setNewTypeSlug(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <option value="">Default type (optional)</option>
              {typeOptions.map((t) => <option key={t.id} value={t.slug}>{t.name}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={addSource}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
          >
            {saving ? "Saving..." : "Save source"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : sources.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No sources yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {sources.map((s) => (
            <div key={s.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.last_imported_at
                      ? `Last imported ${new Date(s.last_imported_at).toLocaleString()} - ${s.last_import_count ?? 0} new`
                      : "Never imported yet"}
                    {s.last_import_error ? ` - error: ${s.last_import_error}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <input type="checkbox" checked={s.active} onChange={(e) => toggleField(s.id, "active", e.target.checked)} />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <input type="checkbox" checked={s.auto_publish} onChange={(e) => toggleField(s.id, "auto_publish", e.target.checked)} />
                    Auto-publish
                  </label>
                  <button
                    type="button"
                    onClick={() => importNow(s.slug)}
                    disabled={importingSlug === s.slug}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
                  >
                    {importingSlug === s.slug ? "Importing..." : "Import now"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
      {msg ? <p className="mt-3 text-sm text-muted-foreground">{msg}</p> : null}
    </div>
  );
}
