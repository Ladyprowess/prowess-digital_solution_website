import type { CVData } from "@/lib/cvBuilder/validate";

type ExperienceItem = {
  role: string;
  company: string;
  dates: string;
  bullets: string[];
};

export type PreviewData = {
  name: string;
  title: string;
  contact: string;
  summary: string;
  experience: ExperienceItem[];
  skills: string[];
  education: string[];
  extras: string[];
  metrics?: string[];
  accent: string;
  soft: string;
  dark: string;
};

export const PREVIEWS: Record<string, PreviewData> = {
  plain: {
    name: "Maya Okafor",
    title: "Operations Associate",
    contact: "Lagos, Nigeria | maya.okafor@email.com | 0800 000 0000 | linkedin.com/in/mayaokafor",
    summary: "Organised operations professional with experience coordinating internal workflows, improving reporting habits and supporting customer facing teams. Known for clear documentation, reliable follow through and turning scattered tasks into simple weekly systems.",
    experience: [
      {
        role: "Operations Associate",
        company: "BrightWorks Studio",
        dates: "Jan 2022 to Present",
        bullets: [
          "Created weekly operations reports used by leadership to track team workload, customer requests and open tasks.",
          "Documented repeat admin processes, reducing missed handoffs and making onboarding easier for new team members.",
          "Coordinated vendor follow ups, meeting notes and client records across a 12 person delivery team.",
        ],
      },
      {
        role: "Administrative Intern",
        company: "Cedar Point Services",
        dates: "Jun 2020 to Dec 2021",
        bullets: [
          "Updated client files, prepared meeting summaries and supported front desk communication.",
          "Helped organise digital folders so contracts, invoices and client documents were easier to find.",
        ],
      },
    ],
    skills: ["Operations support", "Customer records", "Reporting", "Google Workspace", "CRM updates", "Documentation"],
    education: ["B.Sc. Business Administration, University of Lagos", "Certificate in Project Coordination"],
    extras: ["Available for hybrid or remote operations roles", "Strong written communication and task ownership"],
    accent: "#507c80",
    soft: "#e8f1f2",
    dark: "#233739",
  },
  modern: {
    name: "Daniel Carter",
    title: "Customer Success Manager",
    contact: "Remote | daniel.carter@email.com | danielcarter.co | linkedin.com/in/danielcarter",
    summary: "Customer success manager helping growing SaaS teams improve onboarding, renewals and customer communication. Combines relationship management with practical process design so users get value earlier and support teams work with less friction.",
    experience: [
      {
        role: "Customer Success Manager",
        company: "ScaleDesk",
        dates: "Mar 2021 to Present",
        bullets: [
          "Managed a portfolio of 85 business accounts and improved renewal rate from 71 percent to 84 percent within one year.",
          "Built onboarding guides, lifecycle emails and product training notes used by more than 600 client users.",
          "Partnered with product and support teams to identify recurring customer issues and improve help content.",
        ],
      },
      {
        role: "Account Support Specialist",
        company: "NexaCloud",
        dates: "Aug 2018 to Feb 2021",
        bullets: [
          "Resolved customer issues across email and chat while maintaining a first response time under 2 hours.",
          "Prepared monthly account health summaries for priority customers and renewal conversations.",
        ],
      },
    ],
    skills: ["Customer retention", "Onboarding", "CRM", "Account health", "Training", "SaaS support"],
    education: ["B.A. Communications, University of Birmingham", "Customer Success Management Certificate"],
    extras: ["Tools: HubSpot, Intercom, Notion, Google Sheets", "Strengths: calm communication, follow up, documentation"],
    accent: "#315f63",
    soft: "#e4eeee",
    dark: "#22383b",
  },
  executive: {
    name: "Amara Johnson",
    title: "Head of People Operations",
    contact: "London, UK | amara.johnson@email.com | linkedin.com/in/amarajohnson",
    summary: "Senior people operations leader with 10 years of experience building hiring systems, performance rhythms and culture programs for growing teams. Trusted by founders and executives to bring structure, clarity and care into fast moving organisations.",
    experience: [
      {
        role: "Head of People Operations",
        company: "Northline Group",
        dates: "2019 to Present",
        bullets: [
          "Led hiring for 48 roles across product, operations, sales and customer teams in three markets.",
          "Introduced performance review cycles, manager toolkits and onboarding standards adopted company wide.",
          "Reduced time to hire by 32 percent through clearer scorecards, interviewer training and weekly hiring reviews.",
        ],
      },
      {
        role: "People Operations Lead",
        company: "Harbour Labs",
        dates: "2015 to 2019",
        bullets: [
          "Built the first employee handbook, payroll workflow and internal feedback process for a 70 person team.",
          "Supported leadership planning during expansion from one office to four regional hubs.",
        ],
      },
    ],
    skills: ["Leadership", "Hiring systems", "Performance management", "Employee relations", "Change management", "Executive advising"],
    education: ["MBA, Human Resources, Warwick Business School", "B.Sc. Psychology, University of Bristol"],
    extras: ["Board reporting, compensation reviews and manager coaching", "Speaker at People Operations Africa 2025"],
    metrics: ["48 hires", "32% faster hiring", "4 office expansion"],
    accent: "#24383a",
    soft: "#eef1ef",
    dark: "#172426",
  },
  compact: {
    name: "John Doe",
    title: "Business Analyst",
    contact: "Abuja, Nigeria | john.doe@email.com | 0800 000 0000 | linkedin.com/in/johndoe",
    summary: "Business analyst with strong research, reporting and process mapping experience for finance and operations teams. Skilled at translating business questions into clear dashboards, decision notes and action plans.",
    experience: [
      {
        role: "Business Analyst",
        company: "Meridian Finance",
        dates: "2020 to Present",
        bullets: [
          "Mapped 14 core workflows and identified handoff gaps affecting reporting, approvals and customer updates.",
          "Built management dashboards used in monthly planning, revenue reviews and expense tracking meetings.",
          "Analysed customer records to support a retention plan that improved repeat activity by 19 percent.",
        ],
      },
      {
        role: "Research Assistant",
        company: "Prime Insight",
        dates: "2018 to 2020",
        bullets: [
          "Prepared competitor summaries, survey analysis and presentation notes for client strategy projects.",
          "Cleaned large spreadsheet datasets and created charts for weekly internal reports.",
        ],
      },
    ],
    skills: ["Excel", "SQL basics", "Power BI", "Research", "Process mapping", "Presentation writing"],
    education: ["B.Sc. Economics, University of Abuja", "Google Data Analytics Certificate"],
    extras: ["Tools: Excel, Power BI, Notion, Google Sheets", "Good fit for analyst, operations and strategy roles"],
    metrics: ["14 workflows", "19% retention lift", "Monthly dashboards"],
    accent: "#4b5f68",
    soft: "#edf1f3",
    dark: "#27333a",
  },
  creative: {
    name: "Lina Brooks",
    title: "Brand Designer",
    contact: "Accra, Ghana | lina@email.com | linabrooks.co | Behance",
    summary: "Brand designer creating visual identities, campaign systems and launch assets for small businesses and creators. Blends clean design thinking with practical delivery so teams can use the brand confidently after launch.",
    experience: [
      {
        role: "Brand Designer",
        company: "Lina Brooks Studio",
        dates: "2020 to Present",
        bullets: [
          "Designed brand identity systems for 26 founders across beauty, education, lifestyle and consulting.",
          "Created campaign templates, social media kits and launch decks that helped clients show up consistently.",
          "Built case studies that increased referral enquiries and made the design process easier to explain.",
        ],
      },
      {
        role: "Content Design Associate",
        company: "Bloom Digital",
        dates: "2018 to 2020",
        bullets: [
          "Designed weekly content visuals for Instagram, email and event campaigns.",
          "Collaborated with copywriters to turn campaign ideas into visual systems and brand stories.",
        ],
      },
    ],
    skills: ["Brand identity", "Figma", "Canva", "Campaign design", "Art direction", "Case studies"],
    education: ["Diploma in Visual Design, Radford Design Institute", "Certificate in Brand Strategy"],
    extras: ["Portfolio: linabrooks.co/projects", "Selected clients: Kora Beauty, Bloom Digital, Studio Mina"],
    metrics: ["26 brands", "84 campaign assets", "12 launch decks"],
    accent: "#6c7d4f",
    soft: "#f0f2e8",
    dark: "#3f4931",
  },
  tech: {
    name: "Ife Mensah",
    title: "Frontend Developer",
    contact: "Remote | ife.mensah@email.com | github.com/ife-dev | ifemensah.dev",
    summary: "Frontend developer building accessible dashboards, payment flows and responsive web applications. Comfortable working from product requirements to polished user interfaces with React, TypeScript and API integrations.",
    experience: [
      {
        role: "Frontend Developer",
        company: "CloudLedger",
        dates: "2021 to Present",
        bullets: [
          "Shipped a finance reporting dashboard used by 4,000 monthly users across web and mobile browsers.",
          "Improved Lighthouse performance from 62 to 91 by reducing bundle size, fixing image loading and cleaning render paths.",
          "Built reusable form, table and empty state components now used across 18 internal product screens.",
        ],
      },
      {
        role: "Junior Web Developer",
        company: "PixelForge",
        dates: "2019 to 2021",
        bullets: [
          "Developed landing pages, admin panels and client dashboards using React, CSS modules and REST APIs.",
          "Worked with designers to improve responsive behaviour, accessibility labels and browser consistency.",
        ],
      },
    ],
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "API integration", "Accessibility"],
    education: ["B.Eng. Computer Engineering, KNUST", "Frontend Masters JavaScript Path"],
    extras: ["Projects: invoice dashboard, job board, payment checkout", "Testing: Jest, Playwright basics, browser QA"],
    metrics: ["4,000 users", "91 performance score", "18 reusable screens"],
    accent: "#3f6f68",
    soft: "#e8f2ef",
    dark: "#24403d",
  },
  academic: {
    name: "Dr. Sarah Williams",
    title: "Research Fellow",
    contact: "Cape Town, South Africa | sarah@email.com | Google Scholar | ORCID",
    summary: "Research fellow focused on public health policy, evidence synthesis and graduate teaching. Experienced in qualitative research, manuscript development, ethics documentation and supervising early career researchers.",
    experience: [
      {
        role: "Research Fellow",
        company: "Institute for Health Systems",
        dates: "2018 to Present",
        bullets: [
          "Published 9 peer reviewed articles on health access, service delivery and public policy implementation.",
          "Led ethics submissions, interview guides and data analysis for a multi site health systems study.",
          "Supervised 12 postgraduate research projects and supported student conference presentations.",
        ],
      },
      {
        role: "Lecturer",
        company: "Cape Town School of Public Health",
        dates: "2015 to 2018",
        bullets: [
          "Taught research methods, policy analysis and academic writing to undergraduate and graduate students.",
          "Coordinated assessment rubrics, guest lectures and departmental seminar schedules.",
        ],
      },
    ],
    skills: ["Qualitative research", "Policy analysis", "Academic writing", "Teaching", "Ethics", "Supervision"],
    education: ["Ph.D. Public Health, University of Cape Town", "M.Sc. Health Policy, University of Pretoria"],
    extras: ["Publications: 9 peer reviewed articles, 3 policy briefs", "Grants: Health Access Research Fund, 2023"],
    metrics: ["9 articles", "12 projects supervised", "3 policy briefs"],
    accent: "#40565a",
    soft: "#edf0f1",
    dark: "#253235",
  },
  graduate: {
    name: "Tomi Adeyemi",
    title: "Graduate Trainee",
    contact: "Ibadan, Nigeria | tomi.adeyemi@email.com | LinkedIn | 0800 000 0000",
    summary: "Recent management graduate with internship experience, strong research skills and a clear interest in business operations. Brings curiosity, organised documentation and the confidence to support teams with practical day to day execution.",
    experience: [
      {
        role: "Operations Intern",
        company: "GreenMart",
        dates: "Mar 2025 to Aug 2025",
        bullets: [
          "Prepared stock reports for weekly review and helped managers track fast moving items across two branches.",
          "Cleaned customer records in the CRM and corrected duplicate entries before a loyalty campaign.",
          "Supported supplier communication, meeting notes and branch expense documentation.",
        ],
      },
      {
        role: "Class Representative",
        company: "Faculty of Management Sciences",
        dates: "2023 to 2024",
        bullets: [
          "Coordinated communication between lecturers and more than 120 students during final year project season.",
          "Organised peer study sessions and shared resource summaries before major exams.",
        ],
      },
    ],
    skills: ["Research", "Excel", "Writing", "Team coordination", "Customer records", "Presentation"],
    education: ["B.Sc. Management, First Class Honours", "NYSC, Community Development Group Secretary"],
    extras: ["Final project: Digital tools and small business performance", "Available for trainee, intern and entry level roles"],
    metrics: ["First Class", "120 students", "2 branch reports"],
    accent: "#5f7b80",
    soft: "#e8f1f2",
    dark: "#31474a",
  },
  consulting: {
    name: "Victor Allen",
    title: "Strategy Consultant",
    contact: "New York, USA | victor.allen@email.com | linkedin.com/in/victorallen",
    summary: "Consultant helping founders clarify unit economics, market positioning and growth priorities. Strong at turning messy information into practical models, executive summaries and focused implementation plans.",
    experience: [
      {
        role: "Strategy Consultant",
        company: "MarketBridge Advisory",
        dates: "2020 to Present",
        bullets: [
          "Built pricing and unit economics models for 18 founder led companies across services, commerce and SaaS.",
          "Supported a go to market plan that helped one client grow quarterly revenue by 28 percent.",
          "Created investor ready market maps, competitor reviews and operating dashboards for leadership teams.",
        ],
      },
      {
        role: "Business Analyst",
        company: "Keller Strategy Group",
        dates: "2017 to 2020",
        bullets: [
          "Prepared client research, financial models and workshop materials for strategy engagements.",
          "Presented weekly analysis updates to managers and incorporated feedback into board level summaries.",
        ],
      },
    ],
    skills: ["Strategy", "Finance", "Go to market", "Market research", "Dashboards", "Executive writing"],
    education: ["M.Sc. Management, NYU Stern", "B.A. Economics, Howard University"],
    extras: ["Engagements: pricing, market sizing, retention, customer segmentation", "Tools: Excel, PowerPoint, Airtable, Tableau"],
    metrics: ["18 clients", "28% revenue growth", "6 market maps"],
    accent: "#2f595d",
    soft: "#e7eeee",
    dark: "#1f3639",
  },
};

