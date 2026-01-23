export type CaseStudy = {
    slug: string;
    title: string;
    category: string;
    size: string; // "Small", "Medium", etc
    image: string;
  
    challenge: string;
    solution: string;
  
    results: { label: string; value: string }[];
    testimonial: { quote: string; name?: string; role?: string };
    timeline: string;
  
    // optional: extra sections for the full page
    whatWeDid?: string[];
    keyChanges?: string[];
  };
  
  export const caseStudies: CaseStudy[] = [
    {
      slug: "lagos-fashion-boutique",
      title: "Lagos Fashion Boutique",
      category: "Retail",
      size: "Small",
      image: "/images/case-studies/lagos-fashion.jpg",
      challenge:
        "Struggling with inventory management and inconsistent cash flow despite steady customer traffic.",
      solution:
        "We set up a simple stock system, clarified pricing and profit tracking, and created a weekly sales and restock routine.",
      results: [
        { label: "Stock Accuracy", value: "Improved" },
        { label: "Cash Flow Tracking", value: "Stable" },
        { label: "Restock Planning", value: "Clear" },
      ],
      testimonial: {
        quote:
          "I finally understood what was selling, what was wasting money, and what to restock. It became easier to run.",
      },
      timeline: "6 weeks",
      whatWeDid: [
        "Inventory clean-up and stock categories",
        "Simple profit tracking sheet",
        "Weekly restock and sales review routine",
      ],
      keyChanges: ["Clear pricing rules", "Weekly stock checks", "Simple reporting"],
    },
    {
      slug: "abuja-tech-startup",
      title: "Abuja Tech Startup",
      category: "Professional Services",
      size: "Small",
      image: "/images/case-studies/abuja-tech.jpg",
      challenge:
        "Rapid growth without proper systems led to operational chaos and team burnout.",
      solution:
        "Strategic planning to restructure operations. Systems optimisation for workflow automation and team coordination.",
      results: [
        { label: "Operational Efficiency", value: "70% improvement" },
        { label: "Team Productivity", value: "3x increase" },
        { label: "Client Satisfaction", value: "95% rating" },
      ],
      testimonial: {
        quote:
          "Prowess helped us scale without losing our minds. The structured approach was exactly what we needed.",
      },
      timeline: "9 months",
      whatWeDid: [
        "Clear team roles and responsibilities",
        "Weekly priority planning",
        "Simple process docs and handover flow",
        "Tracking system for tasks and delivery",
      ],
      keyChanges: ["Less confusion", "Faster delivery", "Better team communication"],
    },
    {
      slug: "ibadan-consulting-firm",
      title: "Ibadan Consulting Firm",
      category: "Professional Services",
      size: "Small",
      image: "/images/case-studies/ibadan-consulting.jpg",
      challenge:
        "Founder overwhelmed with client work, unable to focus on business growth.",
      solution:
        "We created a simple service structure, fixed the weekly schedule, and set a basic delivery process that reduced pressure.",
      results: [
        { label: "Workload Control", value: "Improved" },
        { label: "Delivery Clarity", value: "Clear" },
        { label: "Founder Focus", value: "Restored" },
      ],
      testimonial: {
        quote:
          "The business stopped feeling like fire-fighting. I could finally plan and breathe.",
      },
      timeline: "4 weeks",
    },
    {
      slug: "kano-ecommerce-store",
      title: "Kano E-commerce Store",
      category: "E-commerce",
      size: "Small",
      image: "/images/case-studies/kano-ecommerce.jpg",
      challenge:
        "High cart abandonment rates and poor conversion despite significant traffic.",
      solution:
        "We simplified product pages, fixed the checkout flow, and added follow-up messages to recover abandoned carts.",
      results: [
        { label: "Checkout Completion", value: "Improved" },
        { label: "Cart Recovery", value: "Higher" },
        { label: "Customer Trust", value: "Better" },
      ],
      testimonial: {
        quote:
          "People were visiting but not buying. After the changes, we started seeing real orders.",
      },
      timeline: "5 weeks",
    },
  ];
  