"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, EmptyState } from "@/components/account/AccountUI";
import { hrefFor } from "@/lib/account/itemLinks";
import { supabase } from "@/lib/supabase";

type InterestRow = { career_path_id: string; title?: string; slug?: string };

export default function InterestsPage() {
  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("user_career_interests").select("career_path_id");
      const withTitles = await Promise.all(
        (data || []).map(async (row) => {
          const { data: path } = await supabase.from("career_paths").select("title, slug").eq("id", row.career_path_id).maybeSingle();
          return { ...row, title: path?.title || "Untitled", slug: path?.slug };
        })
      );
      setInterests(withTitles);
      setLoading(false);
    })();
  }, []);

  async function removeInterest(careerPathId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;
    await supabase.from("user_career_interests").delete().eq("user_id", userId).eq("career_path_id", careerPathId);
    setInterests((prev) => prev.filter((i) => i.career_path_id !== careerPathId));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Career Interests</h1>
      <p className="mt-1 text-sm text-muted-foreground">Career paths you&rsquo;re tracking.</p>

      <div className="mt-6">
        <Card title="My Career Interests" action={<Link href="/career-paths" className="text-sm font-semibold text-primary hover:underline">Browse →</Link>}>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : interests.length === 0 ? (
            <EmptyState text="No career interests saved yet." ctaLabel="Explore career paths" ctaHref="/career-paths" />
          ) : (
            <ul className="space-y-2">
              {interests.map((i) => {
                const href = hrefFor("career_path", i.slug);
                return (
                  <li key={i.career_path_id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm">
                    {href ? (
                      <Link href={href} className="font-medium text-foreground hover:text-primary hover:underline">{i.title}</Link>
                    ) : (
                      <span className="font-medium text-foreground">{i.title}</span>
                    )}
                    <button onClick={() => removeInterest(i.career_path_id)} className="flex-shrink-0 text-xs font-semibold text-red-600 hover:underline">Remove</button>
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
