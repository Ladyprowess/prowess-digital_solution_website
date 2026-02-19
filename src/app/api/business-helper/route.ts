import { NextResponse } from "next/server";

type InputBody = {
  businessType: string;
  problem?: string;
  details: string;
};

type ReportSection = {
  heading: string;
  paragraphs: string[];
};

type Result = {
    reportId: string;
    generatedAt: string;
  
    healthScore: number;
    healthLabel: "Strong" | "Fair" | "Needs attention" | "Critical";
    scoreNote: string;
  
    reportTitle: string;
    sections: ReportSection[];
    disclaimer: string;
  };

function normalise(s: string) {
  return (s || "").toLowerCase();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreToLabel(score: number): Result["healthLabel"] {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Fair";
  if (score >= 25) return "Needs attention";
  return "Critical";
}

function detectTags(text: string) {
  const t = normalise(text);

  // ✅ Expanded areas (includes location + customer support + quality)
  const TAGS: Record<string, string[]> = {
    sales: ["low sales", "no sales", "sales", "buyers", "orders", "conversion", "no patron", "patronise", "patronize"],
    pricing: ["price", "pricing", "expensive", "cheap", "profit", "margin", "cost", "charge", "rate", "discount"],
    cashflow: ["cashflow", "cash flow", "debt", "owing", "owe", "credit", "rent", "salary", "bills", "no money", "payment delay"],
    records: ["record", "track", "account", "book", "spreadsheet", "inventory", "stock", "profit and loss", "p&l"],
    visibility: ["instagram", "tiktok", "whatsapp", "facebook", "x", "twitter", "ads", "reach", "views", "followers", "content"],
    customerSupport: ["customer support", "support", "reply", "response time", "ignore", "rude", "attitude", "dm", "messages"],
    location: ["location", "where i am", "storefront", "shop location", "traffic", "footfall", "far", "no one comes", "area"],
    retention: ["repeat", "returning", "retention", "loyal", "complain", "complaint", "bad review", "refund", "customer care"],
    operations: ["delivery", "late", "logistics", "supplier", "process", "workflow", "delay", "order fulfilment", "fulfillment"],
    quality: ["quality", "spoilt", "spoiled", "damaged", "not good", "fake", "break", "poor finish", "stitching", "taste", "smell"],
    staff: ["staff", "worker", "team", "employee", "lazy", "resign", "hire", "training"],
    competition: ["competitor", "competition", "others sell", "same product", "market is full", "too many", "undercut"],
    demand: ["season", "seasonal", "december", "january", "slow period", "rainy season", "festive", "easter", "school resumption"],
    onlinePayments: ["payment", "transfer", "pay online", "card", "pos", "gateway", "checkout", "failed payment"],
    offer: ["offer", "package", "bundle", "promo", "promotion", "deal", "campaign"],
    trust: ["trust", "brand", "professional", "logo", "packaging", "profile", "portfolio", "testimonials", "proof"],
  };

  const tags: string[] = [];
  for (const [tag, words] of Object.entries(TAGS)) {
    if (words.some((w) => t.includes(w))) tags.push(tag);
  }

  return tags.length ? tags : ["general"];
}

function uniq(arr: string[]) {
  return [...new Set(arr)];
}

function computeScore(tags: string[], details: string) {
  let score = 72;
  const set = new Set(tags);

  // Reductions
  if (set.has("general")) score -= 10;
  if (set.has("cashflow")) score -= 12;
  if (set.has("pricing")) score -= 10;
  if (set.has("sales")) score -= 10;
  if (set.has("visibility")) score -= 8;
  if (set.has("retention")) score -= 8;
  if (set.has("operations")) score -= 7;
  if (set.has("customerSupport")) score -= 7;
  if (set.has("location")) score -= 6;
  if (set.has("quality")) score -= 7;
  if (set.has("staff")) score -= 6;

  // Small positive signals
  const t = normalise(details);
  if (t.includes("profit") || t.includes("cost")) score += 3;
  if (t.includes("track") || t.includes("record")) score += 3;
  if (t.includes("plan") || t.includes("routine")) score += 2;

  score = clamp(score, 15, 95);
  return score;
}

function friendlyAreaName(tag: string) {
  switch (tag) {
    case "sales":
      return "Sales flow";
    case "pricing":
      return "Pricing and profit";
    case "cashflow":
      return "Cash flow";
    case "records":
      return "Tracking and records";
    case "visibility":
      return "Visibility";
    case "retention":
      return "Customer retention";
    case "operations":
      return "Operations and delivery";
    case "customerSupport":
      return "Customer support";
    case "location":
      return "Location and foot traffic";
    case "quality":
      return "Product/service quality";
    case "staff":
      return "Staff and roles";
    case "competition":
      return "Competition";
    case "demand":
      return "Demand/seasonality";
    case "onlinePayments":
      return "Payments";
    case "offer":
      return "Offer structure";
    case "trust":
      return "Trust and proof";
    default:
      return "Business structure";
  }
}

function pickTopAreas(tags: string[]) {
  // Order = what usually unlocks results fastest
  const order = [
    "records",
    "pricing",
    "cashflow",
    "offer",
    "sales",
    "visibility",
    "trust",
    "customerSupport",
    "retention",
    "operations",
    "quality",
    "location",
    "staff",
    "competition",
    "demand",
    "onlinePayments",
    "general",
  ];

  const sorted = uniq(tags).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return sorted.slice(0, 5);
}

function buildReport(input: InputBody, tags: string[], score: number): Result {
  const businessType = input.businessType.trim();
  const problem = (input.problem || "").trim();
  const details = input.details.trim();

  const topAreas = pickTopAreas(tags);
  const areaText = topAreas.map(friendlyAreaName).join(", ");

  const label = scoreToLabel(score);

  const reportTitle = `Business Diagnostic Report — ${businessType}`;
  const reportId = `RPT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const generatedAt = new Date().toISOString();

  // ✅ ONE score note (no repeating lists)
  const scoreNote =
    label === "Strong"
      ? "Your business looks fairly stable, but there are still a few gaps that can reduce growth if you ignore them. The focus should be on tightening your routine, tracking, and consistency."
      : label === "Fair"
      ? "Your business has potential, but some key areas are not stable yet. The biggest wins will come from tightening your offer, tracking your numbers, and improving the customer journey."
      : label === "Needs attention"
      ? "Right now, too many important parts of the business are weak at the same time. If you fix the fundamentals (tracking, pricing, follow-up, and service delivery), you will see improvement quickly."
      : "Your business needs urgent structure. The goal is to stop avoidable losses, regain control of cash and operations, and rebuild customer trust step by step.";

  const sections: ReportSection[] = [];

  // 1) Executive Summary (clean paragraph)
  sections.push({
    heading: "Executive Summary",
    paragraphs: [
      `Based on what you shared${problem ? ` (main issue: ${problem})` : ""}, the strongest signal is that your challenge sits around ${areaText}. This does not mean everything is wrong, but it suggests that a few weak links are affecting results.`,
      `Your next progress will come from fixing one clear offer, tracking your basic numbers, and improving the customer journey from first contact to payment and delivery.`,
    ],
  });

  // 2) What You Shared (short, professional)
  sections.push({
    heading: "What You Shared",
    paragraphs: [
      `Business type: ${businessType}.`,
      problem
        ? `Main issue selected: ${problem}.`
        : "No main issue was selected, so the report is based mainly on your written details.",
      `Your details: “${details.length > 360 ? details.slice(0, 360) + "..." : details}”`,
    ],
  });

  // 3) Likely Root Causes (paragraph style, not bullets)
  const rootCauseParas: string[] = [];

  if (topAreas.includes("customerSupport")) {
    rootCauseParas.push(
      "Customer support can quietly destroy revenue. Slow replies, unclear answers, or poor attitude makes people lose interest, even when they like the product. Many sales are lost in the DM/WhatsApp stage because customers do not feel guided or reassured."
    );
  }
  if (topAreas.includes("location")) {
    rootCauseParas.push(
      "Location affects foot traffic and convenience. If the shop is hard to find, too far, or the area does not have your ideal customers, you may have a good product but still struggle with steady daily sales. In many cases, the fix is not only relocation; it can be better signage, partnerships, delivery options, or shifting focus to online acquisition."
    );
  }
  if (topAreas.includes("pricing")) {
    rootCauseParas.push(
      "Pricing problems often come from not knowing the true cost per sale. When your price is not tied to costs and profit, you can be busy and still be losing money. This is common when expenses rise and pricing remains the same."
    );
  }
  if (topAreas.includes("cashflow")) {
    rootCauseParas.push(
      "Cash flow issues usually happen when spending is not planned, credit sales delay cash, or business and personal money are mixed. Even with decent sales, cash can disappear if there is no spending routine and no weekly review."
    );
  }
  if (topAreas.includes("operations") || topAreas.includes("quality")) {
    rootCauseParas.push(
      "Operations and quality problems create refunds, complaints, and lost trust. Late delivery, inconsistent service, or poor finishing can reduce repeat purchases, which then forces you to keep chasing new customers all the time."
    );
  }
  if (topAreas.includes("visibility") || topAreas.includes("trust")) {
    rootCauseParas.push(
      "Visibility alone is not the full answer. People buy when they understand what you do, trust you, and feel the buying process is easy. If proof, pricing clarity, or a clear offer is missing, marketing effort may not convert into sales."
    );
  }
  if (rootCauseParas.length === 0) {
    rootCauseParas.push(
      "From what you shared, the core need is a simple operating system for your business: a clear offer, simple pricing logic, basic tracking, consistent follow-up, and reliable delivery."
    );
  }

  sections.push({
    heading: "Likely Root Causes",
    paragraphs: rootCauseParas,
  });

  // 4) Practical Recommendations (3 phases, paragraph style)
  const immediate = [
    "Start by writing one clear offer for the next 7 days. Focus on one product/service that you can deliver well, set a clear price, and define how people should order.",
    "Track your basics daily: sales, expenses, and profit. You do not need a complicated system; consistency matters more than perfection.",
    "Fix the customer journey. Reply faster, guide customers step by step, confirm payments clearly, and give updates until delivery is complete.",
  ];

  const shortTerm = [
    "Stabilise your pricing by listing your costs and setting a minimum profit per sale. If customers complain about price, build packages so they can choose rather than forcing one option.",
    "Strengthen trust using proof. Show completed work, reviews, behind-the-scenes, and real results. This reduces hesitation and increases conversion.",
    "If location is affecting walk-in sales, improve visibility outside the shop, add delivery options, partner with nearby businesses, and push online acquisition to reduce dependence on foot traffic.",
  ];

  const mediumTerm = [
    "Put a weekly routine in place. Choose one day for review (numbers, complaints, stock), one day for marketing planning, and one day for operations improvement.",
    "If staff is involved, define roles and simple rules. Most team issues reduce when expectations are written down and reviewed weekly.",
    "Review performance monthly. Identify what made money, what wasted money, and what to stop doing next month.",
  ];

  sections.push({
    heading: "Recommendations",
    paragraphs: [
      "Immediate focus (next 7 days): " + immediate.join(" "),
      "Short-term focus (next 2–4 weeks): " + shortTerm.join(" "),
      "Medium-term focus (next 1–3 months): " + mediumTerm.join(" "),
    ],
  });

  // 5) What to Track (minimal, professional: short paragraph + small list-like sentence)
  sections.push({
    heading: "What to Track",
    paragraphs: [
      "To avoid guessing, track a small set of numbers consistently. Focus on sales, expenses, profit, customer enquiries, conversion, and complaints. When you track these, you will see what is working and what is wasting money.",
      "Suggested metrics: Daily sales, daily expenses, profit (sales minus expenses), number of enquiries, number of sales, repeat customers, and complaints per week.",
    ],
  });

  // 6) Common Mistakes (sentence style)
  sections.push({
    heading: "Common Mistakes to Avoid",
    paragraphs: [
      "Avoid changing your offer every two days. Consistency helps customers understand you and helps you measure what works.",
      "Avoid relying on vibes for pricing. If you do not know costs and profit per sale, you may be working hard and still losing money.",
      "Avoid poor follow-up. Many sales come from simple reminders and proper guidance, not from more posting.",
      "Avoid mixing business money with personal spending. It makes tracking impossible and causes cash flow stress.",
    ],
  });

  // 7) Next step / CTA (professional)
  sections.push({
    heading: "Next Step",
    paragraphs: [
      "If you want a personalised plan, the fastest approach is a short review session where we look at your offer, pricing, basic numbers, and customer journey, then create a simple routine you can follow weekly.",
    ],
  });

  return {
    healthScore: score,
    healthLabel: label,
    scoreNote,
    detectedAreas: topAreas,
    reportTitle,
    sections,
    disclaimer:
      "This report provides general guidance and does not replace professional legal, tax, or financial advice. For tailored support, book a consultation with Prowess Digital Solutions.",
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<InputBody>;

    const businessType = (body.businessType ?? "").trim();
    const details = (body.details ?? "").trim();
    const problem = (body.problem ?? "").trim();

    if (!businessType || !details) {
      return NextResponse.json(
        { error: "Please fill business type and details." },
        { status: 400 }
      );
    }

    const tags = uniq([
      ...detectTags(details),
      ...(problem ? detectTags(problem) : []),
    ]);

    const score = computeScore(tags, details);

    const result = buildReport({ businessType, problem, details }, tags, score);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}