import type { SupabaseClient } from "@supabase/supabase-js";

// Snapshotted onto every post/reply/review at write time (member_profiles
// has no public read policy - see certificates.learner_name for the same
// pattern). No email fallback: a public discussion board is not the place
// to expose any part of an address the member never chose as a display
// name, so an unset full_name falls back to a neutral literal instead.
export async function resolveAuthorFields(
  supabase: SupabaseClient,
  userId: string
): Promise<{ author_name: string; author_avatar_url: string | null }> {
  const { data } = await supabase
    .from("member_profiles")
    .select("full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  return {
    author_name: data?.full_name || "Community member",
    author_avatar_url: data?.avatar_url || null,
  };
}
