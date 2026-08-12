import test from 'node:test';
import assert from 'node:assert/strict';

test('a single frame error cannot permanently stop requestAnimationFrame', async()=>{
  const oldDocument=globalThis.document;
  const oldWindow=globalThis.window;
  const oldRAF=globalThis.requestAnimationFrame;
  const ctx={setTransform(){}};
  const canvas={
    clientWidth:640, clientHeight:1138, width:640, height:1138,
    getContext(){ return ctx; }
  };
  let scheduled=0, reported=0, nextFrame=null;
  globalThis.document={getElementById:id=>id==='game'?canvas:null};
  globalThis.window={devicePixelRatio:1};
  globalThis.requestAnimationFrame=callback=>{ scheduled++; nextFrame=callback; return scheduled; };
  try{
    const {G}=await import('../src/core.js');
    const {configureBoot,resetBootClock,gameLoop}=await import('../src/boot.js');
    Object.assign(G,{running:true,paused:false,hitstop:0});
    configureBoot({
      diagFrame(){}, getDiag:()=>({on:false}), getFps:()=>0, isNoDraw:()=>false,
      update(){ throw new Error('intentional frame failure'); },
      draw(){}, onLoopError(){ reported++; }
    });
    resetBootClock();
    gameLoop(100);
    nextFrame(200);
    assert.equal(reported,1);
    assert.equal(scheduled,2,'the next frame must be scheduled from finally after the failure');
  }finally{
    globalThis.document=oldDocument;
    globalThis.window=oldWindow;
    globalThis.requestAnimationFrame=oldRAF;
  }
});
