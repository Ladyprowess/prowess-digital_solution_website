import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { markBusinessServicePaid } from '@/lib/payments/businessService';
export async function POST(req:Request){
  try{const {reference}=await req.json();if(!reference)return NextResponse.json({ok:false,error:'Missing payment reference.'},{status:400});const {data:order}=await supabaseAdmin().from('business_service_orders').select('id').eq('flutterwave_reference',reference).maybeSingle();if(!order)return NextResponse.json({ok:false,error:'Order not found.'},{status:404});const result=await markBusinessServicePaid(order.id,reference);return NextResponse.json(result,{status:result.ok?200:400});}catch{return NextResponse.json({ok:false,error:'Could not verify payment.'},{status:500});}
}
