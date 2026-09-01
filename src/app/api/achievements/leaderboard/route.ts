import { NextResponse } from "next/server";
import { verifyMember } from "@/lib/auth/verifyMember";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const TOP_N = 10;

export async function GET(req: Request) {
  try {
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const supabase = supabaseAdmin();

    // Secondary sort key (user_id) purely so tied learners don't visually
    // reorder between requests - ties still share the same rank below.
    const { data: rows } = await supabase
      .from("learner_stats")
      .select("user_id, total_points")
      .order("total_points", { ascending: false })
      .order("user_id", { ascending: true });

    const allRows = rows || [];
    const userIds = allRows.map((r) => r.user_id);
    const { data: profiles } = userIds.length
      ? await supabase.from("member_profiles").select("id, full_name").in("id", userIds)
      : { data: [] };
    const nameById = new Map((profiles || []).map((p) => [p.id, p.full_name]));

    // Never expose email on a cross-user leaderboard - only a display name,
    // falling back to a generic label rather than any identifying contact info.
    const top = allRows.slice(0, TOP_N).map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      name: nameById.get(r.user_id) || "A learner",
      totalPoints: r.total_points,
    }));

    const selfIndex = allRows.findIndex((r) => r.user_id === member.id);
    const self = selfIndex === -1
      ? null
      : {
          // Standard competition ranking: count of strictly-higher scores + 1,
          // so tied learners share a rank.
          rank: allRows.filter((r) => r.total_points > allRows[selfIndex].total_points).length + 1,
          totalPoints: allRows[selfIndex].total_points,
        };

    return NextResponse.json({ ok: true, top, self });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
