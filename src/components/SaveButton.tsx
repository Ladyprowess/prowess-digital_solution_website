"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Shared bookmark toggle for jobs/opportunities/resources/courses/career
// paths - all backed by the one generic saved_items table (see
// jobs_opportunities_schema.sql for why a single polymorphic table beats a
// saved_<type> table per content type). Requires sign-in; anonymous clicks
// go to /account/login rather than failing silently, since saved_items has
// no anon-write RLS policy.
export function SaveButton({
  itemType,
  itemId,
  className = "",
}: {
  itemType: "job" | "opportunity" | "resource" | "course" | "career_path";
  itemId: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setChecking(false);
        return;
      }
      const { data } = await supabase
        .from("saved_items")
        .select("id")
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();
      setSavedRowId(data?.id ?? null);
      setChecking(false);
    })();
  }, [itemType, itemId]);

  async function toggle() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/account/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setBusy(true);
    if (savedRowId) {
      await supabase.from("saved_items").delete().eq("id", savedRowId);
      setSavedRowId(null);
    } else {
      const { data } = await supabase
        .from("saved_items")
        .insert({ item_type: itemType, item_id: itemId, user_id: session.user.id })
        .select("id")
        .single();
      setSavedRowId(data?.id ?? null);
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={checking || busy}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
        savedRowId ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-muted"
      } ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={savedRowId ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
      {savedRowId ? "Saved" : "Save"}
    </button>
  );
}
