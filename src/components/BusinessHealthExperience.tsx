"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Compass, Target, TrendingUp, Workflow, Wallet } from "lucide-react";
import { healthQuestions, scoreHealth, healthAnswers, healthFindings } from "@/lib/businessHealth";
import { previewSummary } from "@/lib/businessSummary";
import { businessVerdict } from "@/lib/businessVerdict";
const icons=[Target,Wallet,TrendingUp,Workflow,Compass];
export default function BusinessHealthExperience(){
 const [answers,setAnswers]=useState<number[]>(Array(5).fill(-1));
 const [step,setStep]=useState(0);
 const [finished,setFinished]=useState(false);
 const count=answers.filter(v=>v>=0).length;
 const result=finished?scoreHealth(answers):null;
 const verdict=businessVerdict(answers);
 const findings=healthFindings(answers);
 const question=healthQuestions[step]; const Icon=icons[step];
 const focus="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
 return <div className="grid overflow-hidden rounded-2xl border border-border lg:grid-cols-[280px_minmax(0,1fr)]">
  <aside className="bg-muted p-6 text-foreground sm:p-8">
   <p className="text-xs font-bold uppercase tracking-widest opacity-70">Your business, in focus</p>
   <h3 className="mt-4 text-3xl font-semibold leading-tight">Where does the work get stuck?</h3>
   <p className="mt-4 text-sm leading-6 opacity-80">Look at five foundations of a well-run business. Leave with a clearer starting point.</p>
   <div className="my-8 flex items-end gap-2" aria-label={`${count} of 5 questions answered`}>{answers.map((a,i)=><div key={i} className={`h-2 flex-1 rounded-full ${a>=0?"bg-primary":"bg-border"}`}/>)}</div>
   <div className="hidden space-y-3 lg:block">{healthQuestions.map((q,i)=>{const ItemIcon=icons[i];return <button key={q.area} onClick={()=>{setStep(i);setFinished(false);}} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm ${focus} ${i===step&&!finished?"bg-background":"opacity-75"}`}><ItemIcon size={18} aria-hidden/>{q.area}{answers[i]>=0&&<Check size={16} className="ml-auto" aria-label="Answered"/>}</button>;})}</div>
   <p className="mt-8 text-xs leading-5 opacity-70">Free • No email required<br/>Your answers stay on this page.</p>
  </aside>
  <div className="flex min-h-[480px] flex-col bg-card p-6 sm:p-10">
   {result?<div aria-live="polite">
    <p className="text-sm font-semibold uppercase tracking-widest text-primary">Your starting point</p>
    <div className="mt-6 flex flex-wrap items-center gap-6"><div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-8 border-primary/25"><span className="text-4xl font-bold">{result.score}<span className="block text-center text-xs font-medium text-muted-foreground">OUT OF 100</span></span></div><div className="max-w-sm"><h4 className="text-2xl font-bold">{verdict?.name}</h4><p className="mt-2 text-muted-foreground">{verdict?.description}</p></div></div>
    <div className="mt-8 space-y-4">{findings.map((q,i)=><div className="flex gap-4 border-t border-border pt-4" key={q.area}><span className="text-sm font-bold text-primary">0{i+1}</span><div><h5 className="font-semibold">{q.area} · {q.value===0?"Establish":q.value===1?"Strengthen":"Maintain"}</h5><p className="mt-2 text-sm text-muted-foreground">Your answer: {q.answer}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{q.action}</p></div></div>)}</div>
    <p className="mt-6 text-xs leading-5 text-muted-foreground">Each answer scores 0, 1 or 2 across five equally weighted areas. Your total out of 10 becomes a percentage. Missing practices appear first, then inconsistent practices, then strengths. This measures reported habits, not business performance or likely success.</p>
    <div className="mt-6 flex flex-wrap gap-3"><Link href="/services/business-structure-diagnostic" className={`inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground ${focus}`}>Explore the full diagnostic <ArrowRight size={18}/></Link><button onClick={()=>previewSummary(verdict!.name,`${verdict!.description}\n\nSELF-ASSESSED SCORE: ${result.score}/100\nMethod: five equally weighted areas. Each answer scores 0, 1 or 2. The total is divided by 10 and expressed as a percentage. This reflects reported habits, not business performance.\n\n${findings.map(q=>`${q.area} · ${q.value===0?'Establish':q.value===1?'Strengthen':'Maintain'}\nQuestion: ${q.question}\nYour answer: ${q.answer}\nNext action: ${q.action}`).join("\n\n")}\n\nStart with areas marked Establish, then Strengthen. Validate your answers against recent business records. This is not an independent audit.`)} className={`min-h-12 rounded-lg border border-border px-5 ${focus}`}>Generate my result</button><button onClick={()=>{setFinished(false);setStep(0);}} className={`min-h-12 rounded-lg border border-border px-5 ${focus}`}>Review answers</button></div>
   </div>:<>
    <div className="flex items-center justify-between"><span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={24} aria-hidden/></span><span className="text-sm font-medium text-muted-foreground">Question {step+1} of 5</span></div>
    <p className="mt-7 text-sm font-semibold text-primary">{question.area}</p>
    <h4 className="mt-3 max-w-xl text-2xl font-semibold leading-snug sm:text-3xl">{question.question}</h4>
    <fieldset className="mt-7 space-y-3"><legend className="sr-only">Choose the answer closest to your business</legend>{healthAnswers[step].map((description,value)=>[["Not in place","Partly in place","In place"][value],description]).map(([title,desc],value)=><label key={title} className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${answers[step]===value?"border-primary bg-primary/10":"border-border hover:bg-muted"}`}><input type="radio" name={`guided-health-${step}`} checked={answers[step]===value} onChange={()=>setAnswers(old=>old.map((v,i)=>i===step?value:v))} className={`h-5 w-5 shrink-0 accent-primary ${focus}`}/><span><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm text-muted-foreground">{desc}</span></span></label>)}</fieldset>
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5"><button disabled={step===0} onClick={()=>setStep(step-1)} className={`inline-flex min-h-12 items-center gap-2 rounded-lg px-3 disabled:opacity-30 ${focus}`}><ArrowLeft size={18}/>Back</button><button disabled={answers[step]<0} onClick={()=>step===4?(count===5?setFinished(true):setStep(answers.findIndex(v=>v<0))):setStep(step+1)} className={`inline-flex min-h-12 items-center gap-3 rounded-lg bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-40 ${focus}`}>{step===4?"Show my results":"Continue"}<ArrowRight size={18}/></button></div>
   </>}
  </div>
 </div>;
}
