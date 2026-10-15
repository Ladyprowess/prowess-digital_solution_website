import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path,globals={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,...globals});return module.exports;}
const audit=load('src/lib/operationalAudit.ts');
const answers=value=>Object.fromEntries(audit.auditKeys.map(key=>[key,value]));
test('unanswered and invalid checkpoints never become reported gaps or a score',()=>{
 for(const values of [{},{'0-0':'in_place'},{...answers('in_place'),'0-0':'invalid'}]){const result=audit.summarizeAudit(values);assert.equal(result.complete,false);assert.equal(result.percent,null);assert.equal(result.notInPlace,0);assert.equal(audit.auditReport(values),null);}
});
test('all missing practices can produce a complete result at zero percent',()=>{const result=audit.summarizeAudit(answers('not_in_place'));assert.equal(result.complete,true);assert.equal(result.percent,0);assert.equal(result.notInPlace,36);assert.ok(audit.auditReport(answers('not_in_place')).includes('0 of 36'));});
test('not-applicable answers are excluded and all-N/A does not claim 100%',()=>{
 const values=answers('not_applicable');assert.equal(audit.summarizeAudit(values).percent,null);assert.ok(audit.auditReport(values).includes('No percentage'));
 values['0-0']='in_place';values['0-1']='in_progress';values['0-2']='not_in_place';const result=audit.summarizeAudit(values);assert.equal(result.percent,33);assert.equal(result.applicable,3);assert.equal(result.notApplicable,33);
});
test('the report includes each answer, unfinished work and method without growth claims',()=>{const values=answers('in_place');values['2-0']='in_progress';values['3-0']='not_applicable';const report=audit.auditReport(values);assert.ok(report.includes('In progress: Income and expenses'));assert.ok(report.includes('Not applicable: New customer'));assert.ok(report.includes('Next step to consider'));assert.ok(report.includes('does not verify compliance'));assert.ok(!report.includes('Time to grow'));});
function route(payload,notificationFails=false){const rows=[],sent=[];const {POST}=load('src/app/api/leads/route.ts',{process:{env:{RESEND_FROM_EMAIL:'from@example.com',ADMIN_NOTIFY_EMAIL:'admin@example.com'}},console:{error(){}},require(name){if(name==='@/lib/operationalAudit')return audit;if(name==='@/lib/payments/emailEscape')return {escapeEmail:value=>String(value).replaceAll('<','&lt;')};if(name==='next/server')return {NextResponse:{json:(body,options)=>Response.json(body,options)}};if(name==='@/lib/supabase/admin')return {supabaseAdmin:()=>({from:()=>({insert:async row=>{rows.push(row);return {error:null};}})})};if(name==='@/lib/resendClient')return {resend:{emails:{send:async mail=>{sent.push(mail);if(notificationFails)throw Error('offline');return {};}}}};throw Error(name);}});return {rows,sent,submit:()=>POST(new Request('https://example.com/api/leads',{method:'POST',body:JSON.stringify(payload)}))};}
const payload={source:'operational-health-self-audit',email:'owner@example.com',answers:answers('not_in_place')};
test('server derives totals from answers instead of trusting a supplied score',async()=>{const r=route({...payload,scorePercent:100});assert.equal((await r.submit()).status,200);assert.equal(r.rows[0].score_percent,0);assert.equal(r.rows[0].checked_count,0);assert.equal(r.rows[0].total_items,36);});
test('invalid email, source, incomplete answers and spoofed legacy counts are rejected before writes',async()=>{for(const body of [{...payload,email:'bad@'},{...payload,source:'unknown'},{...payload,answers:{}},{source:payload.source,email:payload.email,totalItems:36,checkedCount:0,scorePercent:100}]){const r=route(body);assert.equal((await r.submit()).status,400);assert.equal(r.rows.length,0);assert.equal(r.sent.length,0);}});
test('no applicable checks save a null score and notification failure does not block the result',async()=>{const r=route({...payload,answers:answers('not_applicable')},true);assert.equal((await r.submit()).status,200);assert.equal(r.rows[0].score_percent,null);assert.equal(r.rows[0].total_items,0);});
