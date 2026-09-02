"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ReportButton } from "@/components/learn/ReportButton";

const REPLIES_PAGE_SIZE = 10;

type Post = { id: string; user_id: string; author_name: string; body: string; created_at: string };
type Reply = { id: string; user_id: string; author_name: string; body: string; created_at: string };

function timeLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function RepliesPanel({ postId, userId, signedIn }: { postId: string; userId: string | null; signedIn: boolean }) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (offset: number) => {
    const { data } = await supabase
      .from("discussion_replies")
      .select("id, user_id, author_name, body, created_at")
      .eq("post_id", postId)
      .eq("status", "visible")
      .order("created_at", { ascending: true })
      .range(offset, offset + REPLIES_PAGE_SIZE - 1);
    return data || [];
  }, [postId]);

  async function open() {
    if (loaded) return;
    const first = await load(0);
    setReplies(first);
    setHasMore(first.length === REPLIES_PAGE_SIZE);
    setLoaded(true);
  }

  async function loadMore() {
    const next = await load(replies.length);
    setReplies((prev) => [...prev, ...next]);
    setHasMore(next.length === REPLIES_PAGE_SIZE);
  }

  async function submitReply() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSending(false); return; }

    const res = await fetch(`/api/community/discussions/${postId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ body: trimmed }),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: "Something went wrong." }));

    setSending(false);
    if (!res.ok) { setError(res.error || "Something went wrong."); return; }
    setBody("");
    const first = await load(0);
    setReplies(first);
    setHasMore(first.length === REPLIES_PAGE_SIZE);
    setLoaded(true);
  }

  async function selfDeleteReply(replyId: string) {
    await supabase.from("discussion_replies").update({ status: "deleted_by_author" }).eq("id", replyId);
    const first = await load(0);
    setReplies(first);
  }

  useEffect(() => { (async () => { await open(); })(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-3 space-y-3 border-l-2 border-border pl-4">
      {replies.map((r) => (
        <div key={r.id} className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-foreground">{r.author_name} <span className="ml-1 font-normal text-muted-foreground">{timeLabel(r.created_at)}</span></p>
            <p className="mt-0.5 text-sm text-muted-foreground">{r.body}</p>
          </div>
          {signedIn && r.user_id === userId && (
            <button type="button" onClick={() => selfDeleteReply(r.id)} className="flex-shrink-0 text-xs font-semibold text-muted-foreground hover:text-destructive">Delete</button>
          )}
          {signedIn && r.user_id !== userId && (
            <ReportButton targetType="discussion_reply" targetId={r.id} />
          )}
        </div>
      ))}
      {hasMore && <button type="button" onClick={loadMore} className="text-xs font-semibold text-primary hover:underline">Load more replies</button>}
      {signedIn && (
        <div className="flex items-center gap-2 pt-1">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            placeholder="Write a reply…"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            onKeyDown={(e) => { if (e.key === "Enter") submitReply(); }}
          />
          <button type="button" onClick={submitReply} disabled={sending || !body.trim()} className="flex-shrink-0 text-sm font-semibold text-primary hover:underline disabled:opacity-50">Reply</button>
        </div>
      )}
      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}

export function DiscussionThread({
  courseId,
  lessonId = null,
  pageSize,
  composerLabel,
  placeholder,
  emptyLabel,
}: {
  courseId: string;
  lessonId?: string | null;
  pageSize: number;
  composerLabel: string;
  placeholder: string;
  emptyLabel: string;
}) {
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openReplies, setOpenReplies] = useState<Set<string>>(new Set());

  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async (offset: number) => {
    let q = supabase
      .from("discussion_posts")
      .select("id, user_id, author_name, body, created_at")
      .eq("course_id", courseId)
      .eq("status", "visible");
    q = lessonId ? q.eq("lesson_id", lessonId) : q.is("lesson_id", null);
    const { data } = await q.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);
    return data || [];
  }, [courseId, lessonId, pageSize]);

  const load = useCallback(async () => {
    setLoading(true);
    const first = await loadPosts(0);
    setPosts(first);
    setHasMore(first.length === pageSize);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) { setSignedIn(true); setUserId(session.user.id); }
    setLoading(false);
  }, [loadPosts, pageSize]);

  useEffect(() => { (async () => { await load(); })(); }, [load]);

  async function loadMore() {
    const next = await loadPosts(posts.length);
    setPosts((prev) => [...prev, ...next]);
    setHasMore(next.length === pageSize);
  }

  async function submitPost() {
    const trimmed = newBody.trim();
    if (!trimmed) return;
    setPosting(true);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setPosting(false); return; }

    const res = await fetch("/api/community/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ courseId, lessonId, body: trimmed }),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: "Something went wrong." }));

    setPosting(false);
    if (!res.ok) { setError(res.error || "Something went wrong."); return; }
    setNewBody("");
    load();
  }

  async function selfDeletePost(postId: string) {
    await supabase.from("discussion_posts").update({ status: "deleted_by_author" }).eq("id", postId);
    load();
  }

  function toggleReplies(postId: string) {
    setOpenReplies((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  }

  return (
    <div>
      {signedIn ? (
        <div>
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            maxLength={4000}
            rows={3}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
          />
          {error && <p className="mt-2 text-sm font-semibold text-destructive">{error}</p>}
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={submitPost} disabled={posting || !newBody.trim()} className="inline-flex min-h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {posting ? "Posting…" : composerLabel}
            </button>
          </div>
        </div>
      ) : (
        <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <Link href="/account/login" className="font-semibold text-primary hover:underline">Sign in</Link> to join the discussion.
        </p>
      )}

      <div className="mt-5 space-y-5">
        {!loading && posts.length === 0 && <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
        {posts.map((p) => (
          <div key={p.id} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{p.author_name}</p>
                <p className="text-xs text-muted-foreground">{timeLabel(p.created_at)}</p>
              </div>
              {signedIn && p.user_id === userId && (
                <button type="button" onClick={() => selfDeletePost(p.id)} className="flex-shrink-0 text-xs font-semibold text-muted-foreground hover:text-destructive">Delete</button>
              )}
              {signedIn && p.user_id !== userId && (
                <ReportButton targetType="discussion_post" targetId={p.id} />
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-foreground">{p.body}</p>
            <button type="button" onClick={() => toggleReplies(p.id)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              <MessageCircle size={13} aria-hidden="true" />
              {openReplies.has(p.id) ? "Hide replies" : "View replies"}
            </button>
            {openReplies.has(p.id) && <RepliesPanel postId={p.id} userId={userId} signedIn={signedIn} />}
          </div>
        ))}
      </div>

      {hasMore && <button type="button" onClick={loadMore} className="mt-5 text-sm font-semibold text-primary hover:underline">Load more</button>}
    </div>
  );
}
