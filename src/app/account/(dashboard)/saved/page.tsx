"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, EmptyState } from "@/components/account/AccountUI";
import { ITEM_LABEL, attachTitles, hrefFor } from "@/lib/account/itemLinks";
import { supabase } from "@/lib/supabase";

type SavedItem = { id: string; item_type: string; item_id: string; title?: string; slug?: string };

export default function SavedPage() {
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("saved_items").select("id, item_type, item_id").order("created_at", { ascending: false });
      setSaved(await attachTitles((data || []) as SavedItem[]));
      setLoading(false);
    })();
  }, []);

  async function removeSaved(id: string) {
    await supabase.from("saved_items").delete().eq("id", id);
    setSaved((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Saved</h1>
      <p className="mt-1 text-sm text-muted-foreground">Jobs, opportunities, and resources you&rsquo;ve bookmarked for later.</p>

      <div className="mt-6">
        <Card title="Saved items">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : saved.length === 0 ? (
            <EmptyState text="Nothing saved yet." ctaLabel="Browse jobs" ctaHref="/jobs" />
          ) : (
            <ul className="space-y-2">
              {saved.map((s) => {
                const href = hrefFor(s.item_type, s.slug);
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      {href ? (
                        <Link href={href} className="font-medium text-foreground hover:text-primary hover:underline">{s.title}</Link>
                      ) : (
                        <span className="font-medium text-foreground">{s.title}</span>
                      )}
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{ITEM_LABEL[s.item_type] || s.item_type}</span>
                    </div>
                    <button onClick={() => removeSaved(s.id)} className="flex-shrink-0 text-xs font-semibold text-red-600 hover:underline">Remove</button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
