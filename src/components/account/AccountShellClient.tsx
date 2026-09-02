"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  BookOpen,
  Bookmark,
  CreditCard,
  FileText,
  Grid2X2,
  LogOut,
  Map,
  Menu,
  Settings,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import { MemberSessionProvider, useAccountSession } from "@/components/account/MemberSessionProvider";

const NAV_GROUPS: {
  label: string;
  items: { label: string; href: string; icon: LucideIcon }[];
}[] = [
  {
    label: "",
    items: [{ label: "Overview", href: "/account", icon: Grid2X2 }],
  },
  {
    label: "Membership",
    items: [{ label: "Membership", href: "/account/membership", icon: BadgeCheck }],
  },
  {
    label: "Workspace",
    items: [
      { label: "Purchases", href: "/account/purchases", icon: CreditCard },
      { label: "CVs", href: "/account/cvs", icon: FileText },
      { label: "Saved", href: "/account/saved", icon: Bookmark },
      { label: "Learning", href: "/account/learning", icon: BookOpen },
      { label: "Certificates", href: "/account/certificates", icon: Award },
      { label: "Achievements", href: "/account/achievements", icon: Star },
      { label: "Career Interests", href: "/account/interests", icon: Map },
    ],
  },
  {
    label: "",
    items: [{ label: "Settings", href: "/account/settings", icon: Settings }],
  },
];

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
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {initials(profile?.full_name || null, email)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Account</p>
            <p className="truncate text-base font-bold text-foreground">{profile?.full_name || "My Account"}</p>
          </div>
        </div>
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
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon size={17} aria-hidden="true" className="flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/70 px-3 py-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials(profile?.full_name || null, email)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{profile?.full_name || "My Account"}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <Link href="/" onClick={onNavigate} className="mt-2 flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to site
        </Link>
        <button
          type="button"
          onClick={() => { onNavigate?.(); signOut(); }}
          className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <LogOut size={17} aria-hidden="true" />
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
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm" aria-busy="true">
          <div className="h-11 w-11 rounded-lg bg-muted" />
          <div className="mt-5 h-5 w-40 rounded bg-muted" />
          <div className="mt-3 h-3 w-full rounded bg-muted" />
          <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
        </div>
      </div>
    );
  }
  if (status === "signed-out") return null;

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-card/95 backdrop-blur lg:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Account</p>
          <p className="text-sm font-bold text-foreground">My Account</p>
        </div>
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
          className="min-h-10 rounded-lg border border-border bg-card px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-80 max-w-[86vw] bg-card shadow-xl">
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content */}
      <main className="lg:pl-72">
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
