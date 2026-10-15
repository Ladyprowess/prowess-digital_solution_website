"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Check, Download, ArrowRight } from 'lucide-react';
import { businessReviews as services, businessReviewReport } from '@/lib/businessProblemReview';
import { careerPaths, jobSearchPlanReport } from '@/lib/jobSearchPlan';
import { opportunityPaths, opportunityPlanReport } from '@/lib/opportunityPlan';
import { learningPaths, learningPlanReport } from '@/lib/learningPlan';
import { previewSummary } from '@/lib/businessSummary';
import type { Ambition } from './journeys';
import s from './ProductOpening.module.css';

const directions: {key:Ambition;label:string;description:string;href:string;linkLabel:string}[] = [
  {key:'business',label:'Business',description:'Get help with business plans, websites and the systems that run your business.',href:'/services',linkLabel:'Go to Business Services'},
  {key:'work',label:'Jobs',description:'Search current jobs. Get your CV and interview answers ready.',href:'/jobs',linkLabel:'Go to Jobs'},
  {key:'opportunities',label:'Opportunities',description:'Find grants, scholarships, fellowships and programmes.',href:'/opportunities',linkLabel:'Go to Opportunities'},
  {key:'skills',label:'Learning',description:'Take courses and build skills you can show to others.',href:'/learn',linkLabel:'Go to Learning'},
];

function scrollToRoute() {
  const target=document.getElementById('route-switch');
  if(!target)return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
}

export function ProductOpening({ambition,onChoose}:{ambition:Ambition;onChoose:(key:Ambition)=>void}) {
  return <header className={s.hero}>
    <div className={s.headline}><div><p className={s.eyebrow}><span/> BUSINESS. JOBS. OPPORTUNITIES. LEARNING.</p><h1>What are you<br/>working <em>towards?</em></h1></div><div className={s.intro}><p>Prowess Digital Solutions helps you build your business, find a job, discover funding and programmes, and learn new skills. Pick one to try it here, or go straight to its page.</p><a href="#route-switch">Start with what you need <ArrowDown size={18}/></a></div></div>
    <div className={s.directions} role="group" aria-label="What would you like to do?">{directions.map(d=><article key={d.key} className={s.direction} data-active={ambition===d.key}>
      <button type="button" className={s.choose} aria-pressed={ambition===d.key} onClick={()=>{onChoose(d.key);scrollToRoute();}}><span className={s.directionTop}><ArrowDown size={22} aria-hidden="true"/></span><strong>{d.label}</strong><span className={s.description}>{d.description}</span><span className={s.selection}>{ambition===d.key?<><span className={s.activeDot}/> Showing below</>:<>Try it here <ArrowDown size={14} aria-hidden="true"/></>}</span></button>
      <Link href={d.href} className={s.goTo}>{d.linkLabel} <ArrowUpRight size={15} aria-hidden="true"/></Link>
    </article>)}</div>
  </header>;
}

