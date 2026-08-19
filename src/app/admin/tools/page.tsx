"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TOOL_ICON_KEYS } from "@/lib/tools/icons";

type ToolRow = {
  id: string;
  key: string;
  category: "career" | "business";
  title: string;
  description: string;
  detail: string | null;
  icon_key: string;
  badge: string;
  gated: boolean;
  href: string | null;
  position: number;
  status: "draft" | "published";
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function ToolsAdmin() {
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [key, setKey] = useState("");
  const [category, setCategory] = useState<"career" | "business">("business");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [detail, setDetail] = useState("");
  const [iconKey, setIconKey] = useState(TOOL_ICON_KEYS[0]);
  const [badge, setBadge] = useState("Free");
  const [gated, setGated] = useState(false);
  const [href, setHref] = useState("");
  const [position, setPosition] = useState("0");
  const [publishNow, setPublishNow] = useState(true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [editingToolId, setEditingToolId] = useState<string | null>(null);

  const loadTools = useCallback(async () => {
    setLoadingList(true);
    const { data } = await supabase
      .from("tools")
      .select("id, key, category, title, description, detail, icon_key, badge, gated, href, position, status")
      .order("category")
      .order("position");
    setTools(data || []);
    setLoadingList(false);
  }, []);

  useEffect(() => { loadTools(); }, [loadTools]);

  const resetForm = () => {
    setEditingToolId(null);
    setKey(""); setCategory("business"); setTitle(""); setDescription(""); setDetail("");
    setIconKey(TOOL_ICON_KEYS[0]); setBadge("Free"); setGated(false); setHref(""); setPosition("0"); setPublishNow(true);
  };

  function startEditTool(tool: ToolRow) {
    setErr(""); setMsg("");
    setEditingToolId(tool.id);
    setKey(tool.key);
    setCategory(tool.category);
    setTitle(tool.title);
    setDescription(tool.description);
    setDetail(tool.detail || "");
    setIconKey(tool.icon_key);
    setBadge(tool.badge);
    setGated(tool.gated);
    setHref(tool.href || "");
    setPosition(String(tool.position));
    setPublishNow(tool.status === "published");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const submit = async () => {
    setErr(""); setMsg("");
    if (!key.trim()) return setErr("Key is required (a short unique id, e.g. cv-builder).");
    if (!title.trim()) return setErr("Title is required.");
    if (!description.trim()) return setErr("Description is required.");

    setSaving(true);
    try {
      const basePayload = {
        key: key.trim(),
        category,
        title: title.trim(),
        description: description.trim(),
        detail: detail.trim() || null,
        icon_key: iconKey,
        badge: badge.trim() || "Free",
        gated,
        href: href.trim() || null,
        position: Number(position) || 0,
        status: publishNow ? "published" as const : "draft" as const,
        updated_at: new Date().toISOString(),
      };

      if (editingToolId) {
        const { error } = await supabase.from("tools").update(basePayload).eq("id", editingToolId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("tools").insert(basePayload);
        if (error) throw new Error(error.message);
      }

      setMsg(editingToolId ? "Tool updated." : "Tool saved.");
      resetForm();
      loadTools();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  async function setToolStatus(id: string, status: ToolRow["status"]) {
    await supabase.from("tools").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setTools((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  async function deleteTool(id: string) {
    if (!confirm("Delete this tool card? This can't be undone.")) return;
    await supabase.from("tools").delete().eq("id", id);
    setTools((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div>
      <div>
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h1 className="text-3xl font-semibold text-foreground">{editingToolId ? "Edit Tool" : "Add Tool"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {editingToolId
              ? "Update this card on the /tools page."
              : "Add a card to the /tools page. Leave the link blank for a \"Coming Soon\" card - useful for announcing career tools before they're built."}
          </p>

          <div className="mt-8 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title *">
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. CV Builder" />
              </Field>
              <Field label="Key * (unique id, no spaces)">
                <input value={key} onChange={(e) => setKey(e.target.value)} className={inputCls} placeholder="e.g. cv-builder" disabled={!!editingToolId} />
              </Field>
            </div>

            <Field label="Description *">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} placeholder="1-2 sentences shown on the card." />
            </Field>

            <Field label="Detail line (optional)">
              <input value={detail} onChange={(e) => setDetail(e.target.value)} className={inputCls} placeholder="e.g. Startup costs · Pricing · Break-even" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className={inputCls}>
                  <option value="career">Career &amp; CV</option>
                  <option value="business">Business</option>
                </select>
              </Field>
              <Field label="Icon">
                <select value={iconKey} onChange={(e) => setIconKey(e.target.value)} className={inputCls}>
                  {TOOL_ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Badge text">
                <input value={badge} onChange={(e) => setBadge(e.target.value)} className={inputCls} placeholder="e.g. Free, From Diagnostic" />
              </Field>
              <Field label="Link (blank = Coming Soon)">
                <input value={href} onChange={(e) => setHref(e.target.value)} className={inputCls} placeholder="/tools/cv-builder" />
              </Field>
              <Field label="Position (order, lowest first)">
                <input type="number" value={position} onChange={(e) => setPosition(e.target.value)} className={inputCls} />
              </Field>
            </div>

            <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
              <input type="checkbox" checked={gated} onChange={(e) => setGated(e.target.checked)} />
              Premium (requires an access code)
            </label>

            <label className="mt-2 flex items-center gap-3 text-sm font-semibold text-foreground">
              <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
              Published (visible on /tools)
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
                {saving ? "Saving..." : editingToolId ? "Update tool" : "Save tool"}
              </button>
              {editingToolId && (
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
          <h2 className="text-xl font-semibold text-foreground">All Tools</h2>
          {loadingList ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : tools.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No tools yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4">Link</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((t) => (
                    <tr key={t.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 font-medium text-foreground">{t.title}</td>
                      <td className="py-2 pr-4 text-muted-foreground capitalize">{t.category}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{t.href ? "Live" : "Coming Soon"}</td>
                      <td className="py-2 pr-4">
                        <select
                          value={t.status}
                          onChange={(e) => setToolStatus(t.id, e.target.value as ToolRow["status"])}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </td>
                      <td className="py-2 pr-4">
                        <button onClick={() => startEditTool(t)} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</button>
                        <button onClick={() => deleteTool(t.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminToolsPage() {
  return <ToolsAdmin />;
}
