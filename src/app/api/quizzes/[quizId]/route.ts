import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { resolveQuizAccess } from "@/lib/quizzes/access";

export const runtime = "nodejs";

// Fetches a quiz plus its ordered questions/options for the learner
// currently taking it. member is optional here (unlike the other three
// quiz routes) - a quiz on a free course should be readable signed-out,
// mirroring /api/content/access's own optional-member handling.
//
// is_correct (on options) and accepted_answers/case_sensitive (on
// short_answer questions) are stripped before this ever reaches the
// response - quiz_questions/quiz_options have no public RLS select policy
// at all specifically so this route is the only way any of that data
// leaves the server, and it never includes the answer key.
export async function GET(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await params;
    const member = await verifyMember(req);

    const access = await resolveQuizAccess(quizId, { userId: member?.id ?? null, email: member?.email ?? null });
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.error, premium: access.premium }, { status: access.status });
    }

    const supabase = supabaseAdmin();

    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("id, question_type, question_text, explanation, position")
      .eq("quiz_id", quizId)
      .order("position");

    const questionIds = (questions || []).map((q) => q.id);
    const { data: options } = questionIds.length
      ? await supabase
          .from("quiz_options")
          .select("id, question_id, option_text, position")
          .in("question_id", questionIds)
          .order("position")
      : { data: [] };

    const optionsByQuestion = new Map<string, { id: string; option_text: string; position: number }[]>();
    for (const opt of options || []) {
      const list = optionsByQuestion.get(opt.question_id) || [];
      list.push({ id: opt.id, option_text: opt.option_text, position: opt.position });
      optionsByQuestion.set(opt.question_id, list);
    }

    const safeQuestions = (questions || []).map((q) => ({
      id: q.id,
      questionType: q.question_type,
      questionText: q.question_text,
      position: q.position,
      options: optionsByQuestion.get(q.id) || [],
    }));

    let existingAttempt = null;
    if (member) {
      const { data: inProgress } = await supabase
        .from("quiz_attempts")
        .select("id, status, score_percent, passed, started_at, submitted_at")
        .eq("quiz_id", quizId)
        .eq("user_id", member.id)
        .eq("status", "in_progress")
        .maybeSingle();

      existingAttempt = inProgress;
      if (!existingAttempt) {
        const { data: lastSubmitted } = await supabase
          .from("quiz_attempts")
          .select("id, status, score_percent, passed, started_at, submitted_at")
          .eq("quiz_id", quizId)
          .eq("user_id", member.id)
          .eq("status", "submitted")
          .order("submitted_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        existingAttempt = lastSubmitted;
      }
    }

    return NextResponse.json({
      ok: true,
      quiz: {
        id: access.quiz.id,
        title: access.quiz.title,
        description: access.quiz.description,
        quizType: access.quiz.quiz_type,
        passMarkPercent: access.quiz.pass_mark_percent,
        allowRetry: access.quiz.allow_retry,
        showCorrectAnswer: access.quiz.show_correct_answer,
      },
      questions: safeQuestions,
      existingAttempt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
