"use client";

import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";

export function ApplyModal({
  open,
  onClose,
  jobTitle,
  jobId,
  companyName,
  applyUrl,
}: {
  open: boolean;
  onClose: () => void;
  jobTitle: string;
  jobId: string;
  companyName: string | null;
  applyUrl: string;
}) {
  function proceed() {
    window.open(applyUrl, "_blank", "noopener,noreferrer");
    onClose();
    void supabase.auth.getSession().then(({ data: { session } }) => session ? fetch("/api/account/applications", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ itemType: "job", itemId: jobId, title: jobTitle, organisationName: companyName, applyUrl }) }).catch(() => null) : null);
  }

  return (
    <Modal open={open} title="Leaving Prowess Digital Solutions" onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        You&rsquo;re about to leave Prowess Digital Solutions to apply for <span className="font-semibold text-foreground">{jobTitle}</span>
        {companyName ? <> on <span className="font-semibold text-foreground">{companyName}</span>&rsquo;s website.</> : "."}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={proceed}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90"
        >
          Continue to Application
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
