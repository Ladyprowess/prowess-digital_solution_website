import { NextResponse } from "next/server";
import { verifyMember } from "@/lib/auth/verifyMember";
import { reconcileBadges } from "@/lib/achievements/evaluate";

export const runtime = "nodejs";

// Re-checks badge eligibility with no new activity required - the only
// way a badge published after a learner already qualified for it (e.g.
// they've had 1,000 points for weeks before an admin adds a "500 points"
// badge) ever reaches them. Called once whenever a learner opens their
// Achievements page.
export async function POST(req: Request) {
  try {
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }
    const newBadges = await reconcileBadges(member.id);
    return NextResponse.json({ ok: true, newBadges });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
