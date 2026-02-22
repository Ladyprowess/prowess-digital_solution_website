"use client";

import { useEffect, useMemo } from "react";

export default function PdfModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  // lock background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1023px)").matches;
  }, []);

  useEffect(() => {
    // ✅ On mobile open PDF in native viewer instead of iframe (prevents zoom issue)
    if (isMobile && url) {
      window.open(url, "_blank", "noopener,noreferrer");
      onClose();
    }
  }, [isMobile, url, onClose]);

  // On mobile modal closes immediately
  if (isMobile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">{title}</p>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            type="button"
          >
            Close
          </button>
        </div>

        <div className="h-[80vh]">
          <iframe
            src={url}
            className="h-full w-full"
            title={title}
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}