import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function guard(member,role,recipient){
 const module={exports:{}};let reads=0;
 const modules={'next/server':{NextResponse:{json:(b,o)=>Response.json(b,o)}},'@/lib/auth/verifyMember':{verifyMember:async()=>member},'@/lib/supabase/admin':{supabaseAdmin:()=>({from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:reads++===0?role&&{role}:recipient&&{role:recipient}})})})})})}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/emails/authorizeNotification.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module,exports:module.exports,URL,require:n=>modules[n]});
 return (path='/api/notify-task')=>module.exports.authorizeNotification(new Request(`https://example.com${path}`,{method:'POST',body:JSON.stringify({to:'team@example.com'})}));
}
test('notification endpoints reject anonymous callers',async()=>assert.equal((await guard(null)()).status,401));
test('notifications reject disabled senders and recipients outside the team',async()=>{
 assert.equal((await guard({id:'u'},'disabled','member')()).status,403);
 assert.equal((await guard({id:'u'},'admin',null)()).status,403);
});
test('payroll rejects ordinary members while a team admin can notify a team recipient',async()=>{
 assert.equal((await guard({id:'u'},'member','member')('/api/notify-payroll')).status,403);
 assert.equal(await guard({id:'u'},'admin','member')('/api/notify-payroll'),null);
});
