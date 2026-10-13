export const brand = {
  name: "Prowess Digital Solutions",
  tagline: "Learn, work, build, and run better.",
  colour: "#507c80",
  tone: "Calm, clear, professional, honest, supportive",
};

// The five pillars, now pointing at their real final routes (/jobs,
// /opportunities, /learn, /career-paths don't exist yet and will 404 until
// built - accepted deliberately rather than routing through a waitlist
// anchor forever). Reused by the nav and the hero's category grid.
export const pillars = [
  { key: "work", label: "Work", desc: "Jobs, internships & remote roles", href: "/jobs" },
  { key: "opportunities", label: "Opportunities", desc: "Grants, scholarships & fellowships", href: "/opportunities" },
  { key: "learn", label: "Learn", desc: "Courses & skill paths", href: "/learn" },
  { key: "build", label: "Build", desc: "Tools & templates", href: "/tools" },
  { key: "connect", label: "Connect", desc: "Events & community", href: "/events" },
] as const;

// No separate "Home" link - the logo already goes there, same as every
// other site. Removing the duplicate also gives the five real pillars more
// breathing room in the nav bar.
export const navPrimary = [
  { href: "/services", label: "Business support" },
  { href: "/learn", label: "Learning" },
  { href: "/jobs", label: "Jobs" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/tools", label: "Tools" },
] as const;

export const navMore = [
  { href: "/blog", label: "Blog" },
  { href: "/videos", label: "Videos" },
  { href: "/resources", label: "Library" },
  { href: "/career-paths", label: "Career Paths" },
  { href: "/skills", label: "Skills" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "For Businesses" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/work-with-us", label: "Work With Us" },
] as const;

// Cross-pillar on purpose - not all jobs.
export const popularSearches = [
  { label: "Remote Jobs", href: "/jobs" },
  { label: "Scholarships", href: "/opportunities" },
  { label: "Grants", href: "/opportunities" },
  { label: "Free Courses", href: "/learn" },
  { label: "Events", href: "/events" },
  { label: "Free Tools", href: "/tools" },
] as const;

// "What are you here to do?" - goal-oriented, not category-oriented. Build
// and Discover point at real, live pages today; the rest 404 until built.
export const goalCards = [
  {
    title: "Find an opportunity",
    desc: "Jobs, internships, scholarships, grants and fellowships.",
    href: "/jobs",
  },
  {
    title: "Learn a skill",
    desc: "Courses, videos, ebooks, guides and books you can save.",
    href: "/learn",
  },
  {
    title: "Build your career",
    desc: "Career paths, skill roadmaps and professional development.",
    href: "/career-paths",
  },
  {
    title: "Find useful tools",
    desc: "Business and career tools to help you work smarter.",
    href: "/tools",
  },
  {
    title: "Discover what's happening",
    desc: "Events, workshops, conferences and communities.",
    href: "/events",
  },
] as const;

export const whyProwess = [
  { title: "Curated", desc: "Useful jobs, books, tools, and opportunities are selected and organised." },
  { title: "Practical", desc: "Every resource points toward something you can learn, apply, or build." },
  { title: "Personal", desc: "Your account keeps your saves, learning progress, videos, and purchases together." },
  { title: "Built for business too", desc: "Founders get tools, guides, diagnostics, SOPs, and operating support." },
] as const;

export const newsletterPreferences = [
  { key: "jobs", label: "Jobs" },
  { key: "scholarships", label: "Scholarships & Grants", also: ["grants"] },
  { key: "courses", label: "Learning" },
  { key: "career_resources", label: "Career Resources" },
  { key: "events", label: "Events" },
  { key: "business", label: "Business" },
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
    id: "business-structure-diagnostic",
    slug: "business-structure-diagnostic",
    icon: "audit",
    title: "Business Structure Diagnostic",
    short:
      "A focused review of your business model, offer, pricing, sales process, operations and basic financial tracking, with a written report and a practical 30-day action plan.",
    price: "$60 - $120",
    cta: "Enquire about the diagnostic",
    details: {
      description:
        "The Business Structure Diagnostic helps business owners understand structural gaps, operational bottlenecks, risks and what needs attention first. We assess your business model, target customers, offer, pricing, sales process, daily operations and basic financial tracking.\n\nThe fixed one-time fee is $60 - $120. Start by describing your business, current challenges and goals in the enquiry form. Prowess Digital Solutions confirms whether the diagnostic is appropriate before providing payment instructions.",
      whoFor: [
        "Business owners who need clarity on what is not working and what to fix first",
        "Solo founders and small teams who want to improve their business structure and daily operations",
      ],
      whatYouGet: [
        "Business review: an assessment of your business model, target customers, offer, pricing, sales process, daily operations and basic financial tracking.",
        "Business Structure Diagnostic Report: a written report highlighting structural gaps, operational bottlenecks, risks and areas requiring attention.",
        "Prioritised Action Plan: a practical 30-day roadmap with recommended actions in order of priority and suggested timelines.",
        "Tools and recommendations: relevant templates, checklists or tracking tools to help you implement the recommendations.",
        "Review call: one 45-minute online session to walk through the findings, explain recommendations and answer questions.",
      ],
      notes: [
        "Delivery: five business days, starting when payment has been confirmed and you have submitted all required information.",
        "Follow-up: one email within seven calendar days after the review call to clarify the report or action plan.",
        "Not included: bookkeeping, tax or legal advice, implementation of recommended changes, financial statement audits, market research, or preparation of a full business plan.",
        "Additional calls and ongoing advisory support are not included.",
      ],
    },
  },

  {
    id: "sop-vault",
    slug: "sop-vault",
    icon: "sop",
    title: "SOP Vault",
    short:
      "Your team's most important workflows, written down as clear, repeatable systems. Client onboarding, inventory tracking, lead handoff, and billing, documented so the business does not depend on any one person.",
    price: "$300 – $550",
    cta: "Build Your SOP Vault",
    details: {
      description:
        "Most businesses run on knowledge that lives only in one person's head. When that person is out sick, on holiday, or simply busy, everything slows down or breaks. An SOP Vault fixes that by turning your actual workflows into written, repeatable systems anyone on your team can follow.\n\nWe document the processes that matter most: how a new client gets onboarded, how inventory gets tracked, how a lead gets handed from one person to the next, how billing gets sent and followed up on. Nothing generic. We build the SOPs around how your business actually works, so your team can pick them up and run with them without needing you to explain everything every time.\n\nThe result is a business that depends less on any one person, including you. New hires ramp up faster, mistakes drop, and the day to day runs the same way whether you are in the room or not.",
      whoFor: [
        "Founders who are the only ones who know how anything actually gets done",
        "Growing teams where onboarding a new hire takes far longer than it should",
        "Businesses with messy, undocumented workflows for onboarding, inventory, billing, or lead handling",
        "Anyone preparing to delegate or hire and wanting the systems in place first",
      ],
      whatYouGet: [
        "Written, step by step SOPs for the processes you choose, such as client onboarding, inventory tracking, lead handoff, or billing",
        "Documentation built around how your business actually works, not a generic template",
        "A shared vault your team can reference without asking you first",
        "Guidance on rolling the new systems out to your team",
      ],
      notes: [
        "Most clients start with three to four core processes. More can be added once the first set is in place.",
      ],
    },
  },

  {
    id: "gtm-offer-playbook",
    slug: "go-to-market-offer-playbook",
    icon: "strategy",
    title: "Go To Market and Offer Playbook",
    short:
      "A practical framework for packaging what you do, pricing it properly, and mapping out how the right customers actually find you.",
    price: "$280 – $480",
    cta: "Get Your Playbook",
    details: {
      description:
        "Having a good business does not automatically mean people know how to buy from you. A Go To Market and Offer Playbook is a practical framework for packaging what you do, pricing it properly, and mapping out how the right customers actually find you.\n\nWe work through your offer first. What exactly are you selling, to whom, and why should they choose you over the alternative. From there we build out pricing that reflects the value you provide, not just a guess at what feels fair. Then we map the channels most likely to bring you customers, so your effort goes toward what will actually move the needle instead of everything at once.\n\nThis is built for founders who are good at the work itself but have never had a clear, honest look at how they package and sell it.",
      whoFor: [
        "Solo founders and small service businesses who are unsure how to price what they offer",
        "Anyone with a good service and no clear plan for how new customers should find them",
        "Founders who have been guessing at pricing or copying competitors instead of pricing with intention",
        "Businesses expanding into new markets and needing a clear plan for how to enter them",
      ],
      whatYouGet: [
        "A clearly packaged offer, written in language your customers actually understand",
        "Pricing built around your real costs and the value you provide, not a guess",
        "A prioritised map of the channels most likely to bring you customers",
        "A written playbook you and your team can follow and revisit",
      ],
      notes: [
        "Works well on its own or as a follow up to the Business Structure Diagnostic.",
      ],
    },
  },

  {
    id: "financial-tracking-dashboard",
    slug: "financial-tracking-dashboard",
    icon: "tools",
    title: "Financial Tracking and Unit Economics Dashboard",
    short:
      "A configured, ongoing dashboard for your margins, customer acquisition cost, and monthly cashflow, built on tools we have already tested rather than something new and unproven.",
    price: "$150 – $260",
    cta: "Set Up Your Dashboard",
    details: {
      description:
        "You cannot run a business well on guesswork. A Financial Tracking and Unit Economics Dashboard gives you a clear, ongoing view of your margins, your customer acquisition cost, and how much cash is actually moving through the business each month.\n\nRather than build something from scratch, we configure the tools we have already built and tested for exactly this: a startup cost and break even calculator, and a profit and cashflow tracker. We set them up around your actual numbers, walk you through how to read them, and hand you a dashboard you can update yourself going forward.\n\nThis is the offer for founders who want to stop finding out how their business did last month by checking their bank balance.",
      whoFor: [
        "Founders making pricing or spending decisions without knowing their real numbers",
        "Anyone who has never calculated their true customer acquisition cost or margin",
        "Small business owners who want an ongoing view of cashflow, not a one time snapshot",
        "Businesses preparing to raise money, apply for funding, or bring on a financial partner",
      ],
      whatYouGet: [
        "A configured Startup Cost and Break Even Calculator built around your numbers",
        "A configured Profit and Cashflow Tracker set up for monthly and annual tracking",
        "A walkthrough session on how to read and update your own dashboard",
        "Ongoing access to both tools through your client account",
      ],
      notes: [
        "This offer includes ongoing access to the underlying tools, not just a one time report.",
      ],
    },
  },
];

// Fixed monthly membership pricing. Paying yearly gets 20% off the monthly
// rate (see pricingHelpers below) rather than a separate hand-maintained number.
export const packages = [
  {
    slug: "diagnostic",
    title: "Diagnostic",
    purpose: "The right starting point. Understand what is really happening in your business and keep a monthly pulse on it going forward.",
    monthlyPrice: 320,
    monthlyPriceNGN: 441600, // 320 * 1380
    deliverables: [
      "A Business Structure Diagnostic when you join, then a fresh check in every month",
      "Access to the Startup Cost and Break Even Calculator and the Profit and Cashflow Tracker",
      "Guides on setting up the basics so your business runs on systems, not memory",
      "Email support",
    ],
    outcomes: ["Know exactly where your business stands, every month", "An honest, outside perspective on call", "The basic tools to track your real numbers"],
  },
  {
    slug: "foundation",
    title: "Foundation",
    purpose: "Fix the foundations. Turn the diagnostic's findings into real systems and a clear way to bring in customers, kept current every month.",
    monthlyPrice: 1050,
    monthlyPriceNGN: 1449000, // 1050 * 1380
    deliverables: [
      "Everything in Diagnostic",
      "SOP Vault for your core processes, updated as your business changes",
      "Go To Market and Offer Playbook, revisited monthly",
      "Access to the Invoice Manager",
      "Guides on building systems that let your business run without you",
    ],
    outcomes: ["A business that runs on systems, not memory", "A clear plan for how customers find you", "Less dependence on you for every decision"],
  },
  {
    slug: "growth",
    title: "Growth",
    purpose: "Scale with intention. Add the numbers and the team alignment that let you grow without losing control.",
    monthlyPrice: 1750,
    monthlyPriceNGN: 2415000, // 1750 * 1380
    deliverables: [
      "Everything in Foundation",
      "Financial Tracking and Unit Economics Dashboard, monitored monthly",
      "Full access to the tools suite, including Inventory Manager and Reach and Growth Planner",
      "A monthly team training session on the systems in place",
      "Bi-weekly check ins",
    ],
    outcomes: ["A full financial picture you can act on", "A team aligned on how the business runs", "Steady, structured growth"],
  },
  {
    slug: "full-support",
    title: "Full Support",
    purpose: "An ongoing partnership for founders who want continued support as the business grows, including the mentorship and accountability most clients ask for after the first three tiers.",
    monthlyPrice: 3900,
    monthlyPriceNGN: 5382000, // 3900 * 1380
    deliverables: [
      "Everything in Growth",
      "Ongoing mentorship and accountability check ins",
      "Priority access for new questions or reviews",
      "Business reviews",
    ],
    outcomes: ["A consistent partner in your corner", "Decisions made with confidence", "Long term, sustainable growth"],
  },
];

export function annualMonthlyPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * 0.8) / 12;
}

// Each individual offer page sells access via the membership tier that
// includes it, since the four offers are the deliverables and the four
// packages above are what is actually billed.
export const offerToPackageSlug: Record<string, string> = {
  "business-structure-diagnostic": "diagnostic",
  "sop-vault": "foundation",
  "go-to-market-offer-playbook": "foundation",
  "financial-tracking-dashboard": "growth",
};

export function annualTotalPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * 0.8);
}

export const addOns = [
  "Legal and Business Name Registration",
  "Domain and Email Setup",
  "Full Website Development",
  "SEO and Content Management",
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

// Real client logos only. Leave empty until actual logo files are supplied -
// the trust bar hides itself rather than showing placeholder/fake brands.
export const clientLogos: { name: string; src: string }[] = [];
