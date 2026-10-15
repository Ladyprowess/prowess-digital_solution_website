import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/businessProblemReview.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports});
const {businessReviews:services,businessReviewReport:report}=module.exports;
test('empty and invalid choices cannot generate a result',()=>{assert.equal(report(0,[]),null);assert.equal(report(99,[0]),null);assert.equal(report(0,[-1,99]),null);});
test('each of the sixteen problems has its own causes, checks and action without unrelated findings',()=>{
 services.forEach((service,i)=>service.problems.forEach((problem,j)=>{const result=report(i,[j]);assert.ok(result.includes(problem.label));assert.ok(result.includes(problem.causes));assert.ok(result.includes(problem.check));assert.ok(result.includes(problem.action));service.problems.forEach((other,k)=>{if(k!==j)assert.ok(!result.includes(other.label));});}));
});
test('report includes multiple selected problems only once and preserves notes as notes',()=>{const result=report(0,[0,0,2],'Acme','Sales fell in June');assert.equal(result.split(services[0].problems[0].label).length,2);assert.ok(result.includes(services[0].problems[2].label));assert.ok(result.includes('Your additional notes\nSales fell in June'));assert.ok(result.includes('possible causes'));});
test('homepage removes save controls and keeps legacy browser saves intact',()=>{const source=fs.readFileSync('src/components/home/HomeLaunchpad.tsx','utf8');assert.ok(!source.includes('my-next-steps'));assert.ok(!source.includes('setSaved'));assert.ok(!source.includes('Bookmark'));assert.ok(source.includes("storageKey = 'pds-home-preferences-v1'"));assert.ok(fs.readFileSync('src/app/account/(dashboard)/saved/page.tsx','utf8').includes('<SavedShortcuts />'));});
function shortcutHarness(raw,writeFails=false){
 const values=[],effects=[];let cursor=0;let stored=raw;
 const jsx=(type,props)=>({type,props});
 const m={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/account/SavedShortcuts.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
 module:m,exports:m.exports,localStorage:{getItem:()=>stored,setItem:(_,value)=>{if(writeFails)throw Error('blocked');stored=value;}},require(name){
 if(name==='react')return {useState(initial){const i=cursor++;if(!(i in values))values[i]=initial;return [values[i],v=>values[i]=typeof v==='function'?v(values[i]):v];},useEffect(fn){effects.push(fn);}};
 if(name==='react/jsx-runtime')return {jsx,jsxs:jsx};
 if(name==='@/components/home/journeys')return {journeys:{business:{tools:[{href:'/tools/invoice',title:'Invoice'}],focuses:[]}}};
 if(name==='next/link')return {default:'a'};if(name==='./AccountUI')return {Card:'Card'};throw Error(name);
 }});
 return {render(){cursor=0;return m.exports.default();},hydrate(){effects[0]();},values,get stored(){return stored;}};
}
function findButton(node){if(!node||typeof node!=='object')return null;if(node.type==='button')return node;for(const child of [node.props?.children].flat(Infinity)){const found=findButton(child);if(found)return found;}return null;}
test('account preserves valid legacy links, filters unsafe links and removes only the chosen shortcut',()=>{const h=shortcutHarness(JSON.stringify({ambition:'skills',saved:['/tools/invoice','/tools/invoice','javascript:bad']}));h.render();h.hydrate();const tree=h.render();assert.equal(h.values[0].length,1);findButton(tree).props.onClick();assert.equal(h.values[0].length,0);assert.equal(JSON.parse(h.stored).ambition,'skills');assert.deepEqual(JSON.parse(h.stored).saved,['javascript:bad']);});
test('account does not pretend removal succeeded if browser storage fails',()=>{const h=shortcutHarness(JSON.stringify({saved:['/tools/invoice']}),true);h.render();h.hydrate();findButton(h.render()).props.onClick();assert.equal(h.values[0].length,1);assert.ok(h.values[1].includes('could not be removed'));});
