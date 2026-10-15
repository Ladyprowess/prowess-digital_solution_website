import Link from "next/link";
import { ArrowDown, ArrowRight, Check, ChevronRight, CircleCheck, Crosshair, MapPin, Search, ShieldCheck, Users } from "lucide-react";
import type { ServicePageContent } from "@/content/servicePages";
import ServiceTestimonials from "./ServiceTestimonials";
import ServiceCheckout from "./ServiceCheckout";
import s from "./MarketResearchOffer.module.css";

const marketQuestions=[
  {label:'Customer',question:'Who is most likely to buy, and what influences the decision?',icon:Users},
  {label:'Competition',question:'What alternatives are customers already choosing?',icon:Crosshair},
  {label:'Demand',question:'What evidence shows that the opportunity exists?',icon:Search},
  {label:'Market entry',question:'Where should the business focus first?',icon:MapPin},
];

export default function MarketResearchOffer({service}:{service:ServicePageContent}){
  return <main className={s.page}>
    <section className={s.hero}><div className={s.wrap}>
      <nav className={s.breadcrumb}><Link href="/services">Business Services</Link><ChevronRight aria-hidden="true"/><span>Market Research</span></nav>
      <div className={s.heroGrid}><div className={s.heroCopy}><p className={s.kicker}>Research for a real business decision</p><h1>Before you enter the market, understand what customers already see and choose.</h1><p className={s.intro}>A market can look attractive from the outside and behave differently once you enter it. We examine customers, demand, competitors and buying conditions so your next move is based on evidence.</p><div className={s.actions}><a href="#market-research-checkout" className={s.primary}>Research my market <ArrowRight aria-hidden="true"/></a><a href="#research-focus" className={s.textLink}>See what we investigate <ArrowDown aria-hidden="true"/></a></div><div className={s.assurance}><span><ShieldCheck aria-hidden="true"/>One-time payment</span><span><CircleCheck aria-hidden="true"/>Findings tied to your business decision</span></div></div>
      <aside className={s.marketWindow}><div className={s.windowTop}><span>MARKET VIEW</span><span>RESEARCH BRIEF</span></div><div className={s.searchBar}><Search aria-hidden="true"/><span>What will make customers choose this offer?</span></div><div className={s.signalMap}><i/><i/><i/><i/><i/><b/><em>Opportunity</em></div><div className={s.windowStats}><div><small>Customer</small><strong>Need</strong></div><div><small>Market</small><strong>Demand</strong></div><div><small>Business</small><strong>Fit</strong></div></div><p>Find the strongest opportunity before spreading effort across the whole market.</p></aside></div>
    </div></section>

    <section className={s.problem}><div className={s.wrap}><div><p className={s.kicker}>The problem with assumptions</p><h2>People saying “it is a good idea” is not the same as evidence they will buy.</h2></div><div className={s.problemList}><p>Research becomes necessary when:</p><ul><li>You know the broad audience but cannot identify the strongest customer segment.</li><li>Competitors exist, but you do not know why customers choose them.</li><li>Sales are slow and the cause could be demand, positioning, price or channel.</li><li>You are entering a new location or category with limited local knowledge.</li></ul></div></div></section>

    <section id="research-focus" className={s.focus}><div className={s.wrap}><div className={s.heading}><p className={s.kicker}>What we investigate</p><h2>Four views of the market, connected to one decision.</h2><p>Research is focused on what your business needs to decide. The result shows what the evidence means, not a collection of facts without direction.</p></div><div className={s.focusGrid}>{marketQuestions.map(({label,question,icon:Icon})=><article key={label}><div><Icon aria-hidden="true"/><span>{label}</span></div><h3>{question}</h3><ArrowRight aria-hidden="true"/></article>)}</div></div></section>

    <section className={s.customer}><div className={s.wrap}><div className={s.customerBoard}><div className={s.boardTop}><span>Priority customer</span><b>Strongest fit</b></div><div className={s.persona}><div className={s.avatar}>C</div><div><small>Buying situation</small><strong>A clear reason to act</strong></div></div><div className={s.boardRows}><div><span>Problem</span><p>What the customer is trying to solve</p></div><div><span>Trigger</span><p>What makes the need urgent now</p></div><div><span>Objection</span><p>What could prevent the purchase</p></div><div><span>Choice</span><p>What makes one option more credible</p></div></div></div><div className={s.customerCopy}><p className={s.kicker}>Understand the buying decision</p><h2>Your customer is more than an age range and location.</h2><p>We look at the situation behind the purchase: the problem, alternatives, decision factors, objections and channels that shape what the customer does next.</p><ul><li><Check aria-hidden="true"/>Clear customer and segment priorities</li><li><Check aria-hidden="true"/>Buying factors connected to the offer</li><li><Check aria-hidden="true"/>Evidence your positioning can use</li></ul></div></div></section>

    <section className={s.competition}><div className={s.wrap}><div className={s.competitionCopy}><p className={s.kicker}>See the real alternatives</p><h2>Your competitor is not only the business selling the same product.</h2><p>Customers can choose another provider, solve the problem themselves, delay the purchase or do nothing. We compare the alternatives customers actually consider and show where your offer can compete credibly.</p></div><div className={s.compare}><div className={s.compareHead}><span>What customers compare</span><span>Your opportunity</span></div><div><span>Price and perceived value</span><b>Explain the difference</b></div><div><span>Trust and proof</span><b>Reduce uncertainty</b></div><div><span>Access and convenience</span><b>Remove friction</b></div><div><span>Offer and experience</span><b>Choose a clear position</b></div></div></div></section>

    <section className={s.deliverables}><div className={s.wrap}><div className={s.heading}><p className={s.kicker}>What you receive</p><h2>Findings your team can use after the presentation ends.</h2></div><div className={s.deliverableGrid}>{service.deliverables.map(item=><article key={item}><span/><h3>{item}</h3><p>Focused on the decision, supported by the research and translated into practical implications.</p></article>)}</div></div></section>

    <section className={s.process}><div className={s.wrap}><div><p className={s.kicker}>How the research works</p><h2>Begin with the decision. Gather the evidence. Explain what it means.</h2></div><div className={s.processList}>{service.process.map(step=><article key={step.title}><CircleCheck aria-hidden="true"/><div><h3>{step.title}</h3><p>{step.body}</p></div></article>)}</div></div></section>

    <section className={s.fit}><div className={s.wrap}><div><p className={s.kicker}>When this service is useful</p><h2>You need evidence before choosing the audience, offer or market direction.</h2></div><ul>{service.fit.map(item=><li key={item}><Check aria-hidden="true"/>{item}</li>)}</ul></div></section>

    <div className={`${s.wrap} ${s.testimonialShell}`}><ServiceTestimonials slug={service.slug}/></div>

    <section className={s.faq}><div className={s.wrap}><div><p className={s.kicker}>Before research begins</p><h2>What clients usually want to know.</h2></div><div>{service.faq.map(item=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></div></section>

    <section id="market-research-checkout" className={s.checkout}><div className={`${s.wrap} ${s.checkoutShell}`}><ServiceCheckout slug={service.slug} title={service.title}/></div></section>
  </main>;
}
