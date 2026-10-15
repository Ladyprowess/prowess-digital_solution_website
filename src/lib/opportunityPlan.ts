export type OpportunityChallenge = {
  label: string;
  reason: string;
  check: string;
  action: string;
};

export type OpportunityPath = {
  title: string;
  description: string;
  outcome: string;
  href: string;
  linkLabel: string;
  challenges: OpportunityChallenge[];
};

export const opportunityPaths: OpportunityPath[] = [
  {
    title: 'Business funding',
    description: 'Prepare for grants, accelerators and other business funding opportunities.',
    outcome: 'A focused funding application with clear evidence and use of funds.',
    href: '/opportunities?type=grant',
    linkLabel: 'Explore funding opportunities',
    challenges: [
      {label:'I am not sure my business is eligible',reason:'The provider may restrict the business stage, location, sector, ownership or intended use of funds.',check:'Read the eligibility and exclusion rules on the provider’s application page. Compare each requirement with your current business information.',action:'Create an eligibility checklist and confirm every uncertain requirement with the provider before investing time in the application.'},
      {label:'I cannot clearly explain how I will use the funding',reason:'The amount requested may not yet be connected to specific activities, costs and expected business results.',check:'List each planned expense, its cost, when it is needed and what it enables the business to do.',action:'Build a costed use of funds with realistic milestones. Keep quotations or calculations that support major amounts.'},
      {label:'My business documents and numbers are not ready',reason:'Financial records, registration details, ownership information or a business plan may be incomplete or spread across different places.',check:'Compare the application requirements with the documents you can currently provide. Check dates, names and figures for consistency.',action:'Gather the required records in one folder. Complete missing documents before drafting long application answers.'},
      {label:'I struggle to make my application convincing',reason:'The application may describe the business without connecting the problem, customers, evidence and proposed use of funds.',check:'Review whether every claim is supported by a customer insight, operating result, document or reasonable assumption.',action:'Answer each question directly. Use specific evidence and remove claims you cannot support.'},
    ],
  },
  {
    title: 'Scholarships and learning',
    description: 'Prepare for scholarships, courses and development programmes.',
    outcome: 'An application that connects the programme with your next step.',
    href: '/opportunities?type=scholarship',
    linkLabel: 'Explore scholarships',
    challenges: [
      {label:'I do not know which programmes fit my goals',reason:'A programme may sound attractive without matching the subject, level, location, delivery format or outcome you need.',check:'Write down what you need to learn, the qualification or experience you want and the time you can commit.',action:'Compare programmes against those priorities and shortlist only those that move you towards a defined next step.'},
      {label:'I am unsure whether I meet the entry requirements',reason:'Academic, location, experience, language or financial criteria may apply differently to each programme.',check:'Separate mandatory criteria from preferences. Verify qualification equivalence and required evidence on the provider’s page.',action:'Resolve uncertain criteria with the provider and avoid relying on summaries when the official requirement is available.'},
      {label:'My personal statement is too general',reason:'The statement may describe ambition without showing relevant experience, a clear direction or why this programme is appropriate now.',check:'Mark the evidence for your interest, preparation and intended use of the learning.',action:'Connect one clear goal with relevant experience and the specific parts of the programme that support it.'},
      {label:'I do not have all the supporting documents',reason:'Transcripts, references, identification or proof of eligibility may take time to obtain.',check:'List every required document, its accepted format, who provides it and the deadline for requesting it.',action:'Request third party documents first. Name and store each final file so it is ready before submission.'},
    ],
  },
  {
    title: 'Fellowships and placements',
    description:'Prepare for fellowships, internships and practical career programmes.',
    outcome:'A relevant application that shows your experience and readiness.',
    href:'/opportunities?type=fellowship',
    linkLabel:'Explore career programmes',
    challenges:[
      {label:'I do not know which experience to highlight',reason:'Your most recent experience may not be the strongest evidence for the programme’s selection criteria.',check:'Match each responsibility or selection criterion with work, study, volunteering or project evidence.',action:'Lead with the evidence that best demonstrates the required skills, even when it comes from a different setting.'},
      {label:'My CV does not match the programme',reason:'A general CV may hide leadership, service, research, technical or community experience the programme values.',check:'Compare your profile and first page with the programme description and selection criteria.',action:'Reorder truthful evidence around the programme’s priorities and remove detail that does not help the reviewer assess your fit.'},
      {label:'I cannot explain why I want this opportunity',reason:'Your answer may focus on the programme’s reputation instead of the work you want to do and what you can contribute.',check:'Identify the programme activity that matters most, the direction it supports and the perspective or ability you bring.',action:'Write a specific connection between your experience, the programme and what you intend to do afterwards.'},
      {label:'I am worried about references or recommendations',reason:'A referee may not have enough time or information to provide a useful recommendation.',check:'Confirm the number, relationship and submission method required for referees.',action:'Ask early. Share the programme details, deadline and a factual summary of relevant work the referee has observed.'},
    ],
  },
  {
    title: 'Events and competitions',
    description:'Choose events, challenges and competitions that are worth your time.',
    outcome:'A clear reason to attend or apply, with the practical details covered.',
    href:'/events',
    linkLabel:'Explore events',
    challenges:[
      {label:'I do not know which event is worth attending',reason:'The topic may look relevant while the audience, format or expected outcome does not match what you need.',check:'Review the agenda, speakers, audience, format, cost and what participation includes.',action:'Choose events that support one specific goal, such as learning a skill, meeting a type of collaborator or presenting your work.'},
      {label:'I am not prepared to make useful connections',reason:'Arriving without a clear introduction or purpose can make conversations difficult to start and follow up.',check:'Decide who you want to meet, what you can discuss and what you want to learn.',action:'Prepare a short introduction and two relevant questions. Record agreed follow ups after each useful conversation.'},
      {label:'I do not understand the competition requirements',reason:'Submission format, judging criteria, team rules or ownership terms may be spread across several documents.',check:'Read the official rules and create a checklist for eligibility, deliverables, judging, rights and deadlines.',action:'Resolve unclear terms with the organiser before preparing the submission. Build around the published judging criteria.'},
      {label:'I keep missing registration or submission deadlines',reason:'Opening dates, time zones and document requirements may not be tracked in one place.',check:'Confirm the official deadline, time zone, required files and any earlier registration stage.',action:'Set an internal deadline before the official one and schedule the work needed to reach it.'},
    ],
  },
];

export function opportunityPlanReport(pathIndex:number,selected:number[],opportunityName='',notes=''):string|null {
  const path=opportunityPaths[pathIndex];
  if(!path) return null;
  const challenges=path.challenges.filter((_,index)=>selected.includes(index));
  if(!challenges.length) return null;
  return [
    opportunityName.trim()||'My opportunity',
    `${path.title}: application plan`,
    '',
    'This plan is based on the challenges you selected. Confirm eligibility, deadlines and terms on the organisation’s official page.',
    '',
    ...challenges.flatMap((challenge,index)=>[
      `${index+1}. ${challenge.label}`,
      `What may be happening: ${challenge.reason}`,
      `What to check: ${challenge.check}`,
      `Next action: ${challenge.action}`,
      '',
    ]),
    ...(notes.trim()?['Your notes',notes.trim(),'']:[]),
    `Continue here: https://prowessdigitalsolutions.com${path.href}`,
  ].join('\n');
}
