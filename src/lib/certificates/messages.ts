// Shared wording so CourseContent.tsx (manual lessons + the catch-up path)
// and QuizRunner.tsx (quiz-lesson completions) show the exact same banner
// for the same outcome, even though each calls evaluateCourseCompletion
// through a different route.
export type CompletionSignal = {
  newlyCompleted: boolean;
  certificateIssued: boolean;
  certificateBlockedReason: "missing_profile_name" | null;
};

export type CompletionBanner = { type: "certificate" | "missing_name" | "completed"; text: string };

export function completionBanner(result: CompletionSignal): CompletionBanner | null {
  if (result.certificateIssued) {
    return { type: "certificate", text: "🎓 You've earned a certificate for this course - view it in your account." };
  }
  if (result.certificateBlockedReason === "missing_profile_name") {
    return { type: "missing_name", text: "You've completed this course! Add your name in Account → Settings to receive your certificate." };
  }
  if (result.newlyCompleted) {
    return { type: "completed", text: "✓ You've completed this course." };
  }
  return null;
}