// Sits above the interactive section so visitors can switch, or leave for
// the full page, without scrolling back to the opening cards.
export function RouteBar({ambition,onChoose}:{ambition:Ambition;onChoose:(key:Ambition)=>void}) {
  const current=directions.find(d=>d.key===ambition)!;
  return <nav id="route-switch" className={s.routeBar} aria-label="Switch section">
    <span>You’re viewing <strong>{current.label}</strong></span>
    <div className={s.routeSwitch}>{directions.filter(d=>d.key!==ambition).map(d=><button type="button" key={d.key} onClick={()=>onChoose(d.key)}>Switch to {d.label}</button>)}</div>
    <Link href={current.href}>{current.linkLabel} <ArrowUpRight size={15} aria-hidden="true"/></Link>
  </nav>;
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
  return <section hidden={!active} id={active?'your-route':undefined} className={s.workspace}>
    <div className={s.workspaceHeading}><div><p className={s.eyebrow}>FOR YOUR BUSINESS</p><h2>Find what is holding<br/><em>your business back.</em></h2></div><p>Choose the problems you’re facing.<br/>See what to check and where to start.</p></div>
    <div className={s.desk}><div className={s.serviceColumn}><div className={s.columnLabel}>What do you need?</div><div className={s.services}>{services.map((item,i)=><button key={item.title} aria-pressed={selected===i} onClick={()=>{setSelected(i);setNotice('');}}><span>0{i+1}</span><strong>{item.title}</strong><ArrowUpRight size={19}/></button>)}</div><div className={s.serviceNote} key={selected}><p>{service.description}</p><Link href={`/contact?service=${['business-plan','business-case-study','website-build','sop-vault'][selected]}`}>Discuss this project <ArrowUpRight size={17}/></Link></div><Link href="/services" className={s.allServices}>Explore business services <ArrowRight size={16}/></Link></div>
    <div className={s.brief}><div className={s.briefBar}><span><span className={s.activeDot}/> YOUR PROJECT STARTS HERE</span><span>01 / NEXT STEPS</span></div><div className={s.paper}><div className={s.paperHeader}><span>PROWESS<br/><small>DIGITAL SOLUTIONS</small></span><span>LET’S MAKE<br/>IT HAPPEN ↗</span></div><label className={s.nameLabel} htmlFor="business-name">Your business name</label><input id="business-name" className={s.businessName} value={name} onChange={e=>setName(e.target.value)} maxLength={100} placeholder="Enter your business name"/><div className={s.serviceTag}>{service.title}</div><label className={s.goalLabel} htmlFor="business-goal">What else would you like us to understand? (optional)</label><textarea id="business-goal" value={goal} onChange={e=>setNotes(prev=>({...prev,[selected]:e.target.value}))} maxLength={1500} placeholder="Add any details you want to include in your printout." rows={2}/><div className={s.checklistHeading}><strong>Which problems are you facing?</strong><span>{complete.length} selected</span></div><div className={s.checklist}>{service.problems.map((item,i)=><label key={`${selected}-${i}`}><input type="checkbox" checked={complete.includes(i)} onChange={()=>setChecked(prev=>({...prev,[selected]:complete.includes(i)?complete.filter(n=>n!==i):[...complete,i]}))}/><span className={s.checkbox}>{complete.includes(i)&&<Check size={13}/>}</span><span>{item.label}</span></label>)}</div><div className={s.paperFooter}><span>{service.outcome}</span><span>PROWESS DIGITAL SOLUTIONS</span></div></div><div className={s.briefActions}><span>Select a problem to see possible causes and next steps.<br/><small>What you type stays on your device. Nothing is sent to us.</small></span><button onClick={download} disabled={!complete.length}>See my next steps <Download size={17}/></button></div><span className={s.status} role="status">{notice}</span></div></div>
  </section>;
}

export function JobsWorkspace({active}:{active:boolean}) {
  const [selected,setSelected]=useState(0);
  const [targetRole,setTargetRole]=useState('');
  const [notes,setNotes]=useState<Record<number,string>>({});
  const [checked,setChecked]=useState<Record<number,number[]>>({});
  const [notice,setNotice]=useState('');
  const path=careerPaths[selected];
  const chosen=checked[selected]||[];
  const currentNotes=notes[selected]||'';
  function preview() {
    const content=jobSearchPlanReport(selected,chosen,targetRole,currentNotes);
    if(!content){setNotice('Select at least one challenge to build your action plan.');return;}
    void previewSummary(`${targetRole.trim()||'My next role'}: action plan`,content);
    setNotice('Your action plan is open for review and printing.');
  }
  return <section hidden={!active} id={active?'your-route':undefined} className={s.workspace}>
    <div className={s.workspaceHeading}><div><p className={s.eyebrow}>FOR YOUR CAREER</p><h2>Get ready for<br/><em>your next job.</em></h2></div><p>Choose where you need support.<br/>Build a practical plan for your next move.</p></div>
    <div className={s.desk}><div className={s.serviceColumn}><div className={s.columnLabel}>What do you want to work on?</div><div className={s.services}>{careerPaths.map((item,i)=><button key={item.title} aria-pressed={selected===i} onClick={()=>{setSelected(i);setNotice('');}}><span>0{i+1}</span><strong>{item.title}</strong><ArrowUpRight size={19} aria-hidden="true"/></button>)}</div><div className={s.serviceNote} key={selected}><p>{path.description}</p><Link href={path.href}>{path.linkLabel} <ArrowUpRight size={17} aria-hidden="true"/></Link></div><Link href="/jobs" className={s.allServices}>Browse all jobs <ArrowRight size={16} aria-hidden="true"/></Link></div>
    <div className={s.brief}><div className={s.briefBar}><span><span className={s.activeDot}/> YOUR NEXT MOVE STARTS HERE</span><span>01 / ACTION PLAN</span></div><div className={s.paper}><div className={s.paperHeader}><span>PROWESS<br/><small>CAREER TOOLS</small></span><span>MAKE YOUR<br/>NEXT MOVE ↗</span></div><label className={s.nameLabel} htmlFor="target-role">Role or career direction</label><input id="target-role" className={s.businessName} value={targetRole} onChange={e=>setTargetRole(e.target.value)} maxLength={100} placeholder="e.g. Product designer" autoComplete="organization-title"/><div className={s.serviceTag}>{path.title}</div><label className={s.goalLabel} htmlFor="career-notes">What else should your plan include? (optional)</label><textarea id="career-notes" value={currentNotes} onChange={e=>setNotes(prev=>({...prev,[selected]:e.target.value}))} maxLength={1500} placeholder="Add a deadline, application goal or detail you want to remember." rows={2}/><div className={s.checklistHeading}><strong>Which challenges are you facing?</strong><span>{chosen.length} selected</span></div><div className={s.checklist}>{path.problems.map((problem,i)=><label key={`${selected}-${i}`}><input type="checkbox" checked={chosen.includes(i)} onChange={()=>setChecked(prev=>({...prev,[selected]:chosen.includes(i)?chosen.filter(n=>n!==i):[...chosen,i]}))}/><span className={s.checkbox}>{chosen.includes(i)&&<Check size={13} aria-hidden="true"/>}</span><span>{problem.label}</span></label>)}</div><div className={s.paperFooter}><span>{path.outcome}</span><span>PROWESS DIGITAL SOLUTIONS</span></div></div><div className={s.briefActions}><span>Select a challenge to see what to check and do next.<br/><small>What you type stays on your device. Nothing is sent to us.</small></span><button onClick={preview} disabled={!chosen.length}>View my action plan <Download size={17} aria-hidden="true"/></button></div><span className={s.status} role="status">{notice}</span></div></div>
  </section>;
}

