import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const compiled={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/content/businessServices.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:compiled,exports:compiled.exports,encodeURIComponent});
const {businessServiceGroups,serviceAddOns,businessServiceInquiryTitles}=compiled.exports;

test('business catalogue contains the complete Start, Fix, Organise and Grow structure',()=>{
  assert.deepEqual(Array.from(businessServiceGroups,group=>group.title),['Start','Fix','Organise','Grow']);
  assert.ok(businessServiceGroups.every(group=>group.services.length===4));
  const titles=businessServiceGroups.flatMap(group=>group.services.map(service=>service.title));
  assert.equal(titles.length,16);
  assert.equal(new Set(titles).size,16);
  assert.deepEqual(Array.from(titles),[
    'Business Plans','Feasibility Studies','Market Research','Business Model',
    'Business Diagnostic','Business Audit','Financial Review','Pricing and Offer Review',
    'SOPs','Workflow Systems','Operations Documentation','Team Systems',
    'Growth Strategy','Expansion Planning','Marketing Strategy','Ongoing Business Support',
  ]);
});

test('every catalogue item has useful copy and an internal next step',()=>{
  for(const item of businessServiceGroups.flatMap(group=>group.services)){
    assert.ok(item.description.length>45,item.title);
    assert.ok(item.routeLabel.length>8,item.title);
    assert.match(item.href,/^\//,item.title);
    assert.ok(!item.href.includes('undefined'),item.title);
  }
});

test('all four add-ons are visible and have individual service pages',()=>{
  assert.equal(serviceAddOns.length,4);
  assert.deepEqual(Array.from(serviceAddOns,item=>item.title),[
    'Legal and Business Name Registration','Domain and Email Setup','Full Website Development','SEO and Content Management',
  ]);
  for(const addOn of serviceAddOns)assert.match(addOn.href,/^\/services\/[a-z-]+$/);
  assert.equal(new Set(businessServiceInquiryTitles).size,20);
});

test('service page renders catalogue, add-ons and contact-aware links',()=>{
  const services=fs.readFileSync('src/app/services/ServicesPageClient.tsx','utf8');
  const contact=fs.readFileSync('src/app/contact/ContactPageClient.tsx','utf8');
  const pricing=fs.readFileSync('src/app/pricing/PricingPageClient.tsx','utf8');
  assert.ok(services.includes('businessServiceGroups.map'));
  assert.ok(services.includes('serviceAddOns.map'));
  assert.ok(contact.includes('businessServiceInquiryTitles'));
  assert.ok(pricing.includes('href={serviceAddOns[i].href}'));
});
