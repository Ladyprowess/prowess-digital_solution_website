const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

// Trims and bounds a submitted post/review/reply body. Returns null for
// anything that isn't a non-blank string within maxLength - the caller
// treats null as a 400, the DB check constraints are only the backstop.
export function normalizeBody(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > maxLength) return null;
  return trimmed;
}
