export type BusinessServiceItem = {
  title: string;
  description: string;
  href: string;
  routeLabel: string;
};

export type BusinessServiceGroup = {
  key: 'start' | 'fix' | 'organise' | 'grow';
  title: string;
  number: string;
  heading: string;
  description: string;
  services: BusinessServiceItem[];
};

const contact = (service:string) => `/contact?service=${encodeURIComponent(service)}`;

export const businessServiceGroups: BusinessServiceGroup[] = [
  {
    key:'start',number:'01',title:'Start',heading:'Turn the idea into a business you can assess.',
    description:'Clarify the market, model and numbers before committing more time or money.',
    services:[
      {title:'Business Plans',description:'Bring your market, operations, strategy and financial assumptions into one clear plan.',href:'/services/business-plans',routeLabel:'Explore business plans'},
      {title:'Feasibility Studies',description:'Assess demand, costs, risks and operating requirements before making a major commitment.',href:'/services/feasibility-studies',routeLabel:'Explore feasibility studies'},
      {title:'Market Research',description:'Understand the customers, alternatives and evidence needed to make a better decision.',href:'/services/market-research',routeLabel:'Explore market research'},
      {title:'Business Model',description:'Define how the business creates value, serves customers and earns sustainable revenue.',href:'/services/business-model',routeLabel:'Explore business modelling'},
    ],
  },
  {
    key:'fix',number:'02',title:'Fix',heading:'Find what is holding the business back.',
    description:'Review the business, its finances and its offer so you can address the right problem first.',
    services:[
      {title:'Business Diagnostic',description:'Review the business model, offer, pricing, sales process, operations and financial tracking.',href:'/services/business-structure-diagnostic',routeLabel:'Explore the diagnostic'},
      {title:'Business Audit',description:'Examine how the business currently operates and identify gaps, risks and priorities.',href:'/services/business-audit',routeLabel:'Explore business audits'},
      {title:'Financial Review',description:'Review margins, cash movement, operating assumptions and the information used for decisions.',href:'/services/financial-review',routeLabel:'Explore financial reviews'},
      {title:'Pricing and Offer Review',description:'Check whether the offer is clear, costed and positioned for the customers it needs to reach.',href:'/services/pricing-offer-review',routeLabel:'Explore offer reviews'},
    ],
  },
  {
    key:'organise',number:'03',title:'Organise',heading:'Give the work a clear and repeatable structure.',
    description:'Document how work moves through the business so the team can deliver it consistently.',
    services:[
      {title:'SOPs',description:'Write the steps, owners, inputs and checks for work that needs to be done consistently.',href:'/services/sops',routeLabel:'Explore SOP development'},
      {title:'Workflow Systems',description:'Map how tasks move between people, tools and decisions from request to completion.',href:'/services/workflow-systems',routeLabel:'Explore workflow systems'},
      {title:'Operations Documentation',description:'Create usable records for processes, responsibilities, exceptions and handovers.',href:'/services/operations-documentation',routeLabel:'Explore operations documentation'},
      {title:'Team Systems',description:'Clarify ownership, communication and operating routines as the team works together.',href:'/services/team-systems',routeLabel:'Explore team systems'},
    ],
  },
  {
    key:'grow',number:'04',title:'Grow',heading:'Move forward with direction and control.',
    description:'Plan how the business will reach more customers, enter a new market or receive ongoing support.',
    services:[
      {title:'Growth Strategy',description:'Choose growth priorities, measures and actions that fit the business and its current capacity.',href:'/services/growth-strategy',routeLabel:'Explore growth strategy'},
      {title:'Expansion Planning',description:'Assess what a new location, market, team or offer requires before committing resources.',href:'/services/expansion-planning',routeLabel:'Explore expansion planning'},
      {title:'Marketing Strategy',description:'Focus the message, audience and channels used to reach and convert relevant customers.',href:'/services/marketing-strategy',routeLabel:'Explore marketing strategy'},
      {title:'Ongoing Business Support',description:'Receive continued review, accountability and business support as priorities change.',href:'/services/ongoing-business-support',routeLabel:'Explore ongoing support'},
    ],
  },
];

export const serviceAddOns = [
  {title:'Legal and Business Name Registration',description:'Support with the practical steps and information needed to register the business.',href:'/services/legal-business-registration'},
  {title:'Domain and Email Setup',description:'Set up a professional domain and business email connected to your organisation.',href:'/services/domain-email-setup'},
  {title:'Full Website Development',description:'Plan, build and launch a website around what customers need to understand and do.',href:'/services/website-development'},
  {title:'SEO and Content Management',description:'Improve search visibility and maintain useful website content after launch.',href:'/services/seo-content-management'},
];

export const businessServiceInquiryTitles = [
  ...businessServiceGroups.flatMap(group=>group.services.map(service=>service.title)),
  ...serviceAddOns.map(addOn=>addOn.title),
];

export function businessServiceTitleFromParam(value:string):string {
  const item=[...businessServiceGroups.flatMap(group=>group.services),...serviceAddOns]
    .find(service=>service.href===contact(value)||service.href===`/services/${value}`);
  return item?.title||'';
}
