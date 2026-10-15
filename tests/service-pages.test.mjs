import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const compiled={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/content/servicePages.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:compiled,exports:compiled.exports});
const {servicePages,servicePageBySlug}=compiled.exports;

test('every business service and add-on has an individual page definition',()=>{
  assert.equal(servicePages.length,20);
  assert.equal(new Set(servicePages.map(item=>item.slug)).size,20);
  assert.deepEqual(Array.from(servicePages.reduce((counts,item)=>counts.set(item.group,(counts.get(item.group)||0)+1),new Map()).entries()),[['start',4],['fix',4],['organise',4],['grow',4],['add-on',4]]);
});

test('each page has distinct sales copy, deliverables, process, fit and faq content',()=>{
  assert.equal(new Set(servicePages.map(item=>item.promise)).size,20);
  for(const item of servicePages){
    assert.ok(item.description.length>90,item.slug);
    assert.equal(item.deliverables.length,4,item.slug);
    assert.equal(item.process.length,3,item.slug);
    assert.ok(item.fit.length>=3,item.slug);
    assert.ok(item.faq.length>=3,item.slug);
  }
});

test('legacy featured package URLs resolve into the rebranded service pages',()=>{
  assert.equal(servicePageBySlug('sop-vault').slug,'sops');
  assert.equal(servicePageBySlug('financial-tracking-dashboard').slug,'financial-review');
  assert.equal(servicePageBySlug('go-to-market-offer-playbook').slug,'pricing-offer-review');
  assert.equal(servicePageBySlug('business-structure-diagnostic').title,'Business Diagnostic');
});

test('page-specific carousel is independent from case studies and testimonial records',()=>{
  const source=fs.readFileSync('src/components/services/ClientVoices.tsx','utf8');
  assert.ok(source.includes('service.deliverables.map'));
  assert.ok(!source.includes('/api/case-studies'));
  assert.ok(!source.includes('testimonial'));
});
