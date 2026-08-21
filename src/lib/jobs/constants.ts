// Single source of truth for what "closing soon" means, shared by the job
// card (urgency styling) and the listing filter facet, so the two never
// disagree about the threshold.
export const CLOSING_SOON_DAYS = 7;

export function isClosingSoon(deadlineAt: string | null): boolean {
  if (!deadlineAt) return false;
  const daysLeft = (new Date(deadlineAt).getTime() - Date.now()) / 86_400_000;
  return daysLeft >= 0 && daysLeft <= CLOSING_SOON_DAYS;
}

export const SORT_OPTIONS = [
  { value: "relevant", label: "Most Relevant" },
  { value: "newest", label: "Newest" },
  { value: "deadline", label: "Deadline" },
  { value: "salary_high", label: "Salary: Highest" },
  { value: "salary_low", label: "Salary: Lowest" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const DATE_POSTED_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1", label: "Today" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
] as const;
