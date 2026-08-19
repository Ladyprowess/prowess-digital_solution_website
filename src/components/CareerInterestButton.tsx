"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Dashboard could only ever remove a career interest, never add one - this
// is the missing other half. user_career_interests has a composite
// (user_id, career_path_id) primary key rather than its own id, so the
// insert/delete shape is slightly different from SaveButton's saved_items
// pattern, hence its own small component instead of reusing that one.
export function CareerInterestButton({ careerPathId, className = "" }: { careerPathId: string; className?: string }) {
  const router = useRouter();
  const [interested, setInterested] = useState(false);
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
        .from("user_career_interests")
        .select("career_path_id")
        .eq("user_id", session.user.id)
        .eq("career_path_id", careerPathId)
        .maybeSingle();
      setInterested(!!data);
      setChecking(false);
    })();
  }, [careerPathId]);

  async function toggle() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/account/login");
      return;
    }

    setBusy(true);
    if (interested) {
      await supabase.from("user_career_interests").delete().eq("user_id", session.user.id).eq("career_path_id", careerPathId);
      setInterested(false);
    } else {
      await supabase.from("user_career_interests").insert({ user_id: session.user.id, career_path_id: careerPathId });
      setInterested(true);
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={checking || busy}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
        interested ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-muted"
      } ${className}`}
    >
      {interested ? "✓ I'm interested in this" : "I'm interested in this"}
    </button>
  );
}
