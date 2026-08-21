"use client";

import Link from "next/link";
import { SaveButton } from "@/components/SaveButton";
import { colorForSeed } from "@/lib/listingColors";
import { isClosingSoon } from "@/lib/closingSoon";

export type OpportunityCardData = {
  id: string;
  slug: string;
  title: string;
  organisation_name: string | null;
  organisation_logo_url: string | null;
  type: string | null;
  location_type: "remote" | "hybrid" | "on_site" | "any";
  country: string | null;
  city: string | null;
  eligibility_summary: string | null;
  eligible_locations: string[] | null;
  benefit_tags: string[] | null;
  skills: { slug: string; name: string }[];
  deadline_at: string | null;
  featured: boolean;
};

const MAX_BENEFITS = 3;
const MAX_SKILLS = 5;

function locationLabel(o: OpportunityCardData) {
  if (o.location_type === "any") return "Global";
  if (o.location_type === "remote") return "Remote";
  return [o.location_type === "hybrid" ? "Hybrid" : "On-site", o.city, o.country].filter(Boolean).join(" · ");
}

export function OpportunityCard({ opportunity: o }: { opportunity: OpportunityCardData }) {
  const color = colorForSeed(o.type || "Opportunity");
  const benefits = o.benefit_tags || [];
  const shownBenefits = benefits.slice(0, MAX_BENEFITS);
  const extraBenefits = benefits.length > MAX_BENEFITS ? benefits.length - MAX_BENEFITS : 0;
  const skills = o.skills.slice(0, MAX_SKILLS);
  const extraSkills = o.skills.length > MAX_SKILLS ? o.skills.length - MAX_SKILLS : 0;
  const closingSoon = isClosingSoon(o.deadline_at);

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${color.ring}`}>
      <span className={`absolute inset-x-0 top-0 h-1 ${color.bar} opacity-70 transition group-hover:opacity-100`} />

      <Link href={`/opportunities/${o.slug}`} className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2 pr-10">
          {o.organisation_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={o.organisation_logo_url} alt="" className="h-11 w-11 flex-shrink-0 rounded-xl border border-border object-cover" />
          ) : (
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${color.chip}`}>
              {(o.organisation_name || o.title).slice(0, 2).toUpperCase()}
            </div>
          )}
          {o.featured && (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">Featured</span>
          )}
        </div>

        {o.type && (
          <span className={`mt-4 w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${color.chip}`}>
            {o.type}
          </span>
        )}

        <h3 className="mt-3 text-lg font-bold leading-snug text-foreground">{o.title}</h3>
        {o.organisation_name && <p className="mt-1 text-sm text-muted-foreground">{o.organisation_name}</p>}
        {o.eligibility_summary && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{o.eligibility_summary}</p>}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span>{locationLabel(o)}</span>
          {o.eligible_locations && o.eligible_locations.length > 0 && (
            <span>Eligible: {o.eligible_locations.join(", ")}</span>
          )}
        </div>

        {shownBenefits.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shownBenefits.map((b) => (
              <span key={b} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${color.tag}`}>{b}</span>
            ))}
            {extraBenefits > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">+{extraBenefits} benefits</span>
            )}
          </div>
        )}

        {skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s.slug} className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{s.name}</span>
            ))}
            {extraSkills > 0 && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">+{extraSkills} more</span>
            )}
          </div>
        )}

        {o.deadline_at && (
          <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className={closingSoon ? "flex items-center gap-1 font-semibold text-amber-600" : ""}>
              {closingSoon && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
              Deadline: {new Date(o.deadline_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        )}
      </Link>

      <div className="absolute right-4 top-4" onClick={(e) => e.stopPropagation()}>
        <SaveButton itemType="opportunity" itemId={o.id} iconOnly className="bg-card/95 shadow-sm backdrop-blur" />
      </div>
    </div>
  );
}
