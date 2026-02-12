"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categories = [
  "Getting Started",
  "Business Systems",
  "Strategy & Growth",
  "Business Setup",
  "Marketing",
  "Financial Planning",
  "Customer Experience",
  "Personal Development",
];

const stages = ["Starting Out", "Growing", "Scaling", "All Stages"];

const types = [
  "PDF Guide",
  "PDF Checklist",
  "PDF Workbook",
  "PDF Workshop",
  "Word Template",
  "Excel Template",
];

function formatMB(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export default function ResourceUploadPage() {
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // ✅ use same filter options as browser
  const [type, setType] = useState(types[0]);
  const [category, setCategory] = useState(categories[0]);
  const [stage, setStage] = useState(stages[0]);

  const [readingMinutes, setReadingMinutes] = useState<string>("");

  // ✅ files
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);

  const fileSizeLabel = useMemo(() => {
    if (!file) return "";
    return formatMB(file.size);
  }, [file]);

  const coverHint = "Recommended: 1200×800 (3:2). JPG/PNG/WebP. Max 2MB.";

  async function onUpload() {
    if (!file) return alert("Please choose the resource file.");
    if (!title.trim()) return alert("Title is required.");
  
    setLoading(true);
  
    try {
      // 1) Upload main file directly to Supabase
      const safeName = file.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9.\-_]/g, "");
  
      const filePath = `${Date.now()}-${safeName}`;
  
      const { error: fileError } = await supabase.storage
        .from("resources")
        .upload(filePath, file, { contentType: file.type, upsert: false });
  
      if (fileError) throw new Error(fileError.message);
  
      // 2) Upload cover directly to Supabase (optional)
      let coverPath = "";
  
      if (cover) {
        const coverSafe = cover.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9.\-_]/g, "");
  
        coverPath = `${Date.now()}-${coverSafe}`;
  
        const { error: coverError } = await supabase.storage
          .from("resource-covers")
          .upload(coverPath, cover, { contentType: cover.type, upsert: false });
  
        if (coverError) throw new Error(coverError.message);
      }
  
      // 3) Send ONLY metadata to your existing API route (small request)
      const form = new FormData();
  
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("type", type);
      form.append("category", category);
      form.append("stage", stage);
  
      if (readingMinutes.trim()) {
        form.append("reading_minutes", readingMinutes.trim());
      }
  
      form.append("file_path", filePath);
      form.append("file_name", file.name);
      form.append("file_size", String(file.size));
      form.append("file_type", file.type || "application/octet-stream");
      form.append("cover_path", coverPath);
  
      const res = await fetch("/api/resources/upload", {
        method: "POST",
        body: form,
      });
  
      const data = await res.json().catch(() => ({}));
  
      if (!data?.ok) throw new Error(data?.error || "Upload failed");
  
      alert("Uploaded successfully ✅");
  
      // reset (same as your current reset)
      setTitle("");
      setDescription("");
      setType(types[0]);
      setCategory(categories[0]);
      setStage(stages[0]);
      setReadingMinutes("");
      setFile(null);
      setCover(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Upload Resource</h1>
      <p className="mt-2 text-slate-600">
        Upload a resource file and optional cover image. This will appear on the Resources page.
      </p>

      <div className="mt-10 space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Title */}
        <input
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-[var(--steel-teal)]"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Description */}
        <textarea
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-[var(--steel-teal)]"
          placeholder="Description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Filters (same options as browser) */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-semibold text-slate-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"
            >
              {types.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"
            >
              {categories.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"
            >
              {stages.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reading minutes */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">Reading minutes (optional)</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              placeholder="e.g. 10"
              value={readingMinutes}
              onChange={(e) => setReadingMinutes(e.target.value)}
            />
          </div>

          <div className="text-sm text-slate-600 sm:flex sm:flex-col sm:justify-end">
            {file ? (
              <p className="mt-6 sm:mt-0">
                <span className="font-semibold text-slate-800">File size:</span> {fileSizeLabel}
              </p>
            ) : (
              <p className="mt-6 sm:mt-0 text-slate-400">Choose a file to see the size.</p>
            )}
          </div>
        </div>

        {/* Cover image upload */}
        <div>
          <label className="text-sm font-semibold text-slate-700">Cover image (optional)</label>
          <p className="mt-1 text-xs text-slate-500">{coverHint}</p>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            onChange={(e) => setCover(e.target.files?.[0] || null)}
          />

          {cover ? (
            <p className="mt-2 text-xs text-slate-600">
              Selected cover: <span className="font-semibold">{cover.name}</span> ({formatMB(cover.size)})
            </p>
          ) : null}
        </div>

        {/* Resource file upload */}
        <div>
          <label className="text-sm font-semibold text-slate-700">Resource file</label>
          <input
            type="file"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          {file ? (
            <p className="mt-2 text-xs text-slate-600">
              Selected file: <span className="font-semibold">{file.name}</span> ({formatMB(file.size)})
            </p>
          ) : null}
        </div>

        <button
          onClick={onUpload}
          disabled={loading}
          className="w-full rounded-2xl bg-[var(--steel-teal)] px-6 py-4 text-base font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
