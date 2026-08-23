"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// A plain <iframe src="file.pdf"> only renders inline PDFs on browsers with
// a built-in PDF plugin -- desktop Chrome/Firefox/Edge do, but mobile
// Safari and most mobile browsers don't reliably support it at all: it
// showed only a stretched, non-scrollable render of page 1 there, while
// working fine on desktop (confirmed against a live mobile screenshot).
// react-pdf renders every page onto its own <canvas> via pdf.js itself, so
// it looks and scrolls identically on every device regardless of what PDF
// support the browser happens to have built in.
//
export function PdfViewer({ url, title }: { url: string; title: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  // Configuring the worker (and touching pdfjs at all) has to happen
  // inside an effect, not at module load time -- this component still
  // gets server-rendered once for its initial HTML/hydration even though
  // it's "use client" (that's how Next.js client components work), and
  // pdf.js depends on browser-only globals (Web Workers, DOMMatrix, etc.)
  // that don't exist in that Node.js render pass. Doing this at import
  // time crashed the whole page with "Object.defineProperty called on
  // non-object" on first render -- confirmed by reproducing it locally.
  //
  // The worker script itself loads from unpkg at the exact version
  // react-pdf's own bundled pdfjs-dist reports (pdfjs.version), not this
  // project's own top-level pdfjs-dist dependency -- react-pdf ships its
  // own nested pdfjs-dist (a different version), and pdf.js hard-fails if
  // the main thread and worker versions don't match exactly. Matching by
  // version number against a CDN sidesteps needing the exact right nested
  // path to resolve through Next.js's bundler.
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setPageWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (failed) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">This document couldn&apos;t be previewed. Try the download link below instead.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="overflow-hidden rounded-2xl border border-border bg-muted">
      <Document
        file={url}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        onLoadError={() => setFailed(true)}
        loading={<p className="py-10 text-center text-sm text-muted-foreground">Loading document…</p>}
        className="max-h-[95vh] overflow-y-auto"
      >
        {pageWidth > 0 &&
          Array.from({ length: numPages || 0 }, (_, i) => (
            <div key={i} className="border-b border-border last:border-0">
              <Page pageNumber={i + 1} width={pageWidth} loading="" />
            </div>
          ))}
      </Document>
      <p className="sr-only">{title}</p>
    </div>
  );
}
