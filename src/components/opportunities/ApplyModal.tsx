"use client";

import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";

export function ApplyModal({
  open,
  onClose,
  opportunityTitle,
  opportunityId,
  organisationName,
  applyUrl,
}: {
  open: boolean;
  onClose: () => void;
  opportunityTitle: string;
  opportunityId: string;
  organisationName: string | null;
  applyUrl: string;
}) {
  function proceed() {
    window.open(applyUrl, "_blank", "noopener,noreferrer");
    onClose();
    void supabase.auth.getSession().then(({ data: { session } }) => session ? fetch("/api/account/applications", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ itemType: "opportunity", itemId: opportunityId, title: opportunityTitle, organisationName, applyUrl }) }).catch(() => null) : null);
  }

  return (
    <Modal open={open} title="Leaving Prowess Digital Solutions" onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        You&rsquo;re about to leave Prowess Digital Solutions to complete your application for{" "}
        <span className="font-semibold text-foreground">{opportunityTitle}</span>
        {organisationName ? <> on <span className="font-semibold text-foreground">{organisationName}</span>&rsquo;s website.</> : "."}
        {" "}Prowess Digital Solutions does not process this application directly.
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