const DEFAULT_PREVIEW = PREVIEWS.plain;

function cleanList(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

function dateRange(startDate: string, endDate: string, current: boolean) {
  const start = startDate.trim();
  const end = current ? "Present" : endDate.trim();
  if (start && end) return `${start} to ${end}`;
  if (start) return start;
  if (end) return end;
  return "";
}

function splitDateRange(dates: string) {
  const [start = "", end = ""] = dates.split(/\s+to\s+/i);
  return {
    startDate: start.trim(),
    endDate: end.trim().toLowerCase() === "present" ? "" : end.trim(),
    current: end.trim().toLowerCase() === "present",
  };
}

function splitContact(contact: string) {
  const [location = "", email = "", phoneOrLink = "", linkOrWebsite = ""] = contact.split("|").map((item) => item.trim());
  const looksLikePhone = /[0-9]/.test(phoneOrLink) && !phoneOrLink.includes(".");
  return {
    location,
    email,
    phone: looksLikePhone ? phoneOrLink : "",
    linkedin: looksLikePhone ? linkOrWebsite : phoneOrLink,
    website: looksLikePhone ? "" : linkOrWebsite,
  };
}

function splitEducation(item: string) {
  const parts = item.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    degree: parts[0] || item,
    field: parts.length > 2 ? parts[1] : "",
    institution: parts.length > 1 ? parts.slice(parts.length > 2 ? 2 : 1).join(", ") : "",
    startDate: "",
    endDate: "",
  };
}

