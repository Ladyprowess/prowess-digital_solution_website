import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { resolveQuizAccess } from "@/lib/quizzes/access";
import { gradeAnswer } from "@/lib/quizzes/grading";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ quizId: string; attemptId: string }> }) {
  try {
    const { quizId, attemptId } = await params;
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const access = await resolveQuizAccess(quizId, { userId: member.id, email: member.email });
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.error, premium: access.premium }, { status: access.status });
    }

    const body = await req.json().catch(() => null);
    const questionId = typeof body?.questionId === "string" ? body.questionId : "";
    const selectedOptionIds = Array.isArray(body?.selectedOptionIds)
      ? body.selectedOptionIds.filter((v: unknown): v is string => typeof v === "string")
      : null;
    const typedAnswer = typeof body?.typedAnswer === "string" ? body.typedAnswer : null;

    if (!questionId) {
      return NextResponse.json({ ok: false, error: "questionId is required." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data: attempt } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, status")
      .eq("id", attemptId)
      .eq("user_id", member.id)
      .maybeSingle();

    if (!attempt || attempt.quiz_id !== quizId) {
      return NextResponse.json({ ok: false, error: "Attempt not found." }, { status: 404 });
    }
    if (attempt.status !== "in_progress") {
      return NextResponse.json({ ok: false, error: "This attempt is already finished." }, { status: 409 });
    }

    // The question must actually belong to THIS attempt (via its frozen
    // snapshot), not just any quiz_questions row that happens to share an
    // id - otherwise a crafted request could grade an answer against a
    // question from a different quiz entirely.
    const { data: attemptQuestion } = await supabase
      .from("quiz_attempt_questions")
      .select("question_id")
      .eq("attempt_id", attemptId)
      .eq("question_id", questionId)
      .maybeSingle();

    if (!attemptQuestion) {
      return NextResponse.json({ ok: false, error: "That question isn't part of this attempt." }, { status: 400 });
    }

    // Guarded insert, not upsert - this is what actually enforces "locks
    // after first answer" server-side, not just a frontend nicety.
    const { data: existingAnswer } = await supabase
      .from("quiz_answers")
      .select("id")
      .eq("attempt_id", attemptId)
      .eq("question_id", questionId)
      .maybeSingle();

    if (existingAnswer) {
      return NextResponse.json({ ok: false, error: "This question has already been answered." }, { status: 409 });
    }

    const { data: question } = await supabase
      .from("quiz_questions")
      .select("question_type, explanation, accepted_answers, case_sensitive")
      .eq("id", questionId)
      .single();

    if (!question) {
      return NextResponse.json({ ok: false, error: "Question not found." }, { status: 404 });
    }

    const { data: options } = await supabase
      .from("quiz_options")
      .select("id, is_correct")
      .eq("question_id", questionId);

    const correctOptionIds = (options || []).filter((o) => o.is_correct).map((o) => o.id);

    const isCorrect = gradeAnswer({
      questionType: question.question_type,
      correctOptionIds,
      acceptedAnswers: question.accepted_answers,
      caseSensitive: question.case_sensitive,
      selectedOptionIds,
      typedAnswer,
    });

    const { error: insertErr } = await supabase.from("quiz_answers").insert({
      attempt_id: attemptId,
      question_id: questionId,
      selected_option_ids: selectedOptionIds,
      typed_answer: typedAnswer,
      is_correct: isCorrect,
    });

    if (insertErr) {
      // 23505 here means a concurrent duplicate submission raced past the
      // guard check above - same "already answered" outcome.
      if (insertErr.code === "23505") {
        return NextResponse.json({ ok: false, error: "This question has already been answered." }, { status: 409 });
      }
      return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
    }

    // Revealing correctness in this response IS revealing it, full stop,
    // regardless of what the frontend chooses to render - an assessment
    // configured for show_correct_answer='after_submission' must get back
    // nothing about correctness here, or a learner reading the network tab
    // sees the answer immediately no matter what the UI does with it.
    const revealNow = access.quiz.quiz_type === "knowledge_check" || access.quiz.show_correct_answer === "immediately";

    return NextResponse.json({
      ok: true,
      locked: true,
      ...(revealNow ? { isCorrect, explanation: question.explanation } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
