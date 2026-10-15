import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const module={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/learningPlan.ts','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,{module,exports:module.exports});
const {learningPaths,learningPlanReport}=module.exports;

test('a learning plan requires a valid path and selected challenge',()=>{
  assert.equal(learningPlanReport(0,[]),null);
  assert.equal(learningPlanReport(99,[0]),null);
  assert.equal(learningPlanReport(0,[99]),null);
});

test('all sixteen learning challenges provide checks and practical actions',()=>{
  assert.equal(learningPaths.length,4);
  learningPaths.forEach((path,pathIndex)=>{
    assert.equal(path.challenges.length,4);
    path.challenges.forEach((challenge,challengeIndex)=>{
      const result=learningPlanReport(pathIndex,[challengeIndex]);
      assert.ok(result.includes(challenge.label));
      assert.ok(result.includes(`What may be happening: ${challenge.reason}`));
      assert.ok(result.includes(`What to check: ${challenge.check}`));
      assert.ok(result.includes(`Next action: ${challenge.action}`));
      path.challenges.forEach((other,index)=>{if(index!==challengeIndex)assert.ok(!result.includes(other.label));});
    });
  });
});

test('the learning plan preserves the skill and user notes without claiming assessment',()=>{
  const result=learningPlanReport(2,[0,2],'Data analysis','Practise on Saturdays');
  assert.ok(result.startsWith('Data analysis'));
  assert.ok(result.includes('Your notes\nPractise on Saturdays'));
  assert.ok(result.includes('challenges you selected'));
  assert.ok(!result.includes(learningPaths[2].challenges[1].label));
});

test('all four homepage directions now use dedicated workspaces',()=>{
  const home=fs.readFileSync('src/components/home/HomeLaunchpad.tsx','utf8');
  assert.ok(home.includes("<SkillsWorkspace active={ambition==='skills'}/>"));
  assert.ok(!home.includes('routeWorkspace'));
  assert.ok(home.includes("ambition==='skills'?<div>"));
  assert.ok(home.includes("ambition!=='skills' || /scholar|fellow|intern|training|course|programme|program|competition|challenge|bootcamp/i"));
});
