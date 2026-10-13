import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { timingSafeEqual } from 'node:crypto';
function load(file, imports = {}, globals = {}) {
 const module = { exports: {} };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,
 {module,exports:module.exports,require: n => {if(n in imports)return imports[n];throw Error(n);}, console, Date, Buffer, process: {env:{}}, ...globals});
 return module.exports;
}
const validation = load('src/lib/payments/validation.ts');
const emailEscape = load('src/lib/payments/emailEscape.ts');
const expected = { reference:'ORDER-1', type:'content_purchase', idKey:'purchase_id', id:'p1',amount:120,currency:'USD',email:'buyer@example.com',storedReference:'ORDER-1' };
const charge = {status:'successful',tx_ref:'ORDER-1',amount:120,currency:'USD',customer:{email:'buyer@example.com'},meta:{type:'content_purchase',purchase_id:'p1'}};
test('verified payment must match order, amount, currency, reference and customer',()=>{
 assert.equal(validation.matchesPayment(charge,expected),true);
 for(const patch of [{status:'pending'},{tx_ref:'OTHER'},{amount:1},{amount:null},{amount:Infinity},{currency:'NGN'},{customer:{email:'other@example.com'}},{meta:{type:'membership',purchase_id:'p1'}},{meta:{type:'content_purchase',purchase_id:'p2'}}]) assert.equal(validation.matchesPayment({...charge,...patch},expected),false,JSON.stringify(patch));
 for(const patch of [{amount:null},{amount:0},{amount:-1},{storedReference:'OTHER'}])assert.equal(validation.matchesPayment(charge,{...expected,...patch}),false);
});
test('requested currency never silently falls back; invalid prices rejected',()=>{
 assert.equal(validation.paymentPrice(120,null,'NGN'),null);
 assert.equal(validation.paymentPrice(120,180000,'EUR'),null);
 for(const value of [0,-1,NaN,Infinity,null]) assert.equal(validation.paymentPrice(value,null,'USD'),null);
 assert.equal(validation.paymentPrice(null,180000,null).currency,'NGN');
 assert.equal(validation.paymentPrice(120,180000,'USD').amount,120);
});
function dbFor(row, options={}) {
 const writes=[];
 return {writes,from(table){ let action='read';let payload; const filters=[];
 const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},neq(){return q;},is(){return q;},in(){return q;},limit(){return q;},order(){return q;},update(v){action='update';payload=v;return q;},insert(v){action='insert';payload=v;return q;},upsert(v){action='insert';payload=v;return q;},
 single(){return Promise.resolve({data:{...row},error:null});},maybeSingle(){return Promise.resolve({data:table==='consultation_services'?{name:'Review',price_usd:999}: {...row},error:null});},
 then(resolve,reject){if(action!=='read')writes.push({table,action,payload,filters});return Promise.resolve({data:options.lostRace?[]:[{id:row.id}],error:options.writeError?{message:'Database offline'}:null}).then(resolve,reject);}};return q;}};
}
const next = {NextResponse:{json:(body,opts)=>Response.json(body,opts)}};
test('free consultation endpoint rejects pending and paid bookings without mutation or email',async()=>{
 for(const payment_status of ['pending','paid','failed']){
 const db=dbFor({id:'b1',payment_status});
 const {POST}=load('src/app/api/consultations/confirm/route.ts',{'next/server':next,'@/lib/supabase/admin':{supabaseAdmin:()=>db}});
 assert.equal((await POST(new Request('https://example.com',{method:'POST',body:JSON.stringify({booking_id:'b1'})}))).status,400);
 assert.equal(db.writes.length,0);
 }
});
for (const [name,kind,fn,key] of [['content','content_purchase','markContentPurchasePaid','purchase_id'],['skillToBusiness','skill_to_business','markSkillToBusinessPaid','purchase_id'],['membership','membership','markMembershipPaid','subscription_id'],['premiumMembership','premium_membership','markPremiumMembershipPaid','subscription_id']]) {
 test(`${name}: mismatched verified metadata cannot grant access`,async()=>{
 const db=dbFor({id:'p1',amount:120,amount_usd:120,currency:'USD',email:'buyer@example.com',payment_status:'pending',flutterwave_reference:'ORDER-1'});
 const helpers=load(`src/lib/payments/${name}.ts`,{'@/lib/supabase/admin':{supabaseAdmin:()=>db},'@/lib/payments/validation':validation,'@/lib/payments/emailEscape':emailEscape,'@/lib/payments/flutterwave':{verifyTransaction:async()=>({...charge,meta:{type:kind,[key]:'different-order'}})},'@/lib/resendClient':{resend:{emails:{send(){throw Error('Unexpected email');}}}},'@/lib/tools/tierAccess':{},'@/lib/payments/toolGrant':{ensureToolGrant(){throw Error('Unexpected grant');}},'@/lib/formatMoney':{},'@/lib/resources/ebookFormats':{} });
 assert.equal((await helpers[fn]('p1','ORDER-1')).ok,false);
 assert.equal(db.writes.length,0);
 });
}
test('consultation uses booked price, retries calendar fulfilment and avoids duplicate email',async()=>{
 const db=dbFor({id:'b1',email:'buyer@example.com',currency:'USD',amount_usd:120,payment_status:'paid',flutterwave_reference:'ORDER-1',google_event_id:null});
 let calendarCalls=0,emailCalls=0;
 const {markConsultationPaid}=load('src/lib/payments/consultation.ts',{'@/lib/supabase/admin':{supabaseAdmin:()=>db},'@/lib/payments/validation':validation,'@/lib/payments/flutterwave':{verifyTransaction:async()=>({...charge,meta:{type:'consultation',booking_id:'b1'}})},'@/lib/googleCalendar':{createGoogleEvent:async p=>{calendarCalls++;assert.equal(p.eventId,'cb1');return 'cb1';}},'@/lib/email':{sendConsultationEmail:async()=>{emailCalls++;}}});
 assert.equal((await markConsultationPaid('ORDER-1')).ok,true);
 assert.equal(calendarCalls,1);assert.equal(emailCalls,1);
 assert.ok(db.writes.some(w=>w.payload.google_event_id==='cb1'));
});
function webhook(result) {
 const imports={'next/server':next,'node:crypto':{timingSafeEqual},'@/lib/supabase/admin':{supabaseAdmin:()=>dbFor({})}};
 for(const name of ['membership','consultation','skillToBusiness','content','premiumMembership','event'])imports[`@/lib/payments/${name}`]={};
 imports['@/lib/payments/content'].markContentPurchasePaid=async()=>result;
 return load('src/app/api/flutterwave/webhook/route.ts',imports,{process:{env:{FLUTTERWAVE_WEBHOOK_HASH:'test-secret'}}}).POST;
}
test('webhook rejects invalid signatures and returns retryable error on failed reconciliation',async()=>{
 const body=JSON.stringify({event:'charge.completed',data:{status:'successful',tx_ref:'ORDER-1',meta:{type:'content_purchase',purchase_id:'p1'}}});
 const request=(signature)=>new Request('https://example.com',{method:'POST',headers:{'verif-hash':signature},body});
 assert.equal((await webhook({ok:true})(request('invalid'))).status,401);
 assert.equal((await webhook({ok:false})(request('test-secret'))).status,500);
 assert.equal((await webhook({ok:true})(request('test-secret'))).status,200);
});
test('HTML payment receipts escape shipping and customer content',()=>{
 assert.equal(emailEscape.escapeEmail('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
});

test('concurrent Skill to Business callback loser does not send another receipt',async()=>{
 const db=dbFor({id:'p1',amount_usd:120,currency:'USD',email:'buyer@example.com',payment_status:'pending',flutterwave_reference:'ORDER-1'},{lostRace:true});
 let sends=0;
 const {markSkillToBusinessPaid}=load('src/lib/payments/skillToBusiness.ts',{'@/lib/supabase/admin':{supabaseAdmin:()=>db},'@/lib/payments/validation':validation,'@/lib/payments/emailEscape':emailEscape,'@/lib/payments/flutterwave':{verifyTransaction:async()=>({...charge,meta:{type:'skill_to_business',purchase_id:'p1'}})},'@/lib/resendClient':{resend:{emails:{send:async()=>{sends++;}}}},'@/lib/tools/tierAccess':{},'@/lib/payments/toolGrant':{ensureToolGrant:async()=> 'SAME-CODE'},'@/lib/formatMoney':{} });
 assert.equal((await markSkillToBusinessPaid('p1','ORDER-1')).alreadyPaid,true);
 assert.equal(sends,0);
});

test('failed tools grant never marks an order paid',async()=>{
 const db=dbFor({id:'p1',amount_usd:120,currency:'USD',email:'buyer@example.com',payment_status:'pending',flutterwave_reference:'ORDER-1'});
 const {markSkillToBusinessPaid}=load('src/lib/payments/skillToBusiness.ts',{'@/lib/supabase/admin':{supabaseAdmin:()=>db},'@/lib/payments/validation':validation,'@/lib/payments/emailEscape':emailEscape,'@/lib/payments/flutterwave':{verifyTransaction:async()=>({...charge,meta:{type:'skill_to_business',purchase_id:'p1'}})},'@/lib/resendClient':{},'@/lib/tools/tierAccess':{},'@/lib/payments/toolGrant':{ensureToolGrant:async()=>{throw Error('Unavailable');}},'@/lib/formatMoney':{} });
 await assert.rejects(markSkillToBusinessPaid('p1','ORDER-1'),/Unavailable/);
 assert.equal(db.writes.length,0);
});

test('Premium pending checkout reuses saved link without changing price or order',async()=>{
 const db=dbFor({id:'p1',billing_interval:'monthly',currency:'USD',amount_usd:100,subscription_status:'pending',checkout_url:'https://checkout.example.com/existing',flutterwave_reference:'ORDER-1'});
 const {POST}=load('src/app/api/premium-membership/checkout/route.ts',{'next/server':next,'@/lib/supabase/admin':{supabaseAdmin:()=>db},'@/lib/auth/verifyMember':{verifyMember:async()=>({id:'u1',email:'buyer@example.com'})},'@/lib/payments/flutterwave':{initializePayment:()=>{throw Error('Must not create new checkout');}},'@/lib/payments/premiumMembershipPricing':{getPremiumMembershipPricing:async()=>({monthlyUsd:999})}});
 const response=await POST(new Request('https://example.com',{method:'POST',body:JSON.stringify({interval:'monthly',currency:'USD'})}));
 assert.equal(response.status,200);
 assert.equal((await response.json()).authorizationUrl,'https://checkout.example.com/existing');
 assert.equal(db.writes.length,0);
 const changed=await POST(new Request('https://example.com',{method:'POST',body:JSON.stringify({interval:'annually',currency:'USD'})}));
 assert.notEqual(changed.status,200);assert.equal(db.writes.length,0);
});

test('content checkout rejects missing selected currency before creating an order',async()=>{
 const {POST}=load('src/app/api/content/checkout/route.ts',{'next/server':next,'@/lib/payments/validation':validation,'@/lib/supabase/admin':{supabaseAdmin:()=>{throw Error('Must not create order');}},'@/lib/auth/verifyMember':{verifyMember:async()=>({id:'u1',email:'buyer@example.com'})},'@/lib/payments/flutterwave':{},'@/lib/payments/content':{getItemPrice:async()=>({usd:120,ngn:null})}});
 const response=await POST(new Request('https://example.com',{method:'POST',body:JSON.stringify({itemType:'course',itemId:'c1',currency:'NGN'})}));
 assert.equal(response.status,400);
});
