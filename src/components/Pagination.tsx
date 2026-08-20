export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-muted"
      >
        ← Previous
      </button>
      <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40 hover:bg-muted"
      >
        Next →
      </button>
    </div>
  );
}
