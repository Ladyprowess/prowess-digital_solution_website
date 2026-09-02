"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { supabase } from "@/lib/supabase";

type TargetType = "course_review" | "discussion_post" | "discussion_reply";

export function ReportButton({ targetType, targetId }: { targetType: TargetType; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  async function submit() {
    setState("sending");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setState("idle"); return; }

    await fetch("/api/community/report", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ targetType, targetId, reason: reason.trim() || null }),
    }).catch(() => {});

    setState("done");
    setOpen(false);
  }

  if (state === "done") {
    return <span className="flex-shrink-0 text-xs font-semibold text-muted-foreground">Reported</span>;
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Report"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
      >
        <Flag size={13} aria-hidden="true" />
        Report
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="text-xs font-semibold text-foreground">Why are you reporting this?</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Optional details"
            className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground"
          />
          <div className="mt-2 flex items-center gap-3">
            <button type="button" onClick={submit} disabled={state === "sending"} className="text-xs font-semibold text-primary hover:underline disabled:opacity-60">
              {state === "sending" ? "Sending…" : "Submit report"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
