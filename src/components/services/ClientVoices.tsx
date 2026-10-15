"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { ServicePageContent } from "@/content/servicePages";
import s from "./ServiceOfferPage.module.css";

export default function ClientVoices({service}:{service:ServicePageContent}){
  const [index,setIndex]=useState(0);
  const slides=service.deliverables.map((deliverable,itemIndex)=>({title:deliverable,body:itemIndex===0?service.signal:itemIndex===service.deliverables.length-1?service.outcome:service.process[Math.min(itemIndex,service.process.length-1)].body}));
  const item=slides[index];
  const move=(direction:number)=>setIndex(current=>(current+direction+slides.length)%slides.length);
  return <section className={s.voices} aria-labelledby="service-proof-title"><div className={s.voiceTop}><div><p className={s.eyebrow}>Inside this service</p><h2 id="service-proof-title">See how the work fits together.</h2></div><div className={s.voiceControls}><button onClick={()=>move(-1)} aria-label="Previous service detail"><ArrowLeft aria-hidden="true"/></button><span>{String(index+1).padStart(2,'0')} / {String(slides.length).padStart(2,'0')}</span><button onClick={()=>move(1)} aria-label="Next service detail"><ArrowRight aria-hidden="true"/></button></div></div><article className={s.voiceCard} key={item.title}><div className={s.voiceStatement}><Check aria-hidden="true"/><p>{item.body}</p></div><div><strong>{item.title}</strong><span>{service.title}</span></div></article></section>;
}
