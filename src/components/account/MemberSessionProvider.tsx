"use client";

import { createContext, useContext } from "react";
import { useMemberSession, type MemberProfile } from "@/lib/useMemberSession";

type MemberSessionValue = {
  status: "loading" | "ready" | "signed-out";
  profile: MemberProfile | null;
  email: string | null;
  reload: () => void;
  signOut: () => void;
};

const MemberSessionContext = createContext<MemberSessionValue | null>(null);

// One useMemberSession() call for the whole /account/(dashboard) tree, held
// here instead of in every page - each page would otherwise repeat the
// auth check, the member_profiles fetch, and the claim-purchases POST on
// every navigation between account pages.
export function MemberSessionProvider({ children }: { children: React.ReactNode }) {
  const session = useMemberSession();
  return <MemberSessionContext.Provider value={session}>{children}</MemberSessionContext.Provider>;
}

export function useAccountSession() {
  const ctx = useContext(MemberSessionContext);
  if (!ctx) throw new Error("useAccountSession must be used within MemberSessionProvider");
  return ctx;
}

export type { MemberProfile };
