export const CV_TEMPLATES = [
  {
    key: "plain",
    label: "Clean Starter",
    audience: "First CVs, entry roles, general applications",
    access: "free",
    tone: "Simple, readable, ATS friendly",
  },
  {
    key: "modern",
    label: "Modern Professional",
    audience: "Operations, admin, customer success, general business roles",
    access: "paid",
    tone: "Confident with a polished header",
  },
  {
    key: "executive",
    label: "Executive Profile",
    audience: "Managers, senior specialists, founders, consultants",
    access: "paid",
    tone: "Structured, senior, achievement led",
  },
  {
    key: "compact",
    label: "Compact One Page",
    audience: "Applicants with strong experience who need a tight format",
    access: "paid",
    tone: "Dense, practical, easy to scan",
  },
  {
    key: "creative",
    label: "Creative Portfolio",
    audience: "Design, content, marketing, brand and social media roles",
    access: "paid",
    tone: "Stylish without hurting readability",
  },
  {
    key: "tech",
    label: "Tech Specialist",
    audience: "Developers, analysts, product, data and IT roles",
    access: "paid",
    tone: "Skills first, project friendly",
  },
  {
    key: "academic",
    label: "Academic Track",
    audience: "Research, teaching, scholarships, graduate school",
    access: "paid",
    tone: "Formal, credential focused",
  },
  {
    key: "graduate",
    label: "Graduate Launch",
    audience: "Students, NYSC, internships and early career applicants",
    access: "paid",
    tone: "Potential, education and transferable skills",
  },
  {
    key: "consulting",
    label: "Consulting Case",
    audience: "Strategy, business analysis, finance and consulting roles",
    access: "paid",
    tone: "Impact metrics and clean hierarchy",
  },
] as const;

export const KNOWN_CV_TEMPLATES = CV_TEMPLATES.map((template) => template.key);
export type KnownCvTemplate = (typeof KNOWN_CV_TEMPLATES)[number];

export function isKnownCvTemplate(template: string): boolean {
  return (KNOWN_CV_TEMPLATES as readonly string[]).includes(template);
}

export function isFreeCvTemplate(template: string): boolean {
  return CV_TEMPLATES.find((item) => item.key === template)?.access === "free";
}
