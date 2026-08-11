import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.INK_CONFIG={
  lifeModel:{pixelsPerLife:100,maxBonus:3},
  armorModel:{perPoint:0.1}
};
globalThis.window={devicePixelRatio:1,INK_CONFIG:globalThis.INK_CONFIG};
globalThis.document={
  getElementById(){ return {getContext(){ return {}; }}; }
};

const { G,stat }=await import('../src/core.js');
const {
  pathLen,leadInLen,bladeLength,inlineGap,formationOffset,
  cmdLife,speedMul,durCost
}=await import('../src/combat.js');

test('path length and remote lead-in are deterministic',()=>{
  G.player={x:1,y:2};
  const path=[{x:4,y:6},{x:7,y:10},{x:7,y:22}];
  assert.equal(pathLen(path),17);
  assert.equal(leadInLen(path),5);
  assert.equal(leadInLen([]),0);
});

test('formation offsets preserve merge, parallel and inline layouts',()=>{
  stat.size=10;
  assert.deepEqual(formationOffset('merge',2,5,30,0),{along:0,side:0});
  assert.deepEqual(formationOffset('parallel',0,3,30,0),{along:0,side:-30});
  assert.deepEqual(formationOffset('parallel',2,3,30,0),{along:0,side:30});
  assert.equal(bladeLength(),53);
  assert.equal(inlineGap(),81);
  assert.deepEqual(formationOffset('inline',1,3,30,0),{along:-123.4,side:0});
});

test('command life is length-based and capped',()=>{
  assert.equal(cmdLife(0),1);
  assert.equal(cmdLife(299),3);
  assert.equal(cmdLife(10000),4);
});

test('speed damage multiplier and armor durability cost retain balance rules',()=>{
  stat.speed=14;
  stat.damage=20;
  stat.armor=0;
  assert.equal(speedMul({speedMul:1}),1);
  assert.equal(speedMul({speedMul:2}),1.6);
  assert.equal(durCost(40),2);
  stat.armor=5;
  assert.ok(Math.abs(durCost(40)-4/3)<1e-12);
  stat.armor=-10;
  assert.equal(durCost(40),4);
});
