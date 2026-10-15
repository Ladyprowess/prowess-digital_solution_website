import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const module = {exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/jobSearchPlan.ts','utf8'), {
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText, {module,exports:module.exports});
const {careerPaths,jobSearchPlanReport} = module.exports;

test('an action plan requires a valid path and at least one selected challenge', () => {
  assert.equal(jobSearchPlanReport(0,[]),null);
  assert.equal(jobSearchPlanReport(99,[0]),null);
  assert.equal(jobSearchPlanReport(0,[99]),null);
});

test('all career challenges provide a reason, a check and a next action', () => {
  assert.equal(careerPaths.length,4);
  careerPaths.forEach((path,pathIndex) => {
    assert.equal(path.problems.length,4);
    path.problems.forEach((problem,problemIndex) => {
      const result=jobSearchPlanReport(pathIndex,[problemIndex]);
      assert.ok(result.includes(problem.label));
      assert.ok(result.includes(`What may be happening: ${problem.reason}`));
      assert.ok(result.includes(`What to check: ${problem.check}`));
      assert.ok(result.includes(`Next action: ${problem.action}`));
      path.problems.forEach((other,index) => {
        if(index!==problemIndex) assert.ok(!result.includes(other.label));
      });
    });
  });
});

test('the plan keeps the target role and user notes without inventing findings', () => {
  const result=jobSearchPlanReport(1,[0,2],'Product designer','Apply before Friday');
  assert.ok(result.startsWith('Product designer'));
  assert.ok(result.includes('Your notes\nApply before Friday'));
  assert.ok(result.includes('challenges you selected'));
  assert.ok(!result.includes(careerPaths[1].problems[1].label));
});

test('Jobs uses its dedicated workspace instead of the generic route', () => {
  const home=fs.readFileSync('src/components/home/HomeLaunchpad.tsx','utf8');
  assert.ok(home.includes("<JobsWorkspace active={ambition==='work'}/>"));
  assert.ok(!home.includes('routeWorkspace'));
  assert.ok(home.includes("ambition==='work'?<div>"));
});
