import Link from "next/link";
import { ArrowDown, ArrowRight, Check, FileCheck2, Search, Settings2, TrendingUp, Route, ShieldCheck, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import type { ServicePageContent } from "@/content/servicePages";
import ClientVoices from "./ClientVoices";
import ServiceTestimonials from "./ServiceTestimonials";
import ServiceCheckout from "./ServiceCheckout";
import BusinessPlansOffer from "./BusinessPlansOffer";
import FeasibilityStudiesOffer from "./FeasibilityStudiesOffer";
import MarketResearchOffer from "./MarketResearchOffer";
import BusinessModelOffer from "./BusinessModelOffer";
import BusinessAuditOffer from "./BusinessAuditOffer";
import s from "./ServiceOfferPage.module.css";

const groupLabels={start:'Start',fix:'Fix',organise:'Organise',grow:'Grow','add-on':'Implementation support'} as const;
const groupIcons={start:FileCheck2,fix:Search,organise:Settings2,grow:TrendingUp,'add-on':Route} as const;
type Design={mode:'editorial'|'split'|'canvas'|'ledger'|'signal';accent:string;soft:string;motif:string;note:string};
const teal='var(--primary)';
const mist='var(--muted)';
const designs:Record<string,Design>={
  'business-plans':{mode:'editorial',accent:teal,soft:mist,motif:'Decision document',note:'Strategy, operations and financial logic in one credible plan'},
  'feasibility-studies':{mode:'split',accent:teal,soft:mist,motif:'Go or no go',note:'Test demand, costs and risk before committing capital'},
  'market-research':{mode:'signal',accent:teal,soft:mist,motif:'Market intelligence',note:'Customers, competitors and buying conditions made clear'},
  'business-model':{mode:'canvas',accent:teal,soft:mist,motif:'Business logic',note:'See how value, delivery, costs and revenue connect'},
  'business-structure-diagnostic':{mode:'signal',accent:teal,soft:mist,motif:'Find the real constraint',note:'A whole-business diagnosis with a focused action path'},
  'business-audit':{mode:'ledger',accent:teal,soft:mist,motif:'Evidence and control',note:'Findings, risks and corrective action you can track'},
  'financial-review':{mode:'ledger',accent:teal,soft:mist,motif:'Know the numbers',note:'Read margin, cash movement and operating cost clearly'},
  'pricing-offer-review':{mode:'editorial',accent:teal,soft:mist,motif:'Make value easier to buy',note:'A sharper offer with pricing the business can defend'},
  'sops':{mode:'ledger',accent:teal,soft:mist,motif:'Reliable execution',note:'Instructions your team can follow without guesswork'},
  'workflow-systems':{mode:'canvas',accent:teal,soft:mist,motif:'Work in motion',note:'Clear stages, ownership, decisions and handovers'},
  'operations-documentation':{mode:'editorial',accent:teal,soft:mist,motif:'The operating record',note:'One connected home for how the business works'},
  'team-systems':{mode:'split',accent:teal,soft:mist,motif:'Better coordination',note:'Ownership, communication and accountability made practical'},
  'growth-strategy':{mode:'signal',accent:teal,soft:mist,motif:'Choose the right growth',note:'Focused priorities that match capacity and evidence'},
  'expansion-planning':{mode:'canvas',accent:teal,soft:mist,motif:'Expand with control',note:'Requirements, risk and milestones before the move'},
  'marketing-strategy':{mode:'editorial',accent:teal,soft:mist,motif:'Earn the right attention',note:'Audience, message and channels tied to a commercial goal'},
  'ongoing-business-support':{mode:'split',accent:teal,soft:mist,motif:'A steady decision rhythm',note:'Consistent review and practical support as priorities change'},
  'legal-business-registration':{mode:'ledger',accent:teal,soft:mist,motif:'Formalise the business',note:'The registration route and records handled clearly'},
  'domain-email-setup':{mode:'signal',accent:teal,soft:mist,motif:'A professional digital identity',note:'Domain, email and ownership configured properly'},
  'website-development':{mode:'canvas',accent:teal,soft:mist,motif:'Built around the customer',note:'A credible website with a clear journey and working actions'},
  'seo-content-management':{mode:'editorial',accent:teal,soft:mist,motif:'Stay useful and discoverable',note:'Search priorities and content that keep serving customers'},
};

function ServiceArtifact({service,design}:{service:ServicePageContent;design:Design}){const Icon=groupIcons[service.group];return <aside className={s.artifact} aria-label={`${service.title} service overview`}><div className={s.artifactTop}><span>Prowess Digital Solutions</span><span>{design.motif}</span></div><div className={s.artifactMark}><Icon aria-hidden="true"/><span>{service.title}</span></div><p>{design.note}</p><div className={s.artifactItems}>{service.deliverables.slice(0,3).map(item=><div key={item}><Check aria-hidden="true"/><span>{item}</span></div>)}</div><strong>{service.outcome}</strong></aside>}

export default function ServiceOfferPage({service}:{service:ServicePageContent}){if(service.slug==='business-plans')return <BusinessPlansOffer service={service}/>;if(service.slug==='feasibility-studies')return <FeasibilityStudiesOffer service={service}/>;if(service.slug==='market-research')return <MarketResearchOffer service={service}/>;if(service.slug==='business-model')return <BusinessModelOffer service={service}/>;if(service.slug==='business-audit')return <BusinessAuditOffer service={service}/>;const design=designs[service.slug]||designs['business-plans'];const style={'--service-accent':design.accent,'--service-soft':design.soft} as CSSProperties;return <main className={s.page} data-layout={design.mode} data-service={service.slug} style={style}>
  <section className={s.hero}><div className={s.wrap}><nav className={s.breadcrumb} aria-label="Breadcrumb"><Link href="/services">Business Services</Link><ArrowRight aria-hidden="true"/><span>{groupLabels[service.group]}</span></nav><div className={s.heroGrid}><div className={s.heroCopy}><p className={s.eyebrow}>{service.eyebrow}</p><h1>{service.promise}</h1><p className={s.lead}>{service.description}</p><div className={s.actions}><a href="#service-checkout" className={s.primary}>Start this service <ArrowRight aria-hidden="true"/></a><a href="#what-you-get" className={s.secondary}>Explore the engagement <ArrowDown aria-hidden="true"/></a></div><p className={s.assurance}><ShieldCheck aria-hidden="true"/> Clear scope. One-time payment. Written confirmation.</p></div><ServiceArtifact service={service} design={design}/></div></div></section>
  <section className={s.tension}><div className={s.wrap}><article><span>The challenge</span><h2>{service.signal}</h2></article><article><span>What changes</span><h3>{service.outcome}</h3></article></div></section>
  <section id="what-you-get" className={s.section}><div className={s.wrap}><div className={s.sectionHeading}><div><p className={s.eyebrow}>What you receive</p><h2>A useful body of work, built for the decision ahead.</h2></div><p>Every deliverable earns its place. You receive the documents, findings and direction needed to move with clarity.</p></div><div className={s.deliverables}>{service.deliverables.map(item=><article key={item}><FileCheck2 aria-hidden="true"/><h3>{item}</h3><p>Prepared around your business, reviewed for practical use and included in the final handover.</p></article>)}</div></div></section>
  <section className={s.process}><div className={s.wrap}><div className={s.processIntro}><p className={s.eyebrow}>How we work</p><h2>Focused work. Visible progress. A clear handover.</h2><p>You always know what we are working on, what we need from you and what happens next.</p></div><div className={s.processFlow}>{service.process.map(step=><article key={step.title}><Sparkles aria-hidden="true"/><div><h3>{step.title}</h3><p>{step.body}</p></div></article>)}</div></div></section>
  <section className={s.fit}><div className={s.wrap}><div><p className={s.eyebrow}>This is for you when</p><h2>The need is real and the next decision matters.</h2></div><ul>{service.fit.map(item=><li key={item}><Check aria-hidden="true"/><span>{item}</span></li>)}</ul></div></section>
  <div className={s.wrap}><ClientVoices service={service}/></div><div className={s.wrap}><ServiceTestimonials slug={service.slug}/></div>
  <section className={s.faq}><div className={s.wrap}><div><p className={s.eyebrow}>Before you begin</p><h2>Useful answers before you commit.</h2></div><div>{service.faq.map(item=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></div></section>
  <section className={s.closing}><div className={s.wrap}><ServiceCheckout slug={service.slug} title={service.title}/></div></section>
 </main>}
