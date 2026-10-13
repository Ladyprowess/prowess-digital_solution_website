"use client";
import { useEffect, useRef, type ReactNode } from 'react';
import s from './PageMotion.module.css';

/** Entrance: section arrives → its cards follow in a short stagger.
 * Content stays visible without JavaScript; preference changes cancel motion.
 */
const TIMING = { entrance: 650, card: 480, stagger: 65, maxDelay: 260 };
export function PageMotion({children}:{children:ReactNode}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const root=ref.current;
    if(!root||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const observed=new WeakSet<Element>();
    const animations=new Set<Animation>();
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    const stop=()=>{if(preference.matches)animations.forEach(a=>a.cancel());};
    preference.addEventListener('change',stop);
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      if(!preference.matches){
        const animate=(el:Element,delay:number,duration:number,card=false)=>{
          const animation=el.animate(card ? [{opacity:0,transform:'translateY(28px) rotate(-1.5deg) scale(.96)'},{opacity:1,transform:'translateY(-3px) rotate(.3deg) scale(1)',offset:.8},{opacity:1,transform:'translateY(0) rotate(0) scale(1)'}] : [{opacity:0,transform:'translateY(18px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration,delay,fill:'backwards',easing:'cubic-bezier(.16,1,.3,1)'});
          animations.add(animation);animation.onfinish=()=>animations.delete(animation);
        };
        animate(entry.target,0,TIMING.entrance);
        entry.target.querySelectorAll(':scope > article, :scope > button, :scope > a').forEach((el,i)=>animate(el,Math.min(i*TIMING.stagger,TIMING.maxDelay),TIMING.card,true));
      }
      observer.unobserve(entry.target);
    }),{threshold:0,rootMargin:'0px 0px -24px 0px'});
    const scan=()=>root.querySelectorAll('section > div:first-child, section > h2, header > div, section > article, [data-motion-group]').forEach(el=>{
      if(observed.has(el))return;
      observed.add(el);observer.observe(el);
    });
    scan();
    const mutation=new MutationObserver(scan);mutation.observe(root,{childList:true,subtree:true});
    return()=>{observer.disconnect();mutation.disconnect();preference.removeEventListener('change',stop);animations.forEach(a=>a.cancel());};
  },[]);
  return <div ref={ref} className={s.motion}>{children}</div>;
}
