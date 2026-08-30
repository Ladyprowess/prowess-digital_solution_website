"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessPriceFields } from "@/components/admin/AccessPriceFields";
import { SkillPicker, type Skill } from "@/components/admin/SkillPicker";
import { ToolPicker, saveToolMap } from "@/components/admin/ToolPicker";
import { LearningItemPicker, saveLearningMap, type LearningItem } from "@/components/admin/LearningItemPicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { CAREER_PATH_ICON_KEYS } from "@/lib/careerPaths/icons";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const CATEGORIES = ["technology", "business", "marketing", "creative", "data"] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function CareerPathEditor({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === "new";

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(!isNew);

  const [title, setTitle] = useState("");
  const [manualSlug, setManualSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  // What was actually loaded from the DB, kept separate from the live
  // selection so saving can tell "the admin unchecked this" apart from "this
  // was never part of what this tab knows about" - see submit()'s comment.
  const [originalSkillIds, setOriginalSkillIds] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<Record<string, "" | (typeof LEVELS)[number]>>({});
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [access, setAccess] = useState<"free" | "premium">("free");
  const [priceUsd, setPriceUsd] = useState("");
  const [priceNgn, setPriceNgn] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [featured, setFeatured] = useState(false);
  const [level, setLevel] = useState<"" | (typeof LEVELS)[number]>("");
  const [category, setCategory] = useState<"" | (typeof CATEGORIES)[number]>("");
  const [iconKey, setIconKey] = useState(CAREER_PATH_ICON_KEYS[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [whoItsFor, setWhoItsFor] = useState(""); // one line per bullet

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.from("skills").select("id, slug, name").order("name").then(({ data }) => setSkills(data || []));
  }, []);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("career_paths")
        .select(
          "id, title, slug, description, access, price_usd, price_ngn, status, featured, level, category, icon_key, image_url, who_its_for, career_path_skill_map(skill_id, level), career_path_tool_map(tool_id), career_path_course_map(course_id, position, courses(title, thumbnail_url)), career_path_resource_map(resource_id, position, resources(title, resource_type, thumbnail_url))"
        )
        .eq("id", id)
        .single();
      setLoading(false);
      if (error || !data) { setErr(error?.message || "Career path not found."); return; }

      const p = data as unknown as {
        title: string; slug: string; description: string | null; access: "free" | "premium";
        price_usd: number | null; price_ngn: number | null; status: "draft" | "published";
        featured: boolean; level: (typeof LEVELS)[number] | null; category: (typeof CATEGORIES)[number] | null;
        icon_key: string; image_url: string | null; who_its_for: string[] | null;
        career_path_skill_map: { skill_id: string; level: (typeof LEVELS)[number] | null }[];
        career_path_tool_map: { tool_id: string }[];
        career_path_course_map: { course_id: string; position: number; courses: { title: string; thumbnail_url: string | null } | null }[];
        career_path_resource_map: { resource_id: string; position: number; resources: { title: string; resource_type: string | null; thumbnail_url: string | null } | null }[];
      };

      setTitle(p.title);
      setManualSlug(p.slug);
      setOriginalSlug(p.slug);
      setDescription(p.description || "");
      setAccess(p.access);
      setPriceUsd(p.price_usd?.toString() || "");
      setPriceNgn(p.price_ngn?.toString() || "");
      setStatus(p.status);
      setFeatured(p.featured);
      setLevel(p.level || "");
      setCategory(p.category || "");
      setIconKey(p.icon_key || CAREER_PATH_ICON_KEYS[0]);
      setImageUrl(p.image_url || "");
      setWhoItsFor((p.who_its_for || []).join("\n"));
      setSelectedSkillIds(p.career_path_skill_map.map((m) => m.skill_id));
      setOriginalSkillIds(p.career_path_skill_map.map((m) => m.skill_id));
      setSkillLevels(Object.fromEntries(p.career_path_skill_map.map((m) => [m.skill_id, m.level || ""])));
      setSelectedToolIds(p.career_path_tool_map.map((m) => m.tool_id));

      // Merge both join tables into one combined array, ordered by
      // position - this reconstructs the admin's original combined order
      // across courses and resources (see LearningItemPicker's saveLearningMap).
      const courseItems: (LearningItem & { position: number })[] = p.career_path_course_map
        .filter((m) => m.courses)
        .map((m) => ({ id: m.course_id, type: "course", title: m.courses!.title, kind: "course", thumbnailUrl: m.courses!.thumbnail_url, position: m.position }));
      const resourceItems: (LearningItem & { position: number })[] = p.career_path_resource_map
        .filter((m) => m.resources)
        .map((m) => ({ id: m.resource_id, type: "resource", title: m.resources!.title, kind: (m.resources!.resource_type as LearningItem["kind"]) || "article", thumbnailUrl: m.resources!.thumbnail_url, position: m.position }));
      setLearningItems(
        [...courseItems, ...resourceItems]
          .sort((a, b) => a.position - b.position)
          .map((item): LearningItem => ({ id: item.id, type: item.type, title: item.title, kind: item.kind, thumbnailUrl: item.thumbnailUrl }))
      );
    })();
  }, [id, isNew]);

  async function getUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (true) {
      const { data } = await supabase.from("career_paths").select("id").eq("slug", candidate).maybeSingle();
      if (!data) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  async function submit() {
    setErr(""); setMsg("");
    if (!title.trim()) return setErr("Title is required.");

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        access,
        price_usd: access === "premium" && priceUsd ? Number(priceUsd) : null,
        price_ngn: access === "premium" && priceNgn ? Number(priceNgn) : null,
        status,
        featured,
        level: level || null,
        category: category || null,
        icon_key: iconKey,
        image_url: imageUrl.trim() || null,
        who_its_for: whoItsFor.trim() ? whoItsFor.split("\n").map((l) => l.trim()).filter(Boolean) : null,
      };

      let pathId = isNew ? null : id;

      if (!isNew) {
        // Same "slug can only move while draft" rule used on Skills/Learn --
        // published paths already have real /career-paths/<slug> links out
        // in the wild.
        const wantsSlugChange = status === "draft" && manualSlug.trim() && slugify(manualSlug) !== originalSlug;
        const slugUpdate = wantsSlugChange ? { slug: await getUniqueSlug(slugify(manualSlug)) } : {};
        const { error } = await supabase.from("career_paths").update({ ...payload, ...slugUpdate }).eq("id", id);
        if (error) throw new Error(error.message);
      } else {
        const slug = await getUniqueSlug(slugify(manualSlug.trim() || title));
        const { data: created, error } = await supabase
          .from("career_paths")
          .insert({ ...payload, slug })
          .select("id")
          .single();
        if (error || !created) throw new Error(error?.message || "Could not save the career path.");
        pathId = created.id;
      }

      // Diffed against what this tab originally loaded, not a blanket
      // delete-then-insert - Career Options and Projects can also add a
      // skill straight to this career path (via PathSkillPicker's "Add
      // more skills"), and this tab has no way to know about that if it's
      // been open since before that happened. A blanket delete would
      // silently wipe any such addition; only removing skills the admin
      // explicitly unchecked *in this tab* avoids that.
      const removedSkillIds = originalSkillIds.filter((skillId) => !selectedSkillIds.includes(skillId));
      if (removedSkillIds.length > 0) {
        await supabase.from("career_path_skill_map").delete().eq("career_path_id", pathId!).in("skill_id", removedSkillIds);
      }
      if (selectedSkillIds.length > 0) {
        await supabase.from("career_path_skill_map").upsert(
          selectedSkillIds.map((skillId) => ({ career_path_id: pathId!, skill_id: skillId, level: skillLevels[skillId] || null })),
          { onConflict: "career_path_id,skill_id" }
        );
      }
      await saveToolMap(pathId!, selectedToolIds);
      await saveLearningMap(pathId!, learningItems);

      if (isNew) {
        router.push(`/admin/career-paths/${pathId}`);
      } else {
        setMsg("Career path updated.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>;
  if (err && !isNew && !title) return <p className="py-16 text-center text-sm text-red-600">{err}</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-foreground">{isNew ? "Add Career Path" : "Edit Career Path"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isNew
          ? "e.g. Digital Marketing, Cybersecurity. Save first, then use the tabs above to add responsibilities, a roadmap, career options and projects."
          : "Core details. Use the tabs above for responsibilities, roadmap, career options and projects."}
      </p>

      <div className="mt-8 grid gap-4">
        <Field label="Title *">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Digital Marketing" />
        </Field>

        <Field label={status !== "draft" && !isNew ? "URL slug (frozen once published)" : "URL slug"}>
          <input
            value={manualSlug}
            onChange={(e) => setManualSlug(e.target.value)}
            disabled={status !== "draft" && !isNew}
            className={`${inputCls} disabled:opacity-60`}
            placeholder="auto-generated from title if left blank"
          />
        </Field>

        <Field label="Description">
          <RichTextEditor key={`desc-${id}`} value={description} onChange={setDescription} placeholder="What is this career? Who is it suitable for?" />
        </Field>

        <Field label="Skills needed">
          <SkillPicker skills={skills} onSkillsChange={setSkills} selectedIds={selectedSkillIds} onSelectedIdsChange={setSelectedSkillIds} />
        </Field>

        {selectedSkillIds.length > 0 && (
          <Field label="Skill levels (optional - powers the skill matrix and roadmap on the public page)">
            <div className="grid gap-2">
              {selectedSkillIds.map((skillId) => {
                const skill = skills.find((s) => s.id === skillId);
                if (!skill) return null;
                return (
                  <div key={skillId} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-2.5">
                    <span className="text-sm text-foreground">{skill.name}</span>
                    <select
                      value={skillLevels[skillId] || ""}
                      onChange={(e) => setSkillLevels((prev) => ({ ...prev, [skillId]: e.target.value as (typeof LEVELS)[number] | "" }))}
                      className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
                    >
                      <option value="">Not set</option>
                      {LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Level">
            <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className={inputCls}>
              <option value="">Not set</option>
              {LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className={inputCls}>
              <option value="">Not set</option>
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </Field>
          <Field label="Icon">
            <select value={iconKey} onChange={(e) => setIconKey(e.target.value)} className={inputCls}>
              {CAREER_PATH_ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Hero image URL (optional)">
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputCls} placeholder="https://... (falls back to a generated visual if left blank)" />
        </Field>

        <Field label="Who this is for (one per line)">
          <textarea
            value={whoItsFor}
            onChange={(e) => setWhoItsFor(e.target.value)}
            className={`${inputCls} min-h-[100px]`}
            placeholder={"You enjoy solving problems\nYou like working with data\nYou want a career that can be remote"}
          />
        </Field>

        <Field label="Related tools">
          <ToolPicker selectedIds={selectedToolIds} onSelectedIdsChange={setSelectedToolIds} />
        </Field>

        <Field label="Learning for this career">
          <LearningItemPicker items={learningItems} onItemsChange={setLearningItems} />
        </Field>

        <AccessPriceFields access={access} onAccessChange={setAccess} priceUsd={priceUsd} onPriceUsdChange={setPriceUsd} priceNgn={priceNgn} onPriceNgnChange={setPriceNgn} />

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
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
          {saving ? "Saving..." : isNew ? "Save career path" : "Update career path"}
        </button>
      </div>
    </div>
  );
}

export default function AdminCareerPathPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CareerPathEditor id={id} />;
}
