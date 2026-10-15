import Link from "next/link";
import { ArrowDown, ArrowRight, Check, CircleDot, FileCheck2, Route, Search, Settings2, TrendingUp } from "lucide-react";
import type { ServicePageContent } from "@/content/servicePages";
import ClientVoices from "./ClientVoices";
import s from "./ServiceOfferPage.module.css";

const groupLabels={start:'Start',fix:'Fix',organise:'Organise',grow:'Grow','add-on':'Implementation support'} as const;
const groupIcons={start:FileCheck2,fix:Search,organise:Settings2,grow:TrendingUp,'add-on':Route} as const;

function WorkingVisual({service}:{service:ServicePageContent}){
  const Icon=groupIcons[service.group];
  return <div className={`${s.visual} ${s[service.group]}`} aria-label={`${service.title} working view`}><div className={s.visualBar}><span>PDS / {groupLabels[service.group]}</span><span>WORKING FILE</span></div><div className={s.visualBody}><Icon size={34} strokeWidth={1.5} aria-hidden="true"/><p>{service.signal}</p><div className={s.visualRule}/>{service.deliverables.slice(0,3).map((item,index)=><div className={s.visualRow} key={item}><span>0{index+1}</span><b>{item}</b><Check size={15} aria-hidden="true"/></div>)}</div><div className={s.visualTab}>{service.outcome}</div></div>;
}

export default function ServiceOfferPage({service}:{service:ServicePageContent}){
  const contactHref=`/contact?service=${service.slug}`;
  return <main className={s.page}>
    <section className={s.hero}><div className={s.wrap}><nav className={s.breadcrumb} aria-label="Breadcrumb"><Link href="/services">Business Services</Link><ArrowRight size={13}/><span>{groupLabels[service.group]}</span></nav><div className={s.heroGrid}><div><p className={s.eyebrow}>{service.eyebrow}</p><h1>{service.promise}</h1><p className={s.lead}>{service.description}</p><div className={s.actions}><Link href={contactHref} className={s.primary}>Discuss this service <ArrowRight size={17}/></Link><a href="#what-you-get" className={s.secondary}>See what you receive <ArrowDown size={17}/></a></div><p className={s.assurance}>Scope, fee and delivery schedule are confirmed before payment.</p></div><WorkingVisual service={service}/></div></div></section>
    <section className={s.decision}><div className={s.wrap}><div className={s.decisionGrid}><div><p className={s.eyebrow}>The situation</p><h2>{service.signal}</h2></div><div><p className={s.eyebrow}>The result</p><h3>{service.outcome}</h3></div></div></div></section>
    <section id="what-you-get" className={s.section}><div className={s.wrap}><div className={s.sectionHeading}><div><p className={s.eyebrow}>What you receive</p><h2>Work you can use after the engagement ends.</h2></div><p>Every item has a clear purpose in the decision, system or implementation this service supports.</p></div><div className={s.deliverables}>{service.deliverables.map((item,index)=><article key={item}><span>{String(index+1).padStart(2,'0')}</span><FileCheck2 aria-hidden="true"/><h3>{item}</h3></article>)}</div></div></section>
    <section className={`${s.section} ${s.process}`}><div className={s.wrap}><div className={s.sectionHeading}><div><p className={s.eyebrow}>How the work moves</p><h2>A defined route from enquiry to handover.</h2></div></div><div className={s.processGrid}>{service.process.map((step,index)=><article key={step.title}><span>STEP {index+1}</span><CircleDot aria-hidden="true"/><h3>{step.title}</h3><p>{step.body}</p></article>)}</div></div></section>
    <section className={s.fit}><div className={s.wrap}><div className={s.fitGrid}><div><p className={s.eyebrow}>A strong fit for</p><h2>Choose this service when the need is specific.</h2></div><ul>{service.fit.map(item=><li key={item}><Check aria-hidden="true"/><span>{item}</span></li>)}</ul></div></div></section>
    <div className={s.wrap}><ClientVoices service={service}/></div>
    <section className={s.section}><div className={s.wrap}><div className={s.faqLayout}><div><p className={s.eyebrow}>Before you enquire</p><h2>Questions people ask first.</h2></div><div>{service.faq.map(item=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></div></div></section>
    <section className={s.closing}><div className={s.wrap}><div><p className={s.eyebrow}>{service.title}</p><h2>Bring the situation.<br/>We will define the work.</h2><p>Tell us what is happening, what you need to decide and what you have already tried.</p></div><Link href={contactHref} className={s.primary}>Start an enquiry <ArrowRight size={18}/></Link></div></section>
  </main>;
}
