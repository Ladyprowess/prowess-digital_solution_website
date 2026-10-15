"use client";

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ArrowRight, Search, BookOpen } from 'lucide-react';
import { journeys, type Ambition } from './journeys';
import { trackEvent } from '@/lib/analytics';
import { stripHtmlForMeta } from '@/lib/stripHtml';
import { formatMoney } from '@/lib/formatMoney';
import type { ResourceItem } from '@/components/resources/ResourceCard';
import { thumbnailFor, type VideoCardData } from '@/components/videos/VideoCard';
import s from './Launchpad.module.css';
import { BusinessWork, BusinessNextStep } from './HomeSupport';
import { ProductOpening, RouteBar, BusinessWorkspace, JobsWorkspace, OpportunitiesWorkspace, SkillsWorkspace } from './ProductOpening';
import { PageMotion } from '@/components/PageMotion';

type Props = {
  opportunities: {id:string;kind:'job'|'opportunity';title:string;subtitle:string;eyebrow:string;href:string}[];
  courses: {id:string;slug:string;title:string;description:string|null;access:string;price_usd:number|null;price_ngn:number|null}[];
  paths: {id:string;slug:string;title:string;description:string|null}[];
  resources: ResourceItem[]; videos: VideoCardData[];
  events:{id:string;slug:string;title:string;date:string;type:string|null}[];
  loading:boolean; error:boolean; retry:()=>void; newsletter:ReactNode;
};
const keys = Object.keys(journeys) as Ambition[];
const storageKey = 'pds-home-preferences-v1';

function Cover({src,title}:{src:string|null;title:string}) {
  const [failed,setFailed]=useState(false);
  // Provider thumbnails and signed covers need their original URLs and an error fallback.
  // eslint-disable-next-line @next/next/no-img-element
  return src&&!failed ? <img src={src} alt="" loading="lazy" onError={()=>setFailed(true)}/> : <div className={s.typeCover}><span>PROWESS DIGITAL SOLUTIONS LIBRARY</span><strong>{title}</strong><BookOpen size={28} aria-hidden="true"/></div>;
}

