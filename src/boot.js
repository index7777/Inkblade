import { G } from './core.js';
import { cv, ctx, W, H, DPR, setDPR } from './viewport.js';

const LOGIC_MS=1000/60;
let hooks={};
let idleFrame=0, perfBuf=[], perfBad=0, perfStart=0;
let logicAcc=0, renderAcc=0, lastFrameTs=0;

export function configureBoot(nextHooks){ hooks=nextHooks||{}; }

export function resetBootClock(now=performance.now()){
  logicAcc=0; renderAcc=0; lastFrameTs=now;
}

function watchPerf(ts){
  if(!perfStart){ perfStart=ts; return; }
  if(ts-perfStart<2000) return;
  perfBuf.push(ts);
  if(perfBuf.length<91) return;
  const d=[];
  for(let i=1;i<perfBuf.length;i++) d.push(perfBuf[i]-perfBuf[i-1]);
  perfBuf.length=0;
  d.sort((a,b)=>a-b);
  const med=d[d.length>>1];
  if(med>22){
    if(++perfBad>=2){
      if(DPR>1){
        setDPR(Math.max(1,+(DPR-0.5).toFixed(2)));
        cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
      }else{
        // DPR 已到底仍持續低於約 45fps，瓶頸通常在 CSS 合成／特效層。
        hooks.degradeQuality?.();
      }
      perfBad=0;
    }
  } else perfBad=0;
}

export function gameLoop(ts){
  // 下一幀必須在 finally 排程。任一瞬時 update / draw 例外都不能永久殺死
  // requestAnimationFrame，否則輸入與音效仍在、畫面／倒數／生怪卻會一起凍結。
  try{
    ts=ts||performance.now();
    hooks.diagFrame?.(ts);
    const dt=Math.min(200,lastFrameTs?ts-lastFrameTs:LOGIC_MS); lastFrameTs=ts;
    if(G.running){
      watchPerf(ts);
      const diag=hooks.getDiag?.();
      const measuring=diag?.on?performance.now():0;
      if(!G.paused){
        logicAcc+=dt;
        let steps=0;
        while(logicAcc>=LOGIC_MS && steps<4){
          if(G.hitstop>0) G.hitstop--;
          else hooks.update?.();
          logicAcc-=LOGIC_MS; steps++;
        }
        if(steps===4 && logicAcc>=LOGIC_MS) logicAcc%=LOGIC_MS;
        const afterUpdate=diag?.on?performance.now():0;
        let paint=true;
        const cap=(hooks.getFps?.()||0)|0;
        if(cap>0){ const iv=1000/cap; renderAcc+=dt;
          if(renderAcc>=iv) renderAcc%=iv; else paint=false; }
        if(paint && !hooks.isNoDraw?.()) hooks.draw?.();
        if(diag?.on){
          diag.upd=diag.upd*.9+(afterUpdate-measuring)*.1;
          diag.drw=diag.drw*.9+(performance.now()-afterUpdate)*.1;
        }
      } else if((idleFrame++&3)===0 && !hooks.isNoDraw?.()) hooks.draw?.();
    }
  }catch(error){
    hooks.onLoopError?.(error);
  }finally{
    requestAnimationFrame(gameLoop);
  }
}

function bindClick(id,handler){
  const el=document.getElementById(id);
  if(el) el.onclick=handler;
}

export function bindBootEvents(actions){
  document.addEventListener('pointerdown',e=>{
    const b=e.target.closest&&e.target.closest('.btn');
    if(b) actions.inkSplashAt?.(e.clientX,e.clientY);
  },true);
  for(const [id,handler] of Object.entries(actions.clicks||{})) bindClick(id,handler);
  if(actions.stamp){
    window.addEventListener('beforeunload',actions.stamp);
    document.addEventListener('visibilitychange',()=>{ if(document.hidden) actions.stamp(); });
  }
  if(actions.canvas){
    const {down,move,up,cancel}=actions.canvas;
    const finish=(event,commit)=>{
      (commit?up:cancel)?.(event);
      try{ if(cv.hasPointerCapture?.(event.pointerId)) cv.releasePointerCapture(event.pointerId); }catch(_){}
    };
    cv.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse'&&event.button!==0) return;
      try{ cv.setPointerCapture?.(event.pointerId); }catch(_){}
      down(event);
    },{passive:false});
    cv.addEventListener('pointermove',move,{passive:false});
    cv.addEventListener('pointerup',event=>finish(event,true),{passive:false});
    cv.addEventListener('pointercancel',event=>finish(event,false),{passive:false});
    cv.addEventListener('lostpointercapture',cancel,{passive:false});
    window.addEventListener('blur',cancel);
    document.addEventListener('visibilitychange',()=>{ if(document.hidden) cancel?.(); });
  }
  if(actions.menuGesture){
    const events=['pointerdown','keydown','touchstart'];
    const onGesture=()=>{ if(actions.menuGesture()) events.forEach(ev=>window.removeEventListener(ev,onGesture)); };
    events.forEach(ev=>window.addEventListener(ev,onGesture,{passive:true}));
  }
  window.addEventListener('keydown',e=>actions.keydown?.(e));
  document.addEventListener('contextmenu',e=>{ e.preventDefault(); return false; });
  document.addEventListener('dragstart',e=>e.preventDefault());
  document.addEventListener('selectstart',e=>{ if(!/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) e.preventDefault(); });
}

export function startBoot(){ requestAnimationFrame(gameLoop); }
