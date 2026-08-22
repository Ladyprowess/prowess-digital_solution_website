// Every connector normalizes a source's own shape (JSON API, RSS, whatever)
// into this one shape before it reaches the shared import logic in
// runImport.ts. Adding a new source later (Himalayas, Jobicy, etc.) means
// writing one function like fetchRemoteOkListings that returns this type -
// runImport.ts, category/type/skill matching and dedup stay unchanged.
export type NormalizedListing = {
  externalId: string;
  title: string;
  companyName: string;
  companyLogoUrl?: string | null;
  descriptionText: string;
  applyUrl: string;
  locationType: "remote" | "hybrid" | "on_site";
  country?: string | null;
  city?: string | null;
  tags: string[];
  // The source's own posting date, in whatever raw format it exposes
  // (ISO string, RFC-822 pubDate, etc.) - runImport.ts is the only place
  // that parses/validates it, so connectors just pass through whatever the
  // feed gives them. Null/absent when a source genuinely doesn't expose one.
  postedAt?: string | null;
};
