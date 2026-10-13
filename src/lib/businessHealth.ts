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


// Answer descriptions address the actual evidence asked for in each question.
export const healthAnswers = [
 ["We have not defined a specific customer or offer.", "We can explain parts of the offer, but the description changes.", "We have a clear customer, problem and paid offer that we use consistently."],
 ["We set prices without checking delivery costs or margin.", "We check some costs, but not consistently when setting prices.", "We calculate delivery costs and review margin when setting prices."],
 ["We do not keep an enquiry or follow-up record.", "Some enquiries are recorded, but follow-up depends on memory.", "Enquiries have a recorded owner, next action and follow-up date."],
 ["Recurring work is not documented.", "Some steps are written down, but people still need verbal guidance.", "Core tasks have instructions that another person can follow."],
 ["Income and expense records are missing or out of date.", "We update some records, but there is no regular review.", "We update and review business income and expenses on a regular schedule."],
] as const;
export function healthFindings(answers: number[]) {
 if (!scoreHealth(answers)) return [];
 return healthQuestions.map((q,index)=>({ ...q, index, value: answers[index], answer: healthAnswers[index][answers[index]],
  action: answers[index]===2 ? "Maintain this practice and review a recent example to check it still works." : answers[index]===1 ? [
   "Agree one written offer statement and use it consistently across your team and customer materials.",
   "Make a cost-and-margin review part of every pricing decision, including changes to delivery costs.",
   "Put every enquiry in one tracker and review overdue follow-ups on a fixed schedule.",
   "Complete the missing instructions and ask another person to test the process without verbal guidance.",
   "Set a weekly update and review routine so all income and expense records stay current.",
  ][index] : q.action,
 })).sort((a,b)=>a.value-b.value||a.index-b.index);
}
