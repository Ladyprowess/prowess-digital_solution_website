"use client";

import { supabase } from "@/lib/supabase";

// The file proxy route (/api/assignments/submissions/[id]/file) requires a
// Bearer token, same as every other member-facing API route in this app -
// verifyMember has no cookie fallback. A plain <a href> tag can't carry
// that header (a browser navigation sends no custom headers), so every
// file link in this feature has to go through fetch() + a Blob URL
// instead of a direct href, or it 401s on click.
export async function downloadAssignmentFile(submissionId: string, filename?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const res = await fetch(`/api/assignments/submissions/${submissionId}/file`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) return;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "submission";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
