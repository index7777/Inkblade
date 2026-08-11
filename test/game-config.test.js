import test from 'node:test';
import assert from 'node:assert/strict';

await import('../data/game-config.js');
const { runtime }=globalThis.INK_CONFIG;

test('authoritative game configuration validates', () => {
  const result=runtime.validateConfig();
  assert.equal(result.ok,true,result.errors.join('\n'));
  assert.deepEqual(result.errors,[]);
});

test('SeededRandom reproduces sequences and stays within requested ranges', () => {
  const a=new runtime.SeededRandom(20260811);
  const b=new runtime.SeededRandom(20260811);
  assert.deepEqual(Array.from({length:8},()=>a.next()),Array.from({length:8},()=>b.next()));

  const rng=new runtime.SeededRandom(7);
  for(let i=0;i<100;i+=1){
    const value=rng.int(2,5);
    assert.ok(value>=2 && value<=5);
  }
});

test('run-state creation returns independent normalized state', () => {
  const first=runtime.createRunState({},1.25);
  const second=runtime.createRunState({},1.25);
  assert.notStrictEqual(first,second);
  assert.notStrictEqual(first.stats,second.stats);
  assert.equal(first.difficultyScale,1.25);
  assert.equal(first.stats.mana,first.stats.manaMax);

  first.stats.damage+=99;
  first.statuses.test={rank:1};
  assert.notEqual(first.stats.damage,second.stats.damage);
  assert.equal(second.statuses.test,undefined);
});

test('applyOperation enforces additive scaling, flags, unlock uniqueness, and status caps', () => {
  const state=runtime.createRunState();
  const baseDamage=state.stats.damage;
  runtime.applyOperation(state,{op:'add',path:'stats.damage',value:4},1.5);
  assert.equal(state.stats.damage,baseDamage+6);

  runtime.applyOperation(state,{op:'flag',path:'tierFlags.regression',value:true});
  assert.equal(state.tierFlags.regression,true);

  runtime.applyOperation(state,{op:'unlock',path:'runUnlocks',value:'regression_unlock'});
  runtime.applyOperation(state,{op:'unlock',path:'runUnlocks',value:'regression_unlock'});
  assert.deepEqual(state.runUnlocks,['regression_unlock']);

  const status={op:'status',path:'regression',value:{maxStacks:2,power:3}};
  runtime.applyOperation(state,status);
  runtime.applyOperation(state,status);
  runtime.applyOperation(state,status);
  assert.deepEqual(state.statuses.regression,{maxStacks:2,power:3,rank:2});
});

test('resetRunState clears transient run mutations', () => {
  const reset=runtime.resetRunState({},1);
  assert.deepEqual(reset.statuses,{});
  assert.deepEqual(reset.ranks,{});
  assert.deepEqual(reset.runUnlocks,[]);
  assert.equal(reset.stats.mana,reset.stats.manaMax);
});
