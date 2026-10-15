"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Plus } from 'lucide-react';
import s from './HomeSupport.module.css';

type Project = {id:string;title:string;slug:string;category:string;image_url:string|null};
function ProjectCover({project}:{project:Project}) {
  const [failed,setFailed]=useState(false);
  return <div className={s.projectImage}>{project.image_url&&!failed?
    // Published project images keep their original provider URLs.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={project.image_url} alt={project.title} loading="lazy" onError={()=>setFailed(true)}/>:<span>{project.title}</span>}</div>;
}

export function BusinessWork() {
  const [projects,setProjects]=useState<Project[]>([]);
  const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();let current=true;
    const timeout=setTimeout(()=>controller.abort(),15000);
    fetch('/api/case-studies?published=true&pageSize=2',{signal:controller.signal}).then(async response=>{
      if(!response.ok)throw new Error('Could not load work');
      const data=await response.json();if(!data.ok||!Array.isArray(data.items))throw new Error('Invalid work');
      if(current){setProjects(data.items.slice(0,2));setState('ready');}
    }).catch(()=>{if(current)setState('error');}).finally(()=>clearTimeout(timeout));
    return()=>{current=false;clearTimeout(timeout);controller.abort();};
  },[attempt]);
  return <section className={s.work} aria-labelledby="work-heading"><div className={s.heading}><div><p className={s.eyebrow}>THE WORK BEHIND THE WORDS</p><h2 id="work-heading">See what we’ve<br/><em>built with businesses.</em></h2></div><Link href="/case-studies">Explore our work <ArrowUpRight size={18}/></Link></div>
    {state==='loading'?<div className={s.projectGrid} role="status" aria-label="Loading business projects"><div className={s.placeholder}/><div className={s.placeholder}/></div>:state==='ready'&&projects.length>0?<div className={s.projectGrid}>{projects.map(project=><Link className={s.project} key={project.id} href={`/case-studies/${project.slug}`}><ProjectCover project={project}/><div className={s.projectCaption}><div><p>{project.category||'Client project'}</p><h3>{project.title}</h3></div><span className={s.roundArrow}><ArrowUpRight size={23}/></span></div></Link>)}</div>:<div className={s.workFallback}><p>{state==='error'?'Our projects couldn’t load just now.':'Explore the projects and businesses we’ve worked with.'}</p>{state==='error'&&<button onClick={()=>{setState('loading');setAttempt(v=>v+1);}}>Try again</button>}<Link href="/case-studies">View client projects <ArrowRight size={16}/></Link></div>}
  </section>;
}

export function BusinessNextStep(){
  return <section className={s.nextStep}><div className={s.enquiry}><p className={s.eyebrow}>LET’S WORK ON YOUR BUSINESS</p><h2>You know what needs<br/>to change.<br/><em>Let’s work out how.</em></h2><p>Choose the service you need. Each service page has a short form where you tell us about your business, then you pay securely on the same page and receive a written confirmation.</p><Link className={s.cta} href="/services">Choose a business service <ArrowUpRight size={19}/></Link><span className={s.serviceLinks}>{[['/services/business-plans#service-checkout','Start my business plan'],['/services/website-development#service-checkout','Start my website'],['/services/workflow-systems#service-checkout','Organise my business systems']].map(([href,label])=><Link key={href} href={href}>{label}</Link>)}</span></div><div className={s.questions}><p className={s.eyebrow}>BEFORE WE START</p>{[
    ['I’m not sure which service I need.','Start with the problem you want to solve. Tell us what is happening in your business and what you want to change. You do not need to choose a package first.'],
    ['Is my result a finished business plan?','Your result suggests possible causes and next steps based on the problems you select. A business plan is a separate piece of work that brings together your market, operations, strategy and financial assumptions.'],
    ['How much will my project cost?','Some business services have published price ranges. For a custom project, we agree the deliverables, timing and fee with you before work begins.'],
    ['Can I use the tools before requesting help?','Yes. Open the tool you need to see its access requirements. Some tools and resources are free; others require an account or paid access. A business service is a separate engagement.'],
  ].map(([question,answer])=><details key={question}><summary>{question}<Plus size={18}/></summary><p>{answer}</p></details>)}<Link href="/services">Compare business services <ArrowRight size={17}/></Link></div></section>;
}
