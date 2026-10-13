"use client";

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-border bg-card p-6 text-center">
      <p className="text-sm text-foreground">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 min-h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        Try again
      </button>
    </div>
  );
}
