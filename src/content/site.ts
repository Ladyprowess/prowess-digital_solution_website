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
    short: "Book a business clarity session to pinpoint what’s holding your business back, get a clear plan, and build simple systems that support steady growth",
    price: "₦60,000 – ₦90,000",
    cta: "Book Session",
    details: {
      description:
        "A business clarity session is a focused consultation where we map out where your business is now, what is not working and what needs to change. It is not about quick fixes or big promises. Instead, it is about building a clear picture so you can make better decisions and set strong foundations.\n\nWe assess your current position, challenges, and decision patterns. Many business owners struggle because they are making reactive decisions without a structured framework.\n\nYou leave the session with a more structured view of your business and practical options for what to do next. This is especially helpful if you feel too close to everything and need an outside perspective that is honest, steady and grounded in day-to-day operations.",
      whoFor: [
        "New Business owners",
        "Founders unsure where to begin",
        "Business owners feeling overwhelmed",
        "Entrepreneurs needing structured direction before investing further",
      ],
      whatYouGet: [
        "60-minute private strategy session",
        "Clearer understanding of what is really holding the business back",
        "Better structure around your services, offers, roles or processes",
        "A simple, prioritised view of where to focus your time and energy",
        "Increased confidence in your decisions, backed by a realistic plan",
        "A calm, supportive space to talk through ideas without pressure",
      ],
      notes: ["This session provides Business Clarity Session for Focused Growth Strategy."],
    },
  },

  {
    id: "audit-review",
    slug: "business-audit-review",
    icon: "audit",
    title: "Business Audit & Review",
    short: "Need a business audit? Get a clear review of operations, strategy and systems, with practical fixes and a roadmap for stable growth.",
    price: "₦200,000 – ₦350,000",
    cta: "Book Audit",
    details: {
      description:
        "When your business feels messy, scattered or stuck, it can be difficult to see what is really going wrong. A Business Audit & Review from Prowess Digital Solutions gives you a clear, honest picture of how your business is working today, and what needs to change so it can work better tomorrow.\n\nWe take a calm, detailed look at how your business actually operates, not just how it appears on paper. The aim is to identify gaps, weak points and confusion, then turn them into clear next steps.\n\nThe goal is to uncover hidden weaknesses and structural gaps that may be slowing growth.\n\nYou receive a professional review with clear restructuring recommendations.",
      whoFor: [
        "Businesses with inconsistent performance",
        "Founders unsure why growth feels unstable",
        "Businesses preparing for scale",
      ],
      whatYouGet: [
        "A structured summary of what is really happening in your business",
        "Clear identification of gaps, risks and weak point",
        "Step-by-step recommendations for improving your structure, operations and decision-making",
        "A roadmap that shows what to address first and what can wait",
        "Suggestions for simple, sustainable systems that support long-term growth".
      ],
      notes: ["Our aim is that you leave with clarity, confidence and a plan that feels achievable."],
    },
  },

  {
    id: "strategy-action-plan",
    slug: "strategy-action-plan",
    icon: "strategy",
    title: "Strategy & Action Plan",
    short: "A structured roadmap outlining what to do, when to do it, and why.",
    price: "₦250,000 – ₦450,000",
    cta: "Get Strategy Plan",
    details: {
      description:
        "This service translates clarity into action.\n\nWe create a structured roadmap aligned with your business goals. Each step is prioritised and timed appropriately.\n\nThis prevents scattered effort and ensures focused growth.",
      whoFor: [
        "Businesses ready for structured growth",
        "Founders preparing for expansion",
        "Entrepreneurs wanting deliberate progress",
      ],
      whatYouGet: [
        "4–8 week structured roadmap",
        "Clear milestone definition",
        "Priority framework",
        "Strategic direction document",
      ],
      notes: ["Implementation support is separate."],
    },
  },

  {
    id: "business-structure-setup",
    slug: "business-structure-setup",
    icon: "setup",
    title: "Business Structure Setup",
    short: "Clear organisational structure to support stability and growth.",
    price: "₦350,000 – ₦600,000",
    cta: "Set Up Structure",
    details: {
      description:
        "We design your internal business framework.\n\nThis includes role clarity, reporting structure, responsibility allocation, and decision hierarchy.\n\nA structured business reduces confusion and improves accountability.",
      whoFor: [
        "Growing SMEs",
        "Founders overwhelmed by responsibility",
        "Businesses preparing to hire",
      ],
      whatYouGet: [
        "Defined organisational framework",
        "Role clarity mapping",
        "Responsibility structure",
        "Operational hierarchy guidance",
      ],
      notes: ["Scope determines final pricing."],
    },
  },

  {
    id: "systems-workflow",
    slug: "systems-workflow-mapping",
    icon: "workflow",
    title: "Systems & Workflow Mapping",
    short: "Clear workflow design to improve efficiency and reduce mistakes.",
    price: "₦300,000 – ₦550,000",
    cta: "Organise Workflow",
    details: {
      description:
        "We examine how tasks move from start to completion inside your business.\n\nUnclear workflows lead to delays and repeated mistakes. We map your processes, simplify the flow, and remove unnecessary bottlenecks.\n\nThis improves efficiency and reduces pressure on leadership.",
      whoFor: [
        "Businesses missing deadlines",
        "Teams repeating operational errors",
        "Owners overwhelmed by day-to-day processes",
      ],
      whatYouGet: [
        "Workflow diagrams",
        "Process simplification plan",
        "Efficiency recommendations",
        "Clear task movement structure",
      ],
      notes: ["Complexity affects final pricing."],
    },
  },

  {
    id: "sop-guidance",
    slug: "sop-process-documentation",
    icon: "sop",
    title: "SOP & Process Documentation",
    short: "Clear written processes that improve consistency and delegation.",
    price: "₦250,000 – ₦500,000",
    cta: "Create Processes",
    details: {
      description:
        "Clear processes create stable businesses.\n\nWe help you outline how tasks should be done step by step. This makes delegation easier and reduces dependency on one individual.\n\nWhen processes are written and organised, growth becomes manageable.",
      whoFor: [
        "Businesses preparing to delegate",
        "Founders building teams",
        "Companies lacking operational consistency",
      ],
      whatYouGet: [
        "Structured process documentation",
        "Delegation guidelines",
        "Operational clarity framework",
        "Written SOP templates",
      ],
      notes: ["Scope and number of processes affect pricing."],
    },
  },

  {
    id: "training-sessions",
    slug: "business-training-sessions",
    icon: "training",
    title: "Business Training Sessions",
    short: "Structured learning to strengthen business understanding and leadership.",
    price: "₦150,000 – ₦350,000",
    cta: "Book Training",
    details: {
      description:
        "We deliver structured training focused on clarity, systems, leadership, and decision-making.\n\nThese sessions are practical and tailored to your business stage.\n\nThe goal is improved understanding and stronger internal alignment.",
      whoFor: [
        "Small teams",
        "Founders developing leadership capacity",
        "Organisations seeking internal improvement",
      ],
      whatYouGet: [
        "Structured training session",
        "Practical case examples",
        "Learning materials",
        "Interactive discussion time",
      ],
      notes: ["Custom training topics available."],
    },
  },

  {
    id: "mentorship-accountability",
    slug: "mentorship-accountability-programme",
    icon: "mentorship",
    title: "Mentorship & Accountability Programme",
    short: "Ongoing structured support to maintain stability and growth.",
    price: "₦300,000 – ₦600,000 (3 months)",
    cta: "Start Mentorship",
    details: {
      description:
        "This programme provides consistent strategic guidance and accountability.\n\nThrough regular sessions, we review progress, refine decisions, and maintain structured growth.\n\nThe aim is stability, not rushed expansion.",
      whoFor: [
        "Founders needing ongoing guidance",
        "Business owners managing major transitions",
        "Entrepreneurs building sustainable growth",
      ],
      whatYouGet: [
        "Bi-weekly mentorship sessions",
        "Progress tracking",
        "Strategic review discussions",
        "Decision-making support",
      ],
      notes: ["Programme duration can be extended."],
    },
  },

  {
    id: "structured-packages",
    slug: "structured-support-packages",
    icon: "package",
    title: "Structured Support Packages",
    short: "Comprehensive bundled support designed around your business needs.",
    price: "₦500,000 – ₦1,200,000",
    cta: "Explore Packages",
    details: {
      description:
        "For businesses requiring multiple layers of support, our structured packages combine clarity, systems, strategy, and ongoing guidance.\n\nThese packages are built after assessment and aligned with your business goals.\n\nThis ensures deep, organised improvement rather than surface-level fixes.",
      whoFor: [
        "Businesses ready for transformation",
        "Founders seeking guided structural overhaul",
        "Entrepreneurs planning long-term stability",
      ],
      whatYouGet: [
        "Integrated service bundle",
        "Defined milestones",
        "Structured timeline",
        "Ongoing advisory support",
      ],
      notes: ["Final pricing depends on business size and complexity."],
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
      investment: "₦150,000 – ₦300,000",
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
      investment: "₦300,000 – ₦800,000",
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
      investment: "₦200,000 – ₦600,000",
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
      investment: "₦250,000 – ₦800,000",
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
    location: "Nigeria (Remote-friendly)",
  };
  
