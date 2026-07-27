import Link from "next/link";
import type { ReactNode } from "react";
import Container from "@/components/Container";

type PageAction = {
  label: string;
  href: string;
};

type AgencyPageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  primaryAction?: PageAction;
  secondaryAction?: PageAction;
  proof?: string[];
};

export default function AgencyPageHeader({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  proof = [],
}: AgencyPageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklch, var(--primary) 5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--primary) 5%, transparent) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "linear-gradient(to bottom, #000 0%, transparent 78%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-180px] top-[-260px] h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl"
      />

      <Container>
        <div className="relative grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              {description}
            </p>

            {(primaryAction || secondaryAction) && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {primaryAction && (
                  <Link
                    href={primaryAction.href}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {primaryAction.label}
                  </Link>
                )}
                {secondaryAction && (
                  <Link
                    href={secondaryAction.href}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {secondaryAction.label}
                  </Link>
                )}
              </div>
            )}
          </div>

          {proof.length > 0 && (
            <div className="rounded-lg border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                What you can expect
              </p>
              <div className="mt-4 space-y-3">
                {proof.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <svg
                        aria-hidden="true"
                        className="h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm leading-6 text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
