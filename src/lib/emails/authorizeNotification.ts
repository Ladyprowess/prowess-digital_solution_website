import { NextResponse } from 'next/server';
import { verifyMember } from '@/lib/auth/verifyMember';
import { supabaseAdmin } from '@/lib/supabase/admin';

/** Internal email endpoints must not act as a public mail relay. */
export async function authorizeNotification(req:Request) {
  const member=await verifyMember(req);
  if(!member)return NextResponse.json({error:'Sign in to send a team notification.'},{status:401});
  const db=supabaseAdmin();
  const {data:profile}=await db.from('profiles').select('role').eq('id',member.id).maybeSingle();
  const path=new URL(req.url).pathname;
  const administrative=/notify-(payroll|month-winner|announcement)$/.test(path);
  const roles=administrative?['admin','leader']:['admin','leader','member'];
  if(!profile||!roles.includes(profile.role))return NextResponse.json({error:'Team access required.'},{status:403});
  const body=await req.clone().json().catch(()=>null);
  const to=body?.to;
  if(typeof to!=='string'||!to.trim())return NextResponse.json({error:'A team recipient is required.'},{status:400});
  const {data:recipient}=await db.from('profiles').select('role').eq('email',to.trim().toLowerCase()).maybeSingle();
  if(!recipient||!['admin','leader','member'].includes(recipient.role))return NextResponse.json({error:'Recipient must be an active team member.'},{status:403});
  return null;
}
