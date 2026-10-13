"use client";

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ArrowRight, ArrowDown, Bookmark, Check, Search, X, Plus, Compass, BookOpen, BriefcaseBusiness, Sparkles } from 'lucide-react';
import { journeys, type Ambition, type Action } from './journeys';
import { trackEvent } from '@/lib/analytics';
import { stripHtmlForMeta } from '@/lib/stripHtml';
import { formatMoney } from '@/lib/formatMoney';
import type { ResourceItem } from '@/components/resources/ResourceCard';
import { thumbnailFor, type VideoCardData } from '@/components/videos/VideoCard';
import s from './Launchpad.module.css';
import { AmbitionLine } from './AmbitionLine';
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
const icons = [BriefcaseBusiness, BookOpen, Compass, Sparkles];
const storageKey = 'pds-home-launchpad-v1';
const allActions = Object.values(journeys).flatMap(j=>[...j.tools,...j.focuses.flatMap(f=>f.actions)]);
const actionMap = new Map(allActions.map(a=>[a.href,a]));

function Cover({src,title}:{src:string|null;title:string}) {
  const [failed,setFailed]=useState(false);
  // Provider thumbnails and signed covers need their original URLs and an error fallback.
  // eslint-disable-next-line @next/next/no-img-element
  return src&&!failed ? <img src={src} alt="" loading="lazy" onError={()=>setFailed(true)}/> : <div className={s.typeCover}><span>PDS / THE LIBRARY</span><strong>{title}</strong><BookOpen size={28} aria-hidden="true"/></div>;
}

