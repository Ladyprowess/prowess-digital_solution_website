"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function BlogSearchBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const BRAND = "#507c80";

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
        onFocus={(e) => {
          e.currentTarget.style.borderColor = BRAND;
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(80,124,128,0.15)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e5e5e5";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      <button
        type="submit"
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          border: `1px solid ${BRAND}`,
          background: BRAND,
          color: "white",
          fontWeight: 800,
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
            border: `1px solid ${BRAND}`,
            background: "white",
            color: BRAND,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      ) : null}
    </form>
  );
}