export function OpportunitiesWorkspace({active}:{active:boolean}) {
  const [selected,setSelected]=useState(0);
  const [opportunityName,setOpportunityName]=useState('');
  const [notes,setNotes]=useState<Record<number,string>>({});
  const [checked,setChecked]=useState<Record<number,number[]>>({});
  const [notice,setNotice]=useState('');
  const path=opportunityPaths[selected];
  const chosen=checked[selected]||[];
  const currentNotes=notes[selected]||'';
  function preview() {
    const content=opportunityPlanReport(selected,chosen,opportunityName,currentNotes);
    if(!content){setNotice('Select at least one challenge to build your application plan.');return;}
    void previewSummary(`${opportunityName.trim()||'My opportunity'}: application plan`,content);
    setNotice('Your application plan is open for review and printing.');
  }
  return <section hidden={!active} id={active?'your-route':undefined} className={s.workspace}>
    <div className={s.workspaceHeading}><div><p className={s.eyebrow}>FOR YOUR NEXT OPPORTUNITY</p><h2>Find an opportunity.<br/><em>Prepare a strong application.</em></h2></div><p>Choose the opportunity you want.<br/>Work through what your application needs.</p></div>
    <div className={s.desk}><div className={s.serviceColumn}><div className={s.columnLabel}>What are you preparing for?</div><div className={s.services}>{opportunityPaths.map((item,i)=><button key={item.title} aria-pressed={selected===i} onClick={()=>{setSelected(i);setNotice('');}}><span>0{i+1}</span><strong>{item.title}</strong><ArrowUpRight size={19} aria-hidden="true"/></button>)}</div><div className={s.serviceNote} key={selected}><p>{path.description}</p><Link href={path.href}>{path.linkLabel} <ArrowUpRight size={17} aria-hidden="true"/></Link></div><Link href="/opportunities" className={s.allServices}>Browse all opportunities <ArrowRight size={16} aria-hidden="true"/></Link></div>
    <div className={s.brief}><div className={s.briefBar}><span><span className={s.activeDot}/> YOUR APPLICATION STARTS HERE</span><span>01 / APPLICATION PLAN</span></div><div className={s.paper}><div className={s.paperHeader}><span>PROWESS<br/><small>OPPORTUNITIES</small></span><span>PREPARE.<br/>THEN APPLY. ↗</span></div><label className={s.nameLabel} htmlFor="opportunity-name">Opportunity or organisation</label><input id="opportunity-name" className={s.businessName} value={opportunityName} onChange={e=>setOpportunityName(e.target.value)} maxLength={120} placeholder="Enter the opportunity name" autoComplete="off"/><div className={s.serviceTag}>{path.title}</div><label className={s.goalLabel} htmlFor="opportunity-notes">What else should your plan include? (optional)</label><textarea id="opportunity-notes" value={currentNotes} onChange={e=>setNotes(prev=>({...prev,[selected]:e.target.value}))} maxLength={1500} placeholder="Add the deadline, requirement or detail you want to remember." rows={2}/><div className={s.checklistHeading}><strong>Which challenges are you facing?</strong><span>{chosen.length} selected</span></div><div className={s.checklist}>{path.challenges.map((challenge,i)=><label key={`${selected}-${i}`}><input type="checkbox" checked={chosen.includes(i)} onChange={()=>setChecked(prev=>({...prev,[selected]:chosen.includes(i)?chosen.filter(n=>n!==i):[...chosen,i]}))}/><span className={s.checkbox}>{chosen.includes(i)&&<Check size={13} aria-hidden="true"/>}</span><span>{challenge.label}</span></label>)}</div><div className={s.paperFooter}><span>{path.outcome}</span><span>PROWESS DIGITAL SOLUTIONS</span></div></div><div className={s.briefActions}><span>Select a challenge to see what to check and do next.<br/><small>What you type stays on your device. Nothing is sent to us.</small></span><button onClick={preview} disabled={!chosen.length}>View my application plan <Download size={17} aria-hidden="true"/></button></div><span className={s.status} role="status">{notice}</span></div></div>
  </section>;
}

