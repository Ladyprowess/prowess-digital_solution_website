import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/businessHealth.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { module, exports: module.exports });
const { scoreHealth } = module.exports;
test('incomplete and invalid answers cannot produce a score', () => {
  for (const answers of [[], [2, 2], [2, 2, -1, 2, 2], [2, 2, NaN, 2, 2], [3, 2, 2, 2, 2]]) assert.equal(scoreHealth(answers), null);
});
test('scores reflect answers and recommendations target only gaps', () => {
  assert.equal(scoreHealth([0, 0, 0, 0, 0]).score, 0);
  const strong = scoreHealth([2, 2, 2, 2, 2]);
  assert.equal(strong.score, 100);
  assert.equal(strong.priorities.length, 0);
  const mixed = scoreHealth([2, 0, 1, 2, 2]);
  assert.equal(mixed.score, 70);
  assert.deepEqual(Array.from(mixed.priorities, x => x.area), ['Pricing', 'Sales']);
});

test('findings explain selected answers and prioritise missing practices before partial ones',()=>{
 const findings=module.exports.healthFindings([1,2,0,2,1]);
 assert.equal(findings[0].area,'Sales');
 assert.equal(findings[0].answer,module.exports.healthAnswers[2][0]);
 assert.ok(findings[0].action.includes('enquiry tracker'));
 const partial=module.exports.healthFindings([1,2,1,2,1]).find(x=>x.area==='Sales');
 assert.ok(partial.action.includes('overdue follow-ups'));
 assert.notEqual(partial.action,findings[0].action);
 assert.equal(findings.filter(x=>x.value===2).length,2);
 assert.equal(module.exports.healthFindings([-1,0,0,0,0]).length,0);
});
