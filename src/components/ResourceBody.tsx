"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { BuyButton } from "@/components/BuyButton";
import { RichText } from "@/components/RichText";

// ssr: false is load-bearing, not an optimization -- pdf.js (which
// PdfViewer depends on) touches browser-only globals (Web Workers,
// DOMMatrix, etc.) that don't exist during the server render Next.js still
// does once for a "use client" component's initial HTML. Even with worker
// setup deferred to an effect inside PdfViewer itself, react-pdf's own
// module-level code crashed that server render with "Object.defineProperty
// called on non-object" -- confirmed by reproducing it locally before this
// was added.
const PdfViewer = dynamic(() => import("@/components/resources/PdfViewer").then((m) => m.PdfViewer), { ssr: false });

type ResourceBodyData = {
  content: string | null;
  file_url: string | null;
  external_url: string | null;
  source: string;
  download_url: string | null;
};

type TocItem = { id: string; text: string; level: 2 | 3 };

export function ResourceBody({
  resourceId,
  title,
  price,
  currency,
  contentDisplay = "text",
}: {
  resourceId: string;
  title: string;
  price: number | null;
  currency: string | null;
  // "pdf" embeds the uploaded file itself (scrollable, in place of the
  // written content + table of contents) instead of rendering `content` --
  // an admin choice for a resource that's really just a PDF, where
  // retyping it as rich text would be pointless duplicate work.
  contentDisplay?: "text" | "pdf";
}) {
  const [status, setStatus] = useState<"loading" | "entitled" | "locked">("loading");
  const [data, setData] = useState<ResourceBodyData | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [toc, setToc] = useState<TocItem[]>([]);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSignedIn(!!session);

      const res = await fetch("/api/content/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ itemType: "resource", itemId: resourceId }),
      });
      const result = await res.json();

      if (!result.ok) {
        setStatus("locked");
        return;
      }
      setData(result.resource);
      setStatus("entitled");
    })();
  }, [resourceId]);

  // Table of contents built from the rendered content's real H2/H3 nodes,
  // once RichText has mounted them into the DOM -- TipTap's schema only
  // ever produces these two heading levels (RichTextEditor.tsx restricts
  // it), on both the write and read paths, so this is safe to rely on.
  // Only shown for genuinely long content, not a two-heading guide.
  // Deferred to a microtask so reading the DOM happens after the commit
  // this effect fired from, not synchronously within the effect body.
  useEffect(() => {
    queueMicrotask(() => {
      if (!contentRef.current) {
        setToc([]);
        return;
      }
      const headings = Array.from(contentRef.current.querySelectorAll("h2, h3")) as HTMLElement[];
      const seen = new Set<string>();
      const items: TocItem[] = headings.map((h) => {
        const base = (h.textContent || "section").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "section";
        let id = base;
        let n = 1;
        while (seen.has(id)) id = `${base}-${n++}`;
        seen.add(id);
        h.id = id;
        return { id, text: h.textContent || "", level: h.tagName === "H2" ? 2 : 3 };
      });
      setToc(items);
    });
  }, [data?.content]);

  if (status === "loading") {
    return <p className="mt-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (status === "locked") {
    return (
      <div className="mt-10 rounded-2xl border-2 border-primary/20 bg-muted p-8 text-center">
        <h2 className="text-lg font-bold text-foreground">This is premium</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {signedIn ? "You don't have access to this yet." : "Sign in if you've already bought this, or buy access below."}
        </p>
        <div className="mx-auto mt-6 max-w-xs">
          <BuyButton itemType="resource" itemId={resourceId} price={price} currency={currency} />
        </div>
      </div>
    );
  }

  // download_url is a same-origin proxy link (/api/resources/[id]/file) that
  // streams the file through our own domain, so it's safe to render as a
  // normal link - the browser never navigates to the raw Supabase storage
  // URL. Only fall back to a plain file_url when there's no file_path-based
  // download available (an admin-typed external link).
  const downloadUrl = data?.download_url || data?.file_url || null;

  // Only meaningful when there's actually a file to embed -- an admin who
  // picked "pdf" display but never uploaded a file falls back to the
  // normal written-content rendering below rather than showing nothing.
  const showEmbeddedPdf = contentDisplay === "pdf" && Boolean(downloadUrl);

  return (
    <div className="mt-10 space-y-6">
      {showEmbeddedPdf ? (
        <PdfViewer url={downloadUrl!} title={title} />
      ) : (
        <>
          {toc.length >= 3 && (
            <nav className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">On this page</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {toc.map((item) => (
                  <li key={item.id} className={item.level === 3 ? "ml-4" : ""}>
                    <a href={`#${item.id}`} className="text-primary hover:underline">{item.text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {data?.content && (
            <div ref={contentRef}>
              <RichText html={data.content} />
            </div>
          )}
        </>
      )}

      {data?.external_url && (
        <a
          href={data.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90"
        >
          Open →
        </a>
      )}

      {downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Download →
        </a>
      )}

      {!data?.content && !data?.external_url && !downloadUrl && (
        <p className="text-sm text-muted-foreground">No content has been added to this resource yet.</p>
      )}
    </div>
  );
}
