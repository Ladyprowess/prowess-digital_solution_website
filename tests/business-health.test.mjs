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
