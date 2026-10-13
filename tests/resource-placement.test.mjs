import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file,imports={}){
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports,URL,URLSearchParams,require:name=>imports[name]});
 return module.exports;
}
for(const placement of ['library','business','career','homepage'])test(`${placement} resources use independent placement and published status`,async()=>{
 const conditions=[];
 const query={select(){return this;},eq(k,v){conditions.push([k,v]);return this;},order(){return this;},range:async()=>({data:[],count:0,error:null})};
 const {GET}=load('src/app/api/resources/route.ts',{'next/server':{NextResponse:{json:(body,options)=>Response.json(body,options)}},'@/lib/supabase/admin':{supabaseAdmin:()=>({from:()=>query})}});
 const flag=placement==='homepage'?'show_on_homepage':`show_in_${placement}`;
 const response=await GET(new Request(`https://example.com/api/resources?${flag}=true`));
 assert.equal(response.status,200);
 assert.ok(conditions.some(([k,v])=>k==='status'&&v==='published'));
 assert.ok(conditions.some(([k,v])=>k===flag&&v===true));
 if(placement!=='library')assert.ok(!conditions.some(([k])=>k==='show_in_library'));
});
test('collection selection survives resource filter navigation',()=>{
 const {filtersFromSearchParams,searchParamsFromFilters,hasActiveFilters}=load('src/lib/resources/filters.ts');
 for(const placement of ['business','career']){
 const filters=filtersFromSearchParams(new URLSearchParams({placement}));
 assert.equal(filters.placement,placement);assert.equal(hasActiveFilters(filters),true);
 assert.equal(searchParamsFromFilters(filters).get('placement'),placement);
 }
 assert.equal(filtersFromSearchParams(new URLSearchParams({placement:'invalid'})).placement,'');
});