export default function HomeLaunchpad(p:Props) {
  const [ambition,setAmbition]=useState<Ambition>('business');
  const [focus,setFocus]=useState(0);
  const [step,setStep]=useState(0);
  const [tool,setTool]=useState(0);
  const [shelf,setShelf]=useState<'courses'|'resources'|'videos'>('resources');
  const [saved,setSaved]=useState<string[]>([]);
  const [ready,setReady]=useState(false);
  const [storageAvailable,setStorageAvailable]=useState(true);
  const [notice,setNotice]=useState('');
  const journey=journeys[ambition];
  const situation=journey.focuses[focus];
  const action=situation.actions[step];
  const selectedTool=journey.tools[tool];
  // Hydrate browser-only preferences after SSR; never read storage during server rendering.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(()=>{
    try {
      const data=JSON.parse(localStorage.getItem(storageKey)||'null');
      if(data && keys.includes(data.ambition)) {
        setAmbition(data.ambition);
        setShelf(data.ambition==='skills'?'courses':'resources');
        if(Number.isInteger(data.focus)&&data.focus>=0&&data.focus<3) setFocus(data.focus);
      }
      if(Array.isArray(data?.saved)) setSaved(data.saved.filter((v:unknown):v is string=>typeof v==='string'&&actionMap.has(v)).slice(0,20));
    } catch { setStorageAvailable(false); }
    setReady(true);
  },[]);
  useEffect(()=>{
    if(!ready)return;
    try { localStorage.setItem(storageKey,JSON.stringify({ambition,focus,saved})); } catch { setStorageAvailable(false); }
  },[ambition,focus,saved,ready]);
  /* eslint-enable react-hooks/set-state-in-effect */
  function choose(key:Ambition) {
    setAmbition(key);setFocus(0);setStep(0);setTool(0);setShelf(key==='skills'?'courses':'resources');
    setNotice(`${journeys[key].label}: your route, tools and discovery sections have changed.`);
    trackEvent('audience_select',{audience:key,location:'homepage_launchpad'});
  }
  function save(a:Action) {
    const exists=saved.includes(a.href);
    setSaved(v=>exists?v.filter(h=>h!==a.href):[...v,a.href]);
    setNotice(exists?`${a.title} removed from your saved.`:`${a.title} added to your saved.`);
  }
  const listings=p.opportunities.filter(o=>o.kind===(ambition==='work'?'job':'opportunity'));
  const shelfItems = shelf==='courses' ? p.courses.map(c=>({id:c.id,title:c.title,description:c.description,href:`/learn/${c.slug}`,src:null,label:c.access==='free'?'Free course':c.price_usd?formatMoney(c.price_usd,'USD'):c.price_ngn?formatMoney(c.price_ngn,'NGN'):'Premium course'}))
    : shelf==='videos'?p.videos.map(v=>({id:v.id,title:v.title,description:v.description,href:`/videos/${v.slug}`,src:thumbnailFor(v),label:v.access==='premium'?'Premium video':'Video'}))
    : p.resources.map(r=>({id:r.id,title:r.title,description:r.description,href:`/resources/${r.slug}`,src:r.cover_url||r.thumbnail_url,label:`${r.access==='premium'?'Premium · ':''}${r.resource_type||'Resource'}`}));
  const catalogue=shelf==='courses'?'/learn':shelf==='videos'?'/videos':'/resources';
  return <PageMotion><div className={s.page} id="top">
    <span className={s.srOnly} role="status">{notice}</span>
    <header className={s.hero}>
      <div className={s.masthead}><span>Prowess Digital Solutions</span><a href="#my-next-steps"><Bookmark size={15}/> saved <b>{saved.length}</b></a></div>
      <div className={s.opening}><AmbitionLine/><h1>Your ambition.<br/><span>Your next chapter.</span></h1><div className={s.openingNote}><p>Business, learning, work and opportunity.<br/>Choose what matters to you. Make this space yours.</p><a href="#your-route">Find my starting point <ArrowDown size={18}/></a></div></div>
      <div className={s.choices} data-motion-group aria-label="Choose your ambition">{keys.map((key,i)=>{const Icon=icons[i];return <button key={key} aria-pressed={ambition===key} onClick={()=>choose(key)} className={ambition===key?s.chosen:''}><span className={s.choiceTop}><Icon size={23}/></span><strong>{journeys[key].label}</strong><span className={s.choiceBottom}>{ambition===key?'Your current direction':'Make this my direction'}{ambition===key?<Check size={20}/>:<ArrowUpRight size={20}/>}</span></button>;})}</div>
      <div className={s.heroFoot}><span><span className={s.dot}/> {journey.label}</span><span>Switch direction whenever you like.</span></div>
    </header>

    <div key={ambition} className={s.journey}>
      <section id="your-route" className={`${s.section} ${s.routeSection}`}>
        <div className={s.sectionHeading}><div><p className={s.eyebrow}>Your starting point</p><h2>{journey.title.split('\n').map((line,i)=><span key={line}>{i>0&&<br/>}{line}</span>)}</h2></div><p>{journey.intro}</p></div>
        <div className={s.routeWorkspace}>
          <div className={s.focusColumn}><h3>{journey.question}</h3><div className={s.focusChoices}>{journey.focuses.map((f,i)=><button key={f.label} aria-pressed={focus===i} onClick={()=>{setFocus(i);setStep(0);}}><span>{focus===i?<Check size={16}/>:<span className={s.radio}/>}</span>{f.label}<ArrowUpRight size={16}/></button>)}</div><p className={s.insight} key={focus}>{situation.insight}</p><Link href={journey.destination} className={s.textLink}>Explore all {ambition==='business'?'business services':ambition==='skills'?'learning':ambition==='work'?'jobs':'opportunities'} <ArrowRight size={17}/></Link></div>
          <div className={s.routeBoard}><div className={s.boardTop}><span>Your route forward</span><span>Three suggested steps</span></div>
            <div className={s.routeStops} aria-label="Explore the steps in your route">{situation.actions.map((a,i)=><button key={a.href} aria-pressed={step===i} onClick={()=>setStep(i)}><span>{(i+1).toString().padStart(2,'0')}</span><strong>{a.title}</strong></button>)}</div>
            <article className={s.activeStep} key={`${focus}-${step}`}><div><p className={s.eyebrow}>{step===0?'Start here':step===1?'Build on it':'Take it further'}</p><h3>{action.title}</h3><p>{action.detail}</p><div className={s.actions}><Link className={s.primary} href={action.href}>{action.label}<ArrowUpRight size={18}/></Link><button className={s.save} onClick={()=>save(action)} aria-pressed={saved.includes(action.href)}>{saved.includes(action.href)?<Check size={18}/>:<Bookmark size={18}/>} {saved.includes(action.href)?'Saved':'Save'}</button></div></div></article>
            <div className={s.boardFoot}><span>Choose a step to explore it.</span><span>Save link keeps a shortcut below.</span></div>
          </div>
        </div>
      </section>

      <section className={s.toolSection}>
        <div className={s.section}><div className={s.sectionHeading}><div><p className={s.eyebrow}>Make something happen</p><h2>A useful tool.<br/>A tangible next step.</h2></div><p>Open something you can use for your {ambition==='business'?'business':ambition==='skills'?'learning':ambition==='work'?'career':'next application'}. Explore the tools before deciding what to keep.</p></div>
          <div className={s.toolDesk}><div className={s.toolMenu}>{journey.tools.map((t,i)=><button key={t.href} aria-pressed={tool===i} onClick={()=>setTool(i)}><strong>{t.title}</strong><ArrowUpRight size={22}/></button>)}<Link href="/tools" className={s.textLink}>See the complete toolbox <ArrowRight size={17}/></Link></div><article className={s.toolPreview} key={selectedTool.href}><div className={s.folderTab}>YOUR WORKSPACE</div><div className={s.folder}><span className={s.eyebrow}>Ready when you are</span><h3>{selectedTool.title}</h3><p>{selectedTool.detail}</p><div className={s.actions}><Link href={selectedTool.href} className={s.primary}>{selectedTool.label}<ArrowUpRight size={18}/></Link><button className={s.save} aria-pressed={saved.includes(selectedTool.href)} onClick={()=>save(selectedTool)} aria-label={`${saved.includes(selectedTool.href)?'Remove':'Save'} ${selectedTool.title}`}>{saved.includes(selectedTool.href)?<Check size={20}/>:<Plus size={20}/>}</button></div><span className={s.folderFooter}>Prowess Digital Solutions <span>TOOLS FOR YOUR NEXT CHAPTER</span></span></div></article></div>
        </div>
      </section>

      <section className={s.section}><div className={s.sectionHeading}><div><p className={s.eyebrow}>Discover & develop</p><h2>{journey.discovery}</h2></div><Link className={s.textLink} href={catalogue}>Explore the full library <ArrowUpRight size={18}/></Link></div>
        <div className={s.shelfTabs} aria-label="Choose content to explore">{(['courses','resources','videos'] as const).map(t=><button key={t} aria-pressed={shelf===t} onClick={()=>setShelf(t)}>{t==='courses'?'Learn something':t==='resources'?'Read & use':'Watch & discover'}</button>)}</div>
        {p.error&&<div role="alert" className={s.error}>Some content could not load. <button onClick={p.retry}>Try again</button> You can still explore the directories.</div>}
        {p.loading?<div className={s.skeleton} role="status" aria-label="Loading published content"><div/><div/><div/></div>:shelfItems.length?<div className={s.shelf} data-motion-group>{shelfItems.slice(0,4).map((item)=><article className={s.publication} key={item.id}><Link href={item.href}><div className={s.cover}><Cover key={item.src} src={item.src} title={item.title}/></div><div className={s.publicationMeta}><span>{item.label}</span><ArrowUpRight size={18}/></div><h3>{item.title}</h3>{item.description&&<p>{stripHtmlForMeta(item.description)}</p>}</Link></article>)}</div>:<div className={s.empty}><BookOpen size={32}/><div><h3>{p.error?'The library is taking a moment.':'Your next discovery starts in the library.'}</h3><p>{p.error?'Open the full directory or try loading again.':'No homepage picks are available in this collection yet. Explore the full directory.'}</p></div><Link href={catalogue} className={s.textLink}>Explore {shelf}<ArrowUpRight size={18}/></Link></div>}
        {ambition==='skills'&&p.paths.length>0&&<div className={s.pathStrip}><span>Find a direction</span>{p.paths.slice(0,4).map(path=><Link key={path.id} href={`/career-paths/${path.slug}`}>{path.title}<ArrowUpRight size={15}/></Link>)}</div>}
      </section>

      <section className={`${s.section} ${s.openings}`}><div><p className={s.eyebrow}>Keep looking forward</p><h2>{ambition==='work'?'Your next role\ncould be here.':ambition==='skills'?'Put your learning\ninto the world.':ambition==='business'?'Make room for\nnew possibilities.':'An opening can\nchange your direction.'}</h2><p>{ambition==='work'?'Explore published jobs. Read the requirements and choose your next application.':'Explore published opportunities, programmes and funding. Check the details to find your fit.'}</p><Link className={s.textLink} href={ambition==='work'?'/jobs':'/opportunities'}>View all {ambition==='work'?'jobs':'opportunities'}<ArrowRight size={18}/></Link></div><div className={s.listings}>{p.loading?<p role="status">Loading openings…</p>:listings.length?listings.slice(0,4).map((o)=><Link href={o.href} key={o.id}><div><span className={s.eyebrow}>{o.eyebrow}</span><h3>{o.title}</h3><p>{o.subtitle}</p></div><ArrowUpRight size={22}/></Link>):<div className={s.empty}><div><h3>{p.error?'We could not load openings.':'More openings to explore.'}</h3><p>{p.error?'Try again or visit the directory.':'Check the directory for current listings or choose updates below.'}</p></div></div>}</div></section>
      {p.events.length>0&&<section className={`${s.section} ${s.events}`}><p className={s.eyebrow}>Meet, learn, connect</p>{p.events.map(e=><Link key={e.id} href={`/events/${e.slug}`}><time dateTime={e.date}>{new Date(e.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</time><strong>{e.title}</strong><span>{e.type||'Event'}</span><ArrowUpRight size={20}/></Link>)}</section>}
    </div>

    <section id="my-next-steps" className={`${s.section} ${s.savedSection}`}><div><p className={s.eyebrow}>Your saved</p><h2>Keep a little<br/>momentum.</h2><p>{storageAvailable?'Your direction and saved stay in this browser. Come back and pick up where you left off.':'Your steps stay here while this page is open. Browser storage is unavailable.'}</p><span className={s.savedCount}>{saved.length} <small>saved</small></span></div><div className={s.savedList}>{saved.length?saved.map(href=>{const a=actionMap.get(href)!;return <div key={href}><Bookmark size={18}/><Link href={href}>{a.title}<ArrowUpRight size={18}/></Link><button onClick={()=>save(a)} aria-label={`Remove ${a.title}`}><X size={18}/></button></div>;}):<div className={s.savedEmpty}><Bookmark size={36}/><h3>Something caught your attention?</h3><p>Use “Save” on a tool or suggested step. Open it here whenever you are ready.</p><a className={s.textLink} href="#your-route">Explore my route <ArrowUpRight size={18}/></a></div>}</div></section>

    <section className={`${s.section} ${s.people}`}><div className={s.peopleImage}><Image src="/images/training.JPG" alt="A Prowess Digital Solutions training session" fill sizes="(max-width: 700px) 100vw, 50vw"/><span>Learning. Building. Doing.</span></div><div><p className={s.eyebrow}>Real work. Real people.</p><h2>You bring the ambition.<br/>We help you build on it.</h2><p>Prowess Digital Solutions brings business support, learning, practical tools and opportunities into one place. Explore independently or get focused support for the work ahead.</p><Link className={s.textLink} href="/about">Meet Prowess Digital Solutions <ArrowUpRight size={18}/></Link><blockquote>“Their team delivered a modern, high-quality website that perfectly reflects our company and brand.”<cite>Testers Connect · Website client</cite></blockquote><Link className={s.textLink} href="/case-studies">Explore our work <ArrowRight size={18}/></Link></div></section>

    <section id="launch" className={`${s.section} ${s.newsletter}`}><p className={s.eyebrow}>Your next chapter continues</p><h2>{journey.closing}</h2><p>Choose the updates you want. Get useful content and openings in your inbox.</p>{p.newsletter}</section>
    <div className={`${s.section} ${s.searchFooter}`}><form action="/search"><Search size={20}/><label className={s.srOnly} htmlFor="launch-search">Search the platform</label><input id="launch-search" name="q" placeholder="Looking for something specific?" required/><button type="submit">Search <ArrowRight size={18}/></button></form><nav aria-label="Explore every destination">{keys.map(k=><Link key={k} href={journeys[k].destination}>{journeys[k].label}<ArrowUpRight size={15}/></Link>)}</nav></div>
  </div></PageMotion>;
}
