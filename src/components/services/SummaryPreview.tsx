"use client";
/* eslint-disable @next/next/no-img-element -- Local canvas snapshot must remain identical across preview and export. */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Printer, RotateCcw, X } from 'lucide-react';
import { downloadBusinessCard } from '@/lib/downloadBusinessCard';
import { summaryDocument, type BusinessSummary } from '@/lib/businessSummary';
import s from './Workshop.module.css';

export default function SummaryPreview(){
 const [summary,setSummary]=useState<BusinessSummary|null>(null);
 const [zoom,setZoom]=useState(1);
 const [ready,setReady]=useState(false);
 const [done,setDone]=useState(false);
 const [run,setRun]=useState(0);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);
 const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{const handler=(event:Event)=>{setZoom(1);setReady(false);setDone(false);setError('');setRun(0);setSummary((event as CustomEvent<BusinessSummary>).detail);};window.addEventListener('prowess-summary',handler);return()=>window.removeEventListener('prowess-summary',handler);},[]);
 useEffect(()=>{if(!summary)return;dialog.current?.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;};},[summary]);
 useEffect(()=>{if(!summary)return;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const timer=setTimeout(()=>setDone(true),reduced?0:3400);return()=>clearTimeout(timer);},[summary,run]);
 if(!summary)return null;
 return createPortal(<dialog ref={dialog} onCancel={()=>setSummary(null)} aria-label="Your business result" className={`${s.printDialog} ${summary.image?s.documentDialog:''}`}>
  <header className={s.printHeader}><div><p>PROWESS DIGITAL SOLUTIONS</p><span role="status">{done?'Your result is ready':'Preparing your result…'}</span></div><button onClick={()=>setSummary(null)} aria-label="Close result"><X size={20}/></button></header>
  <div className={s.compactMachine}><div className={s.machineLabel}><Printer size={18}/><span>BUSINESS REVIEW</span><i className={!done?s.pulsing:''}/></div><div className={s.machineSlot}/></div>
  <div key={run} className={`${s.feedWindow} ${done?s.feedComplete:''}`} onAnimationEnd={e=>{if(e.target===e.currentTarget)setDone(true);}}>
   {summary.image?<img src={summary.image} alt={summary.title} style={{display:'block',width:summary.imageWidth?`${summary.imageWidth*zoom}px`:'100%',maxWidth:'none',height:'auto'}}/>:<article className={s.resultSlip} aria-busy={!done}>
    <p className={s.slipBrand}>PROWESS DIGITAL SOLUTIONS</p><p className={s.slipLabel}>YOUR BUSINESS RESULT</p><h2>{summary.title}</h2>
    {summary.content.split(/\n\s*\n/).filter(Boolean).map((paragraph,i)=><div className={s.slipSection} key={i}>{paragraph.split('\n').map((line,j)=>j===0?<strong key={j}>{line}</strong>:<span key={j}>{line}</span>)}</div>)}
    <div className={s.resultSeal}>REVIEW COMPLETE</div><small>Based on your inputs. A planning guide, not an independent audit.</small>
   </article>}
  </div>
  <footer className={s.printFooter}>
   {done?<><p className={s.printHint}>Scroll to read your result. Download keeps the full original size.</p><div className={s.printActions}>{summary.image&&<><button aria-label="Zoom out result" disabled={zoom<=0.75} onClick={()=>setZoom(v=>Math.max(.75,v-.25))}>−</button><span style={{alignSelf:"center",fontSize:12}}>{Math.round(zoom*100)}%</span><button aria-label="Zoom in result" disabled={zoom>=2} onClick={()=>setZoom(v=>Math.min(2,v+.25))}>+</button></>}<button className={s.saveResult} disabled={saving} onClick={async()=>{setSaving(true);setError('');try{await downloadBusinessCard(summary);}catch{setError('Image creation failed. Please retry or use Print / Save PDF.');}finally{setSaving(false);}}}><Download size={16}/>{saving?'Preparing image…':'Download result'}</button><button disabled={!ready} onClick={()=>{frame.current?.contentWindow?.focus();frame.current?.contentWindow?.print();}}><Printer size={16}/>Print / Save PDF</button><button aria-label="Replay result animation" onClick={()=>{setDone(false);setRun(v=>v+1);}}><RotateCcw size={16}/></button></div></>:<div className={s.printProgress}><span/><p>Your summary is being prepared</p></div>}
   {error&&<p role="alert">{error}</p>}
  </footer>
  <iframe ref={frame} title="Printable business result" srcDoc={summaryDocument(summary)} onLoad={()=>setReady(true)} tabIndex={-1} aria-hidden="true" style={{position:'absolute',width:1,height:1,border:0,clipPath:'inset(100%)'}}/>
 </dialog>,document.body);
}
