export const brand = {
    name: "Prowess Digital Solutions",
    colour: "#507c80",
    tone: "Calm, clear, professional, honest, supportive",
  };
  
  export const blogUrl = "https://your-blog-site.com"; // <-- change to your real blog link

export const navPrimary = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/resources", label: "Resources" },
  { href: "/case-studies", label: "Case Studies" },
  // Blog is external
  { href: blogUrl, label: "Blog", external: true },
] as const;

export const navMore = [
  { href: "/events", label: "Events" },
  { href: "/pricing", label: "Pricing" },
  { href: "/careers", label: "Career" },
  { href: "/contact", label: "Contact Us" },
] as const;

  
export type Service = {
  id: string;
  title: string;
  short: string;
  price: string;
  cta: string;
  icon?: "clarity" | "audit" | "setup" | "brand" | "systems" | "training" | "support" | "strategy" | "team";
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
      icon: "clarity",
      title: "Business Clarity Session",
      short: "A calm, structured session to help you get clear on what to do next.",
      price: "₦25,000 – ₦50,000",
      cta: "Book Session",
      details: {
        description:
          "This is the first step. We listen, ask the right questions, and help you organise your ideas into a clear direction.",
        whoFor: [
          "First-time founders who do not know where to start",
          "Business owners who feel stuck or overwhelmed",
          "People who want clarity before spending more money",
        ],
        whatYouGet: [
          "A clear summary of your current situation",
          "Key priorities for the next 2–4 weeks",
          "Practical guidance on what to stop, start, and fix",
          "A simple action plan you can follow",
        ],
        notes: [
          "If you need deeper review or implementation, we will recommend the right service after the session.",
        ],
      },
    },
    {
      id: "audit-review",
      icon: "audit",
      title: "Business Audit & Review",
      short: "A structured review of what is working, what is not, and what to fix first.",
      price: "₦150,000 – ₦300,000",
      cta: "Make an Enquiry",
      details: {
        description:
          "We review your business properly—your offer, pricing, operations, customer flow, and current structure.",
        whoFor: [
          "Businesses that are active but not seeing results",
          "Owners who feel their business is disorganised",
          "Teams struggling with direction and priorities",
        ],
        whatYouGet: [
          "Audit report with clear findings",
          "Priority fixes (what matters most)",
          "Recommendations for structure, tools, and processes",
          "Next-step plan for stability and growth",
        ],
      },
    },
    {
      id: "setup-structure",
      icon: "setup",
      title: "Business Setup & Structure",
      short: "Direction, operations, tools, and structure for a business that can run properly.",
      price: "₦300,000 – ₦800,000",
      cta: "Discuss This Service",
      details: {
        description:
          "We help you set up the right foundation so you are not guessing your way through business.",
        whoFor: [
          "New businesses starting from scratch",
          "Businesses that need proper structure and processes",
        ],
        whatYouGet: [
          "Clear business direction and focus",
          "Basic operations structure",
          "Tools and simple systems to run day-to-day work",
          "Clear roles and responsibilities (where needed)",
        ],
      },
    },
    {
      id: "brand-foundation",
      icon: "brand",
      title: "Brand Foundation",
      short: "Positioning, messaging, and brand clarity that builds trust over time.",
      price: "₦200,000 – ₦500,000",
      cta: "Discuss This Service",
      details: {
        description:
          "Marketing is a tool, not the foundation. We build the foundation first: what you do, who you help, and how you communicate clearly.",
        whoFor: [
          "Businesses that confuse people with their message",
          "Founders who want a clear and honest brand",
        ],
        whatYouGet: [
          "Clear positioning statement",
          "Messaging guide (simple words, clear meaning)",
          "Offer clarity and customer understanding",
        ],
      },
    },
    {
      id: "systems-ops",
      icon: "systems",
      title: "Systems & Operations Setup",
      short: "Workflows, documentation, and tools that make your work easier and more stable.",
      price: "₦250,000 – ₦600,000",
      cta: "Discuss This Service",
      details: {
        description:
          "We set up practical systems that reduce confusion and help you work with more control.",
        whoFor: [
          "Business owners doing too much by themselves",
          "Teams struggling with handovers and consistency",
        ],
        whatYouGet: [
          "Simple workflow structure",
          "Basic documentation (SOPs where needed)",
          "Tools setup guidance (what to use and how)",
        ],
      },
    },
    {
      id: "training-mentorship",
      icon: "training",
      title: "Training & Mentorship",
      short: "Structured support for individuals and teams (group or one-on-one).",
      price: "Prices vary (based on scope)",
      cta: "Request Details",
      details: {
        description:
          "We train and mentor people who want to learn structure, systems, and strong business thinking.",
        whoFor: [
          "Individuals transitioning into business",
          "Teams that need structured guidance",
        ],
        whatYouGet: [
          "Group training or one-on-one mentorship",
          "Practical exercises and templates",
          "Clear feedback and direction",
        ],
      },
    },
    {
      id: "retainer",
      icon: "support",
      title: "Ongoing Business Support (Retainer)",
      short: "Monthly guidance to keep you focused, organised, and improving over time.",
      price: "₦200,000 – ₦500,000 / month",
      cta: "Discuss Retainer",
      details: {
        description:
          "For businesses that want long-term support and structured thinking, not random advice.",
        whoFor: [
          "Growing businesses that want steady guidance",
          "Founders who want accountability and clarity",
        ],
        whatYouGet: [
          "Monthly check-ins and guidance",
          "Priority reviews and decision support",
          "Support with structure, systems, and execution",
        ],
      },
    },
    {
      id: "business-strategy-growth",
      icon: "strategy",
      title: "Business Strategy & Growth Planning",
      short: "Clear planning and direction to help your business grow in a steady and realistic way.",
      price: "₦200,000 – ₦500,000",
      cta: "Discuss This Service",
      details: {
        description:
          "This service helps you step back and look at your business from a strategy point of view. We work with you to define clear goals, identify growth opportunities, and create a simple plan you can actually follow.",
        whoFor: [
          "Business owners feeling stuck or confused about next steps",
          "Founders who want to grow but don’t have a clear plan",
          "Businesses preparing for expansion or new markets",
        ],
        whatYouGet: [
          "Clear business goals and priorities",
          "Simple growth strategy document",
          "Market and positioning guidance",
          "Actionable next steps for growth",
        ],
        notes: [
          "This is not a marketing service",
          "Best after a Business Clarity Session",
        ],
      },
    },
    {
      id: "team-structure-operations",
      icon: "team",
      title: "Team Structure & Operations Support",
      short: "Help setting up clear roles, responsibilities, and workflows for your team.",
      price: "₦250,000 – ₦600,000",
      cta: "Discuss This Service",
      details: {
        description:
          "This service focuses on how work gets done inside your business. We help you organise roles, responsibilities, and processes so your team can work without confusion or constant supervision.",
        whoFor: [
          "Business owners managing small or growing teams",
          "Founders overwhelmed by daily operations",
          "Businesses with unclear roles and repeated mistakes",
        ],
        whatYouGet: [
          "Clear role and responsibility structure",
          "Basic workflow and process documentation",
          "Guidance on delegation and team coordination",
          "Operational clarity to reduce stress",
        ],
        notes: [
          "This service does not include recruitment",
          "Can be adapted for solo founders with freelancers",
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
    email: "hello@prowessdigitalsolutions.com",
    whatsapp: "+234XXXXXXXXXX",
    location: "Nigeria (Remote-friendly)",
  };
  