"use client";
import { useEffect, useRef, type ReactNode } from 'react';
import s from './PageMotion.module.css';

/** One-time section entrances. Content stays visible without JavaScript. */
export function PageMotion({children}:{children:ReactNode}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const root=ref.current;
    if(!root||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const observed=new WeakSet<Element>();
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.animate([{opacity:0,transform:'translateY(18px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
      observer.unobserve(entry.target);
    }),{threshold:0,rootMargin:'0px 0px -24px 0px'});
    const scan=()=>root.querySelectorAll('section > div:first-child, section > h2, header > div, section > article').forEach(el=>{
      if(observed.has(el))return;
      observed.add(el);observer.observe(el);
    });
    scan();
    const mutation=new MutationObserver(scan);mutation.observe(root,{childList:true,subtree:true});
    return()=>{observer.disconnect();mutation.disconnect();};
  },[]);
  return <div ref={ref} className={s.motion}>{children}</div>;
}
