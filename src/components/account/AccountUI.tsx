"use client";

import Link from "next/link";

export function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
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
    <div className="rounded-lg border border-dashed border-border p-5 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link href={ctaHref} className="mt-2 inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{ctaLabel}</Link>
    </div>
  );
}
