"use client";

import { DiscussionThread } from "@/components/learn/DiscussionThread";

export function CourseDiscussion({ courseId }: { courseId: string }) {
  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-6">
      <h2 className="text-xl font-bold text-foreground">Discussion</h2>
      <div className="mt-5">
        <DiscussionThread
          courseId={courseId}
          lessonId={null}
          pageSize={20}
          composerLabel="Start a discussion"
          placeholder="Ask something or share a thought about this course…"
          emptyLabel="No discussion yet - be the first to start one."
        />
      </div>
    </section>
  );
}
