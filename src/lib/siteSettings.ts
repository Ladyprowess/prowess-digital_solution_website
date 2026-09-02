import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type SiteSettings = {
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
  socialLinkedin: string | null;
  socialInstagram: string | null;
  socialTwitter: string | null;
  seoTitle: string;
  seoDescription: string;
};

// Same values as the original hardcoded contact/socials/metadata - used
// whenever site_settings hasn't been migrated yet, has no row, or the
// request fails, so a DB hiccup never breaks the footer or page metadata.
const FALLBACK: SiteSettings = {
  contactEmail: "info@prowessdigitalsolutions.com",
  contactPhone: "+2348162174443",
  contactLocation: "Remote, worldwide. Based in Nigeria.",
  socialLinkedin: "https://www.linkedin.com/company/prowess-digital-solutions",
  socialInstagram: "https://www.instagram.com/prowessdigitalsolutions",
  socialTwitter: "https://twitter.com/prowessDS",
  seoTitle: "Prowess Digital Solutions | Discover Opportunities, Learn Skills, Build Your Career",
  seoDescription:
    "Prowess Digital Solutions helps people worldwide discover jobs and opportunities, learn useful skills, build their careers with free tools, and connect through events and community.",
};

// Deduped per request (React's cache()) so generateMetadata() and the
// layout body can both call this without doubling the query.
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("contact_email, contact_phone, contact_location, social_linkedin, social_instagram, social_twitter, seo_title, seo_description")
      .eq("id", 1)
      .maybeSingle();

    // No row at all (table not migrated yet) - use the defaults wholesale.
    // Once a row exists, a null field means an admin deliberately cleared
    // it (e.g. "leave blank to hide that social icon" in /admin/settings),
    // so it must be respected as empty, not silently replaced with the
    // original hardcoded value.
    if (!data) return FALLBACK;

    return {
      contactEmail: data.contact_email || FALLBACK.contactEmail,
      contactPhone: data.contact_phone || FALLBACK.contactPhone,
      contactLocation: data.contact_location || FALLBACK.contactLocation,
      socialLinkedin: data.social_linkedin ?? null,
      socialInstagram: data.social_instagram ?? null,
      socialTwitter: data.social_twitter ?? null,
      seoTitle: data.seo_title || FALLBACK.seoTitle,
      seoDescription: data.seo_description || FALLBACK.seoDescription,
    };
  } catch {
    return FALLBACK;
  }
});
