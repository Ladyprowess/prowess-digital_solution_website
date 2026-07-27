"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function BlogSearchBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const initialQ = sp.get("q") ?? "";
  const [value, setValue] = useState(initialQ);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const q = value.trim();
    const params = new URLSearchParams();

    if (q) params.set("q", q);
    params.set("page", "1"); // reset to page 1 whenever searching

    router.push(`/blog?${params.toString()}`);
  }

  function clear() {
    setValue("");
    router.push("/blog?page=1");
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex gap-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search blog posts…"
        aria-label="Search blog posts"
        className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
      />

      <button
        type="submit"
        className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
      >
        Search
      </button>

      {initialQ ? (
        <button
          type="button"
          onClick={clear}
          className="rounded-xl border border-primary px-5 py-3 text-sm font-bold text-primary transition hover:bg-primary/10"
        >
          Clear
        </button>
      ) : null}
    </form>
  );
}
