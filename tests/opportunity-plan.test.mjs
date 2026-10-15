import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const module={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/opportunityPlan.ts','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,{module,exports:module.exports});
const {opportunityPaths,opportunityPlanReport}=module.exports;

test('an application plan requires a valid path and selected challenge',()=>{
  assert.equal(opportunityPlanReport(0,[]),null);
  assert.equal(opportunityPlanReport(99,[0]),null);
  assert.equal(opportunityPlanReport(0,[99]),null);
});

test('all sixteen opportunity challenges provide checks and practical actions',()=>{
  assert.equal(opportunityPaths.length,4);
  opportunityPaths.forEach((path,pathIndex)=>{
    assert.equal(path.challenges.length,4);
    path.challenges.forEach((challenge,challengeIndex)=>{
      const result=opportunityPlanReport(pathIndex,[challengeIndex]);
      assert.ok(result.includes(challenge.label));
      assert.ok(result.includes(`What may be happening: ${challenge.reason}`));
      assert.ok(result.includes(`What to check: ${challenge.check}`));
      assert.ok(result.includes(`Next action: ${challenge.action}`));
      path.challenges.forEach((other,index)=>{if(index!==challengeIndex)assert.ok(!result.includes(other.label));});
    });
  });
});

test('the plan preserves user details and tells users to verify official terms',()=>{
  const result=opportunityPlanReport(0,[0,2],'Growth Fund','Deadline is 30 June');
  assert.ok(result.startsWith('Opportunity: Growth Fund'));
  assert.ok(result.includes('Your notes\nDeadline is 30 June'));
  assert.ok(result.includes('official page'));
  assert.ok(!result.includes(opportunityPaths[0].challenges[1].label));
});

test('Opportunities uses its dedicated workspace and removes the generic route',()=>{
  const home=fs.readFileSync('src/components/home/HomeLaunchpad.tsx','utf8');
  assert.ok(home.includes("<OpportunitiesWorkspace active={ambition==='opportunities'}/>"));
  assert.ok(!home.includes('routeWorkspace'));
  assert.ok(home.includes("ambition==='opportunities'?<div>"));
});
