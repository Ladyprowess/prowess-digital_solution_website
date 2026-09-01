export const KIND_TABS = [
  { value: "", label: "Courses" },
  { value: "video", label: "Videos" },
  { value: "article", label: "Articles" },
  { value: "ebook", label: "Ebooks" },
  { value: "guide", label: "Guides" },
] as const;

export const SORT_OPTIONS = [
  { value: "relevant", label: "Most Relevant" },
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const LEVELS = [
  { value: "", label: "Any level" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

export const ACCESS_OPTIONS = [
  { value: "", label: "Any" },
  { value: "free", label: "Free" },
  { value: "premium", label: "Premium" },
] as const;
