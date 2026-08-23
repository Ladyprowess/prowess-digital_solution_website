"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Shared by BuyButton, MembershipIntakeModal and SkillToBusinessIntakeModal
// (every place that gates paying behind being signed in) - subscribes to
// real auth state changes instead of only checking once on mount/open.
// supabase-js keeps sessions in sync across tabs, so this also catches a
// user who opened a checkout modal signed out, signed in from a *different*
// tab without closing it, then came back - a plain one-shot check tied to
// the modal's open prop never reruns for that case since `open` itself
// never changes value.
export function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSignedIn(!!data.session);
      setChecking(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
      setChecking(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { signedIn, checking };
}
