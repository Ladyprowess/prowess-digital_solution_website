export const healthQuestions = [
  { area: "Customers and offer", question: "Can you clearly explain who you help and what they pay you for?", action: "Write down your main customer, their problem and the specific result your offer provides." },
  { area: "Pricing", question: "Do you use your costs and desired margin to set prices?", action: "List the costs of delivering one sale and review what remains at your current price." },
  { area: "Sales", question: "Do you track enquiries and follow up using a repeatable process?", action: "Create a simple enquiry tracker with an owner, next action and follow-up date." },
  { area: "Operations", question: "Are your recurring tasks documented so someone else can follow them?", action: "Document one recurring task as a checklist, including who owns each step." },
  { area: "Financial tracking", question: "Do you keep business income and expense records up to date?", action: "Set a weekly time to update income and expense records and review cash available." },
] as const;

export function scoreHealth(answers: number[]) {
  if (answers.length !== healthQuestions.length || answers.some(value => ![0, 1, 2].includes(value))) return null;
  return {
    score: Math.round(answers.reduce((sum, value) => sum + value, 0) / (healthQuestions.length * 2) * 100),
    priorities: healthQuestions.filter((_, index) => answers[index] < 2),
  };
}
