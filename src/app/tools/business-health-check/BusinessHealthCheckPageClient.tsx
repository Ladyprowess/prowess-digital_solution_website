"use client";

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, Printer } from 'lucide-react';
import { previewSummary } from '@/lib/businessSummary';
import { auditCategories, auditAnswerLabels, auditNextSteps, auditReport, summarizeAudit, type AuditAnswer, type AuditAnswers } from '@/lib/operationalAudit';
import s from './OperationalAudit.module.css';

export default function BusinessHealthCheckPageClient() {
  const [answers,setAnswers]=useState<AuditAnswers>({});
  const [expanded,setExpanded]=useState(0);
  const [email,setEmail]=useState('');
  const [unlocked,setUnlocked]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [error,setError]=useState('');
  const submission=useRef(false);
  const resultRef=useRef<HTMLElement>(null);
  const summary=summarizeAudit(answers);
  const options=Object.entries(auditAnswerLabels) as [AuditAnswer,string][];
  function preview() {
    const report=auditReport(answers);
    if(report)void previewSummary('Your operational self-audit',report);
  }
  function findUnanswered() {
    const category=auditCategories.findIndex((cat,c)=>cat.items.some((_,i)=>!answers[`${c}-${i}`]));
    if(category<0)return;
    setExpanded(category);
    requestAnimationFrame(()=>{
      const target=document.getElementById(`category-${category}`);
      target?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      target?.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
    });
  }
  async function openResult(event:React.FormEvent) {
    event.preventDefault();
    if(!summary.complete||submission.current)return;
    submission.current=true;setSubmitting(true);setError('');
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
    try {
      const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,
        body:JSON.stringify({source:'operational-health-self-audit',email:email.trim(),answers})});
      const data=await response.json();
      if(!response.ok||!data.ok)throw new Error(data.error||'Could not open your result. Please try again.');
      setUnlocked(true);
      requestAnimationFrame(()=>{resultRef.current?.scrollIntoView({block:'start'});resultRef.current?.focus({preventScroll:true});});
    } catch { setError('We couldn’t record your assessment request. Your answers are still here. Please try again.'); }
    finally {clearTimeout(timeout);submission.current=false;setSubmitting(false);}
  }
  return <main className={s.page}>
    <header className={s.header}><Link href="/tools">← Business tools</Link><p className={s.eyebrow}>FREE BUSINESS CHECKLIST</p><h1>Operational Health<br/><em>Self-Audit</em></h1><p>Look at how your business runs today. Review 36 checkpoints, separate what’s working from what needs attention, and keep a plan for your next steps.</p></header>
    <div className={s.layout}>
      <aside className={s.progress} aria-label="Assessment progress"><p className={s.eyebrow}>YOUR REVIEW</p><strong>{summary.reviewed}<span> / {summary.total}</span></strong><p>checkpoints answered</p><progress max={summary.total} value={summary.reviewed} aria-label="Checkpoints answered"/><div className={s.counts}><span>In place <b>{summary.inPlace}</b></span><span>In progress <b>{summary.inProgress}</b></span><span>Not in place <b>{summary.notInPlace}</b></span><span>Not applicable <b>{summary.notApplicable}</b></span></div><p className={s.note}>Completion shows how much you’ve reviewed. It is not a business health score.</p><a href="#audit-result-access" className={s.link}>Go to my result <ArrowRight size={16}/></a><p className={s.note}>Your progress is kept while this page is open. Preview and download your report before leaving.</p></aside>
      <div><div className={s.instructions}><h2>Choose what is true today.</h2><p><b>In place</b> means it is set up and used. Choose <b>In progress</b> if it is only partly done, or <b>Not in place</b> if it is missing. Use <b>Not applicable</b> when it does not fit your business.</p></div>
        <div className={s.categories}>{auditCategories.map((category,c)=>{
          const reviewed=category.items.filter((_,i)=>answers[`${c}-${i}`]).length;
          return <section key={category.title} id={`category-${c}`} className={s.category}><h2><button type="button" aria-expanded={expanded===c} aria-controls={`questions-${c}`} onClick={()=>setExpanded(expanded===c?-1:c)}><span className={s.categoryNumber}>{reviewed===category.items.length?<Check size={18}/>:String(c+1).padStart(2,'0')}</span><span>{category.title}<small>{reviewed} of {category.items.length} answered</small></span><ChevronDown size={20} className={expanded===c?s.rotated:''}/></button></h2>
          <div id={`questions-${c}`} hidden={expanded!==c} className={s.questions}><p>{category.description}</p>{category.items.map((item,i)=>{
            const key=`${c}-${i}`;
            return <fieldset key={key} disabled={submitting}><legend>{item}</legend><div className={s.options}>{options.map(([value,label])=><label key={value} className={answers[key]===value?s.selected:''}><input type="radio" name={`audit-${key}`} value={value} checked={answers[key]===value} onChange={()=>setAnswers(previous=>({...previous,[key]:value}))}/>{label}</label>)}</div></fieldset>;
          })}{c<auditCategories.length-1&&<button type="button" className={s.next} onClick={()=>{setExpanded(c+1);requestAnimationFrame(()=>document.getElementById(`category-${c+1}`)?.scrollIntoView({block:'start'}));}}>Next: {auditCategories[c+1].title}<ArrowRight size={17}/></button>}</div></section>;
        })}</div>
        <section id="audit-result-access" className={s.access}><h2>{unlocked?'Your report is ready below.':'See what to work on next.'}</h2><p>Your report separates completed, unfinished and non-applicable checkpoints. It includes a breakdown for each area and next steps to consider.</p>{!summary.complete?<><p className={s.remaining} role="status">{summary.total-summary.reviewed} checkpoints still need an answer.</p><button className={s.primary} type="button" onClick={findUnanswered}>Continue my review <ArrowRight size={17}/></button></>:!unlocked?<form onSubmit={openResult}><label htmlFor="audit-email">Email address</label><div className={s.emailRow}><input id="audit-email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={submitting} onChange={e=>setEmail(e.target.value)} placeholder="you@business.com"/><button className={s.primary} disabled={submitting}>{submitting?'Opening your result…':'Show my result'}<ArrowRight size={17}/></button></div><p className={s.note}>We record your email and assessment totals. Your report opens here; it is not sent by email. <Link href="/privacy">Privacy policy</Link></p>{error&&<p className={s.error} role="alert">{error}</p>}</form>:<button className={s.primary} type="button" onClick={preview}>Preview my result <Printer size={18}/></button>}</section>
      </div>
    </div>
    {unlocked&&summary.complete&&<section id="operational-health-result" ref={resultRef} tabIndex={-1} className={s.result} aria-labelledby="result-title"><div className={s.resultHeading}><div><p className={s.eyebrow}>BASED ON YOUR CURRENT ANSWERS</p><h2 id="result-title">Your operational review.</h2></div><button type="button" className={s.primary} onClick={preview}>Preview my result <Printer size={18}/></button></div><div className={s.resultSummary}><strong>{summary.percent===null?'No score':`${summary.percent}%`}</strong><div><h3>{summary.percent===null?'No applicable checkpoints selected':`${summary.inPlace} of ${summary.applicable} applicable checkpoints marked in place`}</h3><p>{summary.percent===null?'You marked every checkpoint as not applicable. Review the questions to check whether this checklist fits your business.':`${summary.inProgress} in progress. ${summary.notInPlace} not in place. ${summary.notApplicable} not applicable.`}</p></div></div><p className={s.method}>This percentage describes completed checkpoints, not business performance. Not-applicable answers are excluded. In-progress items do not count as completed. Each applicable checkpoint has equal weight. It does not verify compliance, profitability or readiness to grow.</p><div className={s.resultCategories}>{auditCategories.map((category,c)=>{
      const unfinished=category.items.filter((_,i)=>['not_in_place','in_progress'].includes(answers[`${c}-${i}`]));
      const excluded=category.items.filter((_,i)=>answers[`${c}-${i}`]==='not_applicable').length;
      return <article key={category.title}><h3>{category.title}</h3><p>{unfinished.length?`${unfinished.length} checkpoints to work on`:excluded===category.items.length?'All checkpoints marked not applicable.':'All applicable checkpoints marked in place.'}</p><ul>{category.items.map((item,i)=>['not_in_place','in_progress'].includes(answers[`${c}-${i}`])?<li key={item}><span>{auditAnswerLabels[answers[`${c}-${i}`]]}</span>{item}</li>:null)}</ul>{unfinished.length>0&&<div className={s.suggestion}><strong>Next step to consider</strong><p>{auditNextSteps[c]}</p></div>}</article>;
    })}</div><div className={s.resultFoot}><p>Choose the unfinished items with the greatest impact on your work. Assign someone to each one and agree a review date.</p><Link href="/services/business-structure-diagnostic">Get help reviewing your business <ArrowRight size={17}/></Link></div></section>}
  </main>;
}
