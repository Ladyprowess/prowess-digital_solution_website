// Shared server-side validator for CV data - used by both the save route
// and the PDF route. Never trust the TypeScript type alone; the client can
// submit arbitrary JSON. The limits here are also what keeps
// @react-pdf/renderer from ever being handed a pathological payload -
// extreme length/count is a rendering-cost and layout problem, not just a
// validation nicety.

export type CVPersonalInfo = {
  fullName: string;
  email: string;
  headline?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
};

export type CVExperience = {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
};

export type CVEducation = {
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate: string;
};

export type CVData = {
  personalInfo: CVPersonalInfo;
  summary: string;
  experience: CVExperience[];
  education: CVEducation[];
  skills: string[];
  highlights?: string[];
  extras?: string[];
};

const LIMITS = {
  personalInfoFieldMax: 200,
  summaryMax: 2000,
  experienceMax: 15,
  experienceBulletsMax: 10,
  bulletMax: 300,
  companyTitleMax: 200,
  educationMax: 10,
  educationFieldMax: 200,
  skillsMax: 30,
  skillMax: 40,
  highlightsMax: 6,
  highlightMax: 80,
  extrasMax: 8,
  extraMax: 180,
};

export type ValidationResult = { ok: true; data: CVData } | { ok: false; error: string };

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function optionalString(v: unknown, field: string, max: number): { ok: true; value: string | undefined } | { ok: false; error: string } {
  if (v === undefined || v === null || v === "") return { ok: true, value: undefined };
  if (!isString(v)) return { ok: false, error: `${field} must be text.` };
  if (v.length > max) return { ok: false, error: `${field} is too long (max ${max} characters).` };
  return { ok: true, value: v };
}

