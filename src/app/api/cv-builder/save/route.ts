import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { validateCvData } from "@/lib/cvBuilder/validate";
import { isFreeCvTemplate, isKnownCvTemplate } from "@/lib/cvBuilder/templates";
import { hasPremiumAccess } from "@/lib/payments/premiumMembership";
import { getActiveCareerPlan, hasCareerToolAccess } from "@/lib/payments/careerTools";

export const runtime = "nodejs";

// Every query below is explicitly scoped to user_id = member.id in the
// query itself, not left to member_cvs's RLS policy alone - this route
// uses the service-role client server-side, which bypasses RLS entirely.
// RLS is the backstop for any future direct-client access, not the only
// check here.

export async function GET(req: Request) {
  const member = await verifyMember(req);
  if (!member) {
    return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const [{ data: cvs, error }, premiumActive, careerPlan] = await Promise.all([
    supabase
      .from("member_cvs")
      .select("id, title, template, data, created_at, updated_at")
      .eq("user_id", member.id)
      .order("updated_at", { ascending: false }),
    hasPremiumAccess({ userId: member.id, email: member.email }),
    getActiveCareerPlan({ userId: member.id, email: member.email }),
  ]);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, cvs: cvs || [], premiumActive, careerPlan, careerAccessActive: Boolean(careerPlan) });
}

export async function POST(req: Request) {
  const member = await verifyMember(req);
  if (!member) {
    return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
  }
  const caller = { userId: member.id, email: member.email };

  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  const title = (typeof body?.title === "string" && body.title.trim()) || "My CV";
  const requestedTemplate = (typeof body?.template === "string" && body.template) || "plain";

  // A template that isn't actually built yet can never be legitimately
  // stored on a row - checked before any entitlement question, since an
  // unknown template is a bad request regardless of who's asking. This is
  // what stops a CV ever ending up with a template value the PDF route can
  // never render for anyone, active member or not.
  if (!isKnownCvTemplate(requestedTemplate)) {
    return NextResponse.json({ ok: false, error: "That template doesn't exist yet." }, { status: 400 });
  }

  const validated = validateCvData(body?.data);
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  if (!id) {
    // Create. A brand-new premium-template CV is itself "creating a new
    // premium thing" - gated the same as the free-tier cap below, not just
    // the cap on its own, so a free member can't sidestep the template gate
    // by only ever creating (never updating into) a premium template.
    // `active` is checked at most once - the template gate and the
    // free-tier cap gate below can both apply to the same request (a
    // second CV using a paid template), and re-running the same two
    // DB-backed access checks a second time in that case would just
    // double the latency for a boolean already known.
    let active: boolean | undefined;
    async function isActive() {
      if (active === undefined) {
        active = await hasPremiumAccess(caller) || await hasCareerToolAccess(caller, "cv_builder");
      }
      return active;
    }

    if (!isFreeCvTemplate(requestedTemplate) && !(await isActive())) {
      return NextResponse.json({ ok: false, error: "Upgrade to Premium Membership to use this template." }, { status: 403 });
    }

    const { count } = await supabase
      .from("member_cvs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", member.id);

    if ((count || 0) >= 1 && !(await isActive())) {
      return NextResponse.json({ ok: false, error: "Upgrade to Premium Membership to save more than one CV." }, { status: 403 });
    }

    const { data: created, error: insertErr } = await supabase
      .from("member_cvs")
      .insert({
        user_id: member.id,
        title,
        template: requestedTemplate,
        data: validated.data,
      })
      .select("id, title, template, data, created_at, updated_at")
      .single();

    if (insertErr || !created) {
      return NextResponse.json({ ok: false, error: insertErr?.message || "Could not save CV." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, cv: created });
  }

  // Update.
  const { data: existing, error: existingErr } = await supabase
    .from("member_cvs")
    .select("id, template")
    .eq("id", id)
    .eq("user_id", member.id)
    .maybeSingle();

  if (existingErr) {
    return NextResponse.json({ ok: false, error: existingErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ ok: false, error: "CV not found." }, { status: 404 });
  }

  // Grandfathering rule: switching THIS CV to a different, non-plain
  // template requires active access right now. Keeping the template
  // unchanged (even if it's already premium) or moving to "plain" is
  // always allowed, active or not - editing content never requires
  // Premium Membership.
  if (requestedTemplate !== existing.template && !isFreeCvTemplate(requestedTemplate)) {
    const active = await hasPremiumAccess({ userId: member.id, email: member.email })
      || await hasCareerToolAccess({ userId: member.id, email: member.email }, "cv_builder");
    if (!active) {
      return NextResponse.json({ ok: false, error: "Upgrade to Premium Membership to switch to this template." }, { status: 403 });
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from("member_cvs")
    .update({
      title,
      template: requestedTemplate,
      data: validated.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", member.id)
    .select("id, title, template, data, created_at, updated_at")
    .single();

  if (updateErr || !updated) {
    return NextResponse.json({ ok: false, error: updateErr?.message || "Could not save CV." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, cv: updated });
}

export async function DELETE(req: Request) {
  const member = await verifyMember(req);
  if (!member) {
    return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id is required." }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: deleted, error } = await supabase
    .from("member_cvs")
    .delete()
    .eq("id", id)
    .eq("user_id", member.id)
    .select("id");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ ok: false, error: "CV not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
