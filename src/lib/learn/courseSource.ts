// Where a course actually lives.
//
// "prowess" is a course we host and teach ourselves: modules, lessons,
// progress, the lot. Anything else is curated - a real course page on our
// site, in our layout, whose lessons sit on the creator's own platform and
// which sends the learner there to take it. We never sell a curated course:
// we do not deliver it, so charging for it would be selling somebody else's
// work.

export const COURSE_SOURCES = ["prowess", "youtube", "external"] as const;
export type CourseSource = (typeof COURSE_SOURCES)[number];

export const COURSE_SOURCE_LABELS: Record<CourseSource, string> = {
  prowess: "Prowess Digital Solutions",
  youtube: "YouTube",
  external: "External",
};

export const COURSE_SOURCE_HINTS: Record<CourseSource, string> = {
  prowess: "We host and teach it. Add modules and lessons after saving.",
  youtube: "A course on YouTube. Learners read the page here, then watch it there.",
  external: "A course anywhere else - Coursera, Udemy, a creator's own site.",
};

export function asCourseSource(value: string | null | undefined): CourseSource {
  return COURSE_SOURCES.includes(value as CourseSource) ? (value as CourseSource) : "prowess";
}

/** True when the lessons live somewhere else and we link out to them. */
export function isCuratedCourse(source: string | null | undefined) {
  return asCourseSource(source) !== "prowess";
}

/**
 * Who to credit on the card and page. The creator's own name wins; the
 * platform is the fallback so a curated course is never unattributed.
 */
export function creatorCredit(source: string | null | undefined, creatorName: string | null | undefined) {
  if (!isCuratedCourse(source)) return null;
  return creatorName?.trim() || COURSE_SOURCE_LABELS[asCourseSource(source)];
}
