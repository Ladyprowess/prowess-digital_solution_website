"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AdminPagination } from "@/components/admin/AdminPagination";

type RoleRow = {
  id: string;
  title: string;
  location: string | null;
  job_type: string | null;
  level: string | null;
  summary: string | null;
  responsibilities: string | null;
  requirements: string | null;
  apply_url: string | null;
  is_published: boolean;
};

const PAGE_SIZE = 20;

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Your session expired - refresh and try again.");
  return token;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-[#6b7d7b]">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-[#dbe9e8] px-4 py-3 text-sm";

export default function AdminCareersPage() {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [level, setLevel] = useState("Mid");
  const [summary, setSummary] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [listSearch, setListSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [listErr, setListErr] = useState("");

  const loadRoles = useCallback(async () => {
    setLoadingList(true);
    setListErr("");
    try {
      const token = await getToken();
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (listSearch.trim()) params.set("q", listSearch.trim());
      const res = await fetch(`/api/admin/careers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Could not load roles.");
      setRoles(body.items || []);
      setTotal(body.total || 0);
    } catch (e) {
      setListErr(e instanceof Error ? e.message : "Could not load roles.");
    } finally {
      setLoadingList(false);
    }
  }, [page, statusFilter, listSearch]);

  useEffect(() => {
    const t = setTimeout(loadRoles, 200);
    return () => clearTimeout(t);
  }, [loadRoles]);

  useEffect(() => { setPage(1); }, [statusFilter, listSearch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const resetForm = () => {
    setEditingRoleId(null);
    setTitle(""); setLocation(""); setJobType("Full-time"); setLevel("Mid");
    setSummary(""); setResponsibilities(""); setRequirements(""); setApplyUrl(""); setIsPublished(true);
  };

  function startEditRole(role: RoleRow) {
    setErr(""); setMsg("");
    setEditingRoleId(role.id);
    setTitle(role.title);
    setLocation(role.location || "");
    setJobType(role.job_type || "Full-time");
    setLevel(role.level || "Mid");
    setSummary(role.summary || "");
    setResponsibilities(role.responsibilities || "");
    setRequirements(role.requirements || "");
    setApplyUrl(role.apply_url || "");
    setIsPublished(role.is_published);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const submit = async () => {
    setErr("");
    setMsg("");

    if (!title.trim()) {
      setErr("Title is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title, location, job_type: jobType, level, summary,
        responsibilities, requirements, apply_url: applyUrl, is_published: isPublished,
      };

      if (editingRoleId) {
        const token = await getToken();
        const res = await fetch("/api/admin/careers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: editingRoleId, ...payload }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error || `Request failed (${res.status}).`);
        setMsg("Role updated.");
      } else {
        const res = await fetch("/api/careers/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const text = await res.text();
        let json: { ok?: boolean; error?: string } | null = null;
        try { json = text ? JSON.parse(text) : null; } catch { json = null; }
        if (!res.ok || !json?.ok) throw new Error(json?.error || `Request failed (${res.status}).`);
        setMsg("Role saved.");
      }

      resetForm();
      loadRoles();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  async function setRolePublished(id: string, is_published: boolean) {
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/careers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, is_published }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Could not update this role.");
      setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, is_published } : r)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not update this role.");
    }
  }

  async function deleteRole(id: string) {
    if (!confirm("Delete this role? This can't be undone.")) return;
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/careers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Could not delete this role.");
      if (editingRoleId === id) resetForm();
      loadRoles();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not delete this role.");
    }
  }

  return (
    <div>
      <div>
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#dbe9e8] bg-white p-8">
          <h1 className="text-3xl font-semibold text-[#223433]">
            {editingRoleId ? "Edit Role" : "Add Open Role"}
          </h1>
          <p className="mt-2 text-sm text-[#4d5f5e]">
            {editingRoleId ? "Update this role." : "Create a role here and publish it to show on the Careers page."}
          </p>

          <div className="mt-8 grid gap-4">
            <Field label="Role title *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Operations Assistant" />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Location">
                <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} placeholder="e.g. Remote" />
              </Field>

              <Field label="Job type">
                <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={`${inputCls} bg-white`}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </Field>

              <Field label="Level">
                <select value={level} onChange={(e) => setLevel(e.target.value)} className={`${inputCls} bg-white`}>
                  <option>Junior</option>
                  <option>Mid</option>
                  <option>Senior</option>
                </select>
              </Field>
            </div>

            <Field label="Short summary">
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className={`min-h-[90px] ${inputCls}`}
                placeholder="A short paragraph about the role..."
              />
            </Field>

            <Field label="Responsibilities">
              <textarea
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                className={`min-h-[120px] ${inputCls}`}
                placeholder="Write responsibilities..."
              />
            </Field>

            <Field label="Requirements">
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className={`min-h-[120px] ${inputCls}`}
                placeholder="Write requirements..."
              />
            </Field>

            <Field label="Apply link (URL)">
              <input value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} className={inputCls} placeholder="e.g. https://forms.gle/..." />
            </Field>

            <label className="mt-2 flex items-center gap-3 text-sm font-semibold text-[#223433]">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              Publish immediately
            </label>

            {err ? <p className="text-sm text-red-600">{err}</p> : null}
            {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="w-full rounded-xl bg-[#507c80] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[#3d5f62]"
              >
                {loading ? "Saving..." : editingRoleId ? "Update role" : "Save role"}
              </button>
              {editingRoleId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-shrink-0 rounded-xl border border-[#dbe9e8] px-6 py-3 text-sm font-semibold text-[#223433] hover:bg-[#f4f9f8]"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-[#dbe9e8] bg-white p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[#223433]">All Roles</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search title..."
                className="rounded-lg border border-[#dbe9e8] px-3 py-2 text-xs"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="rounded-lg border border-[#dbe9e8] bg-white px-3 py-2 text-xs"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {listErr ? (
            <p className="mt-4 text-sm text-red-600">{listErr}</p>
          ) : loadingList ? (
            <p className="mt-4 text-sm text-[#4d5f5e]">Loading…</p>
          ) : roles.length === 0 ? (
            <p className="mt-4 text-sm text-[#4d5f5e]">No roles match this filter.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#dbe9e8] text-xs uppercase tracking-wide text-[#6b7d7b]">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Location</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.id} className="border-b border-[#dbe9e8]/60">
                      <td className="py-2 pr-4 font-medium text-[#223433]">{r.title}</td>
                      <td className="py-2 pr-4 text-[#4d5f5e]">{r.location || "-"}</td>
                      <td className="py-2 pr-4 text-[#4d5f5e]">{r.job_type || "-"}</td>
                      <td className="py-2 pr-4">
                        <select
                          value={r.is_published ? "published" : "draft"}
                          onChange={(e) => setRolePublished(r.id, e.target.value === "published")}
                          className="rounded-lg border border-[#dbe9e8] bg-white px-2 py-1 text-xs"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </td>
                      <td className="py-2 pr-4">
                        <button onClick={() => startEditRole(r)} className="mr-3 text-xs font-semibold text-[#507c80] hover:underline">Edit</button>
                        <button onClick={() => deleteRole(r.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-center text-xs text-[#6b7d7b]">{total} role{total === 1 ? "" : "s"} total</p>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