export function sampleCvDataForTemplate(templateKey: string): CVData {
  const preview = PREVIEWS[templateKey] || DEFAULT_PREVIEW;
  const contact = splitContact(preview.contact);
  return {
    personalInfo: {
      fullName: preview.name,
      email: contact.email,
      phone: contact.phone,
      location: contact.location,
      linkedin: contact.linkedin,
      website: contact.website,
    },
    summary: preview.summary,
    experience: preview.experience.map((item) => ({
      company: item.company,
      title: item.role,
      ...splitDateRange(item.dates),
      bullets: item.bullets,
    })),
    education: preview.education.map(splitEducation),
    skills: preview.skills,
    highlights: preview.metrics || [],
    extras: preview.extras,
  };
}

function previewFromCv(cvData: CVData | undefined, fallback: PreviewData): PreviewData {
  if (!cvData) return fallback;

  const contact = cleanList([
    cvData.personalInfo.location || "",
    cvData.personalInfo.email || "",
    cvData.personalInfo.phone || "",
    cvData.personalInfo.linkedin || "",
    cvData.personalInfo.website || "",
  ]).join(" | ");

  const experience = cvData.experience
    .filter((item) => item.title.trim() || item.company.trim() || item.bullets.some((bullet) => bullet.trim()))
    .map((item) => ({
      role: item.title.trim() || "Role title",
      company: item.company.trim() || "Company name",
      dates: dateRange(item.startDate, item.endDate, item.current) || "Dates",
      bullets: cleanList(item.bullets).length ? cleanList(item.bullets) : ["Describe your strongest achievement, responsibility or result in this role."],
    }));

  const education = cvData.education
    .filter((item) => item.institution.trim() || item.degree.trim() || item.field?.trim())
    .map((item) => cleanList([
      item.degree,
      item.field || "",
      item.institution,
      dateRange(item.startDate, item.endDate, false),
    ]).join(", "));

  const extras = cleanList(cvData.extras || []);
  const highlights = cleanList(cvData.highlights || []);

  return {
    ...fallback,
    name: cvData.personalInfo.fullName.trim() || fallback.name,
    title: experience[0]?.role || fallback.title,
    contact: contact || fallback.contact,
    summary: cvData.summary.trim() || fallback.summary,
    experience: experience.length ? experience : fallback.experience,
    skills: cleanList(cvData.skills).length ? cleanList(cvData.skills) : fallback.skills,
    education: education.length ? education : fallback.education,
    extras,
    metrics: highlights.length ? highlights : undefined,
  };
}

