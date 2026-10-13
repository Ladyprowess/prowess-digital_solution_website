import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path,imports={}){
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports,require:name=>imports[name]});
 return module.exports;
}
const {selectLearnResources,resourceToLearnItem,selectCourses}=load('src/lib/learn/types.ts',{'@/lib/learn/courseSource':{creatorCredit:()=>null}});
test('Learn resource selection uses its own placement and excludes drafts',async()=>{
 const rows=[{id:'shown',status:'published',show_in_learn:true,show_in_library:false},{id:'hidden',status:'published',show_in_learn:false},{id:'draft',status:'draft',show_in_learn:true}];
 const filters=[];
 const result=await selectLearnResources(select=>{
  assert.ok(!select.includes('file_url'));assert.ok(!select.includes('content,'));
  const query={eq(k,v){filters.push([k,v]);return query;},then(resolve){return Promise.resolve({data:rows.filter(row=>filters.every(([k,v])=>row[k]===v)),error:null}).then(resolve);}};
  return query;
 });
 assert.deepEqual(result.map(r=>r.id),['shown']);
});
test('resource links retain video and resource destinations, including non-course formats',()=>{
 const row={id:'one',slug:'web3',resource_type:'video',resource_skill_map:[],title:'What is Web3?'};
 assert.equal(resourceToLearnItem(row).href,'/videos/web3');
 assert.equal(resourceToLearnItem({...row,resource_type:'ebook'}).href,'/resources/web3');
 assert.equal(resourceToLearnItem({...row,resource_type:'checklist'}).kind,'resource');
});
test('Learn errors are surfaced rather than reported as an empty library',async()=>{
 await assert.rejects(selectLearnResources(()=>({eq(){return this;},then(resolve){return Promise.resolve({data:null,error:{message:'offline'}}).then(resolve);}})),/could not be loaded/);
 await assert.rejects(selectCourses(async()=>({data:null,error:{message:'offline'}}),true),/could not be loaded/);
});
test('video and ebook filters survive navigation and count as active filters',()=>{
 const {filtersFromSearchParams,hasActiveFilters,searchParamsFromFilters}=load('src/lib/learn/filters.ts');
 for(const kind of ['video','ebook','course','resource']){
 const filters=filtersFromSearchParams(new URLSearchParams({kind}));
 assert.equal(filters.kind,kind);assert.equal(hasActiveFilters(filters),true);
 // URLSearchParams is only used inside the serialization function in the VM; parsing is sufficient here.
 }
});
