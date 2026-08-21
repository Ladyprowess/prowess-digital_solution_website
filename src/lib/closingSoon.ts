// Single source of truth for what "closing soon" means, shared across
// content types (jobs, opportunities) so a card's urgency styling and a
// listing's "closing soon" filter/section never disagree about the
// threshold.
export const CLOSING_SOON_DAYS = 7;

export function isClosingSoon(deadlineAt: string | null): boolean {
  if (!deadlineAt) return false;
  const daysLeft = (new Date(deadlineAt).getTime() - Date.now()) / 86_400_000;
  return daysLeft >= 0 && daysLeft <= CLOSING_SOON_DAYS;
}
