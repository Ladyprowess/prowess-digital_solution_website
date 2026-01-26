"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ open, title, onClose, children }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    // focus modal for accessibility
    setTimeout(() => panelRef.current?.focus(), 0);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="
          relative z-10 w-full max-w-2xl rounded-xl bg-white shadow-xl outline-none
          flex flex-col
          max-h-[85vh]
          overflow-hidden
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-6">
          <h3 id="modal-title" className="text-lg font-semibold">
            {title}
          </h3>
          <button
            className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Body (scrolls on mobile) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
