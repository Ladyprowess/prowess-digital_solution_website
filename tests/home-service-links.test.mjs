import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const module={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/businessProblemReview.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports});
const {businessReviews,businessReviewReport}=module.exports;
const servicePages=fs.readFileSync('src/content/servicePages.ts','utf8');

test('homepage business services open the form on their own service page',()=>{
  assert.equal(businessReviews.length,3);
  for(const service of businessReviews){
    const match=/^\/services\/([a-z0-9-]+)#service-checkout$/.exec(service.href);
    assert.ok(match,`${service.title} must link to a service form, got ${service.href}`);
    assert.ok(servicePages.includes(`slug:'${match[1]}'`),`${service.title} links to a missing service page`);
    assert.ok(service.cta.trim().length>0);
  }
  assert.ok(fs.readFileSync('src/components/services/ServiceCheckout.tsx','utf8').includes('id="service-checkout"'));
});

test('printed next steps point to the matching service form, not Contact Us',()=>{
  businessReviews.forEach((service,i)=>{
    const report=businessReviewReport(i,[0]);
    assert.ok(report.includes(`https://www.prowessdigitalsolutions.com${service.href}`));
    assert.ok(!report.includes('/contact'));
  });
});

test('homepage business sections do not send buyers to Contact Us',()=>{
  for(const file of ['src/components/home/ProductOpening.tsx','src/components/home/HomeSupport.tsx']){
    assert.ok(!fs.readFileSync(file,'utf8').includes('/contact'),`${file} still links to /contact`);
  }
});
