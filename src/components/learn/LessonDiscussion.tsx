"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { DiscussionThread } from "@/components/learn/DiscussionThread";

export function LessonDiscussion({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <MessageCircle size={13} aria-hidden="true" />
        {open ? "Hide questions" : "Ask a question"}
      </button>
      {/* Not fetched until opened - avoids firing a query for every lesson on every page load */}
      {open && (
        <div className="mt-3">
          <DiscussionThread
            courseId={courseId}
            lessonId={lessonId}
            pageSize={10}
            composerLabel="Ask a question"
            placeholder="Ask a question about this lesson…"
            emptyLabel="No questions yet for this lesson."
          />
        </div>
      )}
    </div>
  );
}
