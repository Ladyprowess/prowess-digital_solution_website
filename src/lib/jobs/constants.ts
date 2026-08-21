// Re-exported from the shared, content-type-agnostic location so existing
// imports of `@/lib/jobs/constants` keep working unchanged - opportunities
// import the same helper directly from `@/lib/closingSoon`.
export { CLOSING_SOON_DAYS, isClosingSoon } from "@/lib/closingSoon";

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
