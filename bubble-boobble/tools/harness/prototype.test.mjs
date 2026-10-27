import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prototypePlan,usesPrototypeLane} from './prototype.mjs';

test('prototype quick and verify never select the strict lane implicitly',()=>{
  for(const command of ['quick','verify','prototype'])assert.equal(usesPrototypeLane(command,'prototype'),true);
  for(const command of ['verify-full','verify-strict','quick-strict','milestone'])assert.equal(usesPrototypeLane(command,'prototype'),false);
  assert.equal(usesPrototypeLane('verify','strict'),false);
  assert.throws(()=>usesPrototypeLane('verify','typo'));
});
test('prototype selection is exactly one V8 logic filter and lists deferred coverage',()=>{
  const plan=prototypePlan('title curtain consumes Enter*',{prototype:{defaultFilter:'harness reset and tap'}});
  assert.deepEqual(plan.args,['test','--tier','t0','--js','v8','--filter','title curtain consumes Enter*']);
  assert.ok(plan.deferred.includes('cooks and cooked smoke'));
  assert.equal(prototypePlan(undefined,{prototype:{defaultFilter:'harness reset and tap'}}).filter,'harness reset and tap');
  assert.throws(()=>prototypePlan('',{prototype:{defaultFilter:'smoke'}}));
});