function SectionTitle({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="mb-1 border-b border-border pb-0.5">
      <p className="text-[6.5px] font-bold uppercase leading-none" style={{ color }}>{children}</p>
    </div>
  );
}

function ExperienceBlock({ item, dense = false }: { item: ExperienceItem; dense?: boolean }) {
  return (
    <div className={dense ? "mt-1.5" : "mt-2"}>
      <div className="flex items-start justify-between gap-1">
        <div>
          <p className="text-[6.7px] font-bold leading-tight text-foreground">{item.role}</p>
          <p className="text-[5.8px] leading-tight text-muted-foreground">{item.company}</p>
        </div>
        <p className="max-w-[34%] text-right text-[5.4px] leading-tight text-muted-foreground">{item.dates}</p>
      </div>
      <ul className="mt-1 list-disc space-y-0.5 pl-2 text-[5.9px] leading-snug text-muted-foreground">
        {item.bullets.slice(0, dense ? 2 : 3).map((itemText) => <li key={itemText}>{itemText}</li>)}
      </ul>
    </div>
  );
}

function SkillsList({ data, chips = false, limit = 6 }: { data: PreviewData; chips?: boolean; limit?: number }) {
  if (chips) {
    return (
      <div className="grid grid-cols-2 gap-1">
        {data.skills.slice(0, limit).map((skill) => (
          <p key={skill} className="rounded-sm px-1 py-0.5 text-center text-[5.4px] font-bold leading-tight" style={{ backgroundColor: data.soft, color: data.dark }}>{skill}</p>
        ))}
      </div>
    );
  }

  return (
    <p className="text-[5.9px] leading-snug text-muted-foreground">{data.skills.slice(0, limit).join(" | ")}</p>
  );
}

