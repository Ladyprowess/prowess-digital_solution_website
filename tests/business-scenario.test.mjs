import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/businessScenario.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports});
const {businessScenario:calculate}=module.exports;
test('scenario calculates contribution, fixed costs and break-even',()=>{
 const result=calculate('100','40','50','1500');
 assert.equal(result.revenue,5000); assert.equal(result.profit,1500); assert.equal(result.breakEven,25);
 assert.equal(calculate('10','10','50','100').breakEven,null);
 assert.equal(calculate('10','15','50','100').profit,-350);
});
test('invalid, incomplete and overflowing scenarios have no result',()=>{
 for(const args of [['','40','50','1500'],['100','-1','50','100'],['100','40','1.5','100'],['1e308','1','1e308','1']])assert.equal(calculate(...args),null);
});
