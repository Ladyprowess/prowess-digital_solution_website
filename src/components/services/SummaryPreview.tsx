"use client";
import { useEffect, useRef, useState } from 'react';
import { downloadBusinessCard } from '@/lib/downloadBusinessCard';
import s from './Workshop.module.css';
import { createPortal } from 'react-dom';
import { summaryDocument, type BusinessSummary } from '@/lib/businessSummary';
export default function SummaryPreview(){
 const [summary,setSummary]=useState<BusinessSummary|null>(null);
 const [ready,setReady]=useState(false);
 const [saving,setSaving]=useState(false);const [error,setError]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{const handler=(event:Event)=>{setReady(false);setError('');setSummary((event as CustomEvent<BusinessSummary>).detail);};window.addEventListener('prowess-summary',handler);return()=>window.removeEventListener('prowess-summary',handler);},[]);
 useEffect(()=>{if(summary){dialog.current?.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;};}},[summary]);
 if(!summary)return null;
 return createPortal(<dialog ref={dialog} onCancel={()=>setSummary(null)} aria-label="Business summary preview" style={{width:'min(900px,95vw)',maxWidth:'95vw',height:'90dvh',maxHeight:'90dvh',margin:'auto',padding:0,border:'1px solid #cbd1d0',borderRadius:16,background:'#fff',color:'#172326'}}><div style={{display:"flex",flexDirection:"column",height:"100%"}}><div style={{padding:'16px 20px',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',borderBottom:'1px solid #ddd'}}><div style={{flex:1,minWidth:160}}><strong>{summary.title}</strong><p style={{fontSize:12,marginTop:4}}>Your result card is ready to keep. Download an image or print a PDF.</p></div><button disabled={!ready||saving} onClick={async()=>{setSaving(true);setError('');try{await downloadBusinessCard(summary);}catch{setError('Could not create the image. Please try again or use Print / Save PDF.');}finally{setSaving(false);}}} style={{background:'#507c80',color:'white',padding:'12px 18px',borderRadius:8}}>{saving?'Preparing image…':'Download result image'}</button><button disabled={!ready} onClick={()=>{frame.current?.contentWindow?.focus();frame.current?.contentWindow?.print();}} style={{background:'#507c80',color:'white',padding:'12px 18px',borderRadius:8}}>Print / Save PDF</button><button aria-label="Close preview" onClick={()=>setSummary(null)} style={{padding:12}}>Close</button></div>{error&&<p role="alert">{error}</p>}<div className={s.resultMachine}><span>PROWESS / RESULT SUMMARY</span><i/><div/></div><div className={s.resultPaper}><iframe ref={frame} title={`${summary.title} document`} srcDoc={summaryDocument(summary)} onLoad={()=>setReady(true)} style={{width:'100%',height:"100%",border:0}}/></div></div></dialog>,document.body);
}
