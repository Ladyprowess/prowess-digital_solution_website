export const brand = {
  name: "Prowess Digital Solutions",
  tagline: "Discover opportunities. Build your career.",
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
  { href: "/jobs", label: "Work" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/learn", label: "Learn" },
  { href: "/tools", label: "Build" },
  { href: "/events", label: "Connect" },
] as const;

export const navMore = [
  { href: "/blog", label: "Blog" },
  { href: "/videos", label: "Videos" },
  { href: "/resources", label: "Resources" },
  { href: "/career-paths", label: "Career Paths" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "For Businesses" },
  { href: "/careers", label: "Work With Us" },
  { href: "/contact", label: "Contact Us" },
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
    desc: "Courses, videos, e-books, guides and practical resources.",
    href: "/learn",
  },
  {
    title: "Build your career",
    desc: "Career paths, skill roadmaps and professional development.",
    href: "/career-paths",
  },
  {
    title: "Find useful tools",
    desc: "Free and premium tools to help you work smarter.",
    href: "/tools",
  },
  {
    title: "Discover what's happening",
    desc: "Events, workshops, conferences and communities.",
    href: "/events",
  },
] as const;

export const whyProwess = [
  { title: "Curated", desc: "Useful content is selected and organised, not dumped in a directory." },
  { title: "Practical", desc: "Resources are focused on things you can actually use." },
  { title: "Accessible", desc: "A large portion of the platform remains free." },
  { title: "Built for growth", desc: "Follow skills and career paths instead of consuming random content." },
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
      "A fast, focused review of how your business actually runs today. In 48 to 72 hours you get an honest outside look at what is working, what is leaking time or money, and what to fix first.",
    price: "$180 – $320",
    cta: "Start the Diagnostic",
    details: {
      description:
        "A Business Structure Diagnostic is a fast, focused review of how your business actually runs today. In 48 to 72 hours, we look at your workflow, your numbers, and the way decisions get made, and hand you a clear picture of what is working, what is leaking time or money, and what to fix first.\n\nThis is not a long coaching engagement. It is a short, sharp look at your business from the outside, the kind of perspective that is hard to get when you are inside the business every day. We ask the questions you have not had time to ask yourself, and we give you a written plan you can act on immediately.\n\nSolo founders, local service businesses, and small teams everywhere use this as their starting point with us. Whether you are running a service business in Lagos, a shop in London, or a small agency in Buenos Aires, the diagnostic works the same way. We look at what is actually happening in your business, not what your business plan says should be happening.",
      whoFor: [
        "Founders who sense something is off but cannot pinpoint exactly where",
        "Solo business owners and small teams who want an outside, honest look at how things really run",
        "Local service businesses such as technicians, coaches, and boutique owners who built the business on skill, not systems",
        "Anyone about to invest more time or money in a business and wanting to know the real state of it first",
      ],
      whatYouGet: [
        "A financial and workflow review of your business as it runs today",
        "A written report identifying where time or revenue is leaking",
        "A clear, prioritised action plan you can start using immediately",
        "A fixed 48 to 72 hour turnaround from the moment we start",
        "A short call to walk through the findings together",
      ],
      notes: [
        "This is the recommended starting point for anyone new to working with us. Everything else we offer builds on what the diagnostic finds.",
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

export const contact = {
  email: "info@prowessdigitalsolutions.com",
  whatsapp: "+2348162174443",
  location: "Remote, worldwide. Based in Nigeria.",
};

// Real client logos only. Leave empty until actual logo files are supplied -
// the trust bar hides itself rather than showing placeholder/fake brands.
export const clientLogos: { name: string; src: string }[] = [];