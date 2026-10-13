import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const module = {exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/payments/consultationPrice.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports});
const {consultationPrice}=module.exports;
test('missing currency cannot create a free consultation',()=>{
 assert.equal(consultationPrice({price_usd:null,price_ngn:25000},'USD'),null);
 assert.equal(consultationPrice({price_usd:50,price_ngn:null},'NGN'),null);
 assert.equal(consultationPrice({price_usd:null,price_ngn:null},null),null);
});
test('unspecified currency selects an actually configured price',()=>{
 const price=consultationPrice({price_usd:null,price_ngn:25000},null);
 assert.equal(price.currency,'NGN'); assert.equal(price.amount,25000);
});
test('only an explicit zero allows free booking',()=>{
 assert.equal(consultationPrice({price_usd:0,price_ngn:null},'USD').amount,0);
 for(const value of [-1,NaN,Infinity]) assert.equal(consultationPrice({price_usd:value,price_ngn:null},'USD'),null);
});
