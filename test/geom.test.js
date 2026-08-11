import test from 'node:test';
import assert from 'node:assert/strict';

import { offsetPath, rotatePath, truncatePath, segCircleDist, supHash } from '../src/geom.js';

test('path transforms preserve their geometric contracts', () => {
  const line=[{x:0,y:0},{x:10,y:0}];
  assert.deepEqual(offsetPath(line,3),[{x:0,y:3},{x:10,y:3}]);

  const rotated=rotatePath(line,Math.PI/2);
  assert.equal(rotated[0].x,0);
  assert.equal(rotated[0].y,0);
  assert.ok(Math.abs(rotated[1].x)<1e-12);
  assert.ok(Math.abs(rotated[1].y-10)<1e-12);
});

test('truncatePath interpolates the terminal point at the requested length', () => {
  const path=[{x:0,y:0},{x:3,y:4},{x:9,y:4}];
  assert.deepEqual(truncatePath(path,8),[{x:0,y:0},{x:3,y:4},{x:6,y:4}]);
  assert.equal(truncatePath(path,0),null);
  assert.equal(truncatePath([{x:0,y:0}],4),null);
});

test('segment distance clamps projection to the segment endpoints', () => {
  assert.equal(segCircleDist(0,0,10,0,5,4),4);
  assert.equal(segCircleDist(0,0,10,0,14,3),5);
  assert.equal(segCircleDist(null,0,10,0,13,4),5);
});

test('supHash is deterministic and normalized', () => {
  const values=[0,1,17.5,-3].map(supHash);
  assert.deepEqual(values,[0,1,17.5,-3].map(supHash));
  for(const value of values) assert.ok(value>=0 && value<1);
});
