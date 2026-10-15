import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/verifyAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req:Request){
  if(!(await verifyAdmin(req)))return NextResponse.json({ok:false,error:'Admin access required.'},{status:403});
  const db=supabaseAdmin();const [{data:services,error},{data:testimonials,error:testimonialError},{data:orders,error:orderError}]=await Promise.all([
    db.from('business_service_offerings').select('*').order('title'),db.from('business_service_testimonials').select('*').order('service_slug').order('sort_order'),db.from('business_service_orders').select('id,service_slug,full_name,email,business_name,currency,amount_usd,amount_ngn,payment_status,created_at,paid_at').order('created_at',{ascending:false}).limit(100),
  ]);
  if(error||testimonialError||orderError)return NextResponse.json({ok:false,error:'Could not load business settings.'},{status:500});
  return NextResponse.json({ok:true,services,testimonials,orders:(orders||[]).map(order=>({...order,service_title:(services||[]).find(service=>service.slug===order.service_slug)?.title||order.service_slug,customer_name:order.full_name,customer_email:order.email,amount:order.currency==='NGN'?order.amount_ngn:order.amount_usd}))});
}

export async function PATCH(req:Request){
  if(!(await verifyAdmin(req)))return NextResponse.json({ok:false,error:'Admin access required.'},{status:403});
  const body=await req.json();const slug=String(body.slug||'');const usd=Number(body.priceUsd);const ngn=Number(body.priceNgn);
  if(!slug||!Number.isFinite(usd)||usd<=0||!Number.isFinite(ngn)||ngn<=0)return NextResponse.json({ok:false,error:'Enter valid USD and NGN prices.'},{status:400});
  const {error}=await supabaseAdmin().from('business_service_offerings').update({price_usd:usd,price_ngn:ngn,active:body.active!==false,updated_at:new Date().toISOString()}).eq('slug',slug);
  if(error)return NextResponse.json({ok:false,error:'Could not update the service.'},{status:500});
  return NextResponse.json({ok:true});
}

export async function POST(req:Request){
  if(!(await verifyAdmin(req)))return NextResponse.json({ok:false,error:'Admin access required.'},{status:403});
  const body=await req.json();
  const payload={service_slug:String(body.serviceSlug||''),client_name:String(body.clientName||'').trim(),client_role:String(body.clientRole||'').trim()||null,quote:String(body.quote||'').trim(),sort_order:Number(body.sortOrder)||0,published:Boolean(body.published)};
  if(!payload.service_slug||!payload.client_name||!payload.quote)return NextResponse.json({ok:false,error:'Service, client name and quote are required.'},{status:400});
  const db=supabaseAdmin();const query=body.id?db.from('business_service_testimonials').update({...payload,updated_at:new Date().toISOString()}).eq('id',body.id):db.from('business_service_testimonials').insert(payload);
  const {error}=await query;if(error)return NextResponse.json({ok:false,error:'Could not save the testimonial.'},{status:500});
  return NextResponse.json({ok:true});
}

export async function DELETE(req:Request){
  if(!(await verifyAdmin(req)))return NextResponse.json({ok:false,error:'Admin access required.'},{status:403});
  const id=new URL(req.url).searchParams.get('id');if(!id)return NextResponse.json({ok:false,error:'Missing testimonial.'},{status:400});
  const {error}=await supabaseAdmin().from('business_service_testimonials').delete().eq('id',id);if(error)return NextResponse.json({ok:false,error:'Could not delete the testimonial.'},{status:500});
  return NextResponse.json({ok:true});
}
