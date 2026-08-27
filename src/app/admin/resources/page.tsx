"use client";

import { useCallback, useEffect, useState } from "react";
import { AccessPriceFields } from "@/components/admin/AccessPriceFields";
import { SkillPicker, saveSkillMap, type Skill } from "@/components/admin/SkillPicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";
import { RESOURCE_TYPES, USE_CASES, USE_CASE_LABELS } from "@/lib/resources/constants";

const PAGE_SIZE = 20;

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

type Source = "prowess" | "youtube" | "external";
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const AUDIENCES = ["consumer", "business", "both"] as const;
const CONTENT_ROLES = ["general", "learning", "career", "business", "motivation", "interview", "webinar", "tutorial"] as const;
const CONTENT_DISPLAYS = ["text", "pdf"] as const;
const CONTENT_DISPLAY_LABELS: Record<(typeof CONTENT_DISPLAYS)[number], string> = {
  text: "Written content (below)",
  pdf: "Embedded PDF (visitors scroll the uploaded file itself)",
};

// Where a resource is eligible to surface, independent of its type/
// audience/category. Applies to every resource type, not just video --
// library/learn/recommended default true (normal flow, nothing published
// today should silently vanish); homepage/business/career are deliberate
// curation opt-ins, default false.
const PLACEMENT_FIELDS = [
  { key: "show_in_library", label: "Video/resource library" },
  { key: "show_in_learn", label: "Learn" },
  { key: "show_in_recommended", label: "Recommended learning (skill/career/job pages)" },
  { key: "show_on_homepage", label: "Homepage" },
  { key: "show_in_business", label: "Business content" },
  { key: "show_in_career", label: "Career content" },
] as const;
type PlacementKey = (typeof PLACEMENT_FIELDS)[number]["key"];

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
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | ResourceRow["status"]>("all");
  const [audienceFilter, setAudienceFilter] = useState<"all" | ResourceRow["audience"]>("all");
  const [listSearch, setListSearch] = useState("");

  const [title, setTitle] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("consumer");
  const [resourceType, setResourceType] = useState<(typeof RESOURCE_TYPES)[number]>("guide");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number] | "">("");
  const [source, setSource] = useState<Source>("prowess");
  const [externalUrl, setExternalUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [contentDisplay, setContentDisplay] = useState<(typeof CONTENT_DISPLAYS)[number]>("text");
  const [allowDownload, setAllowDownload] = useState(true);
  const [fileUrl, setFileUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [access, setAccess] = useState<"free" | "premium">("free");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [featured, setFeatured] = useState(false);
  const [publishNow, setPublishNow] = useState(true);
  const [editingStatus, setEditingStatus] = useState<ResourceRow["status"] | null>(null);
  const [manualSlug, setManualSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [contentRole, setContentRole] = useState<(typeof CONTENT_ROLES)[number] | "">("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [whyRecommended, setWhyRecommended] = useState("");
  const [readingMinutes, setReadingMinutes] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [useCase, setUseCase] = useState<(typeof USE_CASES)[number] | "">("");
  const [placements, setPlacements] = useState<Record<PlacementKey, boolean>>({
    show_in_library: true, show_in_learn: true, show_in_recommended: true,
    show_on_homepage: false, show_in_business: false, show_in_career: false,
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  useEffect(() => {
    supabase.from("skills").select("id, slug, name").order("name").then(({ data }) => setSkills(data || []));
  }, []);

  const loadResources = useCallback(async () => {
    setLoadingList(true);
    let query = supabase
      .from("resources")
      .select("id, slug, title, resource_type, category, audience, access, price, status", { count: "exact" });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (audienceFilter !== "all") query = query.eq("audience", audienceFilter);
    if (listSearch.trim()) query = query.ilike("title", `%${listSearch.trim()}%`);

    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    setResources(data || []);
    setTotal(count || 0);
    setLoadingList(false);
  }, [page, statusFilter, audienceFilter, listSearch]);

  useEffect(() => {
    const t = setTimeout(loadResources, 200);
    return () => clearTimeout(t);
  }, [loadResources]);

  useEffect(() => { setPage(1); }, [statusFilter, audienceFilter, listSearch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
    setEditingResourceId(null);
    setTitle(""); setAudience("consumer"); setResourceType("guide"); setCategory(""); setLevel("");
    setSource("prowess"); setExternalUrl(""); setThumbnailUrl("");
    setSummary(""); setContent(""); setContentDisplay("text"); setAllowDownload(true); setFileUrl("");
    setCoverFile(null); setResourceFile(null); setExistingFileName(null);
    setAccess("free"); setPrice(""); setFeatured(false); setPublishNow(true); setSelectedSkillIds([]);
    setEditingStatus(null); setManualSlug(""); setOriginalSlug(""); setMetaTitle(""); setMetaDescription("");
    setContentRole(""); setDurationMinutes(""); setWhyRecommended("");
    setReadingMinutes(""); setPageCount(""); setUseCase("");
    setPlacements({ show_in_library: true, show_in_learn: true, show_in_recommended: true, show_on_homepage: false, show_in_business: false, show_in_career: false });
  };

  async function startEditResource(id: string) {
    setErr(""); setMsg("");
    setLoadingEdit(true);
    const { data, error } = await supabase
      .from("resources")
      .select("id, slug, title, audience, resource_type, category, level, source, external_url, thumbnail_url, description, content, content_display, allow_download, file_url, file_name, access, price, price_currency, featured, status, meta_title, meta_description, content_role, duration_minutes, why_recommended, reading_minutes, page_count, use_case, show_in_library, show_in_learn, show_in_recommended, show_on_homepage, show_in_business, show_in_career, resource_skill_map(skill_id)")
      .eq("id", id)
      .single();
    setLoadingEdit(false);
    if (error || !data) { setErr(error?.message || "Could not load this resource."); return; }

    const r = data as unknown as {
      id: string; slug: string; title: string; audience: (typeof AUDIENCES)[number]; resource_type: (typeof RESOURCE_TYPES)[number] | null;
      category: string | null; level: (typeof LEVELS)[number] | null; source: Source; external_url: string | null;
      thumbnail_url: string | null; description: string | null; content: string | null; content_display: (typeof CONTENT_DISPLAYS)[number]; allow_download: boolean; file_url: string | null; file_name: string | null;
      access: "free" | "premium"; price: number | null; price_currency: string | null; featured: boolean;
      status: ResourceRow["status"]; meta_title: string | null; meta_description: string | null;
      content_role: (typeof CONTENT_ROLES)[number] | null; duration_minutes: number | null; why_recommended: string | null;
      reading_minutes: number | null; page_count: number | null; use_case: (typeof USE_CASES)[number] | null;
      show_in_library: boolean; show_in_learn: boolean; show_in_recommended: boolean;
      show_on_homepage: boolean; show_in_business: boolean; show_in_career: boolean;
      resource_skill_map: { skill_id: string }[];
    };

    setEditingResourceId(r.id);
    setTitle(r.title);
    setAudience(r.audience);
    setResourceType(r.resource_type || "guide");
    setCategory(r.category || "");
    setLevel(r.level || "");
    setSource(r.source);
    setExternalUrl(r.external_url || "");
    setThumbnailUrl(r.thumbnail_url || "");
    setSummary(r.description || "");
    setContent(r.content || "");
    setContentDisplay(r.content_display || "text");
    setAllowDownload(r.allow_download ?? true);
    setFileUrl(r.file_url || "");
    setCoverFile(null); setResourceFile(null); setExistingFileName(r.file_name || null);
    setAccess(r.access);
    setPrice(r.price?.toString() || "");
    setCurrency(r.price_currency || "USD");
    setFeatured(r.featured);
    setPublishNow(r.status === "published");
    setSelectedSkillIds(r.resource_skill_map.map((m) => m.skill_id));
    setEditingStatus(r.status);
    setManualSlug(r.slug);
    setOriginalSlug(r.slug);
    setMetaTitle(r.meta_title || "");
    setMetaDescription(r.meta_description || "");
    setContentRole(r.content_role || "");
    setDurationMinutes(r.duration_minutes?.toString() || "");
    setWhyRecommended(r.why_recommended || "");
    setReadingMinutes(r.reading_minutes?.toString() || "");
    setPageCount(r.page_count?.toString() || "");
    setUseCase(r.use_case || "");
    setPlacements({
      show_in_library: r.show_in_library, show_in_learn: r.show_in_learn, show_in_recommended: r.show_in_recommended,
      show_on_homepage: r.show_on_homepage, show_in_business: r.show_in_business, show_in_career: r.show_in_career,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const submit = async () => {
    setErr(""); setMsg("");
    if (!title.trim()) return setErr("Title is required.");
    if (source !== "prowess" && !externalUrl.trim()) return setErr("External link is required for a YouTube/external resource.");

    setSaving(true);
    try {
      // Real file/cover uploads take priority over the plain-URL fallback
      // fields - both write into the same file_path/cover_path columns the
      // existing signing pipeline (/api/resources, /api/content/access)
      // already knows how to serve, so nothing downstream needs to change.
      //
      // Uploaded directly to Supabase Storage from the browser (own admin
      // session + RLS, see supabase/admin_storage_policies.sql) rather than
      // routed through a Next.js API route - a real ebook PDF regularly
      // exceeds Vercel's ~4.5MB serverless function request-body limit,
      // which used to fail the whole save with FUNCTION_PAYLOAD_TOO_LARGE
      // before this file's contents ever reached our own code. Uploading
      // straight to Storage has no such limit (only Supabase's own
      // project-level storage cap applies).
      const uploaded: { file_path?: string; file_name?: string; file_type?: string; file_size?: number; cover_path?: string } = {};
      if (source === "prowess" && (resourceFile || coverFile)) {
        setUploading(true);
        try {
          if (resourceFile) {
            const filePath = `${Date.now()}-${resourceFile.name.replace(/\s+/g, "-").toLowerCase()}`;
            const { error } = await supabase.storage.from("resources").upload(filePath, resourceFile, {
              contentType: resourceFile.type || "application/octet-stream",
              upsert: false,
            });
            if (error) throw new Error(`File upload failed: ${error.message}`);
            uploaded.file_path = filePath;
            uploaded.file_name = resourceFile.name;
            uploaded.file_type = resourceFile.type || "application/octet-stream";
            uploaded.file_size = resourceFile.size;
          }
          if (coverFile) {
            const coverPath = `${Date.now()}-${coverFile.name.replace(/\s+/g, "-").toLowerCase()}`;
            const { error } = await supabase.storage.from("resource-covers").upload(coverPath, coverFile, {
              contentType: coverFile.type || "image/jpeg",
              upsert: false,
            });
            if (error) throw new Error(`Cover upload failed: ${error.message}`);
            uploaded.cover_path = coverPath;
          }
        } finally {
          setUploading(false);
        }
      }

      const now = new Date().toISOString();
      const basePayload = {
        title: title.trim(),
        audience,
        resource_type: resourceType,
        category: category.trim() || null,
        level: level || null,
        source,
        external_url: (source !== "prowess" || resourceType === "video") ? externalUrl.trim() : null,
        thumbnail_url: thumbnailUrl.trim() || null,
        // The real column on `resources` is `description` (pre-existing,
        // from before the B2C content model) - `summary` is only the local
        // field/state name here for a clearer form label, not the DB column.
        description: summary.trim() || null,
        content: content.trim() || null,
        content_display: contentDisplay,
        allow_download: allowDownload,
        file_url: fileUrl.trim() || null,
        ...(uploaded.file_path ? { file_path: uploaded.file_path, file_name: uploaded.file_name, file_type: uploaded.file_type, file_size: uploaded.file_size } : {}),
        ...(uploaded.cover_path ? { cover_path: uploaded.cover_path } : {}),
        access,
        price: access === "premium" && price ? Number(price) : null,
        price_currency: access === "premium" && price ? currency : null,
        featured,
        status: publishNow ? "published" as const : "draft" as const,
        is_published: publishNow,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        content_role: resourceType === "video" ? (contentRole || null) : null,
        duration_minutes: resourceType === "video" && durationMinutes ? Number(durationMinutes) : null,
        why_recommended: resourceType === "video" ? (whyRecommended.trim() || null) : null,
        reading_minutes: resourceType === "article" && readingMinutes ? Number(readingMinutes) : null,
        page_count: resourceType === "ebook" && pageCount ? Number(pageCount) : null,
        use_case: useCase || null,
        ...placements,
      };

      let resourceId = editingResourceId;

      if (editingResourceId) {
        // The slug can only move while the resource is still a draft - once
        // published, changing it would break a URL someone may have
        // already bookmarked, shared, or that search engines have indexed.
        const wantsSlugChange = editingStatus === "draft" && manualSlug.trim() && slugify(manualSlug) !== originalSlug;
        const slugUpdate = wantsSlugChange ? { slug: await getUniqueSlug(slugify(manualSlug)) } : {};

        const { error } = await supabase.from("resources").update({ ...basePayload, ...slugUpdate }).eq("id", editingResourceId);
        if (error) throw new Error(error.message);
        await supabase.from("resource_skill_map").delete().eq("resource_id", editingResourceId);
      } else {
        const slug = await getUniqueSlug(slugify(manualSlug.trim() || title));
        const { data: created, error } = await supabase.from("resources").insert({
          ...basePayload,
          slug,
          published_at: publishNow ? now : null,
        }).select("id").single();
        if (error || !created) throw new Error(error?.message || "Could not save the resource.");
        resourceId = created.id;
      }

      await saveSkillMap("resource_skill_map", "resource_id", resourceId!, selectedSkillIds);

      setMsg(editingResourceId ? "Resource updated." : "Resource saved.");
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
    loadResources();
  }

  return (
    <div>
      <div>
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h1 className="text-3xl font-semibold text-foreground">{editingResourceId ? "Edit Resource" : "Add Resource"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {editingResourceId ? "Update this resource." : "Articles, e-books, videos, podcasts, guides, checklists, templates and curated external courses."}
          </p>
          {loadingEdit && <p className="mt-2 text-sm text-muted-foreground">Loading resource…</p>}

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
              {(source !== "prowess" || resourceType === "video") && (
                <Field label={resourceType === "video" ? "Video link (YouTube, etc.) *" : "External link *"}>
                  <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} className={inputCls} placeholder="https://..." />
                </Field>
              )}
            </div>

            {(resourceType === "video" || resourceType === "article" || resourceType === "ebook") && (
              <div className="grid gap-4 rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{resourceType} details</p>

                {resourceType === "video" && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Content role (curation only - not shown as a nav tab)">
                        <select value={contentRole} onChange={(e) => setContentRole(e.target.value as typeof contentRole)} className={inputCls}>
                          <option value="">Not set</option>
                          {CONTENT_ROLES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                        </select>
                      </Field>
                      <Field label="Duration (minutes)">
                        <input type="number" min="0" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className={inputCls} placeholder="e.g. 12" />
                      </Field>
                    </div>
                    <Field label="Why we recommend this (optional)">
                      <RichTextEditor key={`why-${editingResourceId || "new"}`} value={whyRecommended} onChange={setWhyRecommended} placeholder="Why did Prowess select this video? Shown on the video page." />
                    </Field>
                  </>
                )}

                {resourceType === "article" && (
                  <Field label="Reading time (minutes)">
                    <input type="number" min="0" value={readingMinutes} onChange={(e) => setReadingMinutes(e.target.value)} className={inputCls} placeholder="e.g. 8" />
                  </Field>
                )}

                {resourceType === "ebook" && (
                  <Field label="Page count">
                    <input type="number" min="0" value={pageCount} onChange={(e) => setPageCount(e.target.value)} className={inputCls} placeholder="e.g. 42" />
                  </Field>
                )}
              </div>
            )}

            {source === "prowess" ? (
              <Field label="Cover image">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className={inputCls}
                />
                {coverFile && <p className="mt-1.5 text-xs text-muted-foreground">Selected: {coverFile.name}</p>}
                <p className="mt-1.5 text-xs text-muted-foreground">Or paste a cover image URL instead:</p>
                <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className={`${inputCls} mt-1.5`} placeholder="https://..." />
              </Field>
            ) : (
              <Field label="Thumbnail image (URL, optional)">
                <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className={inputCls} placeholder="https://..." />
              </Field>
            )}

            <Field label="Summary">
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} className={`${inputCls} min-h-[80px]`} />
            </Field>

            {source === "prowess" && resourceType !== "video" && (
              <>
                <Field label="Content display">
                  <select value={contentDisplay} onChange={(e) => setContentDisplay(e.target.value as (typeof CONTENT_DISPLAYS)[number])} className={inputCls}>
                    {CONTENT_DISPLAYS.map((d) => <option key={d} value={d}>{CONTENT_DISPLAY_LABELS[d]}</option>)}
                  </select>
                  {contentDisplay === "pdf" && (
                    <p className="mt-1.5 text-xs text-muted-foreground">Make sure a PDF is uploaded below - the detail page will embed it in place of the written content.</p>
                  )}
                </Field>
                <Field label="Content">
                  <RichTextEditor key={`content-${editingResourceId || "new"}`} value={content} onChange={setContent} placeholder="The actual guide/article/checklist content..." />
                </Field>
                <Field label="Downloadable file (PDF, e-book, template, etc.)">
                  <input
                    type="file"
                    onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                    className={inputCls}
                  />
                  {resourceFile ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">Selected: {resourceFile.name} ({(resourceFile.size / (1024 * 1024)).toFixed(1)} MB)</p>
                  ) : existingFileName ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">Current file: {existingFileName}. Choose a new file to replace it.</p>
                  ) : null}
                  <p className="mt-1.5 text-xs text-muted-foreground">Or paste a link to an already-hosted file instead:</p>
                  <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className={`${inputCls} mt-1.5`} placeholder="https://..." />
                  <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" checked={allowDownload} onChange={(e) => setAllowDownload(e.target.checked)} />
                    Show a &quot;Download&quot; link on the resource page
                  </label>
                  {!allowDownload && (
                    <p className="mt-1.5 text-xs text-muted-foreground">Visitors can only read this on the site - no download link will show.</p>
                  )}
                </Field>
              </>
            )}

            <AccessPriceFields
              access={access} onAccessChange={setAccess}
              price={price} onPriceChange={setPrice}
              currency={currency} onCurrencyChange={setCurrency}
            />

            <Field label="Skills">
              <SkillPicker
                skills={skills} onSkillsChange={setSkills}
                selectedIds={selectedSkillIds} onSelectedIdsChange={setSelectedSkillIds}
              />
            </Field>

            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">SEO (optional)</p>
              <div className="mt-4 grid gap-4">
                <Field label={editingStatus && editingStatus !== "draft" ? "URL slug (frozen once published)" : "URL slug"}>
                  <input
                    value={manualSlug}
                    onChange={(e) => setManualSlug(e.target.value)}
                    disabled={Boolean(editingStatus) && editingStatus !== "draft"}
                    className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-60`}
                    placeholder="Leave blank to auto-generate from the title"
                  />
                </Field>
                <Field label="Meta title">
                  <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputCls} placeholder="Defaults to the resource title if left blank" />
                </Field>
                <Field label="Meta description">
                  <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className={`${inputCls} min-h-20`} placeholder="Shown in search results and link previews" />
                </Field>
              </div>
            </div>

            <Field label="Browse by need (curation only, optional)">
              <select value={useCase} onChange={(e) => setUseCase(e.target.value as typeof useCase)} className={inputCls}>
                <option value="">Not set</option>
                {USE_CASES.map((u) => <option key={u} value={u}>{USE_CASE_LABELS[u]}</option>)}
              </select>
            </Field>

            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Where should this show?</p>
              <p className="mt-1 text-xs text-muted-foreground">Independent of type/audience/category - applies to every resource type, not just video.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {PLACEMENT_FIELDS.map((field) => (
                  <label key={field.key} className="flex items-center gap-2.5 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={placements[field.key]}
                      onChange={(e) => setPlacements((prev) => ({ ...prev, [field.key]: e.target.checked }))}
                    />
                    {field.label}
                  </label>
                ))}
              </div>
            </div>

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

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
              >
                {uploading ? "Uploading file..." : saving ? "Saving..." : editingResourceId ? "Update resource" : "Save resource"}
              </button>
              {editingResourceId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-shrink-0 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">All Resources</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search title..."
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
              />
              <select
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value as typeof audienceFilter)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
              >
                <option value="all">All audiences</option>
                {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          {loadingList ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : resources.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No resources match this filter.</p>
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
                      <td className="py-2 pr-4 text-muted-foreground">{r.resource_type ? r.resource_type.replace("_", " ") : "-"}</td>
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
                        <button onClick={() => startEditResource(r.id)} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</button>
                        <button onClick={() => deleteResource(r.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-center text-xs text-muted-foreground">{total} resource{total === 1 ? "" : "s"} total</p>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}

export default function AdminResourcesPage() {
  return <ResourcesAdmin />;
}
