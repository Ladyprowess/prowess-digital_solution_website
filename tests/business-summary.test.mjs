import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
const receiptModule={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/captureBusinessResult.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:receiptModule,exports:receiptModule.exports});
const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/businessSummary.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports,require:()=>receiptModule.exports});
test('print document escapes user content and supports multi-section print layouts',()=>{const html=module.exports.summaryDocument({title:'<img src=x>',content:'<script>bad()</script>\n\nCustomer: A & B\nReview: tomorrow'});assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('A &amp; B'));assert.ok(html.includes('@page{size:A4'));assert.equal((html.match(/class="section"/g)||[]).length,2);});
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