function StandardBody({ data, dense = false }: { data: PreviewData; dense?: boolean }) {
  return (
    <div className={dense ? "space-y-1.5" : "space-y-2"}>
      <section>
        <SectionTitle color={data.accent}>Profile</SectionTitle>
        <p className="text-[6.1px] leading-snug text-muted-foreground">{data.summary}</p>
      </section>
      <section>
        <SectionTitle color={data.accent}>Experience</SectionTitle>
        {data.experience.slice(0, dense ? 2 : 2).map((item) => (
          <ExperienceBlock key={`${item.role}-${item.company}`} item={item} dense={dense} />
        ))}
      </section>
      <section>
        <SectionTitle color={data.accent}>Skills</SectionTitle>
        <SkillsList data={data} limit={dense ? 5 : 6} />
      </section>
      <section>
        <SectionTitle color={data.accent}>Education</SectionTitle>
        <p className="text-[5.9px] leading-snug text-muted-foreground">{data.education.join(" | ")}</p>
      </section>
    </div>
  );
}

export function TemplatePreview({ templateKey, cvData }: { templateKey: string; cvData?: CVData }) {
  const data = previewFromCv(cvData, PREVIEWS[templateKey] || DEFAULT_PREVIEW);

  if (templateKey === "creative") {
    return (
      <div className="grid h-full grid-cols-[34%_1fr] bg-card text-foreground">
        <aside className="p-2 text-primary-foreground" style={{ backgroundColor: data.accent }}>
          <div className="h-10 rounded-md bg-primary-foreground/90" />
          <p className="mt-2.5 text-[7px] font-bold leading-tight">{data.name}</p>
          <p className="mt-0.5 text-[5.8px] leading-tight opacity-85">{data.title}</p>
          <p className="mt-2 text-[5px] leading-snug opacity-80">{data.contact}</p>
          <div className="mt-3 space-y-1">
            {data.skills.slice(0, 5).map((skill) => (
              <p key={skill} className="rounded-sm bg-primary-foreground/18 px-1.5 py-0.5 text-[5.3px] font-semibold leading-tight">{skill}</p>
            ))}
          </div>
          <div className="mt-3 text-[5px] leading-snug opacity-80">
            {data.extras.slice(0, 2).map((extra) => <p key={extra} className="mb-1">{extra}</p>)}
          </div>
        </aside>
        <div className="p-2.5">
          <StandardBody data={data} dense />
        </div>
      </div>
    );
  }

  if (templateKey === "executive") {
    return (
      <div className="h-full bg-card p-4 text-foreground">
        <header className="text-center">
          <p className="text-[12px] font-bold leading-tight" style={{ color: data.dark }}>{data.name}</p>
          <p className="mt-1 text-[6.8px] font-semibold leading-tight" style={{ color: data.accent }}>{data.title}</p>
          <p className="mt-1 border-y border-border py-1 text-[5.2px] leading-tight text-muted-foreground">{data.contact}</p>
        </header>
        {data.metrics?.length ? <div className="mt-2.5 grid grid-cols-3 gap-1">
          {data.metrics?.map((metric) => (
            <p key={metric} className="rounded-sm px-1 py-1 text-center text-[5.3px] font-bold leading-tight" style={{ backgroundColor: data.soft, color: data.dark }}>{metric}</p>
          ))}
        </div> : null}
        <div className="mt-2.5">
          <StandardBody data={data} dense />
        </div>
      </div>
    );
  }

  if (templateKey === "academic") {
    return (
      <div className="h-full bg-card p-4 text-foreground">
        <header className="text-center">
          <p className="text-[11.5px] font-bold leading-tight" style={{ color: data.dark }}>{data.name}</p>
          <p className="mt-1 text-[6.8px] font-semibold leading-tight" style={{ color: data.accent }}>{data.title}</p>
          <p className="mt-1 border-y border-border py-1 text-[5.2px] leading-tight text-muted-foreground">{data.contact}</p>
        </header>
        <div className="mt-2.5 space-y-1.5">
          <section>
            <SectionTitle color={data.accent}>Research Profile</SectionTitle>
            <p className="text-[6px] leading-snug text-muted-foreground">{data.summary}</p>
          </section>
          <section>
            <SectionTitle color={data.accent}>Education</SectionTitle>
            {data.education.map((item) => <p key={item} className="text-[5.8px] leading-snug text-muted-foreground">{item}</p>)}
          </section>
          <section>
            <SectionTitle color={data.accent}>Academic Experience</SectionTitle>
            {data.experience.map((item) => <ExperienceBlock key={`${item.role}-${item.company}`} item={item} dense />)}
          </section>
          {data.extras.length ? <section>
            <SectionTitle color={data.accent}>Publications and Grants</SectionTitle>
            {data.extras.map((extra) => <p key={extra} className="text-[5.8px] leading-snug text-muted-foreground">{extra}</p>)}
          </section> : null}
        </div>
      </div>
    );
  }

  if (templateKey === "tech") {
    return (
      <div className="h-full bg-card p-3 text-foreground">
        <header className="border-b border-border pb-2">
          <p className="text-[11px] font-bold leading-tight" style={{ color: data.dark }}>{data.name}</p>
          <p className="text-[6.8px] font-semibold leading-tight" style={{ color: data.accent }}>{data.title}</p>
          <p className="mt-1 text-[5.2px] text-muted-foreground">{data.contact}</p>
        </header>
        <div className="mt-2">
          <SkillsList data={data} chips />
        </div>
        <div className="mt-2.5">
          <StandardBody data={data} dense />
        </div>
        <section className="mt-1.5">
          <SectionTitle color={data.accent}>Selected Projects</SectionTitle>
          <p className="text-[5.8px] leading-snug text-muted-foreground">{data.extras.join(" | ")}</p>
        </section>
      </div>
    );
  }

  if (templateKey === "compact") {
    return (
      <div className="h-full bg-card p-3 text-foreground">
        <header className="flex items-start justify-between gap-2 border-b border-border pb-2">
          <div>
            <p className="text-[10.5px] font-bold leading-tight" style={{ color: data.dark }}>{data.name}</p>
            <p className="text-[6.2px] font-semibold leading-tight" style={{ color: data.accent }}>{data.title}</p>
          </div>
          <p className="max-w-[42%] text-right text-[4.8px] leading-tight text-muted-foreground">{data.contact}</p>
        </header>
        <div className="mt-2 grid grid-cols-[1fr_35%] gap-2">
          <StandardBody data={data} dense />
          <aside className="space-y-1.5">
            {data.metrics?.length ? <section>
              <SectionTitle color={data.accent}>Highlights</SectionTitle>
              {data.metrics?.map((metric) => <p key={metric} className="mb-1 text-[5.6px] font-bold leading-snug" style={{ color: data.dark }}>{metric}</p>)}
            </section> : null}
            <section>
              <SectionTitle color={data.accent}>Skills</SectionTitle>
              <SkillsList data={data} limit={6} />
            </section>
            {data.extras.length ? <section>
              <SectionTitle color={data.accent}>Tools</SectionTitle>
              <p className="text-[5.8px] leading-snug text-muted-foreground">{data.extras[0]}</p>
            </section> : null}
          </aside>
        </div>
      </div>
    );
  }

  if (templateKey === "modern" || templateKey === "graduate") {
    return (
      <div className="h-full bg-card text-foreground">
        <header className="p-3" style={{ backgroundColor: data.soft }}>
          <p className="text-[11.5px] font-bold leading-tight" style={{ color: data.dark }}>{data.name}</p>
          <p className="mt-0.5 text-[6.8px] font-semibold leading-tight" style={{ color: data.accent }}>{data.title}</p>
          <p className="mt-1 text-[5.2px] text-muted-foreground">{data.contact}</p>
        </header>
        <div className="p-3">
          {templateKey === "graduate" ? (
            <section className="mb-2 rounded-md p-2" style={{ backgroundColor: data.soft }}>
              <SectionTitle color={data.accent}>Education and Early Experience</SectionTitle>
              <p className="text-[5.9px] leading-snug text-muted-foreground">{data.education.join(" | ")}</p>
            </section>
          ) : null}
          <StandardBody data={data} dense />
          {data.extras.length ? <section className="mt-1.5">
            <SectionTitle color={data.accent}>{templateKey === "graduate" ? "Activities" : "Additional Strengths"}</SectionTitle>
            <p className="text-[5.8px] leading-snug text-muted-foreground">{data.extras.join(" | ")}</p>
          </section> : null}
        </div>
      </div>
    );
  }

  if (templateKey === "consulting") {
    return (
      <div className="h-full bg-card p-3 text-foreground">
        <header>
          <p className="text-[11px] font-bold leading-tight" style={{ color: data.dark }}>{data.name}</p>
          <p className="text-[6.8px] font-semibold leading-tight" style={{ color: data.accent }}>{data.title}</p>
          <p className="mt-1 text-[5.2px] text-muted-foreground">{data.contact}</p>
        </header>
        {data.metrics?.length ? <div className="mt-2 grid grid-cols-3 gap-1">
          {data.metrics?.map((metric) => (
            <div key={metric} className="rounded-sm p-1 text-center" style={{ backgroundColor: data.soft }}>
              <p className="text-[5.4px] font-bold leading-tight" style={{ color: data.dark }}>{metric}</p>
            </div>
          ))}
        </div> : null}
        <div className="mt-2.5">
          <StandardBody data={data} dense />
        </div>
        {data.extras.length ? <section className="mt-1.5">
          <SectionTitle color={data.accent}>Engagement Scope</SectionTitle>
          <p className="text-[5.8px] leading-snug text-muted-foreground">{data.extras.join(" | ")}</p>
        </section> : null}
      </div>
    );
  }

  return (
    <div className="h-full bg-card p-4 text-foreground">
      <header className="border-b border-border pb-2.5">
        <p className="text-[12px] font-bold leading-tight" style={{ color: data.dark }}>{data.name}</p>
        <p className="mt-0.5 text-[6.8px] font-semibold leading-tight" style={{ color: data.accent }}>{data.title}</p>
        <p className="mt-1 text-[5.2px] text-muted-foreground">{data.contact}</p>
      </header>
      <div className="mt-3">
        <StandardBody data={data} />
      </div>
      {data.extras.length ? <section className="mt-2">
        <SectionTitle color={data.accent}>Additional Information</SectionTitle>
        <p className="text-[5.8px] leading-snug text-muted-foreground">{data.extras.join(" | ")}</p>
      </section> : null}
    </div>
  );
}
