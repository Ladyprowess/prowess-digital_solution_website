"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";

export function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function EmptyState({ text, ctaLabel, ctaHref }: { text: string; ctaLabel: string; ctaHref: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-card text-primary">
        <Inbox size={20} aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
      <Link href={ctaHref} className="mt-3 inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{ctaLabel}</Link>
    </div>
  );
}
