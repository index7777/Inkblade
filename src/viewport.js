import { G } from './core.js';

export const cv = document.getElementById('game');
export const ctx = cv.getContext('2d');

export let W=0,H=0,DPR=Math.min(window.devicePixelRatio||1,2);
export let PLAY_TOP=0;

const MASTER_W=640;
const MASTER_H=1138;

function fitMasterStage(){
  const wrap=document.getElementById('wrap');
  if(!wrap) return 1;
  const viewport=window.visualViewport;
  const bodyStyle=getComputedStyle(document.body);
  const safeX=(parseFloat(bodyStyle.paddingLeft)||0)+(parseFloat(bodyStyle.paddingRight)||0);
  const safeY=(parseFloat(bodyStyle.paddingTop)||0)+(parseFloat(bodyStyle.paddingBottom)||0);
  const availableW=Math.max(1,(viewport?.width||window.innerWidth)-safeX);
  const availableH=Math.max(1,(viewport?.height||window.innerHeight)-safeY);
  const scale=Math.min(availableW/MASTER_W,availableH/MASTER_H);
  wrap.style.setProperty('--stage-scale',String(scale));
  return scale;
}

const QUALITY={
  low : { dpr:1,   fx:{bg:true,vig:false,trail:false,ink:false,part:false,glow:false}, ink:0,   part:0   },
  med : { dpr:1.5, fx:{bg:true,vig:true, trail:true,ink:true, part:true, glow:false}, ink:90,  part:120 },
  high: { dpr:2,   fx:{bg:true,vig:true, trail:true,ink:true, part:true, glow:true }, ink:220, part:300 }
};

let hooks={};

export function configureViewport(nextHooks){ hooks=nextHooks||{}; }

export function qual(){
  try{ return QUALITY[hooks.getQuality()] || QUALITY.high; }catch(_){ return QUALITY.high; }
}

export function setDPR(value){ DPR=value; }

export function computePlayTop(){
  if(!cv) return;
  try{
    const cr=cv.getBoundingClientRect();
    const logicalScale=cr.height>0?cv.clientHeight/cr.height:1;
    let bottom=0;
    for(const id of ['barwrap','realmHUD','ctrls','scorewrap']){
      const el=document.getElementById(id); if(!el) continue;
      const st=getComputedStyle(el);
      if(st.display==='none'||st.visibility==='hidden'||+st.opacity===0) continue;
      const r=el.getBoundingClientRect(); if(!r.height) continue;
      bottom=Math.max(bottom, (r.bottom-cr.top)*logicalScale);
    }
    PLAY_TOP = bottom>0 ? bottom+6 : Math.min(H*0.14,90);
  }catch(_){ PLAY_TOP=Math.min(H*0.14,90); }
}

export function applyQuality(){
  const q=qual();
  const fx=hooks.getFX&&hooks.getFX();
  if(fx) Object.assign(fx,q.fx);
  DPR=Math.min(window.devicePixelRatio||1,q.dpr);
  if(cv&&W&&H){
    cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
    if(hooks.invalidateSprite) hooks.invalidateSprite();
  }
  if(hooks.invalidatePaper) hooks.invalidatePaper();
}

export function resize(){
  fitMasterStage();
  W=Math.max(1,cv.clientWidth||MASTER_W);
  H=Math.max(1,cv.clientHeight||MASTER_H);
  DPR=Math.min(window.devicePixelRatio||1,qual().dpr,DPR||2);
  cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
  if(hooks.invalidateSprite) hooks.invalidateSprite();
  if(hooks.isBooted&&hooks.isBooted()&&G.player){ G.player.x=W/2; G.player.y=H/2; }
  computePlayTop();
  if(hooks.alignHud) requestAnimationFrame(hooks.alignHud);
}

export function startViewport(){
  window.addEventListener('resize',resize);
  window.addEventListener('orientationchange',()=>setTimeout(resize,150));
  if(window.visualViewport) window.visualViewport.addEventListener('resize',resize);
  window.addEventListener('load',()=>setTimeout(resize,60));
  resize();
}
