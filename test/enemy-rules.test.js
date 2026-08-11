import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window={devicePixelRatio:1};
globalThis.document={
  getElementById(){ return {getContext(){ return {}; }}; }
};

const { waveDifficulty, bossPhase }=await import('../src/enemy.js');

test('waveDifficulty preserves early-wave values and capped scaling', () => {
  const wave1=waveDifficulty(1);
  assert.equal(wave1.hp,1);
  assert.equal(wave1.speed,1);
  assert.equal(wave1.damage,1);
  assert.ok(Math.abs(wave1.spawn-.662)<1e-12);
  assert.equal(wave1.cap,18);

  const wave10=waveDifficulty(10);
  assert.ok(Math.abs(wave10.hp-1.71865)<1e-12);
  assert.ok(Math.abs(wave10.speed-1.054)<1e-12);
  assert.ok(Math.abs(wave10.damage-1.108)<1e-12);
  assert.ok(Math.abs(wave10.spawn-2.11)<1e-12);
  assert.equal(wave10.cap,25);

  const late=waveDifficulty(1000);
  assert.equal(late.speed,1.34);
  assert.equal(late.damage,1.72);
  assert.equal(late.cap,66);
});

test('bossPhase transitions exactly at 70% and 35% HP', () => {
  assert.equal(bossPhase(null),1);
  assert.equal(bossPhase({hp:71,max:100}),1);
  assert.equal(bossPhase({hp:70,max:100}),2);
  assert.equal(bossPhase({hp:36,max:100}),2);
  assert.equal(bossPhase({hp:35,max:100}),3);
  assert.equal(bossPhase({hp:0,max:100}),3);
});