export default function HomeLaunchpad(p:Props) {
  const [ambition,setAmbition]=useState<Ambition>('business');
  const [shelf,setShelf]=useState<'courses'|'resources'|'videos'>('resources');
  const [ready,setReady]=useState(false);
  const [notice,setNotice]=useState('');
  const journey=journeys[ambition];
  // Hydrate browser-only preferences after SSR; never read storage during server rendering.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(()=>{
    try {
      const data=JSON.parse(localStorage.getItem(storageKey)||localStorage.getItem('pds-home-launchpad-v1')||'null');
      if(data && keys.includes(data.ambition)) {
        setAmbition(data.ambition);
        setShelf(data.ambition==='skills'?'courses':'resources');
      }
    } catch { /* Browser preferences are optional. */ }
    setReady(true);
  },[]);
  useEffect(()=>{
    if(!ready)return;
    try { localStorage.setItem(storageKey,JSON.stringify({ambition})); } catch { /* Browser preferences are optional. */ }
  },[ambition,ready]);
  /* eslint-enable react-hooks/set-state-in-effect */
  function choose(key:Ambition) {
    setAmbition(key);setShelf(key==='skills'?'courses':'resources');
    setNotice(`${journeys[key].label}: your route, tools and discovery sections have changed.`);
    trackEvent('audience_select',{audience:key,location:'homepage_launchpad'});
  }
  const listings=p.opportunities.filter(o=>o.kind===(ambition==='work'?'job':'opportunity')
    && (ambition!=='business' || /grant|fund|business|accelerat|incubat|pitch|entrepreneur|competition/i.test(o.eyebrow))
    && (ambition!=='skills' || /scholar|fellow|intern|training|course|programme|program|competition|challenge|bootcamp/i.test(o.eyebrow)));
  const shelfItems = shelf==='courses' ? p.courses.map(c=>({id:c.id,title:c.title,description:c.description,href:`/learn/${c.slug}`,src:null,label:c.access==='free'?'Free course':c.price_usd?formatMoney(c.price_usd,'USD'):c.price_ngn?formatMoney(c.price_ngn,'NGN'):'Premium course'}))
    : shelf==='videos'?p.videos.map(v=>({id:v.id,title:v.title,description:v.description,href:`/videos/${v.slug}`,src:thumbnailFor(v),label:v.access==='premium'?'Premium video':'Video'}))
    : p.resources.map(r=>({id:r.id,title:r.title,description:r.description,href:`/resources/${r.slug}`,src:r.cover_url||r.thumbnail_url,label:`${r.access==='premium'?'Premium · ':''}${r.resource_type||'Resource'}`}));
  const catalogue=shelf==='courses'?'/learn':shelf==='videos'?'/videos':'/resources';
  return <PageMotion><div className={s.page} id="top">
    <span className={s.srOnly} role="status">{notice}</span>
    <ProductOpening ambition={ambition} onChoose={choose}/>
    <RouteBar ambition={ambition} onChoose={choose}/>

    <BusinessWorkspace active={ambition==='business'}/>
    <JobsWorkspace active={ambition==='work'}/>
    <OpportunitiesWorkspace active={ambition==='opportunities'}/>
    <SkillsWorkspace active={ambition==='skills'}/>
    <div key={ambition} className={s.journey}>
      <section className={s.toolSection}>
        <div className={s.section}><div className={s.sectionHeading}><div><p className={s.eyebrow}>TOOLS YOU CAN USE TODAY</p><h2>{ambition==='business'?'Check your business, track your money and send invoices.':ambition==='work'?'Get ready for your next application.':ambition==='skills'?'Turn what you learn into work you can show.':'Get ready for the opportunity you want.'}</h2></div><Link href="/tools" className={s.textLink}>Explore all tools <ArrowUpRight size={18}/></Link></div>
        <div className={s.toolCards}>{journey.tools.map((t,i)=><article key={t.href}><div className={s.toolCardTop}><span>0{i+1}</span></div><h3>{t.title}</h3><p>{t.detail}</p><Link href={t.href}>{t.label}<ArrowUpRight size={19}/></Link></article>)}</div>
        <div className={s.toolsFoot}><span>Check each tool for free and paid access.</span></div></div>
      </section>
      {ambition==='business'&&<BusinessWork/>}

      <section className={s.section}><div className={s.sectionHeading}><div><p className={s.eyebrow}>READ. WATCH. PUT IT TO WORK.</p><h2>{ambition==='business'?'Practical help for the work ahead.':journey.discovery}</h2></div><Link className={s.textLink} href={catalogue}>Browse the library <ArrowUpRight size={18}/></Link></div>
        <div className={s.shelfTabs} aria-label="Choose content to explore">{(['courses','resources','videos'] as const).map(t=><button key={t} aria-pressed={shelf===t} onClick={()=>setShelf(t)}>{t==='courses'?'Learn something':t==='resources'?'Read & use':'Watch & discover'}</button>)}</div>
        {p.error&&<div role="alert" className={s.error}>Some content could not load. <button onClick={p.retry}>Try again</button> You can still explore the directories.</div>}
        {p.loading?<div className={s.skeleton} role="status" aria-label="Loading published content"><div/><div/><div/></div>:shelfItems.length?<div className={s.shelf} data-motion-group>{shelfItems.slice(0,4).map((item)=><article className={s.publication} key={item.id}><Link href={item.href}><div className={s.cover}><Cover key={item.src} src={item.src} title={item.title}/></div><div className={s.publicationMeta}><span>{item.label}</span><ArrowUpRight size={18}/></div><h3>{item.title}</h3>{item.description&&<p>{stripHtmlForMeta(item.description)}</p>}</Link></article>)}</div>:<div className={s.empty}><BookOpen size={32}/><div><h3>{p.error?'The library is taking a moment.':'Find a resource you can use.'}</h3><p>{p.error?'Open the full directory or try loading again.':'Browse guides, templates and learning for the work you want to do.'}</p></div><Link href={catalogue} className={s.textLink}>Explore {shelf}<ArrowUpRight size={18}/></Link></div>}
        {ambition==='skills'&&p.paths.length>0&&<div className={s.pathStrip}><span>Find a direction</span>{p.paths.slice(0,4).map(path=><Link key={path.id} href={`/career-paths/${path.slug}`}>{path.title}<ArrowUpRight size={15}/></Link>)}</div>}
      </section>

      <section className={`${s.section} ${s.openings}`}><div><p className={s.eyebrow}>FIND YOUR NEXT OPENING</p><h2>{ambition==='work'?'Your next role\ncould be here.':ambition==='skills'?'Put your learning\ninto the world.':ambition==='business'?'Funding and programmes\nfor your next step.':'An opening can\nchange your direction.'}</h2><p>{ambition==='work'?'Explore published jobs. Read the requirements and choose your next application.':ambition==='business'?'Explore funding and programmes. Check the eligibility, deadline and provider’s requirements before applying.':'Explore opportunities, programmes and funding. Check the details to find your fit.'}</p><Link className={s.textLink} href={ambition==='work'?'/jobs':'/opportunities'}>View all {ambition==='work'?'jobs':'opportunities'}<ArrowRight size={18}/></Link></div><div className={s.listings}>{p.loading?<p role="status">Loading openings…</p>:listings.length?listings.slice(0,4).map((o)=><Link href={o.href} key={o.id}><div><span className={s.eyebrow}>{o.eyebrow}</span><h3>{o.title}</h3><p>{o.subtitle}</p></div><ArrowUpRight size={22}/></Link>):<div className={s.empty}><div><h3>{p.error?'We could not load openings.':'More openings to explore.'}</h3><p>{p.error?'Try again or visit the directory.':'Check the directory for current listings or choose updates below.'}</p></div></div>}</div></section>
      {p.events.length>0&&<section className={`${s.section} ${s.events}`}><p className={s.eyebrow}>Meet, learn, connect</p>{p.events.map(e=><Link key={e.id} href={`/events/${e.slug}`}><time dateTime={e.date}>{new Date(e.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</time><strong>{e.title}</strong><span>{e.type||'Event'}</span><ArrowUpRight size={20}/></Link>)}</section>}
    </div>



    <section className={`${s.section} ${s.people}`}><div className={s.peopleImage}><Image src="/images/training.JPG" alt="A Prowess Digital Solutions training session" fill sizes="(max-width: 700px) 100vw, 50vw"/><span>A Prowess Digital Solutions training session</span></div>{ambition==='work'?<div><p className={s.eyebrow}>PREPARE FOR THE WORK YOU WANT</p><h2>Build the application.<br/>Practise the conversation.</h2><p>Use the career tools to make your experience easier to understand. Build your CV, prepare for interviews and bring your strongest work together.</p><Link className={s.textLink} href="/tools">Explore career tools <ArrowUpRight size={18}/></Link><blockquote>Start with the role you want. Then make every part of your application support that direction.<cite>Prowess Digital Solutions career guidance</cite></blockquote><Link className={s.textLink} href="/jobs">Browse current jobs <ArrowRight size={18}/></Link></div>:ambition==='opportunities'?<div><p className={s.eyebrow}>PREPARE BEFORE YOU APPLY</p><h2>Check the fit.<br/>Build the evidence.</h2><p>Use each listing to understand the provider’s requirements, deadline and selection process. Then prepare an application that answers what they are actually asking.</p><Link className={s.textLink} href="/opportunities">Explore opportunities <ArrowUpRight size={18}/></Link><blockquote>A strong application begins with eligibility. Confirm the rules, then connect your evidence to the selection criteria.<cite>Prowess Digital Solutions application guidance</cite></blockquote><Link className={s.textLink} href="/events">Explore upcoming events <ArrowRight size={18}/></Link></div>:ambition==='skills'?<div><p className={s.eyebrow}>PUT LEARNING TO WORK</p><h2>Understand it.<br/>Practise it. Show it.</h2><p>Choose learning that supports a clear goal. Use courses and resources to build understanding, then practise through work you can explain and share.</p><Link className={s.textLink} href="/learn">Explore learning <ArrowUpRight size={18}/></Link><blockquote>Course completion records what you finished. Practice and projects show what you can now do.<cite>Prowess Digital Solutions learning guidance</cite></blockquote><Link className={s.textLink} href="/career-paths">Explore career paths <ArrowRight size={18}/></Link></div>:<div><p className={s.eyebrow}>SUPPORT FROM PEOPLE WHO DO THE WORK</p><h2>Work on it yourself.<br/>Get help when you need it.</h2><p>Use a tool, take a course or work with our team. From writing a business plan to preparing for your next role, choose the support that fits what you need to do.</p><Link className={s.textLink} href="/about">Meet Prowess Digital Solutions <ArrowUpRight size={18}/></Link><blockquote>“Their team delivered a modern, high-quality website that perfectly reflects our company and brand.”<cite>Testers Connect · Website client</cite></blockquote><Link className={s.textLink} href="/case-studies">Explore our work <ArrowRight size={18}/></Link></div>}</section>

    {ambition==='business'&&<BusinessNextStep/>}
    <section id="launch" className={`${s.section} ${s.newsletter}`}><p className={s.eyebrow}>CHOOSE WHAT REACHES YOUR INBOX</p><h2>Useful updates. Chosen by you.</h2><p>Choose business resources, learning, jobs or opportunities. We’ll send the updates you select.</p>{p.newsletter}</section>
    <div className={`${s.section} ${s.searchFooter}`}><form action="/search"><Search size={20}/><label className={s.srOnly} htmlFor="launch-search">Search the platform</label><input id="launch-search" name="q" placeholder="Looking for something specific?" required/><button type="submit">Search <ArrowRight size={18}/></button></form><nav aria-label="Explore every destination">{keys.map(k=><Link key={k} href={journeys[k].destination}>{journeys[k].label}<ArrowUpRight size={15}/></Link>)}</nav></div>
  </div></PageMotion>;
}
