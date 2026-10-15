import Link from "next/link";
import { ArrowDown, ArrowRight, Check, ChevronRight, CircleCheck, Gauge, Search, ShieldCheck, TriangleAlert } from "lucide-react";
import type { ServicePageContent } from "@/content/servicePages";
import ServiceTestimonials from "./ServiceTestimonials";
import ServiceCheckout from "./ServiceCheckout";
import s from "./FeasibilityStudiesOffer.module.css";

const questions=[
  ['Demand','Are enough customers willing to buy at the price the business needs?'],
  ['Delivery','Can the business provide the offer reliably with the available people and resources?'],
  ['Money','Do revenue, costs and cash requirements support a workable business?'],
  ['Risk','What could prevent the idea from working, and what would reduce that risk?'],
];

export default function FeasibilityStudiesOffer({service}:{service:ServicePageContent}){
  return <main className={s.page}>
    <section className={s.hero}><div className={s.wrap}>
      <nav className={s.breadcrumb}><Link href="/services">Business Services</Link><ChevronRight aria-hidden="true"/><span>Feasibility Studies</span></nav>
      <div className={s.heroGrid}><div className={s.heroCopy}><p className={s.kicker}>Before you commit the money</p><h1>The opportunity looks promising. The study shows whether it can work.</h1><p className={s.intro}>A good idea can still fail because demand was overestimated, costs were missed or the operation was harder than expected. We investigate those questions before you make the larger commitment.</p><div className={s.actions}><a className={s.primary} href="#feasibility-checkout">Assess my opportunity <ArrowRight aria-hidden="true"/></a><a className={s.textLink} href="#questions">See what we test <ArrowDown aria-hidden="true"/></a></div><div className={s.assurance}><span><ShieldCheck aria-hidden="true"/>One-time payment</span><span><CircleCheck aria-hidden="true"/>Written findings and recommendation</span></div></div>
      <aside className={s.decisionPanel}><div className={s.panelTop}><span>FEASIBILITY REVIEW</span><span>GO / REWORK / STOP</span></div><div className={s.dial}><Gauge aria-hidden="true"/><div><small>Decision confidence</small><strong>Built from evidence</strong></div></div><div className={s.panelQuestion}><p>Before proceeding, can you answer:</p><strong>Who will buy?</strong><strong>What will it cost?</strong><strong>What must be true?</strong></div><div className={s.panelFoot}><TriangleAlert aria-hidden="true"/><span>Find the expensive assumptions before they become expensive mistakes.</span></div></aside></div>
    </div></section>

    <section className={s.recognition}><div className={s.wrap}><p className={s.kicker}>The warning signs</p><div className={s.recognitionGrid}><h2>You should not have to invest first and understand the risk later.</h2><div><p>The idea may be attractive, but important questions are still unanswered:</p><ul><li>Customers say they like it, but nobody has tested what they will pay.</li><li>The projected profit looks strong, but operating costs are incomplete.</li><li>The location, equipment or team has been chosen before demand is confirmed.</li><li>Partners support the opportunity but disagree about what success requires.</li></ul></div></div></div></section>

    <section id="questions" className={s.questions}><div className={s.wrap}><div className={s.heading}><div><p className={s.kicker}>The four tests</p><h2>We examine the conditions the opportunity depends on.</h2></div><p>The study does not begin with a preferred answer. It begins with the questions that could change the decision.</p></div><div className={s.questionGrid}>{questions.map(([title,body],index)=><article key={title}><span>{title}</span><strong>{body}</strong><div className={s.progress}><i style={{width:`${58+index*10}%`}}/></div></article>)}</div></div></section>

    <section className={s.evidence}><div className={s.wrap}><div className={s.evidenceCard}><div className={s.cardTitle}><Search aria-hidden="true"/><span>Evidence register</span></div><div className={s.evidenceRows}><div><span>Customer and market evidence</span><b>Tested</b></div><div><span>Operating requirements</span><b>Mapped</b></div><div><span>Cost and revenue assumptions</span><b>Checked</b></div><div><span>Constraints and dependencies</span><b>Visible</b></div></div></div><div className={s.evidenceCopy}><p className={s.kicker}>From assumption to evidence</p><h2>A recommendation is useful only when you can see what supports it.</h2><p>You receive the findings, the assumptions behind them and the conditions that would need to change. That gives you a basis for proceeding, revising the idea or walking away.</p><ul>{service.deliverables.map(item=><li key={item}><Check aria-hidden="true"/>{item}</li>)}</ul></div></div></section>

    <section className={s.outcomes}><div className={s.wrap}><div className={s.heading}><div><p className={s.kicker}>A useful answer in every direction</p><h2>The study does more than say yes or no.</h2></div></div><div className={s.outcomeGrid}><article><span className={s.go}>Proceed</span><h3>The evidence supports the opportunity.</h3><p>You know the requirements, assumptions and next steps needed to move forward.</p></article><article><span className={s.rework}>Rework</span><h3>The opportunity needs changes first.</h3><p>You see which parts of the model, cost, market or operation need to be corrected.</p></article><article><span className={s.stop}>Do not proceed yet</span><h3>The risk is stronger than the current case.</h3><p>You can protect more of your time and capital before the commitment becomes difficult to reverse.</p></article></div></div></section>

    <section className={s.process}><div className={s.wrap}><div className={s.processHead}><p className={s.kicker}>How the study is completed</p><h2>Focused investigation, followed by a clear recommendation.</h2></div><div className={s.processList}>{service.process.map(step=><article key={step.title}><span/><div><h3>{step.title}</h3><p>{step.body}</p></div></article>)}</div></div></section>

    <section className={s.fit}><div className={s.wrap}><div><p className={s.kicker}>When this service is useful</p><h2>A meaningful investment depends on an assumption you have not confirmed.</h2></div><ul>{service.fit.map(item=><li key={item}><CircleCheck aria-hidden="true"/>{item}</li>)}</ul></div></section>

    <div className={`${s.wrap} ${s.testimonialShell}`}><ServiceTestimonials slug={service.slug}/></div>

    <section className={s.faq}><div className={s.wrap}><div><p className={s.kicker}>Before the study begins</p><h2>Questions clients ask before committing.</h2></div><div>{service.faq.map(item=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></div></section>

    <section id="feasibility-checkout" className={s.checkout}><div className={`${s.wrap} ${s.checkoutShell}`}><ServiceCheckout slug={service.slug} title={service.title}/></div></section>
  </main>;
}
