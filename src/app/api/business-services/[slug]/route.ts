import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
  try{
    const {slug}=await params;const db=supabaseAdmin();
    const [{data:service,error},{data:testimonials,error:testimonialError}]=await Promise.all([
      db.from('business_service_offerings').select('slug,title,price_usd,price_ngn,active').eq('slug',slug).eq('active',true).maybeSingle(),
      db.from('business_service_testimonials').select('id,client_name,client_role,quote').eq('service_slug',slug).eq('published',true).order('sort_order').order('created_at'),
    ]);
    if(error||!service)return NextResponse.json({ok:false,error:'Service is not available.'},{status:404});
    if(testimonialError)throw testimonialError;
    return NextResponse.json({ok:true,service,testimonials:testimonials??[]});
  }catch{return NextResponse.json({ok:false,error:'Could not load this service.'},{status:500});}
}
