"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Client-side guard for the content-CMS admin pages (/admin/work,
// /admin/opportunities, /admin/learn, /admin/resources). This only decides
// whether to show the page -- the real security boundary is the
// admin_full_access RLS policy (supabase/admin_content_policies.sql), which
// checks profiles.role = 'admin' at the database level regardless of what
// the client does.
export function useRequireAdmin() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "denied">("loading");
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        setStatus("denied");
        return;
      }
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong checking access.");
      setStatus("denied");
    }
  }, [router]);

  useEffect(() => { check(); }, [check]);

  return { status, error };
}
