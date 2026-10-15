import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateReference,initializePayment } from '@/lib/payments/flutterwave';
import { paymentPrice } from '@/lib/payments/validation';
import { verifyMember } from '@/lib/auth/verifyMember';

const SITE_URL=process.env.NEXT_PUBLIC_SITE_URL||'https://prowessdigitalsolutions.com';
export async function POST(req:Request){
  try{
    const member=await verifyMember(req);const body=await req.json();const serviceSlug=String(body.serviceSlug||'');const fullName=String(body.fullName||'').trim();const email=String(body.email||'').trim().toLowerCase();const brief=String(body.brief||'').trim();
    if(!serviceSlug||!fullName||!/^\S+@\S+\.\S+$/.test(email)||brief.length<20)return NextResponse.json({ok:false,error:'Complete your name, email and project brief.'},{status:400});
    const db=supabaseAdmin();const {data:service,error:serviceError}=await db.from('business_service_offerings').select('slug,title,price_usd,price_ngn,active').eq('slug',serviceSlug).eq('active',true).maybeSingle();
    if(serviceError||!service)return NextResponse.json({ok:false,error:'This service is not available for payment.'},{status:404});
    const price=paymentPrice(service.price_usd,service.price_ngn,body.currency);if(!price)return NextResponse.json({ok:false,error:'This currency is not available.'},{status:400});
    const {data:order,error:insertError}=await db.from('business_service_orders').insert({user_id:member?.id||null,service_slug:serviceSlug,full_name:fullName,email,phone:String(body.phone||'').trim()||null,business_name:String(body.businessName||'').trim()||null,brief,currency:price.currency,amount_usd:price.currency==='USD'?price.amount:null,amount_ngn:price.currency==='NGN'?price.amount:null,payment_status:'pending'}).select('id').single();
    if(insertError||!order)throw new Error('Could not save your service brief.');
    const reference=generateReference('BIZ');const {error:referenceError}=await db.from('business_service_orders').update({flutterwave_reference:reference}).eq('id',order.id);if(referenceError)throw new Error('Could not prepare payment.');
    const {link}=await initializePayment({email,amount:price.amount,currency:price.currency,reference,callbackUrl:`${SITE_URL}/services/payment-success?service=${encodeURIComponent(serviceSlug)}`,metadata:{type:'business_service',order_id:order.id,service_slug:serviceSlug}});
    return NextResponse.json({ok:true,authorizationUrl:link});
  }catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'Could not start payment.'},{status:500});}
}
