"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminCaseStudies() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "",
    business_size: "",
    challenge: "",
    solution: "",
    image_url: "",
  });

  const handleSubmit = async () => {
    setLoading(true);

    const { error } = await supabase
      .from("case_studies")
      .insert([form]);

    setLoading(false);

    if (!error) {
      alert("Case study uploaded");
      setForm({
        title: "",
        slug: "",
        category: "",
        business_size: "",
        challenge: "",
        solution: "",
        image_url: "",
      });
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Add Case Study</h1>

      <input
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <input
        placeholder="Slug (e.g lagos-fashion)"
        value={form.slug}
        onChange={(e) => setForm({ ...form, slug: e.target.value })}
      />

      <input
        placeholder="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />

      <input
        placeholder="Business Size"
        value={form.business_size}
        onChange={(e) =>
          setForm({ ...form, business_size: e.target.value })
        }
      />

      <textarea
        placeholder="Challenge"
        value={form.challenge}
        onChange={(e) =>
          setForm({ ...form, challenge: e.target.value })
        }
      />

      <textarea
        placeholder="Solution"
        value={form.solution}
        onChange={(e) =>
          setForm({ ...form, solution: e.target.value })
        }
      />

      <input
        placeholder="Image URL"
        value={form.image_url}
        onChange={(e) =>
          setForm({ ...form, image_url: e.target.value })
        }
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="rounded bg-[#507c80] px-6 py-3 text-white"
      >
        {loading ? "Saving..." : "Publish Case Study"}
      </button>
    </div>
  );
}
