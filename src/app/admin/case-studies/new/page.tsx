"use client";

import { useMemo, useState } from "react";

export default function NewCaseStudyPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Retail");
  const [businessSize, setBusinessSize] = useState("Small");
  const [imageUrl, setImageUrl] = useState("");
  const [challenge, setChallenge] = useState("");
  const [solution, setSolution] = useState("");

  const [resultsJson, setResultsJson] = useState(
    `[
  { "label": "Revenue Growth", "value": "45%" },
  { "label": "Cash Flow Improvement", "value": "$850/month" }
]`
  );

  const [testimonial, setTestimonial] = useState(
    "The first conversation changed everything. I finally understood what was holding my business back."
  );

  const [timelineMonths, setTimelineMonths] = useState<number>(6);
  const [isPublished, setIsPublished] = useState(true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const slugHint = useMemo(() => {
    const s = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return s;
  }, [slug, title]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);

    try {
      const res = await fetch("/api/case-studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slugHint,
          category,
          business_size: businessSize,
          image_url: imageUrl || null,
          challenge,
          solution: solution || null,
          results: resultsJson || null,
          testimonial: testimonial || null,
          timeline_months: timelineMonths ?? null,
          is_published: isPublished,
        }),
      });
      
      // 👇 SAFETY WRAPPER (THIS FIXES THE ERROR)
      const text = await res.text();
      let json: any = null;
      
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      
      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.error ||
            `Request failed (${res.status}). Empty or invalid response body.`
        );
      }
      
      // success
      setMsg("Saved. Your case study is now live.");
      
      // Optionally clear form
      // setTitle(""); setSlug(""); setImageUrl(""); setChallenge(""); setSolution("");
    } catch (err: any) {
      setMsg(err?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-semibold text-[#223433]">New Case Study</h1>
      <p className="mt-2 text-sm text-[#4d5f5e]">
        Fill this form and publish. It will appear on the Case Studies page.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-10 rounded-2xl border border-[#dbe9e8] bg-white p-6 shadow-sm"
      >
        {msg ? (
          <div className="mb-6 rounded-xl border border-[#dbe9e8] bg-[#f6fbfb] px-4 py-3 text-sm text-[#223433]">
            {msg}
          </div>
        ) : null}

        <div className="grid gap-5">
          <div>
            <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
              TITLE
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-lg border border-[#dbe9e8] px-4 py-3 text-sm"
              placeholder="Lagos Fashion Boutique"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
              SLUG (optional)
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-2 w-full rounded-lg border border-[#dbe9e8] px-4 py-3 text-sm"
              placeholder="lagos-fashion-boutique"
            />
            <p className="mt-2 text-xs text-[#4d5f5e]">
              Final slug: <span className="font-semibold">{slugHint}</span>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
                CATEGORY
              </label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#dbe9e8] px-4 py-3 text-sm"
                placeholder="Retail"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
                BUSINESS SIZE
              </label>
              <select
                value={businessSize}
                onChange={(e) => setBusinessSize(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm"
              >
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
              IMAGE URL (optional)
            </label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-2 w-full rounded-lg border border-[#dbe9e8] px-4 py-3 text-sm"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
              CHALLENGE
            </label>
            <textarea
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              className="mt-2 min-h-[120px] w-full rounded-lg border border-[#dbe9e8] px-4 py-3 text-sm"
              placeholder="Struggling with inventory management and inconsistent cash flow..."
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
              SOLUTION (optional)
            </label>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className="mt-2 min-h-[120px] w-full rounded-lg border border-[#dbe9e8] px-4 py-3 text-sm"
              placeholder="We ran a Business Clarity Session and then..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
              RESULTS (JSON)
            </label>
            <textarea
              value={resultsJson}
              onChange={(e) => setResultsJson(e.target.value)}
              className="mt-2 min-h-[140px] w-full rounded-lg border border-[#dbe9e8] px-4 py-3 text-sm font-mono"
            />
            <p className="mt-2 text-xs text-[#4d5f5e]">
              Must be valid JSON.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
              TESTIMONIAL (optional)
            </label>
            <textarea
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
              className="mt-2 min-h-[90px] w-full rounded-lg border border-[#dbe9e8] px-4 py-3 text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
                TIMELINE (months)
              </label>
              <input
                type="number"
                value={timelineMonths}
                onChange={(e) => setTimelineMonths(Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-[#dbe9e8] px-4 py-3 text-sm"
                min={0}
              />
            </div>

            <div className="flex items-end gap-3">
              <label className="flex w-full items-center gap-3 rounded-lg border border-[#dbe9e8] px-4 py-3 text-sm text-[#223433]">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                Publish now
              </label>
            </div>
          </div>

          <button
            disabled={saving}
            className="mt-2 rounded-lg bg-[#507c80] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3d5f62] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Case Study"}
          </button>
        </div>
      </form>
    </main>
  );
}
