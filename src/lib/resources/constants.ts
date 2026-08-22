// Single source of truth for resource_type/use_case values -- shared by
// the admin form (src/app/admin/resources/page.tsx) and the public
// /resources listing page, so they can't silently drift out of sync.

export const RESOURCE_TYPES = ["article", "guide", "checklist", "template", "ebook", "video", "podcast", "external_course", "business_guide"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

// video has its own dedicated /videos experience -- never offered as a
// type filter on the public resources page.
export const PUBLIC_RESOURCE_TYPES = RESOURCE_TYPES.filter((t) => t !== "video");

export const USE_CASES = ["learn", "template", "checklist", "business_guide", "career", "read"] as const;
export type UseCase = (typeof USE_CASES)[number];

export const USE_CASE_LABELS: Record<UseCase, string> = {
  learn: "I want to learn something",
  template: "I need a template",
  checklist: "I need a checklist",
  business_guide: "I want a business guide",
  career: "I need career resources",
  read: "I want something to read",
};

// Short supporting copy for the "Browse by need" tiles -- the label above
// is reused verbatim from USE_CASE_LABELS so admin and public language
// always match.
export const USE_CASE_DESCRIPTIONS: Record<UseCase, string> = {
  learn: "Guides and articles that teach a real skill or concept.",
  template: "Ready-to-use templates you can fill in and start with.",
  checklist: "Step-by-step checklists to track your progress.",
  business_guide: "In-depth guides for founders and business owners.",
  career: "Resources to help you plan and grow your career.",
  read: "Articles and ebooks worth reading end to end.",
};
