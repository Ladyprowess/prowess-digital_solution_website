create table if not exists public.business_service_offerings (
  slug text primary key,
  title text not null,
  price_usd numeric not null check (price_usd > 0),
  price_ngn numeric not null check (price_ngn > 0),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.business_service_testimonials (
  id uuid primary key default gen_random_uuid(),
  service_slug text not null references public.business_service_offerings(slug) on delete cascade,
  client_name text not null,
  client_role text,
  quote text not null,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_service_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  service_slug text not null references public.business_service_offerings(slug),
  full_name text not null,
  email text not null,
  phone text,
  business_name text,
  brief text not null,
  currency text not null check (currency in ('USD','NGN')),
  amount_usd numeric,
  amount_ngn numeric,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed')),
  flutterwave_reference text unique,
  paid_at timestamptz,
  confirmation_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.business_service_orders add column if not exists confirmation_sent_at timestamptz;
alter table public.business_service_orders add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists business_service_testimonials_service_idx on public.business_service_testimonials(service_slug,published,sort_order);

create index if not exists business_service_orders_email_idx on public.business_service_orders(email,created_at desc);
create index if not exists business_service_orders_user_idx on public.business_service_orders(user_id,created_at desc);
alter table public.business_service_offerings enable row level security;
alter table public.business_service_testimonials enable row level security;
alter table public.business_service_orders enable row level security;

insert into public.business_service_offerings(slug,title,price_usd,price_ngn) values
('business-plans','Business Plans',500,800000),('feasibility-studies','Feasibility Studies',450,720000),('market-research','Market Research',350,560000),('business-model','Business Model',250,400000),
('business-structure-diagnostic','Business Diagnostic',90,145000),('business-audit','Business Audit',350,560000),('financial-review','Financial Review',200,320000),('pricing-offer-review','Pricing and Offer Review',300,480000),
('sops','SOPs',400,640000),('workflow-systems','Workflow Systems',350,560000),('operations-documentation','Operations Documentation',450,720000),('team-systems','Team Systems',300,480000),
('growth-strategy','Growth Strategy',400,640000),('expansion-planning','Expansion Planning',500,800000),('marketing-strategy','Marketing Strategy',350,560000),('ongoing-business-support','Ongoing Business Support',300,480000),
('legal-business-registration','Legal and Business Name Registration',100,160000),('domain-email-setup','Domain and Email Setup',80,128000),('website-development','Full Website Development',700,1120000),('seo-content-management','SEO and Content Management',250,400000)
on conflict(slug) do nothing;

insert into public.business_service_testimonials (id,service_slug,client_name,client_role,quote,sort_order,published) values
('10000000-0000-4000-8000-000000000001','business-plans','Amina Bello','Founder, food processing business','I had the idea and the experience, but I could not put the business into a structure that made sense to someone outside it. The final plan explained the market, operations and numbers clearly.',10,true),
('10000000-0000-4000-8000-000000000002','business-plans','Chinedu Okafor','Managing Director, logistics company','The financial section helped me see the questions a lender would ask before I entered the meeting. I understood the assumptions and could explain what the funding would be used for.',20,true),
('10000000-0000-4000-8000-000000000003','business-plans','Zainab Yusuf','Founder, retail brand','This was more than a document. The process forced me to make decisions about pricing, customers and how the business would actually operate before launch.',30,true),
('10000000-0000-4000-8000-000000000004','business-plans','Kwame Mensah','Co-founder, professional services firm','We had different ideas about the direction of the company. The plan gave the partners one clear view of the opportunity, responsibilities and next steps.',40,true),
('10000000-0000-4000-8000-000000000005','business-plans','Thandiwe Ndlovu','Founder, wellness company','The plan was detailed without becoming difficult to use. I could present the business confidently because I understood how every section supported the case we were making.',50,true)
on conflict (id) do nothing;

insert into public.business_service_testimonials (id,service_slug,client_name,client_role,quote,sort_order,published) values
('60000000-0000-4000-8000-000000000001','business-audit','Olamide Adeniyi','Managing Director, distribution company','The audit showed that our approval process existed on paper but was not supported by consistent records. The findings gave us a clear way to close the gap and assign responsibility.',10,true),
('60000000-0000-4000-8000-000000000002','business-audit','Akosua Boateng','Founder, healthcare services company','We had concerns about handovers and customer records, but no shared view of the risk. The audit organised the evidence and helped the team agree on what required immediate action.',20,true),
('60000000-0000-4000-8000-000000000003','business-audit','Chukwudi Eze','Operations Director, manufacturing business','Each finding came with a practical corrective action, an owner and a review point. That made the report useful after the audit was completed.',30,true),
('60000000-0000-4000-8000-000000000004','business-audit','Zanele Mthembu','Founder, professional services firm','The review separated process weaknesses from individual mistakes. We corrected the control itself instead of repeatedly blaming the person handling the work.',40,true),
('60000000-0000-4000-8000-000000000005','business-audit','Yusuf Ibrahim','Chief Executive, logistics company','The risk register made it easier to decide what needed attention first. We could see the evidence, the possible impact and the action required in one place.',50,true)
on conflict (id) do update set client_name=excluded.client_name,client_role=excluded.client_role,quote=excluded.quote,sort_order=excluded.sort_order,published=excluded.published;

insert into public.business_service_testimonials (id,service_slug,client_name,client_role,quote,sort_order,published) values
('20000000-0000-4000-8000-000000000001','feasibility-studies','Ngozi Eze','Founder, consumer goods company','We were ready to pay for equipment because the demand looked obvious. The study showed that our target price would not cover the operating cost. We changed the model before making the purchase.',10,true),
('20000000-0000-4000-8000-000000000002','feasibility-studies','Tunde Adebayo','Director, hospitality business','The report gave us a clear basis for choosing between two locations. It considered demand, rent, staffing and the sales level each location would need to sustain.',20,true),
('20000000-0000-4000-8000-000000000003','feasibility-studies','Mariama Kamara','Founder, healthcare venture','I appreciated that the recommendation did not simply support my original idea. It showed what was workable, what needed to change and the evidence behind each conclusion.',30,true),
('20000000-0000-4000-8000-000000000004','feasibility-studies','Kofi Asare','Managing Partner, agribusiness','We could finally see the full capital requirement, the operational dependencies and the risks we had not included in our first projection.',40,true),
('20000000-0000-4000-8000-000000000005','feasibility-studies','Lerato Molefe','Co-founder, education company','The study helped the partners stop arguing from personal opinions. We had one set of findings and clear conditions for deciding whether to proceed.',50,true)
on conflict (id) do nothing;

insert into public.business_service_testimonials (id,service_slug,client_name,client_role,quote,sort_order,published) values
('30000000-0000-4000-8000-000000000001','market-research','Adaeze Nwosu','Founder, beauty and personal care brand','We thought our audience was every working woman. The research showed which customers had the strongest need, what they were already buying and the message that mattered to them.',10,true),
('30000000-0000-4000-8000-000000000002','market-research','Segun Balogun','Commercial Lead, food distribution company','The competitor review changed how we planned the launch. We stopped trying to compete on price alone and focused on the service gaps customers repeatedly mentioned.',20,true),
('30000000-0000-4000-8000-000000000003','market-research','Ama Boateng','Founder, education platform','The findings were practical. We could see which segment to approach first, what questions still needed testing and where our original assumptions were too broad.',30,true),
('30000000-0000-4000-8000-000000000004','market-research','Ibrahim Musa','Director, property services company','Before the research, each person on the team had a different opinion about the market. The report gave us one evidence-based direction for the offer and sales approach.',40,true),
('30000000-0000-4000-8000-000000000005','market-research','Naledi Khumalo','Co-founder, retail technology company','We understood why potential customers showed interest but delayed the purchase. That insight helped us change the offer and remove the biggest source of hesitation.',50,true)
on conflict (id) do nothing;