export function SkillsWorkspace({active}:{active:boolean}) {
  const [selected,setSelected]=useState(0);
  const [skillName,setSkillName]=useState('');
  const [notes,setNotes]=useState<Record<number,string>>({});
  const [checked,setChecked]=useState<Record<number,number[]>>({});
  const [notice,setNotice]=useState('');
  const path=learningPaths[selected];
  const chosen=checked[selected]||[];
  const currentNotes=notes[selected]||'';
  function preview() {
    const content=learningPlanReport(selected,chosen,skillName,currentNotes);
    if(!content){setNotice('Select at least one challenge to build your learning plan.');return;}
    void previewSummary(`${skillName.trim()||'My next skill'}: learning plan`,content);
    setNotice('Your learning plan is open for review and printing.');
  }
  return <section hidden={!active} id={active?'your-route':undefined} className={s.workspace}>
    <div className={s.workspaceHeading}><div><p className={s.eyebrow}>FOR YOUR LEARNING</p><h2>Learn a skill<br/><em>you can actually use.</em></h2></div><p>Choose what is slowing you down.<br/>Build a plan you can follow.</p></div>
    <div className={s.desk}><div className={s.serviceColumn}><div className={s.columnLabel}>What do you want to work on?</div><div className={s.services}>{learningPaths.map((item,i)=><button key={item.title} aria-pressed={selected===i} onClick={()=>{setSelected(i);setNotice('');}}><span>0{i+1}</span><strong>{item.title}</strong><ArrowUpRight size={19} aria-hidden="true"/></button>)}</div><div className={s.serviceNote} key={selected}><p>{path.description}</p><Link href={path.href}>{path.linkLabel} <ArrowUpRight size={17} aria-hidden="true"/></Link></div><Link href="/learn" className={s.allServices}>Explore all learning <ArrowRight size={16} aria-hidden="true"/></Link></div>
    <div className={s.brief}><div className={s.briefBar}><span><span className={s.activeDot}/> YOUR LEARNING STARTS HERE</span><span>01 / LEARNING PLAN</span></div><div className={s.paper}><div className={s.paperHeader}><span>PROWESS<br/><small>LEARNING</small></span><span>LEARN.<br/>PRACTISE. APPLY. ↗</span></div><label className={s.nameLabel} htmlFor="skill-name">Skill or subject</label><input id="skill-name" className={s.businessName} value={skillName} onChange={e=>setSkillName(e.target.value)} maxLength={100} placeholder="e.g. Data analysis" autoComplete="off"/><div className={s.serviceTag}>{path.title}</div><label className={s.goalLabel} htmlFor="learning-notes">What else should your plan include? (optional)</label><textarea id="learning-notes" value={currentNotes} onChange={e=>setNotes(prev=>({...prev,[selected]:e.target.value}))} maxLength={1500} placeholder="Add the time available, a goal or a detail you want to remember." rows={2}/><div className={s.checklistHeading}><strong>Which challenges are you facing?</strong><span>{chosen.length} selected</span></div><div className={s.checklist}>{path.challenges.map((challenge,i)=><label key={`${selected}-${i}`}><input type="checkbox" checked={chosen.includes(i)} onChange={()=>setChecked(prev=>({...prev,[selected]:chosen.includes(i)?chosen.filter(n=>n!==i):[...chosen,i]}))}/><span className={s.checkbox}>{chosen.includes(i)&&<Check size={13} aria-hidden="true"/>}</span><span>{challenge.label}</span></label>)}</div><div className={s.paperFooter}><span>{path.outcome}</span><span>PROWESS DIGITAL SOLUTIONS</span></div></div><div className={s.briefActions}><span>Select a challenge to see what to check and do next.<br/><small>What you type stays on your device. Nothing is sent to us.</small></span><button onClick={preview} disabled={!chosen.length}>View my learning plan <Download size={17} aria-hidden="true"/></button></div><span className={s.status} role="status">{notice}</span></div></div>
  </section>;
}
