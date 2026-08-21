"use client";

import { useState } from "react";
import { ApplyModal } from "@/components/opportunities/ApplyModal";

export function ApplyButton({
  opportunityTitle,
  organisationName,
  applyUrl,
  className = "",
}: {
  opportunityTitle: string;
  organisationName: string | null;
  applyUrl: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 ${className}`}
      >
        Apply now →
      </button>
      <ApplyModal open={open} onClose={() => setOpen(false)} opportunityTitle={opportunityTitle} organisationName={organisationName} applyUrl={applyUrl} />
    </>
  );
}
