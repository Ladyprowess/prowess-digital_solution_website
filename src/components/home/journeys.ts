export type Ambition = 'business' | 'skills' | 'work' | 'opportunities';
export type Action = { title: string; detail: string; href: string; label: string };
export type Journey = {
  label: string; verb: string; title: string; intro: string; destination: string;
  question: string; focuses: { label: string; insight: string; actions: Action[] }[];
  tools: Action[]; discovery: string; closing: string;
};
export const journeys: Record<Ambition, Journey> = {
  business: {
    label: 'Grow my business', verb: 'Build', title: 'A business that works.\nEven when you step away.', intro: 'Find the gaps, put structure around the work and make your next decision with clarity.', destination: '/services',
    question: 'What needs your attention first?', discovery: 'Ideas to put to work.', closing: 'Build with support around you.',
    focuses: [
      {label: 'Everything depends on me', insight: 'Start with the work you repeat. Give one process a clear owner, a sequence and a definition of done.', actions: [
        {title: 'Map a recurring process', detail: 'Open the process builder and identify the steps that need structure.', href: '/services#workshop', label: 'Open the workshop'},
        {title: 'Create a shared way of working', detail: 'Explore procedures your team can follow without asking you every time.', href: '/services/sop-vault', label: 'Explore SOP Vault'},
        {title: 'Find the wider gaps', detail: 'Review how your offer, operations and financial tracking fit together.', href: '/services/business-structure-diagnostic', label: 'Explore the diagnostic'},
      ]},
      {label: 'My offer is hard to explain', insight: 'Focus on one customer, one important problem and the change your work creates. Then test that message in a conversation.', actions: [
        {title: 'Clarify your offer', detail: 'Build a statement that connects your customer, their problem and your value.', href: '/services/go-to-market-offer-playbook#offer-workbench', label: 'Open the offer workbench'},
        {title: 'Plan how people find you', detail: 'Connect your offer, pricing and customer acquisition in one plan.', href: '/services/go-to-market-offer-playbook', label: 'Explore the playbook'},
        {title: 'Check your costs', detail: 'Understand the contribution each sale makes before choosing a price.', href: '/services/financial-tracking-dashboard', label: 'Explore your numbers'},
      ]},
      {label: 'I need to understand my numbers', insight: 'Separate sales, costs and actual cash movement. A busy month can still leave you short of cash.', actions: [
        {title: 'Explore your unit economics', detail: 'See how price, costs and sales volume affect your operating balance.', href: '/services/financial-tracking-dashboard', label: 'Open the dashboard'},
        {title: 'Start a tracking routine', detail: 'Keep income and costs in one place so you can review them regularly.', href: '/tools/tracker', label: 'Open the tracker'},
        {title: 'Review the business as a whole', detail: 'Bring the numbers together with your customers, offer and operations.', href: '/services/business-structure-diagnostic', label: 'Explore the diagnostic'},
      ]},
    ],
    tools: [
      {title: 'Business health check', detail: 'Review the habits behind your business and identify what needs attention.', href: '/tools/business-health-check', label: 'Check my business'},
      {title: 'Profit & cashflow tracker', detail: 'Organise the numbers you need to review your business.', href: '/tools/tracker', label: 'Open the tracker'},
      {title: 'Invoice builder', detail: 'Put your work, customer and payment details into an invoice.', href: '/tools/invoice', label: 'Create an invoice'},
    ],
  },
  skills: {
    label: 'Build my skills', verb: 'Learn', title: 'Turn curiosity\ninto something you can do.', intro: 'Choose a direction, learn something useful and put it into practice. Your next skill starts with a first step.', destination: '/learn',
    question: 'Where are you with learning?', discovery: 'Your next learning session.', closing: 'Keep your curiosity moving.',
    focuses: [
      {label: 'I am choosing a direction', insight: 'Explore the work behind a career before choosing a course. Look for skills you want to practise, not just a title you like.', actions: [
        {title: 'Explore career paths', detail: 'See the skills and learning connected to different kinds of work.', href:'/career-paths', label:'Explore paths'},
        {title: 'Choose a skill', detail:'Find a skill that supports the direction you want to take.', href:'/skills', label:'Browse skills'},
        {title: 'Start learning', detail:'Compare published courses and choose where to begin.', href:'/learn', label:'Browse learning'},
      ]},
      {label: 'I know what I want to learn', insight:'Make the next step small enough to start today. Choose a course, set aside time and apply one thing you learn.', actions:[
        {title:'Find your course', detail:'Explore the available courses and their access options.', href:'/learn', label:'Browse courses'},
        {title:'Watch a new perspective', detail:'Explore the video library for explanations and practical insights.', href:'/videos', label:'Browse videos'},
        {title:'Keep your learning together', detail:'Sign in to revisit your learning and progress.', href:'/account/learning', label:'Open my learning'},
      ]},
      {label: 'I want to show what I can do', insight:'Give your learning a visible outcome. A clear project and an explanation of your decisions make your skills easier to understand.', actions:[
        {title:'Build a portfolio', detail:'Bring your work together in one place.', href:'/tools/portfolio-builder', label:'Open portfolio builder'},
        {title:'Make your experience clear', detail:'Connect your skills and projects to the work you want.', href:'/tools/cv-builder', label:'Build my CV'},
        {title:'Explore roles', detail:'Read real job requirements to see where your skills fit.', href:'/jobs', label:'Explore jobs'},
      ]},
    ],
    tools:[
      {title:'Skill explorer', detail:'Connect what interests you with skills and learning.',href:'/skills',label:'Explore skills'},
      {title:'Portfolio builder', detail:'Create a place to show your projects and experience.',href:'/tools/portfolio-builder',label:'Build my portfolio'},
      {title:'Video library', detail:'Find something useful to watch in your next learning session.',href:'/videos',label:'Explore videos'},
    ],
  },
  work: {
    label:'Find work', verb:'Progress', title:'Make your next move\na considered one.',intro:'Prepare your story, practise how you tell it and explore roles where your skills can contribute.', destination:'/jobs',question:'What is your next career move?',discovery:'Open a new possibility.',closing:'Keep your next move in sight.',
    focuses:[
      {label:'Get my application ready',insight:'Start with the role you want. Make your relevant experience easy to find and show what you contributed.',actions:[
        {title:'Build your CV',detail:'Organise your skills, experience and education.',href:'/tools/cv-builder',label:'Open CV builder'},
        {title:'Review your CV',detail:'Check your document before your next application.',href:'/tools/cv-checker',label:'Open CV checker'},
        {title:'Find a role to pursue',detail:'Review published jobs and their application requirements.',href:'/jobs',label:'Browse jobs'},
      ]},
      {label:'Prepare for an interview',insight:'Use specific situations, your actions and the outcome. Practise explaining your contribution clearly.',actions:[
        {title:'Practise your answers',detail:'Work through interview preparation before the conversation.',href:'/tools/interview-prep',label:'Start preparing'},
        {title:'Bring your work together',detail:'Use your projects to support the experience you describe.',href:'/tools/portfolio-builder',label:'Build my portfolio'},
        {title:'Review your direction',detail:'Explore the skills connected to your next career step.',href:'/career-paths',label:'Explore career paths'},
      ]},
      {label:'Explore a different career',insight:'Look for transferable skills first. Compare what you already do with the skills your next direction requires.',actions:[
        {title:'Explore different paths',detail:'Discover the skills behind different careers.',href:'/career-paths',label:'Explore paths'},
        {title:'Build a missing skill',detail:'Find learning that supports the move you want to make.',href:'/learn',label:'Explore learning'},
        {title:'Read current requirements',detail:'Use published roles to understand what employers are asking for.',href:'/jobs',label:'Explore jobs'},
      ]},
    ],tools:[
      {title:'CV builder',detail:'Turn your experience into a clear application document.',href:'/tools/cv-builder',label:'Build my CV'},
      {title:'Interview preparation',detail:'Prepare how you explain your experience and contribution.',href:'/tools/interview-prep',label:'Practise for an interview'},
      {title:'CV checker',detail:'Give your CV another review before you send it.',href:'/tools/cv-checker',label:'Check my CV'},
    ],
  },
  opportunities:{
    label:'Find opportunities',verb:'Explore',title:'There is more than\none way forward.',intro:'Discover funding, programmes and openings. Prepare for the ones that fit your goals.',destination:'/opportunities',question:'What would help you move forward?',discovery:'Possibilities worth a closer look.',closing:'Stay open to what comes next.',
    focuses:[
      {label:'Funding for my business',insight:'Check eligibility before committing to an application. Be ready to explain your business, how the funds will be used and what you can deliver.',actions:[
        {title:'Explore funding opportunities',detail:'Review available listings and their eligibility requirements.',href:'/opportunities',label:'Browse opportunities'},
        {title:'Clarify the business',detail:'Connect your customers, offer, operations and financial tracking.',href:'/services/business-structure-diagnostic',label:'Explore the diagnostic'},
        {title:'Understand your numbers',detail:'Review your costs and operating assumptions.',href:'/services/financial-tracking-dashboard',label:'Explore the dashboard'},
      ]},
      {label:'A programme to develop myself',insight:'Look at the learning, time commitment and eligibility together. Choose a programme that supports your next step.',actions:[
        {title:'Find a programme',detail:'Explore published opportunities and their requirements.',href:'/opportunities',label:'Explore programmes'},
        {title:'Strengthen your application',detail:'Bring your experience and skills into a clear CV.',href:'/tools/cv-builder',label:'Build my CV'},
        {title:'Keep building skills',detail:'Continue learning while you explore your options.',href:'/learn',label:'Explore learning'},
      ]},
      {label:'Meet people and learn together',insight:'Choose a conversation with a purpose. Explore upcoming events and prepare one question you want answered.',actions:[
        {title:'Explore upcoming events',detail:'Find published events and check their format and access details.',href:'/events',label:'Browse events'},
        {title:'Discover a new perspective',detail:'Explore the videos available on the platform.',href:'/videos',label:'Browse videos'},
        {title:'Find your next opportunity',detail:'Review the latest openings and programmes.',href:'/opportunities',label:'Browse opportunities'},
      ]},
    ],tools:[
      {title:'Opportunity directory',detail:'Explore listings and check each provider’s requirements.',href:'/opportunities',label:'Explore opportunities'},
      {title:'CV builder',detail:'Get your experience ready for your next application.',href:'/tools/cv-builder',label:'Build my CV'},
      {title:'Events calendar',detail:'Find a session or event to join.',href:'/events',label:'Explore events'},
    ],
  },
};
