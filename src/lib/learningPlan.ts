export type LearningChallenge = {
  label: string;
  reason: string;
  check: string;
  action: string;
};

export type LearningPath = {
  title: string;
  description: string;
  outcome: string;
  href: string;
  linkLabel: string;
  challenges: LearningChallenge[];
};

export const learningPaths: LearningPath[] = [
  {
    title:'Choose what to learn',
    description:'Connect a useful skill with the work or goal you want to pursue.',
    outcome:'A learning direction based on what you want to be able to do.',
    href:'/career-paths',
    linkLabel:'Explore career paths',
    challenges:[
      {label:'I am interested in too many different skills',reason:'Several topics may look useful, but they may support different goals and require different starting knowledge.',check:'Write down what you want to do within the next six months. Compare each skill by relevance, time required and opportunities to practise it.',action:'Choose one primary skill for the next learning cycle. Keep other interests on a later list instead of learning everything at once.'},
      {label:'I do not know which skill will help my career',reason:'A popular skill may not match the work available in your chosen direction or the experience you already have.',check:'Review current roles and career paths. Record the skills that appear repeatedly and how employers expect people to use them.',action:'Choose a skill that closes a clear gap between your current evidence and the work you want.'},
      {label:'I do not know where to start as a beginner',reason:'Courses may assume different foundations, which makes advanced content feel like a starting point.',check:'List what the course expects you to know and test whether you can explain or perform those basics.',action:'Begin with the first missing foundation. Choose a short introduction with an activity you can complete.'},
      {label:'I keep choosing courses without a clear goal',reason:'Completion can become the goal even when the course does not change what you can do.',check:'For each course, write the task or decision it should help you perform afterwards.',action:'Choose learning with a clear output. Define what you will create, improve or demonstrate before you begin.'},
    ],
  },
  {
    title:'Keep learning consistently',
    description:'Make progress with a routine that fits the time and energy you actually have.',
    outcome:'A realistic learning routine you can return to each week.',
    href:'/account/learning',
    linkLabel:'Open my learning',
    challenges:[
      {label:'I start courses but rarely finish them',reason:'The course may be too large, the next step may be unclear or learning time may not be protected.',check:'Review where you stopped in the last two courses and what made returning difficult.',action:'Choose one active course. Set the next lesson and a small weekly completion target before adding another course.'},
      {label:'I cannot find enough time to learn',reason:'Learning may be competing with work and personal commitments without a defined place in the week.',check:'Look for two repeatable periods when you can focus without creating a new conflict.',action:'Schedule short learning sessions and decide the exact lesson or activity before each session begins.'},
      {label:'I lose motivation after the first few lessons',reason:'Progress may feel invisible when the course is disconnected from a practical result you care about.',check:'Identify what you can now understand or do that you could not do before starting.',action:'Pair each group of lessons with a small task that shows progress and gives you a reason to continue.'},
      {label:'I am learning from too many places at once',reason:'Multiple courses, videos and notes can repeat the same material and leave no clear next step.',check:'List your active learning sources and the purpose each one serves.',action:'Keep one main course and one supporting resource. Pause anything that does not support the current learning goal.'},
    ],
  },
  {
    title:'Practise what I learn',
    description:'Turn explanations into work you can perform without following every step.',
    outcome:'A practice plan that moves knowledge into usable skill.',
    href:'/learn',
    linkLabel:'Browse practical learning',
    challenges:[
      {label:'I understand lessons but cannot do the work alone',reason:'Following an explanation uses recognition, while independent work requires recalling the process and making decisions.',check:'Try a small task without replaying the lesson. Note the exact point where you become stuck.',action:'Practise that step separately, then repeat the task with fewer prompts until you can explain your decisions.'},
      {label:'I forget what I learned quickly',reason:'The material may not be reviewed or used after the first lesson.',check:'Without looking at your notes, write the main ideas and complete one related task from memory.',action:'Review at spaced intervals and retrieve the knowledge through questions or practice instead of rereading alone.'},
      {label:'I do not have a useful project to practise with',reason:'A project may be too broad, too advanced or unrelated to the work you want to perform.',check:'Choose one real task the skill should help you complete and reduce it to a manageable first version.',action:'Build a small project with a clear user, purpose and finish point. Add complexity only after the first version works.'},
      {label:'I cannot tell whether I am improving',reason:'Time spent learning does not show whether speed, accuracy, understanding or independence has changed.',check:'Repeat a comparable task and record where you needed help, the errors made and the time taken.',action:'Choose one measure connected to the skill and review it after each practice cycle.'},
    ],
  },
  {
    title:'Show what I can do',
    description:'Turn your learning into projects and evidence other people can understand.',
    outcome:'Clear proof of your skill, your decisions and your contribution.',
    href:'/tools/portfolio-builder',
    linkLabel:'Open Portfolio Builder',
    challenges:[
      {label:'I have learned the skill but have nothing to show',reason:'Course completion may not include a finished piece of work that demonstrates independent decisions.',check:'Review the tasks the skill should enable and choose one that matters to your intended audience.',action:'Create a focused project with a clear goal, constraints and finished result.'},
      {label:'My projects look like course assignments',reason:'The project may follow the tutor’s structure without showing your own choices or response to a real need.',check:'Identify which decisions were yours and what you changed after the guided work ended.',action:'Adapt the project for a specific user or problem. Document your reasoning and the parts you completed independently.'},
      {label:'I find it difficult to explain my skill level',reason:'Labels such as beginner or advanced do not show what you can complete reliably.',check:'List the tasks you can do independently, the areas where you need guidance and the evidence for each claim.',action:'Describe your skill through work completed, tools used and decisions made. Keep the claim consistent with the evidence.'},
      {label:'My work is not organised for other people to review',reason:'Files may be scattered or missing the context needed to understand the problem and your contribution.',check:'Ask whether a reviewer can find the goal, your process, the result and a working link without contacting you.',action:'Select your strongest work and give each project a concise story. Test every link before sharing it.'},
    ],
  },
];

export function learningPlanReport(pathIndex:number,selected:number[],skillName='',notes=''):string|null {
  const path=learningPaths[pathIndex];
  if(!path) return null;
  const challenges=path.challenges.filter((_,index)=>selected.includes(index));
  if(!challenges.length) return null;
  return [
    `Skill: ${skillName.trim()||'My next skill'}`,
    `Focus: ${path.title}`,
    '',
    'This plan is based on the learning challenges you selected. Adjust the pace and activities to your current responsibilities and starting level.',
    '',
    ...challenges.flatMap((challenge,index)=>[
      `${index+1}. ${challenge.label}`,
      `What may be happening: ${challenge.reason}`,
      `What to check: ${challenge.check}`,
      `Next action: ${challenge.action}`,
      '',
    ]),
    ...(notes.trim()?['Your notes',notes.trim(),'']:[]),
    `Continue here: https://www.prowessdigitalsolutions.com${path.href}`,
  ].join('\n');
}