export function validateCvData(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "CV data is missing or invalid." };
  }
  const raw = input as Record<string, unknown>;

  const personalInfoRaw = raw.personalInfo;
  if (!personalInfoRaw || typeof personalInfoRaw !== "object") {
    return { ok: false, error: "Personal info is missing." };
  }
  const pi = personalInfoRaw as Record<string, unknown>;

  if (!isString(pi.fullName) || !pi.fullName.trim()) {
    return { ok: false, error: "Full name is required." };
  }
  if (pi.fullName.length > LIMITS.personalInfoFieldMax) {
    return { ok: false, error: `Full name is too long (max ${LIMITS.personalInfoFieldMax} characters).` };
  }
  if (!isString(pi.email) || !pi.email.trim()) {
    return { ok: false, error: "Email is required." };
  }
  if (pi.email.length > LIMITS.personalInfoFieldMax) {
    return { ok: false, error: `Email is too long (max ${LIMITS.personalInfoFieldMax} characters).` };
  }

  const optionalFields: (keyof CVPersonalInfo)[] = ["headline", "phone", "location", "linkedin", "website"];
  const personalInfo: CVPersonalInfo = { fullName: pi.fullName.trim(), email: pi.email.trim() };
  for (const field of optionalFields) {
    const result = optionalString(pi[field], field, LIMITS.personalInfoFieldMax);
    if (!result.ok) return result;
    if (result.value !== undefined) personalInfo[field] = result.value;
  }

  const summaryResult = optionalString(raw.summary, "Summary", LIMITS.summaryMax);
  if (!summaryResult.ok) return summaryResult;
  const summary = summaryResult.value || "";

  const experienceRaw = raw.experience;
  if (experienceRaw !== undefined && !Array.isArray(experienceRaw)) {
    return { ok: false, error: "Experience must be a list." };
  }
  const experienceList = (experienceRaw as unknown[] | undefined) || [];
  if (experienceList.length > LIMITS.experienceMax) {
    return { ok: false, error: `Too many experience entries (max ${LIMITS.experienceMax}).` };
  }
  const experience: CVExperience[] = [];
  for (const entry of experienceList) {
    if (!entry || typeof entry !== "object") return { ok: false, error: "Each experience entry must be an object." };
    const e = entry as Record<string, unknown>;
    const company = isString(e.company) ? e.company : "";
    const title = isString(e.title) ? e.title : "";
    if (company.length > LIMITS.companyTitleMax || title.length > LIMITS.companyTitleMax) {
      return { ok: false, error: `Company/title is too long (max ${LIMITS.companyTitleMax} characters).` };
    }
    const bulletsRaw = e.bullets;
    if (bulletsRaw !== undefined && !Array.isArray(bulletsRaw)) {
      return { ok: false, error: "Experience bullets must be a list." };
    }
    const bulletsList = (bulletsRaw as unknown[] | undefined) || [];
    if (bulletsList.length > LIMITS.experienceBulletsMax) {
      return { ok: false, error: `Too many bullet points on one experience entry (max ${LIMITS.experienceBulletsMax}).` };
    }
    const bullets: string[] = [];
    for (const b of bulletsList) {
      if (!isString(b)) return { ok: false, error: "Each bullet point must be text." };
      if (b.length > LIMITS.bulletMax) return { ok: false, error: `A bullet point is too long (max ${LIMITS.bulletMax} characters).` };
      bullets.push(b);
    }
    experience.push({
      company,
      title,
      startDate: isString(e.startDate) ? e.startDate : "",
      endDate: isString(e.endDate) ? e.endDate : "",
      current: Boolean(e.current),
      bullets,
    });
  }

  const educationRaw = raw.education;
  if (educationRaw !== undefined && !Array.isArray(educationRaw)) {
    return { ok: false, error: "Education must be a list." };
  }
  const educationList = (educationRaw as unknown[] | undefined) || [];
  if (educationList.length > LIMITS.educationMax) {
    return { ok: false, error: `Too many education entries (max ${LIMITS.educationMax}).` };
  }
  const education: CVEducation[] = [];
  for (const entry of educationList) {
    if (!entry || typeof entry !== "object") return { ok: false, error: "Each education entry must be an object." };
    const e = entry as Record<string, unknown>;
    const institution = isString(e.institution) ? e.institution : "";
    const degree = isString(e.degree) ? e.degree : "";
    const field = isString(e.field) ? e.field : undefined;
    if (
      institution.length > LIMITS.educationFieldMax ||
      degree.length > LIMITS.educationFieldMax ||
      (field && field.length > LIMITS.educationFieldMax)
    ) {
      return { ok: false, error: `Education field is too long (max ${LIMITS.educationFieldMax} characters).` };
    }
    education.push({
      institution,
      degree,
      field,
      startDate: isString(e.startDate) ? e.startDate : "",
      endDate: isString(e.endDate) ? e.endDate : "",
    });
  }

  const skillsRaw = raw.skills;
  if (skillsRaw !== undefined && !Array.isArray(skillsRaw)) {
    return { ok: false, error: "Skills must be a list." };
  }
  const skillsList = (skillsRaw as unknown[] | undefined) || [];
  if (skillsList.length > LIMITS.skillsMax) {
    return { ok: false, error: `Too many skills (max ${LIMITS.skillsMax}).` };
  }
  const skills: string[] = [];
  for (const s of skillsList) {
    if (!isString(s)) return { ok: false, error: "Each skill must be text." };
    if (s.length > LIMITS.skillMax) return { ok: false, error: `A skill is too long (max ${LIMITS.skillMax} characters).` };
    skills.push(s);
  }

  const highlightsRaw = raw.highlights;
  if (highlightsRaw !== undefined && !Array.isArray(highlightsRaw)) {
    return { ok: false, error: "Highlights must be a list." };
  }
  const highlightsList = (highlightsRaw as unknown[] | undefined) || [];
  if (highlightsList.length > LIMITS.highlightsMax) {
    return { ok: false, error: `Too many highlights (max ${LIMITS.highlightsMax}).` };
  }
  const highlights: string[] = [];
  for (const h of highlightsList) {
    if (!isString(h)) return { ok: false, error: "Each highlight must be text." };
    if (h.length > LIMITS.highlightMax) return { ok: false, error: `A highlight is too long (max ${LIMITS.highlightMax} characters).` };
    if (h.trim()) highlights.push(h);
  }

  const extrasRaw = raw.extras;
  if (extrasRaw !== undefined && !Array.isArray(extrasRaw)) {
    return { ok: false, error: "Additional information must be a list." };
  }
  const extrasList = (extrasRaw as unknown[] | undefined) || [];
  if (extrasList.length > LIMITS.extrasMax) {
    return { ok: false, error: `Too many additional information entries (max ${LIMITS.extrasMax}).` };
  }
  const extras: string[] = [];
  for (const item of extrasList) {
    if (!isString(item)) return { ok: false, error: "Each additional information entry must be text." };
    if (item.length > LIMITS.extraMax) return { ok: false, error: `An additional information entry is too long (max ${LIMITS.extraMax} characters).` };
    if (item.trim()) extras.push(item);
  }

  return { ok: true, data: { personalInfo, summary, experience, education, skills, highlights, extras } };
}
