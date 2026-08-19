import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { ResourceBody } from "@/components/ResourceBody";
import { supabaseAdmin } from "@/lib/supabase/admin";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ResourceDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  type: string | null;
  resource_type: string | null;
  level: string | null;
  audience: "consumer" | "business" | "both";
  access: "free" | "premium";
  price: number | null;
  price_currency: string | null;
  cover_url: string | null;
  cover_path: string | null;
  resource_skill_map: { skills: { name: string; slug: string } }[];
};

async function getResource(slug: string) {
  const { data } = await supabase
    .from("resources")
    .select("id, slug, title, description, category, type, resource_type, level, audience, access, price, price_currency, cover_url, cover_path, resource_skill_map(skills(name, slug))")
    // published check covers both the legacy is_published-driven rows and
    // the newer status field, kept in sync on every admin write
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  const resource = data as unknown as ResourceDetail | null;
  if (!resource) return null;

  // cover_url is always stored null on real rows - the actual image lives
  // at cover_path in Storage and has to be signed server-side, same as
  // /api/resources already does for the main resources listing.
  if (!resource.cover_url && resource.cover_path) {
    const { data: signed } = await supabaseAdmin().storage
      .from("resource-covers")
      .createSignedUrl(resource.cover_path, 60 * 60);
    resource.cover_url = signed?.signedUrl ?? null;
  }

  return resource;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) return { title: "Resource not found" };
  return {
    title: resource.title,
    description: resource.description?.slice(0, 155) || `${resource.title} on Prowess Digital Solutions.`,
  };
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) return notFound();

  const skills = resource.resource_skill_map?.map((m) => m.skills).filter(Boolean) || [];
  const typeLabel = (resource.resource_type || resource.type || "Resource").toString().replace(/_/g, " ");

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal>
          <Link href="/resources" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80">
            ← All resources
          </Link>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-primary">{typeLabel}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${resource.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {resource.access === "premium" ? `Premium${resource.price ? ` - ${resource.price_currency || "NGN"} ${resource.price}` : ""}` : "Free"}
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{resource.title}</h1>
              {resource.category && <p className="mt-1 text-sm text-muted-foreground">{resource.category}</p>}
            </div>
            <SaveButton itemType="resource" itemId={resource.id} className="flex-shrink-0" />
          </div>

          {resource.cover_url && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resource.cover_url} alt={resource.title} className="w-full object-cover" />
            </div>
          )}

          {resource.description && <p className="mt-6 leading-relaxed text-muted-foreground">{resource.description}</p>}

          {skills.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s.slug} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">{s.name}</span>
              ))}
            </div>
          )}
        </Reveal>

        <ResourceBody resourceId={resource.id} price={resource.price} currency={resource.price_currency} />
      </div>
    </div>
  );
}
