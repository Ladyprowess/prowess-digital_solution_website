"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Printer } from 'lucide-react';
import { previewSummary, type BusinessSummary } from '@/lib/businessSummary';

export default function BusinessPrintPreviewPage() {
  const [summary,setSummary]=useState<BusinessSummary|null>(null);
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    let frame=0;
    try {
      const data=JSON.parse(sessionStorage.getItem('pds-business-print-preview')||'null');
      if(typeof data?.title==='string'&&typeof data?.content==='string') {
        // Keep this tab's copy so refreshing the print page does not lose the document.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSummary({title:data.title,content:data.content});
        frame=requestAnimationFrame(()=>void previewSummary(data.title,data.content));
      }
    } catch { /* Show a way back when browser storage is unavailable. */ }
    setReady(true);
    return()=>cancelAnimationFrame(frame);
  },[]);
  return <main className="mx-auto min-h-[60vh] max-w-3xl px-6 py-20"><Printer className="mb-6 text-primary" size={36}/><p className="mb-3 text-sm font-semibold text-primary">YOUR BUSINESS DOCUMENT</p><h1 className="text-4xl font-semibold tracking-tight">{summary?.title||'Print preview'}</h1><p className="my-6 text-muted-foreground">{summary?'Review your document, then print it or save it as a PDF. Your entries stay in this browser tab.':ready?'Open a preview from your business tool to see your document here.':'Preparing your document…'}</p>{summary&&<button className="mb-6 flex min-h-12 items-center gap-3 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" onClick={()=>void previewSummary(summary.title,summary.content)}><Printer size={18}/>Open print preview</button>}<Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/tools">Explore business tools</Link></main>;
}
