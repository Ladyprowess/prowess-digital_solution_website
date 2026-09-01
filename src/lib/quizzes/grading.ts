// Single source of truth for "is this answer correct" - used only by the
// answer-submission route. Never trust a client-sent isCorrect; always
// grade from the question's actual correct-option-ids/accepted-answers,
// resolved server-side from quiz_options/quiz_questions.

export type GradeInput = {
  questionType: "single_choice" | "multiple_select" | "true_false" | "short_answer";
  correctOptionIds: string[];       // from quiz_options where is_correct
  acceptedAnswers: string[] | null; // short_answer only
  caseSensitive: boolean;           // short_answer only
  selectedOptionIds: string[] | null;
  typedAnswer: string | null;
};

function normalizeText(value: string, caseSensitive: boolean): string {
  const collapsed = value.trim().replace(/\s+/g, " ");
  return caseSensitive ? collapsed : collapsed.toLowerCase();
}

export function gradeAnswer(input: GradeInput): boolean {
  const { questionType, correctOptionIds, acceptedAnswers, caseSensitive, selectedOptionIds, typedAnswer } = input;

  if (questionType === "single_choice" || questionType === "true_false") {
    if (correctOptionIds.length === 0) return false; // authoring bug - never correct
    if (!selectedOptionIds || selectedOptionIds.length !== 1) return false;
    return correctOptionIds.includes(selectedOptionIds[0]);
  }

  if (questionType === "multiple_select") {
    const selected = new Set(selectedOptionIds || []);
    const correct = new Set(correctOptionIds);
    if (selected.size !== correct.size) return false;
    for (const id of selected) {
      if (!correct.has(id)) return false;
    }
    return true;
  }

  // short_answer
  if (!acceptedAnswers || acceptedAnswers.length === 0) return false; // authoring bug - never correct
  if (!typedAnswer || !typedAnswer.trim()) return false;
  const normalizedTyped = normalizeText(typedAnswer, caseSensitive);
  return acceptedAnswers.some((accepted) => normalizeText(accepted, caseSensitive) === normalizedTyped);
}
