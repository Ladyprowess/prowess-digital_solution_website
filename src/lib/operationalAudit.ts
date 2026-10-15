type AuditCategory = {
  title: string;
  description: string;
  items: string[];
};

export const auditCategories: AuditCategory[] = [
  {
    title: "Registration & Legal",
    description: "Requirements and agreements you have checked for your location and business.",
    items: [
      "Registration requirements checked and any required registration completed",
      "Business ownership and responsibilities are clearly recorded",
      "Tax registration requirements checked and any required registration completed",
      "A suitable account is in place for receiving and making business payments",
      "Relevant industry permits or licences obtained (if applicable)",
      "Basic contract or service agreement template prepared for clients",
    ],
  },
  {
    title: "Business Clarity & Direction",
    description: "How clearly you describe your customers, offer and business goals.",
    items: [
      "Clear description of what your business does (in one or two sentences)",
      "Target audience defined (who exactly you serve and why)",
      "Core services or products clearly listed with pricing",
      "Revenue model defined (how you actually make money)",
      "Short term goals set for the next 3 to 6 months",
      "Long term vision documented (where you want the business to be in 2 to 3 years)",
    ],
  },
  {
    title: "Financial Foundation",
    description: "The money systems that keep you informed and in control.",
    items: [
      "Income and expenses being tracked consistently (even a simple spreadsheet)",
      "Pricing structured to cover costs and generate profit",
      "Separate personal and business finances",
      "Basic budget or financial plan in place for the next quarter",
      "Invoicing system set up (even a simple template)",
      "Emergency fund or reserve started for the business",
    ],
  },
  {
    title: "Operations & Systems",
    description: "The internal processes that keep your business running without chaos.",
    items: [
      "New customer or order intake process defined",
      "Product or service delivery process documented from order to completion",
      "Communication channels decided (email, WhatsApp, Slack, etc.) with a clear purpose for each",
      "File storage organised (Google Drive, Dropbox, or similar) with a naming convention",
      "Basic project or task management system in use",
      "At least one key process written as a simple SOP",
    ],
  },
  {
    title: "Brand & Online Presence",
    description: "How people find you and what impression they get when they do.",
    items: [
      "Business name and identity are used consistently in customer materials",
      "Customers can find accurate product or service information online",
      "Business listing details are current on the directories your customers use",
      "Active on at least one social media platform relevant to your audience",
      "Contact information easy to find (email, phone, WhatsApp)",
      "Client testimonials or case studies collected (even one or two)",
    ],
  },
  {
    title: "Team & Growth Readiness",
    description: "Responsibilities, skills and support needed for the work ahead.",
    items: [
      "Roles and responsibilities defined (even if you are the only person)",
      "Decision making process clear (who decides what)",
      "Delegation plan in place or identified (what can be handed off first)",
      "Skills gap identified (what you need but do not currently have)",
      "Basic onboarding process ready for when you hire or bring on help",
      "Growth priorities ranked (what to focus on next, and what to wait on)",
    ],
  },
];

export const auditAnswerLabels = {
  in_place: 'In place',
  in_progress: 'In progress',
  not_in_place: 'Not in place',
  not_applicable: 'Not applicable',
} as const;
export type AuditAnswer = keyof typeof auditAnswerLabels;
export type AuditAnswers = Record<string, AuditAnswer>;
export const auditNextSteps = [
  'List the requirements you still need to confirm for your location and activity. Keep the relevant registrations, permissions and agreements together.',
  'Write down your customer, offer, pricing and next business goal. Review the parts you marked as unfinished.',
  'Choose one unfinished money routine to set up, such as a weekly record of income and costs. Assign a time to review it.',
  'Choose a recurring task that causes delays or questions. Write its steps, responsible person and completion check.',
  'Check the places customers actually use to find you. Update the information they need to understand your offer and contact you.',
  'Choose one responsibility that is unclear. Record who owns it, what they can decide and when they need support.',
];
const validAnswers = Object.keys(auditAnswerLabels);
export const auditKeys = auditCategories.flatMap((category,c)=>category.items.map((_,i)=>`${c}-${i}`));
export function summarizeAudit(answers: Record<string, unknown>) {
  const values=auditKeys.map(key=>answers[key]);
  const reviewed=values.filter(value=>typeof value==='string'&&validAnswers.includes(value)).length;
  const inPlace=values.filter(v=>v==='in_place').length;
  const inProgress=values.filter(v=>v==='in_progress').length;
  const notInPlace=values.filter(v=>v==='not_in_place').length;
  const notApplicable=values.filter(v=>v==='not_applicable').length;
  const complete=reviewed===auditKeys.length;
  const applicable=inPlace+inProgress+notInPlace;
  return {reviewed,total:auditKeys.length,inPlace,inProgress,notInPlace,notApplicable,applicable,complete,
    percent:complete&&applicable>0?Math.round(inPlace/applicable*100):null};
}
export function auditReport(answers: AuditAnswers) {
  const result=summarizeAudit(answers);
  if(!result.complete)return null;
  return [
    'YOUR SELF-REPORTED CHECKLIST\n'+(result.percent===null?'No applicable checkpoints were selected. No percentage has been calculated.':`${result.inPlace} of ${result.applicable} applicable checkpoints marked in place (${result.percent}%).`)+`\nIn progress: ${result.inProgress}\nNot in place: ${result.notInPlace}\nNot applicable: ${result.notApplicable}`,
    ...auditCategories.map((category,c)=>[
      category.title,
      ...category.items.map((item,i)=>`${auditAnswerLabels[answers[`${c}-${i}`]]}: ${item}`),
      category.items.some((_,i)=>['in_progress','not_in_place'].includes(answers[`${c}-${i}`]))?`Next step to consider: ${auditNextSteps[c]}`:'',
    ].filter(Boolean).join('\n')),
    'HOW TO READ THIS RESULT\nThe percentage counts only applicable checkpoints marked in place. In-progress checkpoints are not counted as completed. All checkpoints have equal weight. This records your answers; it does not verify compliance, profitability or readiness to grow. Review the unfinished items and choose what matters most for your business.',
  ].join('\n\n');
}
