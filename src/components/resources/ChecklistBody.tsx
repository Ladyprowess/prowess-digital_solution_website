"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BuyButton } from "@/components/BuyButton";
import { sanitizeRichTextHtml } from "@/components/RichText";

type ChecklistBodyData = {
  content: string | null;
  file_url: string | null;
  external_url: string | null;
  source: string;
  download_url: string | null;
};

type ChecklistBlock =
  | { type: "html"; key: number; html: string }
  | { type: "list"; key: number; items: { html: string; index: number }[] };

// Splits the resource's rich-text content into ordered blocks -- plain
// HTML blocks rendered as-is, and list blocks whose <li> items become real
// interactive checkboxes. Item indices are assigned sequentially across
// every list in the content, since checked_items is one flat array per
// resource (a checklist with two sections still has one continuous set of
// checkable items). Nested lists inside a <li> stay as static formatted
// text within that item's label rather than becoming their own checkboxes
// -- checklist content in practice is a flat list, not nested outlines.
function parseChecklistContent(html: string): { blocks: ChecklistBlock[]; totalItems: number } {
  const clean = sanitizeRichTextHtml(html);
  const blocks: ChecklistBlock[] = [];
  let counter = 0;
  let key = 0;

  const doc = new DOMParser().parseFromString(clean, "text/html");
  for (const node of Array.from(doc.body.childNodes)) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;
    if (el.tagName === "UL" || el.tagName === "OL") {
      const items = Array.from(el.querySelectorAll(":scope > li")).map((li) => ({
        html: (li as HTMLElement).innerHTML,
        index: counter++,
      }));
      if (items.length > 0) {
        blocks.push({ type: "list", key: key++, items });
        continue;
      }
    }
    blocks.push({ type: "html", key: key++, html: el.outerHTML });
  }
  return { blocks, totalItems: counter };
}

// Interactive counterpart to ResourceBody.tsx, swapped in only for
// resource_type === 'checklist'. Same entitlement flow, plus real checked-
// item state: signed-in visitors get it saved to checklist_progress
// (direct client upsert, same pattern as VideoPlayer's progress writes);
// signed-out visitors can still check things off locally for the session,
// no persistence and no forced login wall.
export function ChecklistBody({
  resourceId,
  priceUsd,
  priceNgn,
  allowDownload = true,
}: {
  resourceId: string;
  priceUsd: number | null;
  priceNgn: number | null;
  // Admin choice: some resources should only be readable/checkable on the
  // site, not downloadable as a raw file.
  allowDownload?: boolean;
}) {
  const [status, setStatus] = useState<"loading" | "entitled" | "locked">("loading");
  const [data, setData] = useState<ChecklistBodyData | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSignedIn(!!session);
      setUserId(session?.user.id || null);

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

      if (session?.user.id) {
        const { data: progress } = await supabase
          .from("checklist_progress")
          .select("checked_items")
          .eq("user_id", session.user.id)
          .eq("resource_id", resourceId)
          .maybeSingle();
        if (progress?.checked_items) setCheckedItems(new Set(progress.checked_items));
      }

      setStatus("entitled");
    })();
  }, [resourceId]);

  const { blocks, totalItems } = useMemo(
    () => (data?.content ? parseChecklistContent(data.content) : { blocks: [], totalItems: 0 }),
    [data]
  );

  function toggleItem(index: number) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);

      if (userId) {
        supabase.from("checklist_progress").upsert(
          {
            user_id: userId,
            resource_id: resourceId,
            checked_items: Array.from(next),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,resource_id" }
        );
      }
      return next;
    });
  }

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
          <BuyButton itemType="resource" itemId={resourceId} priceUsd={priceUsd} priceNgn={priceNgn} />
        </div>
      </div>
    );
  }

  const downloadUrl = data?.download_url || data?.file_url || null;

  return (
    <div className="mt-10 space-y-6">
      {totalItems > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{checkedItems.size} of {totalItems} checked</p>
          {!signedIn && <p className="text-xs text-muted-foreground">Sign in to save your progress</p>}
        </div>
      )}

      {blocks.map((block) =>
        block.type === "list" ? (
          <ul key={block.key} className="space-y-2">
            {block.items.map((item) => (
              <li key={item.index}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-primary/30">
                  <input
                    type="checkbox"
                    checked={checkedItems.has(item.index)}
                    onChange={() => toggleItem(item.index)}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-border text-primary focus:ring-primary"
                  />
                  <span
                    className={`text-sm ${checkedItems.has(item.index) ? "text-muted-foreground line-through" : "text-foreground"}`}
                    dangerouslySetInnerHTML={{ __html: item.html }}
                  />
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <div key={block.key} className="blog-content" dangerouslySetInnerHTML={{ __html: block.html }} />
        )
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

      {allowDownload && downloadUrl && (
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
        <p className="text-sm text-muted-foreground">No content has been added to this checklist yet.</p>
      )}
    </div>
  );
}
