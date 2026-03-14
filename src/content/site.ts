export const brand = {
  name: "Prowess Digital Solutions",
  colour: "#507c80",
  tone: "Calm, clear, professional, honest, supportive",
};

export const navPrimary = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/tools", label: "Tools" },
  { href: "/resources", label: "Resources" },
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
    | "tools";
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
      "A focused one-on-one session to identify what is really holding your business back, get an honest outside perspective, and leave with a clear, prioritised direction.",
    price: "$60 – $90",
    cta: "Book Session",
    details: {
      description:
        "A business clarity session is a focused, one on one consultation designed to help you understand what is really happening inside your business. We sit down together, look at where things stand, identify what is not working, and map out what needs to change. There are no vague motivational talks. No scripts. Just honest, structured guidance built around your actual situation.\n\nMany business owners in Africa operate in reactive mode. They respond to problems as they come, make decisions under pressure, and never quite feel like they are moving forward with a plan. This is not because they lack intelligence or effort. It is because they have not had a proper space to step back, look at the full picture, and think clearly about what the business actually needs.\n\nThat is what this session provides. We assess your current position, your challenges, your goals, and the patterns behind your decisions. We ask the questions most people around you will not ask. We challenge assumptions in a calm, respectful way. And we help you build a clearer understanding of what is working, what is wasting your time, and where your energy should go next.\n\nYou leave the session with a more structured view of your business and practical, prioritised options for what to do next. Not a 50 page document. Not a complicated strategy. Just clear thinking, honest feedback, and a simple direction you can act on immediately.",
      whoFor: [
        "New business owners who need a clear starting point",
        "Founders unsure where to begin or what to prioritise",
        "Business owners feeling overwhelmed by too many moving parts",
        "Entrepreneurs who need structured direction before investing more time or money",
        "Small business owners across Africa looking for honest, practical business guidance",
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
    title: "Business Audit and Review",
    short:
      "A structured review of how your business actually operates today, with a clear professional report, specific recommendations, and a prioritised roadmap for fixing what needs to be fixed.",
    price: "$200 – $350",
    cta: "Book Audit",
    details: {
      description:
        "When your business feels messy, scattered, or stuck, it can be difficult to see what is really going wrong. You know something is off, but you cannot pinpoint exactly where the problems are because you are inside it every day. A Business Audit and Review gives you a clear, honest picture of how your business is working today and what needs to change so it can work better tomorrow.\n\nWe take a calm, detailed look at how your business actually operates. Not just what your website says or what your business plan reads like, but how things really move on a day to day basis. How decisions get made. How work flows between people. Where money goes. Where time gets wasted. Where confusion keeps showing up.\n\nThe aim is to identify gaps, weak points, and areas of confusion, then turn them into clear, actionable next steps. We look at your operations, your team structure, your service delivery, your pricing, your customer experience, and the internal systems that hold everything together or fail to.\n\nMany business owners in Africa try to grow without first understanding where the cracks are. They add more services, hire more people, or spend more on marketing without realising the foundation is unstable. A business audit prevents that. It gives you an accurate picture before you make expensive decisions.",
      whoFor: [
        "Businesses with inconsistent performance or unpredictable results",
        "Founders who sense something is wrong but cannot identify the exact issue",
        "Businesses preparing to scale and wanting to fix problems before they multiply",
        "Companies that have grown quickly without proper structure",
        "African SMEs looking for a professional operational review",
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
    title: "Strategy and Action Plan",
    short:
      "A practical, step-by-step growth roadmap that turns your business clarity into a real plan with milestones, priorities, and clear sequencing so you know exactly what to do next.",
    price: "$250 – $450",
    cta: "Get Strategy Plan",
    details: {
      description:
        "Clarity without action does not change anything. Once you understand where your business stands, you need a plan that turns that understanding into real progress. That is what the Strategy and Action Plan delivers.\n\nWe take the insights from your clarity session or business audit and build a structured roadmap around them. This is not a generic template or a motivational vision board. It is a practical, step by step plan that is specific to your business, your current resources, and your goals.\n\nEvery step in the plan is prioritised. We define what needs to happen first, what can wait, and what depends on other things being in place. We set realistic timelines so you are not trying to do everything at once, which is one of the most common reasons small businesses lose momentum.\n\nThe action plan includes clear milestones and a priority framework. The milestones are specific points where you can measure whether things are on track. The priority framework helps you stay focused when everything feels equally urgent. Both are written clearly, without jargon, so you and your team can follow the plan without needing to decode anything.",
      whoFor: [
        "Businesses that have completed a clarity session or audit and are ready for next steps",
        "Founders preparing to expand or enter a new phase of growth",
        "Entrepreneurs who want deliberate, structured progress instead of scattered effort",
        "Business owners who tend to start things but struggle to follow through consistently",
        "African SMEs looking for a realistic growth plan, not theoretical advice",
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
      "A properly defined internal framework for your business: clear roles, responsibilities, a decision hierarchy, and an operational structure that reduces founder dependency and supports steady growth.",
    price: "$350 – $600",
    cta: "Set Up Structure",
    details: {
      description:
        "Most business problems are structure problems. When roles are unclear, decisions get delayed, tasks fall through the cracks, and everyone ends up doing a bit of everything without real accountability. The business might still function, but it functions on stress rather than on systems. That is not sustainable.\n\nThe Business Structure Setup service gives your business a proper internal framework. We look at how your business is currently organised, where the confusion sits, and design a structure that makes it easier for the right people to do the right things at the right time.\n\nThis includes defining roles clearly. Not just job titles, but actual responsibilities. Who owns what. Who reports to whom. Who makes which decisions. In many small businesses across Africa, the founder is the bottleneck for every single decision. A clear structure removes that bottleneck and distributes responsibility in a way that still keeps you in control of the important things.\n\nWe also set up a decision hierarchy: which decisions need your direct involvement and which ones your team can handle on their own. This frees up your time, reduces delays, and gives your team the confidence to act. The structure we design is built for where your business is right now, with room to grow.",
      whoFor: [
        "Growing SMEs that have outgrown their original setup",
        "Founders who are overwhelmed because everything depends on them",
        "Businesses preparing to hire and wanting the structure in place first",
        "Teams where roles overlap and accountability is unclear",
        "African entrepreneurs building businesses that need to run without constant oversight",
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
    id: "training-sessions",
    slug: "business-training-sessions",
    icon: "training",
    title: "Business Training Sessions",
    short:
      "Practical training built around your business and your team's real challenges, covering structure, systems, leadership, and operational thinking in a format your team can actually apply.",
    price: "$150 – $350",
    cta: "Book Training",
    details: {
      description:
        "Most business training is too generic. It gives broad advice that sounds good in the room but does not change anything when people go back to work. Our training sessions are different. They are built around your actual business, your current challenges, and the specific skills your team needs to move forward.\n\nWe deliver structured training focused on the areas that matter most for growing businesses: clarity, systems, leadership, decision making, and operational thinking. Each session is practical, not theoretical. We use real examples, discuss real scenarios, and focus on things your team can apply the same week.\n\nFor small teams, this kind of training creates alignment. When everyone understands how the business is structured, what the priorities are, and how decisions should be made, the whole team moves in the same direction. That reduces internal friction, speeds up execution, and makes your business feel more stable.\n\nFor founders, the sessions can also serve as a space to develop your own leadership capacity. Running a business and leading a team are two different skill sets, and many entrepreneurs are expected to do both without any formal support. These sessions give you frameworks and thinking tools that make leadership feel less overwhelming.",
      whoFor: [
        "Small teams that need to understand the business better and work more effectively together",
        "Founders developing their own leadership and management capacity",
        "Organisations seeking practical internal improvement without bringing in external managers",
        "Business owners across Africa who want structured learning that applies to real operations",
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
    title: "Mentorship and Accountability Programme",
    short:
      "Structured, ongoing mentorship over three months with regular check-ins, progress tracking, and strategic guidance so you grow steadily and never have to figure things out completely alone.",
    price: "$300 – $600 (3 months)",
    cta: "Start Mentorship",
    details: {
      description:
        "Building a business is not just about getting the right advice once. It is about having consistent support as things change, as new problems come up, and as the pressure to make the right decisions increases. That is what the Mentorship and Accountability Programme provides.\n\nThis is a structured, ongoing engagement where we work with you over a three month period. Through regular sessions, we review how your business is progressing, discuss the decisions you are facing, and help you think through them clearly before you act. It is practical, strategic guidance from someone who understands business structure and operations.\n\nAccountability is a big part of this programme. Many founders have great intentions but struggle with follow through. Not because they are lazy, but because they are doing everything alone and there is no external structure holding them to their commitments. This programme creates that structure. We set goals together, track progress, and have honest conversations about what is and is not getting done.\n\nThe mentorship is tailored to your business stage. If you are just starting, we focus on building foundations. If you are growing, we focus on structure, systems, and sustainable decision making. If you are navigating a transition, we help you manage that process without losing stability.",
      whoFor: [
        "Founders who need ongoing guidance and a structured sounding board",
        "Business owners managing major transitions like hiring, scaling, or repositioning",
        "Entrepreneurs who want consistent accountability to stay on track with their goals",
        "Business owners in Africa who lack access to experienced, trustworthy mentors",
        "Anyone building a business who knows they perform better with external support and structure",
      ],
      whatYouGet: [
        "Bi-weekly mentorship sessions over a three month period",
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
    id: "premium-tools",
    slug: "premium-business-tools",
    icon: "tools",
    title: "Premium Business Tools",
    short:
      "A suite of practical digital tools built specifically for African entrepreneurs — giving you real numbers and operational clarity so you can run your business with confidence.",
    price: "Access included for clients",
    cta: "See the Tools",
    details: {
      description:
        "We built a suite of digital tools specifically for how African entrepreneurs run their businesses. These are not generic spreadsheets or Western-market software repurposed for Africa. They are built from the ground up with African currencies, African business structures, and the real challenges African business owners face every day.\n\nWe do not build custom tools for individual clients. What we do is give our clients access to tools that already exist and work. Each tool is designed to solve a specific operational problem that most small business owners in Africa are dealing with but have no proper system for.\n\nKnowing your actual costs before you launch. Understanding whether your pricing is actually profitable. Tracking cash so you are never surprised by an empty account. Managing invoices and following up on payments. Monitoring your stock before you run out. Planning your marketing and content without the chaos.\n\nThese are the things the tools handle. And because they are built for African businesses specifically, they work the way your business actually works — with the currencies, the context, and the conditions that matter here.",
      whoFor: [
        "Clients of Prowess Digital Solutions who need practical operational tools",
        "Business owners who make decisions based on guesswork because they have no reliable numbers",
        "Founders who are losing money to pricing errors, unpaid invoices, or stock shortfalls",
        "African entrepreneurs who need tools that actually reflect how business works on this continent",
      ],
      whatYouGet: [
        "Startup Cost and Break-Even Calculator — know your real costs and pricing before you commit",
        "Profit and Cashflow Tracker — track every naira monthly and annually so you always know where you stand",
        "Invoice Manager — create professional invoices and send payment reminders in one tap",
        "Inventory Manager — monitor stock levels and get low-stock alerts before you run out",
        "Reach and Growth Planner — plan content, track campaigns, and manage your social calendar",
      ],
      notes: [
        "Premium tools are available to Prowess Digital Solutions clients with a valid access code. Free tools are available to everyone at no cost.",
      ],
    },
  },
];

export const packages = [
  {
    title: "Clarity",
    purpose: "The right starting point. Understand what is really happening in your business and leave with a clear direction.",
    deliverables: [
      "60-minute Business Clarity Session",
      "Honest assessment of your current situation",
      "Prioritised list of what to fix first",
      "Clear next steps you can act on immediately",
    ],
    outcomes: ["Stop operating in reactive mode", "Know exactly what to focus on", "Confidence to move forward"],
    investment: "$60 – $90",
  },
  {
    title: "Foundation",
    purpose: "Fix the foundations. Build structure, sort your operations, and get your business running properly.",
    deliverables: [
      "Business Clarity Session",
      "Business Audit and Review",
      "Strategy and Action Plan",
      "Business Structure Setup",
      "Access to Premium Business Tools",
      "Email support throughout",
    ],
    outcomes: ["Stable operational structure", "Clear roles and decision flow", "A business that runs without chaos"],
    investment: "$400 – $700",
  },
  {
    title: "Growth",
    purpose: "Scale with intention. Strategy, training, tools, and ongoing mentorship to help you grow without losing control.",
    deliverables: [
      "Everything in Foundation",
      "Customised growth and strategy plan",
      "Team structure and role clarity",
      "Business Training Sessions",
      "3-month Mentorship Programme",
      "Bi-weekly accountability check-ins",
    ],
    outcomes: ["A team that works without you in everything", "Steady, structured growth", "A business you can scale"],
    investment: "$800 – $1,500",
  },
  {
    title: "Full Support",
    purpose: "Comprehensive, ongoing support for founders who want a dedicated strategic partner as they build.",
    deliverables: [
      "Everything in Growth",
      "Extended mentorship beyond 3 months",
      "Custom advisory support",
      "Priority response and access",
      "Quarterly business reviews",
      "Tailored engagement built around your specific needs",
    ],
    outcomes: ["A consistent strategic partner in your corner", "Decisions made with confidence", "Long-term, sustainable growth"],
    investment: "From $1,500",
  },
];

export const addOns = [
  "Legal and Business Name Registration",
  "Domain and Email Setup",
  "Ongoing Retainer Support",
];

export const resources = [
  {
    category: "Getting Started",
    items: ["Business basics checklist", "Simple business plan template", "Clarity questions guide"],
  },
  {
    category: "Business Systems",
    items: ["Weekly operations checklist", "Simple SOP template", "Team handover template"],
  },
  {
    category: "Strategy and Growth",
    items: ["Offer clarity worksheet", "Pricing thinking guide", "Customer journey checklist"],
  },
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