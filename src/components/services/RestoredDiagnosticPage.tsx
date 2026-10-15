"use client";
import { useEffect } from "react";
import type { Service } from "@/content/site";
import DiagnosticLanding from "@/components/DiagnosticLanding";
import RestoredServiceCommerce from "./RestoredServiceCommerce";
import s from "./RestoredDiagnosticPage.module.css";

export default function RestoredDiagnosticPage({service}:{service:Service}){
  useEffect(()=>{
    const legacy=document.getElementById('diagnostic-enquiry');
    const payment=document.getElementById('diagnostic-payment');
    if(legacy){legacy.id='diagnostic-enquiry-legacy';legacy.hidden=true;}
    if(payment)payment.id='diagnostic-enquiry';
  },[]);
  return <div className={s.page}><DiagnosticLanding service={service}/><div className={s.commerce}><RestoredServiceCommerce slug="business-structure-diagnostic" title="Business Diagnostic" id="diagnostic-payment"/></div></div>;
}
