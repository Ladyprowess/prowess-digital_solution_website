"use client";

import { useRequireAdmin } from "@/lib/useRequireAdmin";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { status, error } = useRequireAdmin();

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-lg font-semibold text-foreground">You don&rsquo;t have access to this page.</p>
        <p className="text-sm text-muted-foreground">{error || "This area is restricted to Prowess Digital Solutions admins."}</p>
      </div>
    );
  }

  return <>{children}</>;
}
