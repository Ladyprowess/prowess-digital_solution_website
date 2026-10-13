"use client";
import { useEffect, useRef } from 'react';
import s from './Launchpad.module.css';
const PHRASES=['Build your business.','Develop your skills.','Find your next role.','Discover opportunities.'];
const TIMING={hold:3200,roll:600};
/** Hero: hold phrase → roll upward → next phrase settles; stop outside the viewport. */
export function AmbitionLine(){
 const ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  const node=ref.current;if(!node)return;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let index=0,visible=false,timer:ReturnType<typeof setInterval>|undefined;
  let animation:Animation|undefined;
  const sync=()=>{
   clearInterval(timer);
   if(preference.matches){animation?.cancel();node.textContent=PHRASES[0];return;}
   if(!visible||document.hidden){animation?.cancel();return;}
   timer=setInterval(()=>{
    index=(index+1)%PHRASES.length;
    animation=node.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(-100%)',opacity:0}],{duration:TIMING.roll/2,easing:'ease-in',fill:'forwards'});
    animation.onfinish=()=>{
     animation?.cancel();node.textContent=PHRASES[index];
     animation=node.animate([{transform:'translateY(100%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:TIMING.roll/2,easing:'cubic-bezier(.16,1,.3,1)'});
    };
   },TIMING.hold);
  };
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});observer.observe(node);
  preference.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  return()=>{clearInterval(timer);animation?.cancel();observer.disconnect();preference.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};
 },[]);
 return <p className={s.ambitionLine}><span className={s.srOnly}>{PHRASES.join(' ')}</span><span aria-hidden="true" className={s.rollingWindow}><span ref={ref}>{PHRASES[0]}</span></span></p>;
}
