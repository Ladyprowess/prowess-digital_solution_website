import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { hasCareerToolAccess } from "@/lib/payments/careerTools";
import { hasPremiumAccess } from "@/lib/payments/premiumMembership";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";

const MAX_PROJECTS = 12;
const MAX_TEXT = 4000;

type Project = { title: string; role?: string; description?: string; link?: string; tags?: string[] };

function validatePortfolio(body: Record<string, unknown>) {
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const headline = typeof body.headline === "string" ? body.headline.trim() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  if (!fullName) return { ok: false as const, error: "Full name is required." };
  if (bio.length > MAX_TEXT) return { ok: false as const, error: `Bio is too long (max ${MAX_TEXT} characters).` };

  const rawProjects = Array.isArray(body.projects) ? body.projects : [];
  if (rawProjects.length > MAX_PROJECTS) return { ok: false as const, error: `Too many projects (max ${MAX_PROJECTS}).` };

  const projects: Project[] = [];
  for (const entry of rawProjects) {
    if (!entry || typeof entry !== "object") return { ok: false as const, error: "Each project must be an object." };
    const p = entry as Record<string, unknown>;
    const title = typeof p.title === "string" ? p.title.trim() : "";
    if (!title) continue;
    projects.push({
      title,
      role: typeof p.role === "string" ? p.role.trim() : "",
      description: typeof p.description === "string" ? p.description.trim().slice(0, MAX_TEXT) : "",
      link: typeof p.link === "string" ? p.link.trim() : "",
      tags: Array.isArray(p.tags) ? p.tags.filter((t): t is string => typeof t === "string").slice(0, 10) : [],
    });
  }

  return { ok: true as const, data: { fullName, headline, bio, projects } };
}

async function getUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const supabase = supabaseAdmin();
  let candidate = slugify(base) || "portfolio";
  let suffix = 1;
  while (true) {
    let q = supabase.from("member_portfolios").select("id").eq("slug", candidate);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
    suffix += 1;
    candidate = `${slugify(base) || "portfolio"}-${suffix}`;
  }
}

export async function GET(req: Request) {
  const member = await verifyMember(req);
  if (!member) {
    return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const [{ data: portfolios, error }, hasAccess] = await Promise.all([
    supabase
      .from("member_portfolios")
      .select("id, slug, full_name, headline, bio, projects, is_public, created_at, updated_at")
      .eq("user_id", member.id)
      .order("updated_at", { ascending: false }),
    hasCareerToolAccess({ userId: member.id, email: member.email }, "portfolio_builder")
      .then((v) => v || hasPremiumAccess({ userId: member.id, email: member.email })),
  ]);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, portfolios: portfolios || [], hasAccess });
}

export async function POST(req: Request) {
  const member = await verifyMember(req);
  if (!member) {
    return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });

  const id = typeof body.id === "string" ? body.id : undefined;
  const isPublic = body.isPublic !== false;
  const requestedSlug = typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug.trim()) : null;

  const validated = validatePortfolio(body);
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  if (!id) {
    // Portfolio Builder has no free tier at all (Pro-only, or Premium
    // Membership) - unlike CV Builder there's nothing to fall back to, so
    // every new portfolio requires active access, full stop.
    const hasAccess = await hasCareerToolAccess({ userId: member.id, email: member.email }, "portfolio_builder")
      || await hasPremiumAccess({ userId: member.id, email: member.email });
    if (!hasAccess) {
      return NextResponse.json({ ok: false, error: "Portfolio Builder needs Pro career access or Premium Membership." }, { status: 403 });
    }

    const slug = await getUniqueSlug(requestedSlug || validated.data.fullName);
    const { data: created, error: insertErr } = await supabase
      .from("member_portfolios")
      .insert({
        user_id: member.id,
        slug,
        full_name: validated.data.fullName,
        headline: validated.data.headline,
        bio: validated.data.bio,
        projects: validated.data.projects,
        is_public: isPublic,
      })
      .select("id, slug, full_name, headline, bio, projects, is_public, created_at, updated_at")
      .single();

    if (insertErr || !created) {
      return NextResponse.json({ ok: false, error: insertErr?.message || "Could not save portfolio." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, portfolio: created });
  }

  // Update - editing an already-created portfolio is always allowed,
  // active access or not, same grandfathering principle used everywhere
  // else in this feature set (CV Builder/CV templates): access gates
  // creating something new, never editing what you already made.
  const { data: existing, error: existingErr } = await supabase
    .from("member_portfolios")
    .select("id, slug")
    .eq("id", id)
    .eq("user_id", member.id)
    .maybeSingle();

  if (existingErr) return NextResponse.json({ ok: false, error: existingErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ ok: false, error: "Portfolio not found." }, { status: 404 });

  let slug = existing.slug;
  if (requestedSlug && requestedSlug !== existing.slug) {
    slug = await getUniqueSlug(requestedSlug, existing.id);
  }

  const { data: updated, error: updateErr } = await supabase
    .from("member_portfolios")
    .update({
      slug,
      full_name: validated.data.fullName,
      headline: validated.data.headline,
      bio: validated.data.bio,
      projects: validated.data.projects,
      is_public: isPublic,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", member.id)
    .select("id, slug, full_name, headline, bio, projects, is_public, created_at, updated_at")
    .single();

  if (updateErr || !updated) {
    return NextResponse.json({ ok: false, error: updateErr?.message || "Could not save portfolio." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, portfolio: updated });
}

export async function DELETE(req: Request) {
  const member = await verifyMember(req);
  if (!member) {
    return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id is required." }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: deleted, error } = await supabase
    .from("member_portfolios")
    .delete()
    .eq("id", id)
    .eq("user_id", member.id)
    .select("id");

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!deleted || deleted.length === 0) return NextResponse.json({ ok: false, error: "Portfolio not found." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
