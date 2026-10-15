"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Check, Download, ArrowRight } from 'lucide-react';
import { businessReviews as services, businessReviewReport } from '@/lib/businessProblemReview';
import { previewSummary } from '@/lib/businessSummary';
import type { Ambition } from './journeys';
import s from './ProductOpening.module.css';

const directions: {key:Ambition;label:string;description:string;number:string}[] = [
  {key:'business',label:'Business',description:'Plans, websites & business support',number:'01'},
  {key:'work',label:'Jobs',description:'Find a role. Prepare to get it.',number:'02'},
  {key:'opportunities',label:'Opportunities',description:'Funding, programmes & openings',number:'03'},
  {key:'skills',label:'Skills',description:'Learn something you can put to work.',number:'04'},
];

export function ProductOpening({ambition,onChoose}:{ambition:Ambition;onChoose:(key:Ambition)=>void}) {
  return <header className={s.hero}>
    <div className={s.headline}><div><p className={s.eyebrow}><span/> BUSINESS. CAREERS. LEARNING.</p><h1>What are you<br/>working <em>towards?</em></h1></div><div className={s.intro}><p>Build your business. Find your next job. Learn a skill. Get the support and opportunities to move forward.</p><a href="#your-route">Start with what you need <ArrowDown size={18}/></a></div></div>
    <div className={s.directions} aria-label="What would you like to do?">{directions.map(d=><button key={d.key} aria-pressed={ambition===d.key} onClick={()=>onChoose(d.key)}><span className={s.directionTop}><span>{d.number}</span><ArrowUpRight size={24}/></span><strong>{d.label}</strong><span className={s.description}>{d.description}</span><span className={s.selection}>{ambition===d.key?<><span className={s.activeDot}/> You’re here</>:<>Explore {d.label.toLowerCase()} <ArrowRight size={14}/></>}</span></button>)}</div>
  </header>;
}

export function BusinessWorkspace({active}:{active:boolean}) {
  const [selected,setSelected]=useState(0);
  const [name,setName]=useState('');
  const [notes,setNotes]=useState<Record<number,string>>({});
  const goal=notes[selected]||'';
  const [checked,setChecked]=useState<Record<number,number[]>>({});
  const [notice,setNotice]=useState('');
  const service=services[selected];
  const complete=checked[selected]||[];
  function download() {
    const content=businessReviewReport(selected,complete,name,goal);
    if(!content){setNotice('Select at least one problem to see your next steps.');return;}
    void previewSummary(`${name.trim()||'My business'}: next steps`,content);
    setNotice('Your next steps are open for review and printing.');
  }
  return <section hidden={!active} id={active?"your-route":undefined} className={s.workspace}>
    <div className={s.workspaceHeading}><div><p className={s.eyebrow}>FOR YOUR BUSINESS</p><h2>Good ideas deserve<br/><em>good execution.</em></h2></div><p>Choose the problems you’re facing.<br/>See what to check and where to start.</p></div>
    <div className={s.desk}><div className={s.serviceColumn}><div className={s.columnLabel}>What do you need?</div><div className={s.services}>{services.map((item,i)=><button key={item.title} aria-pressed={selected===i} onClick={()=>{setSelected(i);setNotice('');}}><span>0{i+1}</span><strong>{item.title}</strong><ArrowUpRight size={19}/></button>)}</div><div className={s.serviceNote} key={selected}><p>{service.description}</p><Link href={`/contact?service=${['business-plan','business-case-study','website-build','sop-vault'][selected]}`}>Discuss this project <ArrowUpRight size={17}/></Link></div><Link href="/services" className={s.allServices}>Explore business services <ArrowRight size={16}/></Link></div>
    <div className={s.brief}><div className={s.briefBar}><span><span className={s.activeDot}/> YOUR PROJECT STARTS HERE</span><span>01 / NEXT STEPS</span></div><div className={s.paper}><div className={s.paperHeader}><span>PROWESS<br/><small>DIGITAL SOLUTIONS</small></span><span>LET’S MAKE<br/>IT HAPPEN ↗</span></div><label className={s.nameLabel} htmlFor="business-name">Your business name</label><input id="business-name" className={s.businessName} value={name} onChange={e=>setName(e.target.value)} maxLength={100} placeholder="Enter your business name"/><div className={s.serviceTag}>{service.title}</div><label className={s.goalLabel} htmlFor="business-goal">What else would you like us to understand? (optional)</label><textarea id="business-goal" value={goal} onChange={e=>setNotes(prev=>({...prev,[selected]:e.target.value}))} maxLength={1500} placeholder="Add any details you want to include in your printout." rows={2}/><div className={s.checklistHeading}><strong>Which problems are you facing?</strong><span>{complete.length} selected</span></div><div className={s.checklist}>{service.problems.map((item,i)=><label key={`${selected}-${i}`}><input type="checkbox" checked={complete.includes(i)} onChange={()=>setChecked(prev=>({...prev,[selected]:complete.includes(i)?complete.filter(n=>n!==i):[...complete,i]}))}/><span className={s.checkbox}>{complete.includes(i)&&<Check size={13}/>}</span><span>{item.label}</span></label>)}</div><div className={s.paperFooter}><span>{service.outcome}</span><span>PDS</span></div></div><div className={s.briefActions}><span>Select a problem to see possible causes and next steps.<br/><small>Nothing is sent when you type here.</small></span><button onClick={download} disabled={!complete.length}>See my next steps <Download size={17}/></button></div><span className={s.status} role="status">{notice}</span></div></div>
  </section>;
}
