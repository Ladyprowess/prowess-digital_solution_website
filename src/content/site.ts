export const brand = {
  name: "Prowess Digital Solutions",
  colour: "#507c80",
  tone: "Calm, clear, professional, honest, supportive",
};

export const navPrimary = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/resources", label: "Resources" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/blog", label: "Blog" },
] as const;

export const navMore = [
  { href: "/events", label: "Events" },
  { href: "/pricing", label: "Pricing" },
  { href: "/careers", label: "Career" },
  { href: "/contact", label: "Contact Us" },
] as const;

export type Service = {
  id: string;
  slug: string;
  title: string;
  short: string;
  price: string;
  cta: string;
  icon?:
    | "clarity"
    | "audit"
    | "strategy"
    | "setup"
    | "workflow"
    | "sop"
    | "training"
    | "mentorship"
    | "package"
    | "brand"
    | "systems"
    | "support"
    | "team";
  details: {
    description: string;
    whoFor: string[];
    whatYouGet: string[];
    notes?: string[];
  };
};

export const services: Service[] = [
  {
    id: "clarity-session",
    slug: "business-clarity-session",
    icon: "clarity",
    title: "Business Clarity Session",
    short:
      "Book a business clarity session to pinpoint what is holding your business back, get a clear plan, and build simple systems that support steady growth.",
    price: "$60 – $90",
    cta: "Book Session",
    details: {
      description:
        "A business clarity session is a focused, one on one consultation designed to help you understand what is really happening inside your business. We sit down together, look at where things stand, identify what is not working, and map out what needs to change. There are no vague motivational talks. No scripts. Just honest, structured guidance built around your actual situation.\n\nMany business owners in Nigeria and across Africa operate in reactive mode. They respond to problems as they come, make decisions under pressure, and never quite feel like they are moving forward with a plan. This is not because they lack intelligence or effort. It is because they have not had a proper space to step back, look at the full picture, and think clearly about what the business actually needs.\n\nThat is what this session provides. We assess your current position, your challenges, your goals, and the patterns behind your decisions. We ask the questions most people around you will not ask. We challenge assumptions in a calm, respectful way. And we help you build a clearer understanding of what is working, what is wasting your time, and where your energy should go next.\n\nThis is especially helpful if you feel too close to everything and need an outside perspective. Someone who is not emotionally involved in the business, but who understands how businesses actually work in practice, not just in theory.\n\nYou leave the session with a more structured view of your business and practical, prioritised options for what to do next. Not a 50 page document. Not a complicated strategy. Just clear thinking, honest feedback, and a simple direction you can act on immediately.\n\nWhether you are just starting out or you have been running your business for years and things still feel scattered, this session gives you the foundation to move forward with more confidence and less confusion.",
      whoFor: [
        "New business owners who need a clear starting point",
        "Founders unsure where to begin or what to prioritise",
        "Business owners feeling overwhelmed by too many moving parts",
        "Entrepreneurs who need structured direction before investing more time or money",
        "Small business owners in Nigeria looking for honest, practical business guidance",
      ],
      whatYouGet: [
        "60 to 90 minute private strategy session tailored to your business",
        "A clearer understanding of what is really holding the business back",
        "Better structure around your services, pricing, or internal processes",
        "A simple, prioritised view of where to focus your time and energy",
        "Increased confidence in your decisions, backed by a realistic plan",
        "A calm, supportive space to talk through ideas without pressure or sales tactics",
      ],
      notes: [
        "This session is the recommended starting point for every new client. It gives both of us the clarity we need before any further engagement.",
      ],
    },
  },

  {
    id: "audit-review",
    slug: "business-audit-review",
    icon: "audit",
    title: "Business Audit & Review",
    short:
      "Get a structured business audit that reviews your operations, strategy, and systems, with practical recommendations and a clear roadmap for stable growth.",
    price: "$200 – $350",
    cta: "Book Audit",
    details: {
      description:
        "When your business feels messy, scattered, or stuck, it can be difficult to see what is really going wrong. You know something is off, but you cannot pinpoint exactly where the problems are because you are inside it every day. A Business Audit and Review gives you a clear, honest picture of how your business is working today and what needs to change so it can work better tomorrow.\n\nWe take a calm, detailed look at how your business actually operates. Not just what your website says or what your business plan reads like, but how things really move on a day to day basis. How decisions get made. How work flows between people. Where money goes. Where time gets wasted. Where confusion keeps showing up.\n\nThe aim is to identify gaps, weak points, and areas of confusion, then turn them into clear, actionable next steps. We look at your operations, your team structure (if you have one), your service delivery, your pricing, your customer experience, and the internal systems that hold everything together or fail to.\n\nMany business owners in Nigeria try to grow without first understanding where the cracks are. They add more services, hire more people, or spend more on marketing without realising the foundation is unstable. A business audit prevents that. It gives you an accurate picture before you make expensive decisions.\n\nAfter the audit, you receive a professional review document with clear restructuring recommendations. We do not just tell you what is wrong. We show you what to fix first, what can wait, and how to approach each issue in a way that is realistic for your current resources.\n\nThis is not about criticism. It is about clarity. The businesses that grow well are the ones that understand themselves properly. This audit gives you that understanding.",
      whoFor: [
        "Businesses with inconsistent performance or unpredictable results",
        "Founders who sense something is wrong but cannot identify the exact issue",
        "Businesses preparing to scale and wanting to fix problems before they multiply",
        "Companies that have grown quickly without proper structure",
        "Nigerian SMEs looking for a professional operational review",
      ],
      whatYouGet: [
        "A structured summary of what is really happening inside your business",
        "Clear identification of operational gaps and weak points",
        "Step by step recommendations for improving structure and decision making",
        "A prioritised roadmap that shows what to address first and what can wait",
        "Suggestions for simple, sustainable systems that support long term growth",
        "A professional audit document you can reference as you implement changes",
      ],
      notes: [
        "The audit is most effective when done after a Clarity Session, but can also be booked independently.",
      ],
    },
  },

  {
    id: "strategy-action-plan",
    slug: "strategy-action-plan",
    icon: "strategy",
    title: "Strategy & Action Plan",
    short:
      "Get a structured business strategy and action plan that outlines exactly what to do, when to do it, and why it matters for your growth.",
    price: "$250 – $450",
    cta: "Get Strategy Plan",
    details: {
      description:
        "Clarity without action does not change anything. Once you understand where your business stands, you need a plan that turns that understanding into real progress. That is what the Strategy and Action Plan service delivers.\n\nWe take the insights from your clarity session or business audit and build a structured roadmap around them. This is not a generic template or a motivational vision board. It is a practical, step by step plan that is specific to your business, your current resources, and your goals.\n\nEvery step in the plan is prioritised. We define what needs to happen first, what can wait, and what depends on other things being in place. We set realistic timelines so you are not trying to do everything at once, which is one of the most common reasons small businesses in Nigeria lose momentum. They start strong, get overwhelmed, and stall.\n\nThe action plan also includes clear milestones. These are specific points where you can measure whether things are on track or whether something needs to be adjusted. Without milestones, it is easy to keep working hard without knowing if you are making progress.\n\nWe also build in a priority framework. This is a simple system for deciding what deserves your attention at any given time. Most business owners are pulled in ten different directions every day. A priority framework helps you stay focused even when things get noisy.\n\nThe final deliverable is a strategic direction document that you can use as a guide over the coming weeks and months. It is written clearly, without jargon, so you and your team can follow it without needing to decode anything.\n\nThis service is ideal if you already have some clarity about your business but need help organising that clarity into something you can actually execute.",
      whoFor: [
        "Businesses that have completed a clarity session or audit and are ready for next steps",
        "Founders preparing to expand or enter a new phase of growth",
        "Entrepreneurs who want deliberate, structured progress instead of scattered effort",
        "Business owners who tend to start things but struggle to follow through consistently",
        "Nigerian SMEs looking for a realistic growth plan, not theoretical advice",
      ],
      whatYouGet: [
        "A 4 to 8 week structured roadmap tailored to your business goals",
        "Clear milestone definitions so you can track progress objectively",
        "A priority framework to help you decide what to focus on and what to set aside",
        "A strategic direction document written in plain, actionable language",
        "Guidance on sequencing so you know what comes first, second, and third",
      ],
      notes: [
        "Implementation support is available separately through our mentorship or structured support packages.",
      ],
    },
  },

  {
    id: "business-structure-setup",
    slug: "business-structure-setup",
    icon: "setup",
    title: "Business Structure Setup",
    short:
      "Set up a clear business structure with defined roles, responsibilities, and a decision framework that supports stability and long term growth.",
    price: "$350 – $600",
    cta: "Set Up Structure",
    details: {
      description:
        "Most business problems are structure problems. When roles are unclear, decisions get delayed, tasks fall through the cracks, and everyone ends up doing a bit of everything without real accountability. The business might still function, but it functions on stress rather than on systems. That is not sustainable.\n\nThe Business Structure Setup service is designed to give your business a proper internal framework. We look at how your business is currently organised, where the confusion sits, and we design a structure that makes it easier for the right people to do the right things at the right time.\n\nThis includes defining roles clearly. Not just job titles, but actual responsibilities. Who owns what. Who reports to whom. Who makes which decisions. In many small businesses, especially in Nigeria, the founder is the bottleneck for every single decision. That works when you are alone, but it breaks down the moment you start working with other people. A clear structure removes that bottleneck and distributes responsibility in a way that still keeps you in control of the important things.\n\nWe also set up a decision hierarchy. This means defining which decisions need your direct involvement and which ones your team can handle on their own. It sounds simple, but it is one of the biggest shifts a growing business can make. It frees up your time, reduces delays, and gives your team the confidence to act.\n\nThe structure we design is not a rigid corporate model. It is practical and built for where your business is right now, with room to grow. We focus on simplicity because complicated structures create more confusion, not less.\n\nIf you are preparing to hire, bring on a co founder, or simply want your current team to work more effectively, this is where you start. A well structured business is easier to manage, easier to scale, and far less stressful to run.",
      whoFor: [
        "Growing SMEs that have outgrown their original setup",
        "Founders who are overwhelmed because everything depends on them",
        "Businesses preparing to hire and wanting the structure in place first",
        "Teams where roles overlap and accountability is unclear",
        "Nigerian entrepreneurs building businesses that need to run without constant oversight",
      ],
      whatYouGet: [
        "A defined organisational framework tailored to your business size and stage",
        "Role clarity mapping so every team member knows exactly what they are responsible for",
        "A responsibility structure that reduces overlap and confusion",
        "A decision hierarchy that frees up founder time and speeds up execution",
        "Operational guidance on how to implement and communicate the new structure",
      ],
      notes: [
        "Final pricing depends on the scope of the business and the number of roles involved.",
      ],
    },
  },

  {
    id: "systems-workflow",
    slug: "systems-workflow-mapping",
    icon: "workflow",
    title: "Systems & Workflow Mapping",
    short:
      "Map and simplify your business workflows to reduce delays, eliminate repeated mistakes, and improve how work moves through your team.",
    price: "$300 – $550",
    cta: "Organise Workflow",
    details: {
      description:
        "If your team keeps making the same mistakes, missing deadlines, or asking the same questions over and over, the problem is usually not the people. It is the workflow. When there is no clear system for how tasks move from start to completion, things get lost, duplicated, or delayed. And the person who ends up fixing everything is usually the founder.\n\nSystems and Workflow Mapping is about looking at how work actually flows inside your business and making it better. We examine each key process, from how a client enquiry gets handled to how a project moves through your team to how deliverables reach the finish line. We identify where things slow down, where confusion enters, and where effort gets wasted.\n\nThen we redesign the flow. We simplify steps that are unnecessarily complicated. We remove bottlenecks that force everything through one person. We make sure there is a clear path from beginning to end so your team knows what to do at each stage without needing to ask.\n\nThis is not about adding more tools or software. Many businesses already have tools they do not use properly. The issue is usually the process itself, not the technology. We focus on getting the logic of the workflow right first. Once the process makes sense, the right tools become obvious.\n\nFor businesses operating in fast moving environments, which is most of the Nigerian market, having clean workflows means faster delivery, fewer errors, and less pressure on leadership. You stop spending your time managing every small detail and start spending it on the things that actually grow the business.\n\nYou receive clear workflow diagrams, a process simplification plan, and practical recommendations you can implement immediately. Everything is documented so your team can follow it without needing you to explain it every time.",
      whoFor: [
        "Businesses that keep missing deadlines or delivering late",
        "Teams repeating the same operational errors",
        "Founders who spend most of their time managing tasks instead of leading",
        "Businesses where everyone does things differently and there is no standard process",
        "Nigerian SMEs looking to improve operational efficiency without expensive software",
      ],
      whatYouGet: [
        "Clear workflow diagrams for your key business processes",
        "A process simplification plan that removes unnecessary steps",
        "Practical efficiency recommendations you can act on immediately",
        "A clear task movement structure so everyone knows what happens next",
        "Documentation your team can reference without needing constant supervision",
      ],
      notes: [
        "Final pricing depends on the number and complexity of workflows being mapped.",
      ],
    },
  },

  {
    id: "sop-guidance",
    slug: "sop-process-documentation",
    icon: "sop",
    title: "SOP & Process Documentation",
    short:
      "Create clear, written standard operating procedures that make delegation easier, improve consistency, and reduce dependency on any one person.",
    price: "$250 – $500",
    cta: "Create Processes",
    details: {
      description:
        "One of the biggest risks in a growing business is when critical knowledge lives only in one person's head. If that person is unavailable, overwhelmed, or leaves, the business struggles. SOPs, which stands for Standard Operating Procedures, solve this problem by putting your key processes into writing so anyone can follow them.\n\nThis service helps you document how the important things in your business should be done, step by step. We work with you to identify which processes matter most, break them down into clear instructions, and write them in a way that is simple, practical, and easy for your team to follow.\n\nThe goal is consistency. When every team member handles tasks differently, quality varies, mistakes increase, and clients notice. Written SOPs set a standard. They make sure the work gets done the same way every time, regardless of who is doing it.\n\nSOPs also make delegation much easier. One of the reasons many founders in Nigeria struggle to let go of tasks is because they do not trust that someone else will do it the way it needs to be done. When the process is documented, you are no longer handing over a vague responsibility. You are handing over a clear set of steps. That changes everything.\n\nWe focus on writing SOPs that are realistic and usable. Not 30 page manuals that nobody reads, but clear, practical documents your team will actually reference. We cover things like client onboarding, service delivery, communication protocols, financial processes, and whatever else is central to your operations.\n\nThis service is especially valuable if you are building a team, planning to hire, or simply tired of repeating yourself. Once the processes are written down, your business becomes less dependent on you and more capable of running smoothly on its own.",
      whoFor: [
        "Businesses preparing to delegate tasks for the first time",
        "Founders who are building or expanding their teams",
        "Companies where work quality varies depending on who handles the task",
        "Businesses that want to reduce dependency on the founder or a single key person",
        "Nigerian small businesses looking to build operational consistency as they grow",
      ],
      whatYouGet: [
        "Structured process documentation for your most important business operations",
        "Clear delegation guidelines so tasks can be handed over with confidence",
        "An operational clarity framework that shows how processes connect to each other",
        "Written SOP templates that your team can follow independently",
        "A foundation that makes future hiring and onboarding significantly easier",
      ],
      notes: [
        "Pricing depends on the number of processes being documented and the level of detail required.",
      ],
    },
  },

  {
    id: "training-sessions",
    slug: "business-training-sessions",
    icon: "training",
    title: "Business Training Sessions",
    short:
      "Practical business training sessions designed to strengthen your team's understanding of structure, systems, leadership, and decision making.",
    price: "$150 – $350",
    cta: "Book Training",
    details: {
      description:
        "Most business training is too generic. It gives broad advice that sounds good in the room but does not change anything when people go back to work. Our training sessions are different. They are built around your actual business, your current challenges, and the specific skills your team needs to move forward.\n\nWe deliver structured training focused on the areas that matter most for growing businesses: clarity, systems, leadership, decision making, and operational thinking. Each session is practical, not theoretical. We use real examples, discuss real scenarios, and focus on things your team can apply the same week.\n\nFor small teams, this kind of training creates alignment. When everyone understands how the business is structured, what the priorities are, and how decisions should be made, the whole team moves in the same direction. That alignment reduces internal friction, speeds up execution, and makes your business feel more stable.\n\nFor founders, the training sessions can also serve as a space to develop your own leadership capacity. Running a business and leading a team are two different skill sets, and many entrepreneurs in Nigeria are expected to do both without any formal support. These sessions give you frameworks and thinking tools that make leadership feel less overwhelming.\n\nWe can run sessions on specific topics like time management for business owners, building accountability within teams, understanding business finances, structuring client relationships, or improving internal communication. If there is a particular area where your business keeps running into problems, we can design a session around it.\n\nTraining can be delivered to individuals, small teams, or groups. Each session includes learning materials and interactive discussion so it is not just a lecture. The goal is that people leave the room with something they can actually use.",
      whoFor: [
        "Small teams that need to understand the business better and work more effectively together",
        "Founders developing their own leadership and management capacity",
        "Organisations seeking practical internal improvement without hiring external managers",
        "Business owners in Nigeria who want structured learning that applies to real operations",
        "Teams going through a period of growth or transition and needing shared understanding",
      ],
      whatYouGet: [
        "A structured training session tailored to your business stage and challenges",
        "Practical case examples drawn from real business scenarios",
        "Learning materials your team can reference after the session",
        "Interactive discussion time where real questions get real answers",
        "A clearer shared understanding of roles, priorities, and decision making within the team",
      ],
      notes: [
        "Custom training topics are available. Let us know what your team is struggling with and we will design the session around it.",
      ],
    },
  },

  {
    id: "mentorship-accountability",
    slug: "mentorship-accountability-programme",
    icon: "mentorship",
    title: "Mentorship & Accountability Programme",
    short:
      "A structured business mentorship programme with regular check ins, progress tracking, and strategic guidance to help you grow steadily and stay accountable.",
    price: "$300 – $600 (3 months)",
    cta: "Start Mentorship",
    details: {
      description:
        "Building a business is not just about getting the right advice once. It is about having consistent support as things change, as new problems come up, and as the pressure to make the right decisions increases. That is what the Mentorship and Accountability Programme provides.\n\nThis is a structured, ongoing engagement where we work with you over a three month period. Through regular sessions, we review how your business is progressing, discuss the decisions you are facing, and help you think through them clearly before you act. It is not coaching in the motivational sense. It is practical, strategic guidance from someone who understands business structure and operations.\n\nAccountability is a big part of this programme. Many founders have great intentions but struggle with follow through. Not because they are lazy, but because they are doing everything alone and there is no external structure holding them to their commitments. This programme creates that structure. We set goals together, track progress, and have honest conversations about what is and is not getting done.\n\nThe mentorship is tailored to your business stage. If you are just starting, we focus on building foundations. If you are growing, we focus on structure, systems, and sustainable decision making. If you are navigating a transition, whether that is expanding your team, changing your business model, or entering a new market, we help you manage that process without losing stability.\n\nThis programme is especially valuable for business owners in Nigeria who do not have a trusted circle of experienced advisors. Running a business can feel isolating, and the decisions you face are not always ones you can discuss with friends or family. Having a consistent, knowledgeable person in your corner makes a real difference.\n\nThe aim is stability, not rushed expansion. We are not here to push you into aggressive growth. We are here to help you grow at a pace that your business and your capacity can sustain.",
      whoFor: [
        "Founders who need ongoing guidance and a structured sounding board",
        "Business owners managing major transitions like hiring, scaling, or repositioning",
        "Entrepreneurs who want consistent accountability to stay on track with their goals",
        "Business owners in Nigeria who lack access to experienced, trustworthy mentors",
        "Anyone building a business who knows they perform better with external support and structure",
      ],
      whatYouGet: [
        "Bi weekly mentorship sessions over a three month period",
        "Progress tracking against goals we define together at the start",
        "Strategic review discussions tailored to the decisions you are currently facing",
        "Decision making support so you do not have to figure everything out alone",
        "A consistent relationship with someone who understands your business and your goals",
      ],
      notes: [
        "The programme duration can be extended beyond three months. Many clients continue because the ongoing support becomes part of how they run their business.",
      ],
    },
  },

  {
    id: "structured-packages",
    slug: "structured-support-packages",
    icon: "package",
    title: "Structured Support Packages",
    short:
      "Comprehensive business support packages that combine clarity, systems, strategy, and ongoing guidance into one structured engagement.",
    price: "$500 – $1,500+",
    cta: "Explore Packages",
    details: {
      description:
        "Some businesses do not need just one service. They need several layers of support working together. The Structured Support Packages are designed for exactly that. They combine clarity, systems, strategy, and ongoing guidance into a single, coordinated engagement so you are not piecing things together on your own.\n\nEvery package starts with an assessment. We look at where your business is, what it needs, and what makes the most sense given your current resources and goals. From there, we build a package that addresses your situation as a whole, not in isolated parts.\n\nThis matters because business problems are rarely isolated. A lack of structure affects your workflow. A weak workflow affects your team. A struggling team affects your delivery. And poor delivery affects your revenue. Fixing just one piece without addressing the others does not produce lasting results. These packages are designed to create connected, sustainable improvement.\n\nThe scope of each package depends on the business. A newer business might need a clarity session, structure setup, and a short mentorship programme. A more established business might need a full audit, SOP documentation, workflow mapping, and ongoing strategic guidance. We build the package around what you actually need, not around a fixed menu.\n\nEach package includes defined milestones and a structured timeline so you can see the plan, track the progress, and know what is being worked on at every stage. You also get ongoing advisory support throughout the engagement, which means you are never left guessing between sessions.\n\nThis is our most comprehensive offering and it is ideal for business owners who are serious about making real, lasting changes. Not surface level fixes, but deep, organised improvement that gives your business a stronger foundation for whatever comes next.\n\nIf you are a business owner in Nigeria or across Africa who is ready to invest properly in the way your business is built, this is the service that will give you the most value.",
      whoFor: [
        "Businesses that are ready for a full structural transformation",
        "Founders seeking a guided, step by step overhaul of how their business operates",
        "Entrepreneurs planning for long term stability and wanting comprehensive support",
        "Companies that have tried fixing problems individually and need a more connected approach",
        "Nigerian business owners who want deep, sustained support rather than one off advice",
      ],
      whatYouGet: [
        "An integrated service bundle tailored to your specific business needs",
        "Defined milestones so you can track exactly where you are in the process",
        "A structured timeline that shows what happens and when",
        "Ongoing advisory support throughout the full engagement",
        "A stronger, more organised business foundation built for long term growth",
      ],
      notes: [
        "Final pricing depends on the size of the business, the number of services included, and the overall complexity. We discuss this after the initial assessment.",
      ],
    },
  },
];

  export const packages = [
    {
      title: "Business Foundation",
      purpose: "Get clear on your business and make better decisions.",
      deliverables: [
        "Clarity session + structured review",
        "Offer and customer clarity",
        "Simple business plan for next steps",
      ],
      outcomes: [
        "Less confusion",
        "Clear priorities",
        "A stable foundation to build on",
      ],
      investment: "$150 – $300",
    },
    {
      title: "Business Setup",
      purpose: "Set up structure, tools, and operations that can run properly.",
      deliverables: [
        "Operations structure",
        "Tools and workflows setup guidance",
        "Basic documentation where needed",
      ],
      outcomes: [
        "Better organisation",
        "More control over daily work",
        "Less chaos and repeated mistakes",
      ],
      investment: "$300 – $800",
    },
    {
      title: "Execution & Visibility",
      purpose: "Support execution with clear steps and stable messaging.",
      deliverables: [
        "Launch plan and execution support",
        "Brand foundation and messaging",
        "Content and email guidance (as needed)",
      ],
      outcomes: [
        "Clear launch direction",
        "Better communication",
        "Steady visibility (no noise)",
      ],
      investment: "$200 – $600",
    },
    {
      title: "Team, Training & Scale",
      purpose: "Help teams work better with structure and strong priorities.",
      deliverables: [
        "Team structure support",
        "Training sessions",
        "Systems and process improvements",
      ],
      outcomes: [
        "Better team output",
        "Clear roles and handovers",
        "More consistent delivery",
      ],
      investment: "$250 – $800",
    },
  ];
  
  export const addOns = [
    "Legal & Business Name",
    "Domain & Email Setup",
    "Website Development",
    "Copywriting",
    "Sales Pages",
    "Training",
    "Retainers",
  ];
  
  export const resources = [
    { category: "Getting Started", items: ["Business basics checklist", "Simple business plan template", "Clarity questions guide"] },
    { category: "Business Systems", items: ["Weekly operations checklist", "Simple SOP template", "Team handover template"] },
    { category: "Strategy & Growth", items: ["Offer clarity worksheet", "Pricing thinking guide", "Customer journey checklist"] },
  ];
  
  export const events = [
    {
      topic: "How to Run a Business Without Confusion or Burnout",
      date: "To be announced",
      format: "Webinar (Online)",
    },
    {
      topic: "Business Clinic: Fix One Problem in 60 Minutes",
      date: "To be announced",
      format: "Live Clinic (Online)",
    },
  ];
  
  export const contact = {
    email: "info@prowessdigitalsolutions.com",
    whatsapp: "+2348162174443",
    location: "Africa (Remote-friendly)",
  };
  
