import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file, imports) {
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module,exports:module.exports,require:n=>{if(n in imports)return imports[n];throw Error(n);},process:{env:{}},URL,Buffer,console});
 return module.exports;
}
function setup(path,{member=true,premium=false,count=0,existing=null}={}) {
 const writes=[];
 const db={from(){let write=false;const q={select(){return q;},eq(){return q;},neq(){return q;},order(){return q;},insert(row){write=true;writes.push(row);return q;},update(row){write=true;writes.push(row);return q;},single:async()=>({data:{id:'new'},error:null}),maybeSingle:async()=>({data:existing,error:null}),then(resolve){return Promise.resolve({data:write?[{id:'new'}]:[],count,error:null}).then(resolve);}};return q;}};
 const imports={
  'next/server':{NextResponse:{json:(body,options)=>Response.json(body,options)}},
  '@/lib/supabase/admin':{supabaseAdmin:()=>db},
  '@/lib/auth/verifyMember':{verifyMember:async()=>member?{id:'u1',email:'a@example.com'}:null},
  '@/lib/payments/premiumMembership':{hasPremiumAccess:async()=>premium},
  '@/lib/slugify':{slugify:s=>s},
  '@/lib/cvBuilder/validate':{validateCvData:()=>({ok:true,data:{personalInfo:{fullName:'Test'}}})},
  '@/lib/cvBuilder/templates':{isKnownCvTemplate:s=>['plain','modern'].includes(s),isFreeCvTemplate:s=>s==='plain'},
  '@/lib/emails/cvChecker':{},'@/lib/resendClient':{},
  react:{default:{createElement:()=>null}},
  '@react-pdf/renderer':{StyleSheet:{create:s=>s}},
 };
 return {routes:load(path,imports),writes};
}
const paths=['cv-checker','interview-prep','portfolio-builder/save','portfolio-builder/upload','portfolio-builder/pdf','cv-builder/save','cv-builder/pdf'];
const request=(body={})=>new Request('https://example.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
for(const path of paths)test(`${path}: anonymous users denied`,async()=>{
 const {routes,writes}=setup(`src/app/api/${path}/route.ts`,{member:false});
 const response=await (path==='interview-prep'?routes.GET:routes.POST)(request());
 assert.equal(response.status,401);assert.equal(writes.length,0);
});
for(const path of ['cv-checker','interview-prep','portfolio-builder/save','portfolio-builder/upload'])test(`${path}: unpaid users cannot submit, create, upload or read paid questions`,async()=>{
 const {routes,writes}=setup(`src/app/api/${path}/route.ts`);
 const response=await (path==='interview-prep'?routes.GET:routes.POST)(request({fullName:'Test'}));
 assert.equal(response.status,403);assert.equal(writes.length,0);
});
test('Portfolio Builder: URL id cannot update or export another user’s portfolio',async()=>{
 for(const path of ['save','pdf']){
 const {routes,writes}=setup(`src/app/api/portfolio-builder/${path}/route.ts`);
 const response=await routes.POST(request({id:'fake',portfolioId:'fake',fullName:'Test'}));
 assert.ok([403,404].includes(response.status));assert.equal(writes.length,0);
 }
});
test('CV Builder: one plain CV is free, paid templates and extra CVs require Premium',async()=>{
 for(const [premium,count,template,status] of [[false,0,'plain',200],[false,1,'plain',403],[false,0,'modern',403],[true,1,'modern',200]]){
 const {routes,writes}=setup('src/app/api/cv-builder/save/route.ts',{premium,count});
 assert.equal((await routes.POST(request({template,data:{}}))).status,status);
 assert.equal(writes.length,status===200?1:0);
 }
});
test('CV Builder: unpaid template switching is blocked for saving and PDF export',async()=>{
 for(const path of ['save','pdf']){
 const {routes,writes}=setup(`src/app/api/cv-builder/${path}/route.ts`,{existing:{id:'cv1',template:'plain',data:{}}});
 assert.equal((await routes.POST(request({id:'cv1',cvId:'cv1',template:'modern',data:{}}))).status,403);
 assert.equal(writes.length,0);
 }
});
test('paid users can create portfolios and read interview questions',async()=>{
 const portfolio=setup('src/app/api/portfolio-builder/save/route.ts',{premium:true});
 assert.equal((await portfolio.routes.POST(request({fullName:'Test'}))).status,200);
 assert.equal(portfolio.writes.length,1);
 const interview=setup('src/app/api/interview-prep/route.ts',{premium:true});
 assert.equal((await interview.routes.GET(request())).status,200);
});
test('CV Checker preflight reflects entitlement without accepting a submission',async()=>{
 for(const premium of [false,true]){
 const {routes,writes}=setup('src/app/api/cv-checker/route.ts',{premium});
 assert.equal((await (await routes.GET(request())).json()).hasAccess,premium);
 assert.equal(writes.length,0);
 }
});
test('UI defaults deny access until verified; URL id is not an entitlement',()=>{
 const portfolio=fs.readFileSync('src/app/tools/portfolio-builder/PortfolioBuilderPageClient.tsx','utf8');
 assert.match(portfolio,/\[portfolioId, setPortfolioId\] = useState<string \| null>\(null\)/);
 assert.match(portfolio,/if \(target\) \{[\s\S]*setPortfolioId\(target.id\)/);
 assert.match(fs.readFileSync('src/app/tools/interview-prep/InterviewPrepPageClient.tsx','utf8'),/\[locked, setLocked\] = useState\(true\)/);
 assert.match(fs.readFileSync('src/app/tools/cv-checker/CvCheckerPageClient.tsx','utf8'),/access !== "allowed"/);
});
