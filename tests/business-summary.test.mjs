import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
const receiptModule={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/captureBusinessResult.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:receiptModule,exports:receiptModule.exports});
const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/businessSummary.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports,require:()=>receiptModule.exports});
test('text results are laid out as the same receipt as the financial summary',()=>{
 const body=receiptModule.exports.textReceiptBody('Business: <b>Acme</b>\nFocus: Business plan\n\n1. Sales fell\nPossible causes: Prices may not cover the full cost of each sale, overheads may be too high.\n\nAfter costs: 1,500');
 assert.ok(!body.includes('<b>Acme</b>'));assert.ok(body.includes('&lt;b&gt;Acme&lt;/b&gt;'));
 assert.equal((body.match(/class="receipt-section"/g)||[]).length,3);
 assert.ok(body.includes('<div class="receipt-row"><span>Focus</span><b>Business plan</b></div>'));
 assert.ok(body.includes('<h4>1. Sales fell</h4>'));
 assert.ok(body.includes('<p><b>Possible causes:</b>'));
 assert.ok(body.includes('<div class="receipt-total"><span>After costs</span>1,500</div>'));
});
test('every business result goes through the receipt renderer before previewing',()=>{
 const source=fs.readFileSync('src/lib/businessSummary.ts','utf8');
 assert.ok(source.includes('textReceipt(title,content)'));assert.ok(source.includes('captureBusinessResult(source,title)'));
 assert.ok(fs.readFileSync('src/app/services/ServicesPageClient.tsx','utf8').includes('id="financial-result" data-receipt-complete'));
});
test('every printout drops out of the slot like the financial summary, without moving the printer',()=>{
 const css=fs.readFileSync('src/components/services/Workshop.module.css','utf8');
 assert.ok(css.includes('.printDialog .feedWindow,.printDialog.documentDialog .feedWindow{animation:none;height:auto;max-height:none}'));assert.ok(css.includes('.printDialog .printFooter{position:sticky'));
 assert.ok(css.includes('.printDialog .feedWindow>*{animation:printOut'));
 assert.ok(/\.receipt\{[^}]*animation:printOut/.test(css));
});
test('printouts never show web addresses',()=>{
 const body=receiptModule.exports.textReceiptBody('Next step: book a review\nContinue here: https://www.example.com/services\nRead more at www.example.com today');
 assert.ok(!/https?:\/\/|www\./.test(body));assert.ok(!body.includes('Continue here'));assert.ok(body.includes('book a review'));
 for(const file of ['src/lib/businessProblemReview.ts','src/lib/jobSearchPlan.ts','src/lib/opportunityPlan.ts','src/lib/learningPlan.ts','src/components/resources/BusinessStructureTemplate.tsx','src/lib/downloadBusinessCard.ts'])
  assert.ok(!fs.readFileSync(file,'utf8').includes('prowessdigitalsolutions.com'),file);
});

test('results offer download only, with no print or save-as-PDF option',()=>{
 const preview=fs.readFileSync('src/components/services/SummaryPreview.tsx','utf8');
 assert.ok(preview.includes('Download result'));assert.ok(!/Print \/ Save PDF|window\.open|summaryDocument/.test(preview));
 assert.ok(!('summaryDocument' in module.exports));
 for(const file of ['src/app/services/ServicesPageClient.tsx','src/components/services/BusinessAuditOffer.tsx','src/components/services/WorkflowSystemsOffer.tsx','src/components/services/SopLanding.tsx','src/app/tools/business-health-check/BusinessHealthCheckPageClient.tsx'])
  assert.ok(!/Preview \/ Print|Preview or print|print or save/i.test(fs.readFileSync(file,'utf8')),file);
 const css=fs.readFileSync('src/lib/captureBusinessResult.ts','utf8');
 assert.ok(css.includes('body{padding:18px}'));assert.ok(css.includes('.receipt-row:last-child'));
});
