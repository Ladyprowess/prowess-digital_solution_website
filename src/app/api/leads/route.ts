import { escapeEmail } from "@/lib/payments/emailEscape";
import { summarizeAudit } from "@/lib/operationalAudit";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resendClient";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=>null);
    const {source, answers} = body || {};
    const email=typeof body?.email==='string'?body.email.trim():'';
    if(source!=='operational-health-self-audit'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ok:false,error:'Enter a valid email address.'},{status:400});
    }
    let scorePercent:number|null, checkedCount:number, totalItems:number;
    if(answers!==undefined) {
      if(!answers||typeof answers!=='object'||Array.isArray(answers))return NextResponse.json({ok:false,error:'Review each checkpoint before opening your result.'},{status:400});
      const result=summarizeAudit(answers);
      if(!result.complete)return NextResponse.json({ok:false,error:'Review each checkpoint before opening your result.'},{status:400});
      scorePercent=result.percent;checkedCount=result.inPlace;totalItems=result.applicable;
    } else {
      // Accept the previous live client's complete count payload during rollout.
      ({scorePercent,checkedCount,totalItems}=body);
      if(totalItems!==36||!Number.isInteger(checkedCount)||checkedCount<0||checkedCount>36||scorePercent!==Math.round(checkedCount/36*100))return NextResponse.json({ok:false,error:'Invalid assessment totals.'},{status:400});
    }
    const {error}=await supabaseAdmin().from('leads').insert({source,email,score_percent:scorePercent,checked_count:checkedCount,total_items:totalItems});
    if(error)return NextResponse.json({ok:false,error:'Could not record your assessment request.'},{status:500});
    const fromEmail=process.env.RESEND_FROM_EMAIL, adminEmail=process.env.ADMIN_NOTIFY_EMAIL;
    if(fromEmail&&adminEmail) {
      // A notification failure must not turn a saved request into a failed submission.
      try {
        const sent=await resend.emails.send({from:fromEmail,to:adminEmail,subject:'New operational self-audit request',html:`<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Operational self-audit</h2><p><b>Email:</b> ${escapeEmail(email)}</p><p><b>Applicable checkpoints in place:</b> ${scorePercent===null?'No applicable checkpoints':`${checkedCount} of ${totalItems} (${scorePercent}%)`}</p><p>Self-reported checklist coverage, not a verified business health score.</p></div>`});
        if(sent.error)console.error('Self-audit notification could not be delivered');
      } catch { console.error('Self-audit notification could not be delivered'); }
    }
    return NextResponse.json({ok:true});
  } catch {
    return NextResponse.json({ok:false,error:'Could not process your assessment request.'},{status:500});
  }
}
