import { NextResponse } from "next/server";
import { verifyMember } from "@/lib/auth/verifyMember";
import { hasEntitlement } from "@/lib/payments/entitlement";
import { evaluateCourseCompletion } from "@/lib/certificates/evaluate";

export const runtime = "nodejs";

// Called after CourseContent.tsx's manual "Mark complete" write succeeds,
// and opportunistically on every course-page load (the catch-up path for
// a learner who already satisfied a course's rules before an admin turned
// on issue_certificate_automatically, or before the rules existed at
// all - idempotent, so calling it repeatedly is safe).
export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params;
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    // Without this, any signed-in member could POST an arbitrary courseId
    // and force an evaluation for a course they never purchased or opened
    // a single lesson in - the evaluator's own ruleset validation prevents
    // a meaningless configuration from ever completing, but doesn't
    // prevent an uninvolved caller from triggering evaluation of a
    // legitimately-configured course they have no relationship to.
    const { entitled, reason } = await hasEntitlement("course", courseId, { userId: member.id, email: member.email });
    if (reason === "not_found") {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    if (!entitled) {
      return NextResponse.json({ ok: false, error: "This content is premium. Purchase or sign in to access it.", premium: true }, { status: 403 });
    }

    const result = await evaluateCourseCompletion(courseId, member.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
