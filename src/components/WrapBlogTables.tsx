"use client";

import { useEffect } from "react";

export default function WrapBlogTables() {
  useEffect(() => {
    const root = document.querySelector(".blog-content");
    if (!root) return;

    const tables = Array.from(root.querySelectorAll("table"));

    tables.forEach((table) => {
      // If already wrapped, skip
      const parent = table.parentElement;
      if (parent && parent.classList.contains("table-wrap")) return;

      const wrap = document.createElement("div");
      wrap.className = "table-wrap";

      table.replaceWith(wrap);
      wrap.appendChild(table);
    });
  }, []);

  return null;
}
