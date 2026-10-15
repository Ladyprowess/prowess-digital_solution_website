export type CareerProblem = {
  label: string;
  reason: string;
  check: string;
  action: string;
};

export type CareerPath = {
  title: string;
  description: string;
  outcome: string;
  href: string;
  linkLabel: string;
  problems: CareerProblem[];
};

export const careerPaths: CareerPath[] = [
  {
    title: 'Find the right job',
    description: 'Choose roles that fit your experience and focus your search.',
    outcome: 'A clearer search with roles you can assess and track.',
    href: '/jobs',
    linkLabel: 'Explore current jobs',
    problems: [
      {label:'I do not know which roles suit my experience',reason:'Your experience may be described through tasks instead of the skills and results employers use to define roles.',check:'List the work you do well, the problems you have handled and the results you can support. Compare those points with current job descriptions.',action:'Choose two role families that repeatedly ask for your strongest skills. Search within those roles before widening your search.'},
      {label:'I cannot find jobs that match what I want',reason:'The job title, location, work arrangement or experience filters may be too narrow, or the same role may use different titles.',check:'Search for your strongest skill as well as your preferred title. Compare related titles and remove one filter at a time.',action:'Create a short list of related titles and search terms. Review new listings on a regular schedule.'},
      {label:'I am unsure whether I meet the requirements',reason:'Job descriptions often combine essential requirements with preferences, which can make a suitable role look out of reach.',check:'Separate the work you must be able to do from qualifications described as preferred. Mark where your experience provides comparable evidence.',action:'Apply where you can perform the main responsibilities. Address the strongest evidence in your CV and application.'},
      {label:'My job search is difficult to organise',reason:'Applications, deadlines and follow ups may be spread across tabs, messages and notes.',check:'Review how many roles you saved, applied for and followed up on during the last two weeks.',action:'Track the role, company, deadline, application status and next action in one place.'},
    ],
  },
  {
    title: 'Strengthen my CV',
    description: 'Make your experience clear and relevant to the work you want.',
    outcome: 'A CV that gives employers relevant evidence quickly.',
    href: '/tools/cv-builder',
    linkLabel: 'Open CV Builder',
    problems: [
      {label:'My CV does not show the value of my work',reason:'It may list duties without showing what changed because of your contribution.',check:'Read each experience bullet and identify the action, context and result. Remove claims you cannot explain in an interview.',action:'Rewrite the strongest bullets around what you did and the supported outcome.'},
      {label:'I use the same CV for every application',reason:'A general CV can hide the experience that matters most for a particular role.',check:'Compare the first half of your CV with the main responsibilities in the job description.',action:'Move the most relevant evidence higher and use the employer’s plain language where it truthfully describes your experience.'},
      {label:'I have gaps or career changes to explain',reason:'The order of your experience may not make the connection between your past work and your target role clear.',check:'Identify the transferable skills, recent learning and relevant work completed during each transition.',action:'Use a short profile and selected achievements to explain the direction of your career without inventing experience.'},
      {label:'My CV is difficult to read',reason:'Dense paragraphs, inconsistent dates or decorative formatting can make important information hard to scan.',check:'Open the CV on a phone and a laptop. Check headings, dates, spacing and whether the key evidence is easy to find.',action:'Use clear sections, consistent dates and concise bullets. Keep contact details and text selectable.'},
    ],
  },
  {
    title: 'Prepare for interviews',
    description: 'Practise clear evidence for the questions employers are likely to ask.',
    outcome: 'Answers you can explain clearly without memorising a script.',
    href: '/tools/interview-prep',
    linkLabel: 'Start interview preparation',
    problems: [
      {label:'I struggle to answer questions clearly',reason:'Your answer may begin without a clear situation, action or result.',check:'Record a two minute answer and listen for the problem, your contribution and the outcome.',action:'Practise a simple situation, action and result structure with one relevant example at a time.'},
      {label:'I cannot think of strong work examples',reason:'Useful evidence may be hidden in everyday work, group projects, volunteering or difficult situations you handled.',check:'List moments when you solved a problem, improved a process, supported someone or learned quickly.',action:'Prepare five truthful stories that can support several common competency questions.'},
      {label:'I become nervous and forget what to say',reason:'Trying to memorise full answers can increase pressure and make recovery difficult.',check:'Notice where you lose your place during practice and which questions create the most uncertainty.',action:'Prepare short prompts for each story, practise aloud and pause before answering.'},
      {label:'I do not know enough about the employer',reason:'Your preparation may focus on your CV without connecting it to the organisation and role.',check:'Review the employer’s work, the role responsibilities and any recent information published by the organisation.',action:'Prepare why the role fits your direction, how your evidence connects and two informed questions to ask.'},
    ],
  },
  {
    title: 'Build my portfolio',
    description: 'Show the work behind your skills with clear project stories.',
    outcome: 'A focused body of work you can share with an application.',
    href: '/tools/portfolio-builder',
    linkLabel: 'Open Portfolio Builder',
    problems: [
      {label:'I do not know what work to include',reason:'You may be choosing projects by appearance rather than relevance to the roles you want.',check:'Compare each project with the skills and responsibilities in your target job descriptions.',action:'Choose two or three projects that demonstrate the most relevant decisions, skills and outcomes.'},
      {label:'I do not have paid client work to show',reason:'Course, personal, volunteer and internal projects may still demonstrate how you work when their context is explained honestly.',check:'List projects where you solved a real problem, completed a useful task or developed a relevant skill.',action:'Select the strongest work and label its context clearly. Explain the goal, your role and what you learned or achieved.'},
      {label:'My projects do not explain my contribution',reason:'Images or finished files alone do not show the decisions you made or the part you owned.',check:'For each project, identify the problem, constraints, your actions and the supported outcome.',action:'Add a short project story that separates your work from the wider team’s contribution.'},
      {label:'My work is scattered across different places',reason:'Recruiters may not have time to open several drives, profiles and attachments.',check:'List every place a reviewer currently needs to visit to understand your work.',action:'Bring the strongest projects into one portfolio and test every link before sharing it.'},
    ],
  },
];

export function jobSearchPlanReport(pathIndex: number, selected: number[], targetRole = '', notes = ''): string | null {
  const path = careerPaths[pathIndex];
  if (!path) return null;
  const problems = path.problems.filter((_, index) => selected.includes(index));
  if (!problems.length) return null;
  return [
    `Role: ${targetRole.trim() || 'My next role'}`,
    `Focus: ${path.title}`,
    '',
    'This plan is based on the challenges you selected. Use the checks to confirm what applies before taking action.',
    '',
    ...problems.flatMap((problem, index) => [
      `${index + 1}. ${problem.label}`,
      `What may be happening: ${problem.reason}`,
      `What to check: ${problem.check}`,
      `Next action: ${problem.action}`,
      '',
    ]),
    ...(notes.trim() ? ['Your notes', notes.trim(), ''] : []),
  ].join('\n');
}
