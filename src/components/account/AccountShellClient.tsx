"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MemberSessionProvider, useAccountSession } from "@/components/account/MemberSessionProvider";

const NAV_GROUPS = [
  {
    label: "",
    items: [{ label: "Overview", href: "/account", icon: "grid" }],
  },
  {
    label: "Membership",
    items: [{ label: "Membership", href: "/account/membership", icon: "star" }],
  },
  {
    label: "My Stuff",
    items: [
      { label: "My Purchases", href: "/account/purchases", icon: "card" },
      { label: "My CVs", href: "/account/cvs", icon: "file" },
      { label: "Saved", href: "/account/saved", icon: "bookmark" },
      { label: "Learning", href: "/account/learning", icon: "book" },
      { label: "Certificates", href: "/account/certificates", icon: "award" },
      { label: "Career Interests", href: "/account/interests", icon: "path" },
    ],
  },
  {
    label: "",
    items: [{ label: "Settings", href: "/account/settings", icon: "settings" }],
  },
] as const;

const ICONS: Record<string, string> = {
  grid: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  card: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z",
  bookmark: "M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z",
  book: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  path: "M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z",
  settings: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a7.712 7.712 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
  file: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  star: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
  award: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
};

function NavIcon({ name }: { name: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="flex-shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[name] || ICONS.grid} />
    </svg>
  );
}

function initials(name: string | null, email: string | null): string {
  const source = (name || email || "?").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { profile, email, signOut } = useAccountSession();
  const isActive = (href: string) => (href === "/account" ? pathname === "/account" : pathname.startsWith(href));

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Prowess Digital Solutions</p>
        <p className="mt-1 text-lg font-bold text-foreground">My Account</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {NAV_GROUPS.map((group, i) => (
          <div key={group.label || `top-${i}`}>
            {group.label && (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{group.label}</p>
            )}
            <div className={group.label ? "mt-2 space-y-1" : "space-y-1"}>
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials(profile?.full_name || null, email)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{profile?.full_name || "My Account"}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <Link href="/" onClick={onNavigate} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to site
        </Link>
        <button
          type="button"
          onClick={() => { onNavigate?.(); signOut(); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0110.5 3h6a2.25 2.25 0 012.25 2.25v13.5a2.25 2.25 0 01-2.25 2.25h-6a2.25 2.25 0 01-2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}

function AccountShell({ children }: { children: React.ReactNode }) {
  const { status } = useAccountSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your account…</p>
      </div>
    );
  }
  if (status === "signed-out") return null;

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card lg:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Prowess Digital Solutions</p>
          <p className="text-sm font-bold text-foreground">My Account</p>
        </div>
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-xl border border-border bg-card p-2.5 text-foreground"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-card shadow-xl">
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}

export function AccountShellClient({ children }: { children: React.ReactNode }) {
  return (
    <MemberSessionProvider>
      <AccountShell>{children}</AccountShell>
    </MemberSessionProvider>
  );
}
