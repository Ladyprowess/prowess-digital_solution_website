export { CLOSING_SOON_DAYS, isClosingSoon } from "@/lib/closingSoon";

// No separate "Closing Soon" sort entry - it's already a filter facet and
// its own homepage-style section, so a third redundant sort option would
// just duplicate those instead of adding anything.
export const SORT_OPTIONS = [
  { value: "relevant", label: "Most Relevant" },
  { value: "newest", label: "Newest" },
  { value: "deadline", label: "Deadline" },
  { value: "featured", label: "Featured" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const FUNDING_TYPES = [
  { value: "fully_funded", label: "Fully funded" },
  { value: "partially_funded", label: "Partially funded" },
  { value: "stipend", label: "Stipend" },
  { value: "scholarship", label: "Scholarship" },
  { value: "no_funding", label: "No funding" },
  { value: "other", label: "Other" },
] as const;

export const APPLICATION_COSTS = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
] as const;

export const DEADLINE_WINDOWS = [
  { value: "", label: "Any" },
  { value: "today", label: "Closing today" },
  { value: "week", label: "Closing this week" },
  { value: "month", label: "Closing this month" },
  { value: "no_deadline", label: "No deadline / open-ended" },
] as const;
