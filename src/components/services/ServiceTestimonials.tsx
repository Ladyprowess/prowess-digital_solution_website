"use client";
import { useEffect,useState } from 'react';import { ArrowLeft,ArrowRight } from 'lucide-react';import { businessServiceTestimonials } from '@/content/businessServiceTestimonials';import s from './ServiceOfferPage.module.css';
type Testimonial={id:string;client_name:string;client_role:string|null;quote:string};
const testimonialHeadings:Record<string,{eyebrow:string;title:string}>={
  'business-audit':{eyebrow:'From business audit clients',title:'What changed when the gaps were supported by evidence.'},
  'business-model':{eyebrow:'From business model clients',title:'What became clearer when the business logic was mapped.'},
  'business-plans':{eyebrow:'From business plan clients',title:'What changed after the plan was completed.'},
  'feasibility-studies':{eyebrow:'From feasibility study clients',title:'What the study clarified before they committed.'},
  'market-research':{eyebrow:'From market research clients',title:'What became clearer when the assumptions were tested.'},
  'business-structure-diagnostic':{eyebrow:'From diagnostic clients',title:'What became clearer when the real problem was identified.'},
  'financial-review':{eyebrow:'From financial review clients',title:'What changed when the numbers became easier to read.'},
  'sops':{eyebrow:'From SOP clients',title:'What changed when the work was documented clearly.'},
  'pricing-offer-review':{eyebrow:'From offer review clients',title:'What changed when the offer and pricing became clearer.'},
  'workflow-systems':{eyebrow:'From workflow systems clients',title:'What changed when every handoff had a clear route and owner.'},
  'operations-documentation':{eyebrow:'From operations documentation clients',title:'What changed when the way the business works was recorded clearly.'},
};
export default function ServiceTestimonials({slug}:{slug:string}){const defaults=businessServiceTestimonials[slug]||[];const heading=testimonialHeadings[slug]||{eyebrow:'Client feedback',title:'What clients say about the work.'};const [items,setItems]=useState<Testimonial[]>(defaults);const [index,setIndex]=useState(0);useEffect(()=>{setItems(defaults);setIndex(0);fetch(`/api/business-services/${slug}`).then(response=>response.ok?response.json():Promise.reject()).then(data=>{if(data.testimonials?.length)setItems(data.testimonials);}).catch(()=>{});},[slug]);if(!items.length)return null;const current=items[index];const move=(amount:number)=>setIndex(value=>(value+amount+items.length)%items.length);return <section className={s.testimonials} aria-labelledby={`${slug}-testimonial-title`}><div className={s.voiceTop}><div><p className={s.eyebrow}>{heading.eyebrow}</p><h2 id={`${slug}-testimonial-title`}>{heading.title}</h2></div><div className={s.voiceControls}><button type="button" onClick={()=>move(-1)} aria-label="Previous testimonial"><ArrowLeft aria-hidden="true"/></button><button type="button" onClick={()=>move(1)} aria-label="Next testimonial"><ArrowRight aria-hidden="true"/></button></div></div><article key={current.id}><blockquote>“{current.quote}”</blockquote><p><strong>{current.client_name}</strong>{current.client_role&&<span>{current.client_role}</span>}</p></article></section>}
