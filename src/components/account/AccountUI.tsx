"use client";

import Link from "next/link";

export function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function EmptyState({ text, ctaLabel, ctaHref }: { text: string; ctaLabel: string; ctaHref: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-5 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link href={ctaHref} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">{ctaLabel} →</Link>
    </div>
  );
}
