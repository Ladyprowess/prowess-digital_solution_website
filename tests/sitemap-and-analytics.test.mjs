import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file, globals={}) {
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,...globals});
 return module.exports;
}
test('analytics is safe without a browser or with a failing tracker',()=>{
 load('src/lib/analytics.ts').trackEvent('generate_lead');
 load('src/lib/analytics.ts',{window:{gtag(){throw new Error('Blocked');}}}).trackEvent('begin_checkout');
 const calls=[];
 load('src/lib/analytics.ts',{window:{gtag:(...args)=>calls.push(args)}}).trackEvent('generate_lead',{source:'contact_form'});
 assert.equal(calls.length,1); assert.equal(calls[0][0],'event'); assert.equal(calls[0][1],'generate_lead');
});
test('sitemap filters publication and expiry and routes video resources correctly',async()=>{
 const calls=[];
 const client={from(table){
  const query=new Proxy({}, {get(_,method){
   if(method==='then')return resolve=>resolve({data:table==='resources'?[{slug:'lesson',resource_type:'video'}]:[{slug:'example'}],error:null});
   return (...args)=>{calls.push([table,method,...args]);return query;};
  }});return query;
 }};
 const {publicContentSitemap}=load('src/lib/publicSitemap.ts',{
  process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://example.test',NEXT_PUBLIC_SUPABASE_ANON_KEY:'public-test'}},
  require:()=>({createClient:()=>client}),console,
 });
 const entries=await publicContentSitemap('https://example.test');
 assert.equal(entries.length,8);
 assert.ok(entries.some(x=>x.url==='https://example.test/videos/lesson'));
 assert.ok(calls.some(([table,method,key,value])=>table==='case_studies'&&method==='eq'&&key==='is_published'&&value===true));
 for(const table of ['jobs','opportunities'])assert.ok(calls.some(([t,m,filter])=>t===table&&m==='or'&&filter.includes('expires_at')));
});
