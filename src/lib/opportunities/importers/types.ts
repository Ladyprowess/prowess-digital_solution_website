// Opportunities have no company/category concept like jobs do - just an
// organisation name (free text) and a type (internship/scholarship/grant/
// fellowship/competition/freelance) that gets guessed from the text itself,
// since almost no opportunity feed classifies this cleanly on its own.
export type NormalizedOpportunity = {
  externalId: string;
  title: string;
  organisationName: string | null;
  descriptionText: string;
  applyUrl: string;
  locationType: "remote" | "hybrid" | "on_site" | "any";
  country?: string | null;
  city?: string | null;
  tags: string[];
  // The source's own posting date, raw/unparsed - see NormalizedListing in
  // jobs/importers/types.ts for why this stays a passthrough here.
  postedAt?: string | null;
};
