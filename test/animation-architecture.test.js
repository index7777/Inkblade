import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveDirection, resolveAvailableDirection } from '../src/animation/direction.js';
import { AnimationController } from '../src/animation/animation-controller.js';
import { validateActorManifest } from '../src/assets/asset-registry.js';
import { drawLayeredCharacter } from '../src/render/layered-character-renderer.js';

const manifest=JSON.parse(fs.readFileSync(new URL('../assets/actors/enemies/ink_blade/actor.manifest.json',import.meta.url),'utf8'));

test('direction resolver quantizes all eight canvas directions',()=>{
  assert.equal(resolveDirection(0,-1),'N');
  assert.equal(resolveDirection(1,-1),'NE');
  assert.equal(resolveDirection(1,0),'E');
  assert.equal(resolveDirection(1,1),'SE');
  assert.equal(resolveDirection(0,1),'S');
  assert.equal(resolveDirection(-1,1),'SW');
  assert.equal(resolveDirection(-1,0),'W');
  assert.equal(resolveDirection(-1,-1),'NW');
});

test('N/E/S POC resolves diagonals vertically and west by mirroring east',()=>{
  assert.deepEqual(resolveAvailableDirection('NW',manifest.authoredDirections),{direction:'N',flipX:false,resolvedDirection:'N'});
  assert.deepEqual(resolveAvailableDirection('W',manifest.authoredDirections),{direction:'E',flipX:true,resolvedDirection:'W'});
  assert.deepEqual(resolveAvailableDirection('SW',manifest.authoredDirections),{direction:'S',flipX:false,resolvedDirection:'S'});
  assert.deepEqual(resolveAvailableDirection('NE',manifest.authoredDirections),{direction:'N',flipX:false,resolvedDirection:'N'});
  assert.deepEqual(resolveAvailableDirection('SE',manifest.authoredDirections),{direction:'S',flipX:false,resolvedDirection:'S'});
  assert.deepEqual(resolveAvailableDirection('S',manifest.authoredDirections),{direction:'S',flipX:false,resolvedDirection:'S'});
});

test('actors may author any subset and resolver selects nearest available view',()=>{
  assert.deepEqual(resolveAvailableDirection('N',['E']),{direction:'E',flipX:false,resolvedDirection:'E'});
  assert.deepEqual(resolveAvailableDirection('NW',['E']),{direction:'E',flipX:true,resolvedDirection:'W'});
  assert.deepEqual(resolveAvailableDirection('NE',['N','E','S']),{direction:'N',flipX:false,resolvedDirection:'N'});
  assert.equal(resolveAvailableDirection('S',[]),null);
});

test('manifest validator accepts actor-specific authored direction subsets',()=>{
  const ghost=structuredClone(manifest);
  ghost.actorId='enemy.ghost'; ghost.authoredDirections=['E'];
  ghost.animations.walk.directions={E:ghost.animations.walk.directions.E};
  assert.deepEqual(validateActorManifest(ghost),[]);
  const tri=structuredClone(manifest);
  tri.actorId='enemy.triad'; tri.authoredDirections=['N','E','S'];
  tri.animations.walk.directions={N:tri.animations.walk.directions.N,E:tri.animations.walk.directions.E,S:tri.animations.walk.directions.S};
  assert.deepEqual(validateActorManifest(tri),[]);
});

test('ink blade POC manifest satisfies runtime contract',()=>{
  assert.deepEqual(validateActorManifest(manifest),[]);
  assert.deepEqual(manifest.authoredDirections,['N','E','S']);
  assert.equal(manifest.assetSource,'ai-runtime');
  for(const direction of manifest.authoredDirections){
    assert.equal(manifest.animations.walk.directions[direction].body.files.length,9);
    for(const file of manifest.animations.walk.directions[direction].body.files){
      assert.match(file,/\/runtime\/body\/walk\//);
      assert.ok(fs.existsSync(new URL('../'+file,import.meta.url)));
    }
  }
});

test('animation controller owns frame timing independent from renderer',()=>{
  const controller=new AnimationController(manifest);
  controller.setMotion(-1,-1);
  assert.equal(controller.direction,'NW');
  controller.update(60);
  assert.equal(controller.frameIndex,4);
  controller.play('missing_action');
  assert.equal(controller.action,'walk');
});

test('layered renderer reports manifest provenance and never labels an empty draw as manifest',()=>{
  const calls=[];
  const ctx={save(){},restore(){},translate(){},scale(){},drawImage(){calls.push('draw');},set globalAlpha(v){}};
  const controller=new AnimationController(manifest); controller.direction='W';
  const registry={getActor(){return {manifest};},resolveFrameDirection(){return {direction:'E',flipX:true};},getFrame(){return {image:{},flipX:true};}};
  const info=drawLayeredCharacter(ctx,registry,'enemy.ink_blade',controller,{x:0,y:0,r:20,visualHeight:72});
  assert.equal(info.renderer,'manifest'); assert.equal(info.logicalDirection,'W'); assert.equal(info.resolvedAssetDirection,'E'); assert.equal(info.flipX,true); assert.ok(calls.length>=1);
  const empty={...registry,getFrame(){return null;}};
  assert.equal(drawLayeredCharacter(ctx,empty,'enemy.ink_blade',controller,{x:0,y:0,r:20,visualHeight:72}),false);
});
