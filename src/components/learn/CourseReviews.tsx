"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ReportButton } from "@/components/learn/ReportButton";

const PAGE_SIZE = 20;

type Review = {
  id: string;
  user_id: string;
  author_name: string;
  rating: number;
  body: string | null;
  created_at: string;
};

type OwnReview = { id: string; rating: number; body: string | null; status: "visible" | "deleted_by_author" | "removed_by_moderator" };

function Stars({ value, size = 15 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= Math.round(value) ? "currentColor" : "none"} strokeWidth={1.75} aria-hidden="true" />
      ))}
    </span>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded">
          <Star size={22} fill={n <= value ? "currentColor" : "none"} strokeWidth={1.75} aria-hidden="true" />
        </button>
      ))}
    </span>
  );
}

export function CourseReviews({ courseId }: { courseId: string }) {
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [ownReview, setOwnReview] = useState<OwnReview | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [bodyInput, setBodyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadReviews = useCallback(async (offset: number) => {
    const { data } = await supabase
      .from("course_reviews")
      .select("id, user_id, author_name, rating, body, created_at")
      .eq("course_id", courseId)
      .eq("status", "visible")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    return data || [];
  }, [courseId]);

  const load = useCallback(async () => {
    setLoading(true);

    const [{ data: ratingRows }, firstPage] = await Promise.all([
      supabase.from("course_reviews").select("rating").eq("course_id", courseId).eq("status", "visible"),
      loadReviews(0),
    ]);

    const ratings = (ratingRows || []).map((r) => r.rating);
    setReviewCount(ratings.length);
    setAvgRating(ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null);
    setReviews(firstPage);
    setHasMore(firstPage.length === PAGE_SIZE);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setSignedIn(true);
      setUserId(session.user.id);
      const [{ data: completion }, { data: mine }] = await Promise.all([
        supabase.from("course_completions").select("id").eq("course_id", courseId).maybeSingle(),
        supabase.from("course_reviews").select("id, rating, body, status").eq("course_id", courseId).eq("user_id", session.user.id).maybeSingle(),
      ]);
      setCompleted(!!completion);
      setOwnReview(mine as OwnReview | null);
    }

    setLoading(false);
  }, [courseId, loadReviews]);

  useEffect(() => { (async () => { await load(); })(); }, [load]);

  async function loadMore() {
    const next = await loadReviews(reviews.length);
    setReviews((prev) => [...prev, ...next]);
    setHasMore(next.length === PAGE_SIZE);
  }

  function startEditing() {
    setRatingInput(ownReview?.rating || 5);
    setBodyInput(ownReview?.body || "");
    setError("");
    setEditing(true);
  }

  async function submit() {
    setSaving(true);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    const res = await fetch("/api/community/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ courseId, rating: ratingInput, body: bodyInput.trim() || null }),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: "Something went wrong." }));

    setSaving(false);
    if (!res.ok) { setError(res.error || "Something went wrong."); return; }
    setEditing(false);
    load();
  }

  async function selfDelete() {
    if (!ownReview) return;
    await supabase.from("course_reviews").update({ status: "deleted_by_author" }).eq("id", ownReview.id);
    load();
  }

  async function selfUndelete() {
    if (!ownReview) return;
    await supabase.from("course_reviews").update({ status: "visible" }).eq("id", ownReview.id);
    load();
  }

  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">Reviews</h2>
        {avgRating !== null && (
          <div className="flex items-center gap-2">
            <Stars value={avgRating} size={17} />
            <span className="text-sm font-semibold text-foreground">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({reviewCount} {reviewCount === 1 ? "review" : "reviews"})</span>
          </div>
        )}
      </div>

      {!signedIn && (
        <p className="mt-5 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <Link href="/account/login" className="font-semibold text-primary hover:underline">Sign in</Link> to leave a review once you&apos;ve completed this course.
        </p>
      )}

      {signedIn && !completed && !ownReview && (
        <p className="mt-5 rounded-lg bg-muted p-4 text-sm text-muted-foreground">Complete this course to leave a review.</p>
      )}

      {signedIn && ownReview?.status === "removed_by_moderator" && (
        <p className="mt-5 rounded-lg bg-muted p-4 text-sm text-muted-foreground">Your review on this course was removed and can&apos;t be resubmitted.</p>
      )}

      {signedIn && ownReview?.status === "deleted_by_author" && (
        <div className="mt-5 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          You deleted your review on this course.{" "}
          <button type="button" onClick={selfUndelete} className="font-semibold text-primary hover:underline">Restore it</button>
        </div>
      )}

      {signedIn && completed && !editing && (!ownReview || ownReview.status === "visible") && (
        <div className="mt-5">
          {ownReview?.status === "visible" ? (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={startEditing} className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Edit your review</button>
              <button type="button" onClick={selfDelete} className="text-sm font-semibold text-muted-foreground hover:text-destructive">Delete</button>
            </div>
          ) : (
            <button type="button" onClick={startEditing} className="inline-flex min-h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Leave a review</button>
          )}
        </div>
      )}

      {editing && (
        <div className="mt-5 rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your rating</p>
          <div className="mt-2"><StarInput value={ratingInput} onChange={setRatingInput} /></div>
          <textarea
            value={bodyInput}
            onChange={(e) => setBodyInput(e.target.value)}
            maxLength={4000}
            rows={4}
            placeholder="Share what you thought of this course (optional)"
            className="mt-3 w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground"
          />
          {error && <p className="mt-2 text-sm font-semibold text-destructive">{error}</p>}
          <div className="mt-3 flex items-center gap-3">
            <button type="button" onClick={submit} disabled={saving} className="inline-flex min-h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {saving ? "Saving…" : "Submit review"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {!loading && reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{r.author_name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>
              </div>
              {signedIn && r.user_id !== userId && (
                <ReportButton targetType="course_review" targetId={r.id} />
              )}
            </div>
            {r.body && <p className="mt-2 text-sm leading-6 text-muted-foreground">{r.body}</p>}
          </div>
        ))}
      </div>

      {hasMore && (
        <button type="button" onClick={loadMore} className="mt-5 text-sm font-semibold text-primary hover:underline">Load more reviews</button>
      )}
    </section>
  );
}
