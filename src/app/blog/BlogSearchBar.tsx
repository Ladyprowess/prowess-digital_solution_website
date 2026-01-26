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
    // reset to page 1 whenever searching
    params.set("page", "1");

    router.push(`/blog?${params.toString()}`);
  }

  function clear() {
    setValue("");
    router.push("/blog?page=1");
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: 10, marginTop: 12 }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search blog posts…"
        aria-label="Search blog posts"
        style={{
          flex: 1,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid #e5e5e5",
          outline: "none",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          border: "1px solid #e5e5e5",
          background: "white",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Search
      </button>
      {initialQ ? (
        <button
          type="button"
          onClick={clear}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #e5e5e5",
            background: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      ) : null}
    </form>
  );
}
