import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { File } from 'node:buffer';
function route({authenticated=true,premium=true,deliveryError=false,insertError=false,configured=true}={}) {
 const sent=[];const writes=[];const removed=[];
 const storage={upload:async(...args)=>{writes.push(args);return {error:null}},createSignedUrl:async()=>({data:{signedUrl:'https://example.com/private-cv'}}),remove:async paths=>{removed.push(...paths);return {error:null}}};
 const module={exports:{}};
 const modules={
 'next/server':{NextResponse:{json:(body,options)=>Response.json(body,options)}},
 '@/lib/supabase/admin':{supabaseAdmin:()=>({storage:{from:()=>storage},from:()=>({insert:async()=>({error:insertError?{message:'db failed'}:null})})})},
 '@/lib/auth/verifyMember':{verifyMember:async()=>authenticated?{id:'member-id',email:'member@example.com'}:null},
 '@/lib/payments/premiumMembership':{hasPremiumAccess:async()=>premium},
 '@/lib/resendClient':{resend:{emails:{send:async payload=>{sent.push(payload);return {error:deliveryError?{name:'provider_error'}:null}}}}},
 '@/lib/emails/cvChecker':{cvAdminEmail:()=>({subject:'Admin',html:'admin'}),cvCustomerEmail:()=>({subject:'Customer',html:'customer'})},
 };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/cv-checker/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module,exports:module.exports,File,Buffer,console:{error(){}},process:{env:configured?{RESEND_API_KEY:'test',RESEND_FROM_EMAIL:'hello@example.com',ADMIN_NOTIFY_EMAIL:'team@example.com'}:{}},require:n=>{if(n in modules)return modules[n];throw Error(n)}});
 const form=new FormData();for(const [key,value] of Object.entries({full_name:'Ada',email:'ada@example.com',target_role:'Operations',career_level:'Mid career'}))form.set(key,value);
 form.set('cv',new File(['cv content'],'cv.pdf',{type:'application/pdf'}));
 return {sent,writes,removed,submit:()=>module.exports.POST({formData:async()=>form})};
}
test('unauthenticated, nonpremium and unconfigured submissions do not upload or send',async()=>{
 for(const options of [{authenticated:false},{premium:false},{configured:false}]){const r=route(options);assert.ok((await r.submit()).status>=400);assert.equal(r.writes.length,0);assert.equal(r.sent.length,0)}
});
test('CV success sends separate admin and member emails with useful reply addresses',async()=>{
 const r=route();const response=await r.submit();const data=await response.json();assert.equal(data.ok,true);assert.equal(data.adminNotified,true);assert.equal(data.confirmationSent,true);
 assert.equal(r.sent[0].to,'team@example.com');assert.equal(r.sent[0].replyTo,'ada@example.com');assert.equal(r.sent[1].to,'ada@example.com');assert.equal(r.sent[1].replyTo,'team@example.com');
});
test('provider failure preserves accepted submission and reports delivery failure honestly',async()=>{
 const r=route({deliveryError:true});const data=await(await r.submit()).json();assert.equal(data.ok,true);assert.equal(data.adminNotified,false);assert.equal(data.confirmationSent,false);assert.equal(r.writes.length,1);
});
test('database rejection removes the upload and never sends confirmation',async()=>{
 const r=route({insertError:true});assert.equal((await r.submit()).status,500);assert.equal(r.removed.length,1);assert.equal(r.sent.length,0);
});
