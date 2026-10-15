type Problem = { label: string; causes: string; check: string; action: string };
// href points at the service page's on-page form (#service-checkout), so
// visitors land where they can brief and pay for the work.
type Review = { title: string; description: string; outcome: string; href: string; cta: string; problems: Problem[] };
export const businessReviews: Review[] = [
  {title:'Business plan',href:'/services/business-plans#service-checkout',cta:'Start my business plan',description:'Put your idea, market and numbers into a plan you can use.',outcome:'Understand what needs attention before your next business decision.',problems:[
    {label:'My business is not making profit',causes:'Prices may not cover the full cost of each sale, overheads may be too high, or sales volume may be too low.',check:'Compare last month’s sales with direct costs and running expenses. Separate profit from cash in the bank, loans and owner withdrawals.',action:'Calculate what is left from each product or service after direct costs. Identify the costs or offers that need attention before changing prices.'},
    {label:'I am not getting enough customers',causes:'The offer may be unclear, the wrong people may be seeing it, or enquiries may not turn into sales.',check:'Count enquiries, sales and repeat purchases by source over the last month. Ask recent customers why they chose you.',action:'Find where people drop out, then test one change to your message, follow-up or offer and track the result.'},
    {label:'I do not know if my business idea can work',causes:'Customer demand, startup costs or the price people will pay may still be untested.',check:'Speak with potential customers about how they solve this problem today. List setup costs and monthly expenses.',action:'Test a small version of the offer with real customers before committing to a full launch.'},
    {label:'I need a clear plan for funding or expansion',causes:'The amount needed, its intended use or the assumptions behind growth may not be clear.',check:'List what the money will pay for, current trading figures and the requirements of the intended funder.',action:'Prepare a costed plan with milestones and cash-flow assumptions, including what happens if sales are slower than expected.'},
  ]},
  {title:'Build my website',href:'/services/website-development#service-checkout',cta:'Start my website',description:'Give customers a clear place to discover your business and take action.',outcome:'Help customers understand your offer and take the next step.',problems:[
    {label:'Customers cannot find a clear place to learn about my business',causes:'Business details may be scattered across social profiles or missing from search results.',check:'Look for your business as a new customer would. Check whether your offer, contact details and service area are easy to find.',action:'Gather your core services, proof of work and contact details for a focused website with a clear enquiry route.'},
    {label:'People visit my website but do not enquire',causes:'Visitors may not be the right audience, may lack enough information to decide, or may encounter a broken contact route.',check:'Test every enquiry button and form on a phone. Review traffic sources and the pages people leave.',action:'Fix broken contact steps first. Make the main offer and next action clear, then measure completed enquiries.'},
    {label:'Visitors do not understand what I offer',causes:'Headings may be vague or services may be described without explaining who they help and what customers receive.',check:'Ask someone unfamiliar with your business to describe your offer after reading the first screen.',action:'State who you help, what you do and how to start. Give each main service a clear description and relevant proof.'},
    {label:'My website is difficult to use on a phone',causes:'Large files, crowded layouts, small controls or long forms may make common tasks difficult.',check:'On a mobile connection, try finding a service and completing an enquiry. Note delays, unreadable text and blocked controls.',action:'Prioritise the barriers that stop customers completing these tasks, then repeat the same checks after changes.'},
  ]},
  {title:'Business systems',href:'/services/workflow-systems#service-checkout',cta:'Organise my business systems',description:'Make everyday work easier to organise, track and hand over.',outcome:'Make the work easier to follow, deliver and check.',problems:[
    {label:'Everything in my business depends on me',causes:'Decisions, access or instructions may sit with you instead of being shared with the people doing the work.',check:'List the tasks that stop when you are unavailable and the approvals each one requires.',action:'Choose one repeatable task to document and delegate, with a clear owner and an agreed point for review.'},
    {label:'Work keeps getting delayed or forgotten',causes:'Tasks may have no clear owner, deadline or visible handover between people.',check:'Trace three recent delayed jobs and identify where each waited and who was responsible for the next step.',action:'Use one shared work list with an owner, due date and status for each task. Review blocked items regularly.'},
    {label:'My team keeps repeating the same mistakes',causes:'Instructions may differ between people, training may be incomplete or checks may happen too late.',check:'Record the last few repeated errors and the step where each first occurred.',action:'Write a short checklist for that step, walk the team through it and check whether the error repeats.'},
    {label:'I cannot keep track of orders, payments or business records',causes:'Records may be spread across notebooks, chats and spreadsheets without a consistent update routine.',check:'Trace recent orders from request through delivery and payment. Identify missing entries or duplicate records.',action:'Choose one record for tracking each order and payment, assign an owner and reconcile it with payment records regularly.'},
  ]},
];

export function businessReviewReport(serviceIndex: number, selected: number[], name = '', notes = ''): string | null {
  const service = businessReviews[serviceIndex];
  if (!service) return null;
  const problems = service.problems.filter((_, index) => selected.includes(index));
  if (!problems.length) return null;
  return [`Business: ${name.trim() || 'My business'}`, `Focus: ${service.title}`, '',
    'These are possible causes to investigate, based on the problems you selected.', '',
    ...problems.flatMap((problem, index) => [`${index + 1}. ${problem.label}`, `Possible causes: ${problem.causes}`, `What to check: ${problem.check}`, `Next step: ${problem.action}`, '']),
    ...(notes.trim() ? ['Your additional notes', notes.trim(), ''] : []),
    'Start with one issue. Gather the information above, take the suggested step and review what changes.',
    `Want us to do this work with you? ${service.cta}: https://www.prowessdigitalsolutions.com${service.href}`,
  ].join('\n');
}
