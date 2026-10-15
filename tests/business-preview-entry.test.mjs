import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('public/tools/preview-business-result.js','utf8');
function setup(overrides={}){
  const saved=new Map();const navigations=[];
  const tab={sessionStorage:{setItem:(key,value)=>saved.set(key,value)},location:{replace:path=>navigations.push(path)},close(){this.closed=true;},opener:{}};
  const window={location:{origin:'https://prowessdigitalsolutions.com'},open:()=>tab,...overrides};
  window.parent=overrides.parent||window;
  vm.runInNewContext(source,{window});
  return {window,tab,saved,navigations};
}
test('standalone preview preserves the full document without putting private entries in the URL',()=>{
  const {window,tab,saved,navigations}=setup();
  window.previewBusinessResult('A & B <studio>','Team roles\nOwner: Ada\n\nPrivate project notes');
  assert.deepEqual(JSON.parse(saved.get('pds-business-print-preview')),{title:'A & B <studio>',content:'Team roles\nOwner: Ada\n\nPrivate project notes'});
  assert.deepEqual(navigations,['/tools/print-preview']);assert.equal(tab.opener,null);
});
test('blocked popups produce an actionable error instead of reporting a download',()=>{
  const {window}=setup({open:()=>null});
  assert.throws(()=>window.previewBusinessResult('Plan','My notes'),/Allow pop-ups/);
});
test('embedded tools use the parent printer only when the shared host exists',()=>{
  const events=[];const parent={location:{origin:'https://prowessdigitalsolutions.com'},document:{querySelector:()=>({})},CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail;}},dispatchEvent:event=>events.push(event)};
  const {window,navigations}=setup({parent});window.previewBusinessResult('Plan','Content');
  assert.equal(events.length,1);assert.equal(events[0].type,'prowess-summary');assert.equal(events[0].detail.content,'Content');assert.equal(navigations.length,0);
});
test('storage failure closes the blank tab and allows the user to retry',()=>{
  const {window,tab}=setup();tab.sessionStorage.setItem=()=>{throw Error('blocked');};
  assert.throws(()=>window.previewBusinessResult('Plan','Content'),/allow browser storage/);assert.equal(tab.closed,true);
});
