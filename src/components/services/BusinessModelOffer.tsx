"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, CircleDollarSign, PackageCheck, Users, Workflow } from "lucide-react";
import type { ServicePageContent } from "@/content/servicePages";
import { previewSummary } from "@/lib/businessSummary";
import ServiceTestimonials from "./ServiceTestimonials";
import ServiceCheckout from "./ServiceCheckout";
import s from "./BusinessModelOffer.module.css";

const fields = [
  { key: "customer", label: "Customer", prompt: "Who has the strongest reason to buy?", placeholder: "Independent retailers managing frequent stock shortages", icon: Users },
  { key: "value", label: "Value", prompt: "What meaningful result do you provide?", placeholder: "Fewer stock-outs and less money tied up in slow-moving products", icon: PackageCheck },
  { key: "delivery", label: "Delivery", prompt: "What must happen consistently to create that result?", placeholder: "Weekly stock review, reorder guidance and supplier coordination", icon: Workflow },
  { key: "money", label: "Money", prompt: "How does the business earn after delivery costs?", placeholder: "Monthly service fee with delivery capacity capped per adviser", icon: CircleDollarSign },
] as const;

export default function BusinessModelOffer({ service }: { service: ServicePageContent }) {
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const complete = answers.filter((answer) => answer.trim()).length;
  const ActiveIcon = fields[active].icon;

  return <main className={s.page}>
    <section className={s.hero}><div className={s.wrap}>
      <nav className={s.breadcrumb}><Link href="/services">Business Services</Link><ArrowRight aria-hidden="true"/><span>Start</span></nav>
      <div className={s.heroGrid}>
        <div><p className={s.kicker}>Business model design</p><h1>A good idea still needs a way to work as a business.</h1><p className={s.lead}>Clarify who will buy, what they are paying for, how you will deliver it and what must remain after the costs.</p><div className={s.actions}><a href="#model-workbench" className={s.primary}>Map my business model <ArrowDown aria-hidden="true"/></a><a href="#business-model-checkout" className={s.link}>Start this service <ArrowRight aria-hidden="true"/></a></div><p className={s.assurance}>One-time payment · NGN or USD · Written confirmation</p></div>
        <div className={s.modelBoard} aria-label="Business model relationship preview"><div className={s.boardTop}><span>YOUR BUSINESS LOGIC</span><span>FOUR CONNECTED DECISIONS</span></div><div className={s.boardGrid}>{fields.map((field,index)=><div key={field.key} className={index===1?s.focusCell:""}><field.icon aria-hidden="true"/><small>{field.label}</small><strong>{["A specific customer","A result worth paying for","A repeatable way to deliver","Revenue that covers the work"][index]}</strong></div>)}</div><p>If one part is weak, the pressure appears somewhere else.</p></div>
      </div>
    </div></section>

    <section className={s.warning}><div className={s.wrap}><p className={s.kicker}>Where business models break</p><div><h2>Demand alone does not make the model viable.</h2><p>Customers may like the idea while the price, delivery effort, sales route or cost structure makes it difficult to sustain. The model needs to work as one connected system.</p></div></div></section>

    <section id="model-workbench" className={s.workbench}><div className={s.wrap}>
      <div className={s.sectionHead}><div><p className={s.kicker}>Work through the logic</p><h2>Can you explain how the business works without filling the gaps with hope?</h2></div><p>Use this working canvas to capture what you know. Your entries stay in place as you move between the four decisions.</p></div>
      <div className={s.builder}>
        <aside>{fields.map((field,index)=><button key={field.key} aria-pressed={active===index} onClick={()=>setActive(index)}><span>{answers[index].trim()?<Check/>:<field.icon/>}</span><div><small>{field.label}</small><strong>{field.prompt}</strong></div></button>)}</aside>
        <div className={s.paper}><header><span>PROWESS DIGITAL SOLUTIONS</span><span>BUSINESS MODEL WORKING VIEW</span></header><div className={s.question}><ActiveIcon aria-hidden="true"/><p className={s.kicker}>{fields[active].label}</p><h3>{fields[active].prompt}</h3><textarea value={answers[active]} rows={5} maxLength={420} placeholder={fields[active].placeholder} onChange={(event)=>setAnswers(current=>current.map((answer,index)=>index===active?event.target.value:answer))}/></div><div className={s.progress}><span>{complete} of 4 decisions captured</span><i><b style={{width:`${complete*25}%`}}/></i></div><div id="business-model-result" className={s.summary}>{fields.map((field,index)=><article key={field.key}><small>{field.label}</small><p>{answers[index].trim()||"Not answered yet"}</p></article>)}</div><button data-model-preview disabled={complete<4} onClick={()=>previewSummary("Business model working view","Review the customer, value, delivery and money logic together.","#business-model-result")}>Preview / Print my working view <ArrowRight aria-hidden="true"/></button></div>
      </div>
    </div></section>

    <section className={s.outcomes}><div className={s.wrap}><div className={s.sectionHead}><div><p className={s.kicker}>What the paid engagement resolves</p><h2>Leave with decisions you can test, explain and improve.</h2></div><p>We turn the working assumptions into a coherent model and identify the evidence still needed before you invest further.</p></div><div className={s.outcomeGrid}>{service.deliverables.map((item,index)=><article key={item}><span>{[Users,PackageCheck,Workflow,CircleDollarSign].map((Icon)=><Icon key={Icon.displayName||Icon.name} aria-hidden="true"/>)[index]}</span><h3>{item}</h3><p>{["Define the customer with the strongest need and the reason the problem matters now.","Connect the promised result to a clear offer customers can understand.","Map the activities, partners and capacity required to deliver reliably.","Test the revenue, cost and assumption logic before it becomes expensive."][index]}</p></article>)}</div></div></section>

    <section className={s.process}><div className={s.wrap}><div><p className={s.kicker}>How we build it</p><h2>One model. Three focused stages.</h2></div><div>{service.process.map((step)=><article key={step.title}><span/><div><h3>{step.title}</h3><p>{step.body}</p></div></article>)}</div></div></section>

    <div className={`${s.wrap} ${s.reviews}`}><ServiceTestimonials slug={service.slug}/></div>
    <section className={s.faq}><div className={s.wrap}><div><p className={s.kicker}>Before you begin</p><h2>Questions founders ask first.</h2></div><div>{service.faq.map((item)=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></div></section>
    <section id="business-model-checkout" className={s.checkout}><div className={s.checkoutWrap}><ServiceCheckout slug={service.slug} title={service.title}/></div></section>
  </main>;
}
