import { truncatePath, segCircleDist } from './geom.js';
import { G, stat } from './core.js';
import { HERO_VISUAL_SCALE, HERO_BODY_SCALE, FAN_PHI, BASE_SPEED, MERGE_SPEED_K, MERGE_WIDTH_K, SOLO_TURN, HOMING_RANGE } from './constants.js';
import { cv, ctx, W, H, DPR, PLAY_TOP, qual, applyQuality, resize, computePlayTop, configureViewport, startViewport, setDPR } from './viewport.js';
import { onScreen, waveDifficulty, spawnEnemy, spawnNetherSpider, eliteSpiderCountForWave, configureEnemy, BOSS_PLAYER_Y_RATIO, spawnXuanmingBoss, beginXuanmingWave, completeXuanmingWave, bossPhase, bossOrbitRadius, bossVisualLift, placeBoss, nextBossManifest, updateBossP1, updateEnemies, killEnemy, spawnSpiderWebShot, updateBossShots, inkCoreDissolve } from './enemy.js';
import { configureCombat, pathLen, leadInLen, bladeLength, inlineGap, inlineTipLead, fanPose, formationOffset, cmdLife, speedMul, durCost, spawnCmdSword, nearestEnemy, extendCommand, spawnAutoCommand, buildStrokePasses, launchCommand, canReturn, launchSword, autoCommandEndpoint, selectAutoTarget, updateCombat } from './combat.js';
import { configureRender, invalidatePaper, drawSplash, drawMistDissolve, swordFxTrail, drawBossShots, enemyVariantFrame, drawSwordSprite, drawInkFlyingSword, swMul, drawJian, drawTassel, heroSet, drawHero, tintFrame, drawEnemies, drawPlayer, draw, ensureSupV, ensureEroV } from './render.js';
import { configureUI, num2cn, setTxt, setW, resetHudCache, renderManaBill, updateHUD, levelChoiceOpen, drawCards, drawStartingFormations, rerollCards, tryLevelUp, resetLevelChoice, isPausedByUser, resetPauseState, togglePause, renderVolumeSettings, bindVolumeSettings, toggleSound, renderSoundButton, bindSettingsSegments, bindPauseTabs, renderMeta as uiRenderMeta, openMeta as uiOpenMeta, closeMeta as uiCloseMeta, resetRespecConfirmation, renderRespec as uiRenderRespec, requestRespec, renderHeroChoices as uiRenderHeroChoices, bindHeroChoices, renderShop as uiRenderShop, openShop as uiOpenShop, closeShop as uiCloseShop, renderTierList as uiRenderTierList, enableDragScroll as uiEnableDragScroll } from './ui.js';
import { configureBoot, resetBootClock, bindBootEvents, startBoot } from './boot.js';
import { AssetRegistry } from './assets/asset-registry.js';
(function(){
'use strict';
let booted=false;
let pendingFormationStart=null;
const ACTOR_POC=new URLSearchParams(location.search).has('actorpoc');
const TRUTH_POC=new URLSearchParams(location.search).get('truthpoc');
const BLADE_POC=new URLSearchParams(location.search).get('bladepoc');
const WAVE_POC=Number(new URLSearchParams(location.search).get('wavepoc'))||0;
let actorPocDiag=null;
const assetRegistry=new AssetRegistry();
assetRegistry.loadActorManifest('assets/actors/enemies/ink_blade/actor.manifest.json')
  .then(()=>{ document.documentElement.dataset.inkBladeRenderer='manifest'; })
  .catch(error=>{ document.documentElement.dataset.inkBladeRenderer='fallback'; console.warn('[Inkblade] ink blade manifest fallback:',error); });
configureViewport({
  getQuality:()=>meta.quality,
  getFX:()=>FX,
  invalidatePaper:()=>invalidatePaper(),
  isBooted:()=>booted,
  alignHud:()=>alignHud()
});
startViewport();
configureUI({
  realmKillTarget:wave=>realmKillTarget(wave),
  realmClockText:()=>realmClockText(),
  realmTimeFrames:wave=>realmTimeFrames(wave),
  bossTestAttackCountdown:boss=>bossTestAttackCountdown(boss),
  getBossHudPlacement:boss=>({
    x:Math.max(W*.29,Math.min(W*.71,boss.bossHudAnchorX??boss.x)),
    y:Math.max(PLAY_TOP+18,Math.min(H*.42,(boss.bossHudAnchorY??boss.y)-64)),
    width:Math.min(330,W*.48)
  }),
  getBossStateLabel:state=>BOSS_STATE_CN[state],
  isDpsOpen:()=>DPS.open,
  renderDps:()=>renderDps(),
  getMeta:()=>meta,
  getRuntime:()=>INK_CONFIG.runtime,
  getRunState:()=>runState,
  resetSwordDrawing:()=>{ drawing=false; path=[]; curLen=0; maxed=false; },
  playPick:()=>SND.pick(),
  playUI:()=>SND.ui(),
  playUIMove:()=>SND.uiMove(),
  syncStat:()=>syncStat(),
  floatText:(...args)=>floatText(...args),
  saveMeta:()=>saveMeta(),
  unlockAudio:()=>SND.unlock(),
  startMusic:()=>SND.startMusic(),
  stopMusic:fade=>SND.stopMusic(fade),
  applyVolume:()=>SND.applyVol(),
  setSoundEnabled:on=>SND.setOn(on),
  applyQuality:()=>applyQuality(),
  resetRenderAccumulator:()=>resetBootClock(),
  renderHeroChoices:()=>uiRenderHeroChoices(),
  renderTierList:()=>uiRenderTierList(),
  resetRespec:()=>resetRespecConfirmation(),
  renderRespec:()=>uiRenderRespec(),
  getRebirthView:()=>INK_CONFIG.runtime.getRebirthView(buildPermanentSave()),
  getRebirthById:()=>INK_CONFIG.rebirthById,
  purchaseRebirth:id=>{ const result=INK_CONFIG.runtime.purchaseRebirth(buildPermanentSave(),id); if(!result.ok) return false; storePermanentSave(result.state); return true; },
  getOfflinePending:()=>offlinePending(),
  getOfflineRate:()=>offlineRate(),
  claimOffline:()=>claimOffline(),
  getRespecInfo:()=>respecInfo(),
  playNoMana:()=>SND.nomana(),
  performRespec:state=>doRespec(state),
  getShopCatalog:()=>({iap:SHOP_IAP,spend:SHOP_SPEND}),
  purchaseShopItem:(type,item)=>{ if(type==='iap'){ meta.gems+=item.gems; if(item.id==='pass') meta.souls+=120; saveMeta(); return true; } if(meta.gems<item.cost) return false; meta.gems-=item.cost; item.grant(); saveMeta(); return true; }
  ,onFormationChosen:()=>{ const resume=pendingFormationStart; pendingFormationStart=null; resume?.(); }
  ,onTruthChosen:()=>refreshTruthButton()
});
configureRender({
  getHeroAssets:()=>({meta,HEROX,HEROF,HEROSPR,HERO,ART}),
  getFX:()=>FX,
  getDrawLevel:()=>DRAWLV,
  getEnemySprites:()=>ENESPR,
  getBossFx:()=>ENESPR.boss.p1.projectiles,
  getAssetRegistry:()=>assetRegistry,
  onActorPocFrame:info=>{ actorPocDiag=info; },
  getDrawState:()=>({drawing,path,curLen,meta,ELEM}),
  allowedLen:()=>allowedLen(),
  getSwordSprite:()=>SWDSPR,
  getBladeSword:()=>BLADE_SWORDS[runState?.activeBlade]||null,
  getFlyingSword:()=>FLYSWORD,
  getElement:element=>ELEM[element]||ELEM.none,
  getTrailFx:()=>TRAILFX,
  getEnemyTone:species=>ENEMY_TONE[species],
  tintFrame:(...args)=>tintFrame(...args)
});
configureCombat({
  floatText:(...args)=>floatText(...args),
  burst:(...args)=>burst(...args),
  playNoMana:()=>SND.nomana(),
  playCast:length=>SND.cast(length),
  dpsAdd:(...args)=>dpsAdd(...args),
  getFX:()=>FX,
  getElementHitColor:element=>(ELEM[element]||ELEM.none).hit,
  mistDissolve:(...args)=>mistDissolve(...args),
  whiteCut:(...args)=>whiteCut(...args),
  splash:(...args)=>splash(...args),
  shake:(...args)=>shake(...args),
  hitstop:frames=>hitstop(frames),
  dmgTo:(...args)=>dmgTo(...args),
  applyIntent:enemy=>applyIntent(enemy),
  pendDamage:(...args)=>pendDamage(...args),
  ink:(...args)=>ink(...args),
  playHit:()=>SND.hit(),
  playBoom:()=>SND.boom(),
  playCrit:()=>SND.crit()
});
configureEnemy({
  floatText:(...args)=>floatText(...args),
  playWave:()=>SND.wave(),
  flash:(...args)=>flash(...args),
  shake:(...args)=>shake(...args),
  ink:(...args)=>ink(...args),
  playHit:()=>SND.hit(),
  playHurt:()=>SND.hurt(),
  mistDissolve:(...args)=>mistDissolve(...args),
  setIntensity:value=>SND.intensity(value),
  stopMusic:seconds=>SND.stopMusic(seconds),
  dmgTo:(...args)=>dmgTo(...args),
  ensureEroV:en=>ensureEroV(en),
  ensureSupV:en=>ensureSupV(en),
  whiteCut:(...args)=>whiteCut(...args),
  splash:(...args)=>splash(...args),
  hitstop:frames=>hitstop(frames),
  playKill:tier=>SND.kill(tier),
  playLevel:()=>SND.level(),
  dpsAdd:(...args)=>dpsAdd(...args),
  getRunState:()=>runState,
  syncStat:()=>syncStat(),
  gainXP:value=>gainXP(value),
  updateHUD:()=>updateHUD(),
  beginDeath:()=>beginDeath(),
  onFormationChosen:()=>{ const resume=pendingFormationStart; pendingFormationStart=null; resume?.(); }
});

/* ---------- 已退役音律 ----------
 * 現行 SND 由 data/sound-system.js 安裝；此段無引用，保留原始碼註記但不再執行或打包。
 * 後續整理 main.js 時可連同註記整段物理刪除。
 *
// 背景樂:assets/audio/bgm/battle01.mp3,雙元素等功率交叉淡入淡出循環。
// 音效:WebAudio 程序化合成(五聲音階撥弦 + 噪音掃頻 + 低頻悶擊),無外部音檔。
const SND_LEGACY=(function(){
  const S={ on:true, music:true };
  let ac=null, master=null, sg=null, rvg=null, noiseBuf=null;

  function makeNoise(sec){
    const b=ac.createBuffer(1,(ac.sampleRate*sec)|0,ac.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    return b;
  }
  function impulse(sec,decay){
    const n=(ac.sampleRate*sec)|0, b=ac.createBuffer(2,n,ac.sampleRate);
    for(let c=0;c<2;c++){ const d=b.getChannelData(c);
      for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay); }
    return b;
  }
  function init(){
    if(ac) return true;
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false;
    try{ ac=new AC(); }catch(e){ return false; }
    master=ac.createGain(); master.gain.value=0.85; master.connect(ac.destination);
    const rv=ac.createConvolver(); rv.buffer=impulse(1.05,2.6);   // 縮短:長卷積在弱機上很貴
    rvg=ac.createGain(); rvg.gain.value=0.30; rv.connect(rvg); rvg.connect(master);
    sg=ac.createGain(); sg.gain.value=0.72; sg.connect(master); sg.connect(rv);
    noiseBuf=makeNoise(2);
    api.applyVol();
    return true;
  }
  function resume(){ if(ac&&ac.state==='suspended') ac.resume(); }
  const now=()=>ac.currentTime;

  // 撥弦(古箏感:基音 + 微失諧泛音 + 極短起音)
  function pluck(f,t,dur,vol,dest){
    const g=ac.createGain(); g.connect(dest||sg);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol,t+0.006);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    const o=ac.createOscillator(); o.type='triangle'; o.frequency.setValueAtTime(f,t);
    o.frequency.exponentialRampToValueAtTime(f*0.997,t+dur);
    const o2=ac.createOscillator(); o2.type='sine'; o2.frequency.setValueAtTime(f*2.008,t);
    const g2=ac.createGain(); g2.gain.setValueAtTime(0.0001,t);
    g2.gain.exponentialRampToValueAtTime(vol*0.4,t+0.004);
    g2.gain.exponentialRampToValueAtTime(0.0001,t+dur*0.45);
    o.connect(g); o2.connect(g2); g2.connect(g);
    o.start(t); o2.start(t); o.stop(t+dur+0.05); o2.stop(t+dur+0.05);
  }
  // 噪音掃頻(劍風、墨爆)
  function noise(t,dur,vol,f0,f1,q,type){
    const src=ac.createBufferSource(); src.buffer=noiseBuf; src.loop=true;
    const bp=ac.createBiquadFilter(); bp.type=type||'bandpass'; bp.Q.value=q||1.2;
    bp.frequency.setValueAtTime(f0,t); bp.frequency.exponentialRampToValueAtTime(Math.max(60,f1),t+dur);
    const g=ac.createGain();
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    src.connect(bp); bp.connect(g); g.connect(sg);
    src.start(t); src.stop(t+dur+0.05);
  }
  // 低頻悶擊(受傷、鐘鳴底)
  function thud(t,dur,vol,f0,f1){
    const o=ac.createOscillator(); o.type='sine';
    o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    const g=ac.createGain();
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(sg); o.start(t); o.stop(t+dur+0.05);
  }

  // 五聲音階:D 羽調 —— 半音位移 0,2,5,7,10(宮商角徵羽)
  const PENT=[0,2,5,7,10];
  const ROOT=146.83; // D3
  function deg(i){ // i 為音階級數(可跨八度,支援負數)
    const o=Math.floor(i/5), s=((i%5)+5)%5;
    return ROOT*Math.pow(2,o+PENT[s]/12);
  }

  // ===== 背景樂:mp3 循環(雙元素等功率交叉淡入淡出,接縫無空隙) =====
  // 不走 WebAudio(MediaElementSource 在 file:// 下會被視為跨來源而靜音),
  // 直接操作 HTMLAudioElement.volume,雙擊開啟本機檔也能正常播放。
  const BGM=(function(){
    let track='assets/audio/bgm/battle01.mp3';
    const XF=2.8;            // 交叉淡入淡出秒數(曲首曲尾各一段)
    let BASE=0.62;           // 背景樂基準音量(由設定的 總音量 × 音樂 決定)
    let els=null, cur=0, gate=0, gateTo=0, gateSpd=1, raf=null, want=false, ok=true;

    function make(){
      const el=new Audio(); el.preload='auto'; el.loop=false; el.volume=0;
      el.addEventListener('error',()=>{ ok=false; },{once:true});   // 找不到音檔就靜靜略過,不影響音效
      el.src=track;
      return el;
    }
    function ensure(){ if(!els) els=[make(),make()]; }
    // 等功率淡變:線性權重會在交叉點掉約 6dB,改用 sin 曲線維持音量感一致
    const shape=w=>Math.sin(Math.max(0,Math.min(1,w))*Math.PI/2);
    function weight(el){
      const d=el.duration;
      if(!d||!isFinite(d)) return 1;
      const t=el.currentTime;
      return Math.min(1, t/XF, (d-t)/XF);
    }
    let last=0;
    function tick(){
      const ts=performance.now();
      const dt=Math.min(0.2,(ts-last)/1000||0.05); last=ts;
      // 總開關的淡入淡出
      if(gate<gateTo) gate=Math.min(gateTo,gate+dt/gateSpd);
      else if(gate>gateTo) gate=Math.max(gateTo,gate-dt/gateSpd);
      if(!els) return;
      for(const el of els){
        if(el.paused) continue;
        const v=Math.max(0,Math.min(1, BASE*gate*shape(weight(el)) ));
        if(Math.abs(v-el.volume)>0.004) el.volume=v;   // 變化太小就不寫,省媒體管線往返
      }
      // 排程接曲:現行曲目剩餘不足 XF 時,另一軌從頭淡入
      const a=els[cur], b=els[1-cur];
      if(!a.paused && a.duration && isFinite(a.duration)){
        if(a.duration-a.currentTime<=XF && b.paused){
          try{ b.currentTime=0; b.volume=0; b.play(); cur=1-cur; }catch(e){}
        }
      }
      // 淡出完畢就真的停住,不留背景解碼
      if(gateTo===0 && gate<=0.001){
        for(const el of els) if(!el.paused) el.pause();
        clearInterval(raf); raf=null;
      }
    }
    function loop(){ if(raf==null){ last=performance.now(); raf=setInterval(tick,50); } }
    return {
      play(fade){
        want=true; ensure(); if(!ok) return;
        gateTo=1; gateSpd=fade||1.8;
        const a=els[cur];
        if(a.paused){ a.volume=0; const pr=a.play(); if(pr&&pr.catch) pr.catch(()=>{}); }
        loop();
      },
      stop(fade){
        want=false; gateTo=0; gateSpd=fade||0.5;
        if(els) loop();
      },
      kill(){ want=false; gate=gateTo=0;
        if(els){ for(const el of els){ try{el.pause();}catch(e){} el.volume=0; } }
        if(raf!=null){ clearInterval(raf); raf=null; } },
      setBase(v){ BASE=v;
        if(els) for(const el of els) if(!el.paused)
          el.volume=Math.max(0,Math.min(1, BASE*gate*shape(weight(el)) )); },
      setTrack(src,fade){
        if(!src||src===track) return;
        const resume=want;
        if(els) for(const el of els){ try{el.pause();}catch(e){} el.volume=0; }
        els=null; cur=0; ok=true; track=src; gate=0; gateTo=0;
        if(resume) this.play(fade||0.9);
      },
      get wanted(){ return want; },
    };
  })();

  function startMusic(){ if(S.music) BGM.play(1.8); }
  function stopMusic(fade){ BGM.stop(fade||0.5); }

  const api={
    get on(){return S.on;},
    setOn(v){ S.on=v;
              if(!v){ BGM.kill(); if(master) master.gain.value=0; }
              else { api.applyVol(); } },
    // 三軌音量:總音量分別乘到音樂與音效上
    applyVol(){
      const V=(meta&&meta.vol)||{master:0.85,music:0.62,sfx:0.75};
      const on=S.on && !(meta&&meta.mute);
      if(master) master.gain.value = on ? V.master*V.sfx*1.15 : 0;
      BGM.setBase(on ? V.master*V.music : 0);
    },
    unlock(){ if(init()) resume(); api.applyVol(); },
    hardMute(v){                       // 診斷用:徹底切斷音訊管線
      if(v){ BGM.kill(); if(ac&&ac.suspend) ac.suspend(); }
      else { if(ac&&ac.resume) ac.resume(); if(S.on&&S.music) BGM.play(0.8); } },
    music(v){ S.music=v; if(v) startMusic(); else stopMusic(); },
    startMusic(){ if(S.on&&S.music){ init(); resume(); startMusic(); } },
    stopMusic(f){ stopMusic(f); },
    duck(){},                       // 保留介面;現行設計為暫停即完全停止
    intensity(wave){
      const src=wave>=60 ? 'assets/audio/bgm/boss01.mp3'
        : wave>=41 ? 'assets/audio/bgm/battle03.mp3'
        : wave>=21 ? 'assets/audio/bgm/battle02.mp3'
        : 'assets/audio/bgm/battle01.mp3';
      BGM.setTrack(src,0.9);
    },

    cast(len){ if(!S.on||!ac)return; const t=now();
      const l=Math.min(1,len/600);
      noise(t,0.16+l*0.14,0.16,900+l*900,260,1.6);
      pluck(deg(9+Math.floor(l*3)),t,0.5,0.075); },
    hit(){ if(!S.on||!ac)return; const t=now();
      noise(t,0.07,0.13,1800,600,2.2); thud(t,0.08,0.10,190,90); },
    crit(){ if(!S.on||!ac)return; const t=now();
      noise(t,0.10,0.16,3200,900,3.0); pluck(deg(14),t,0.6,0.12); pluck(deg(16),t+0.03,0.5,0.09); },
    kill(tier){ if(!S.on||!ac)return; const t=now();
      noise(t,0.22+tier*0.05,0.15,700-tier*180,120,0.9,'lowpass');
      thud(t,0.20+tier*0.08,0.13,150-tier*30,52); },
    boom(){ if(!S.on||!ac)return; const t=now();
      noise(t,0.42,0.22,1400,120,0.8,'lowpass'); thud(t,0.38,0.20,120,38); },
    hurt(){ if(!S.on||!ac)return; const t=now();
      thud(t,0.34,0.26,120,44); noise(t,0.18,0.12,420,110,0.8,'lowpass'); },
    nomana(){ if(!S.on||!ac)return; const t=now();
      pluck(deg(2),t,0.22,0.07); noise(t,0.08,0.05,320,180,1.0); },
    level(){ if(!S.on||!ac)return; const t=now();
      [7,9,11,14].forEach((d,i)=>pluck(deg(d),t+i*0.075,1.6,0.15)); },
    pick(){ if(!S.on||!ac)return; const t=now();
      pluck(deg(12),t,0.9,0.13); pluck(deg(16),t+0.05,0.8,0.09); },
    wave(){ if(!S.on||!ac)return; const t=now();      // 磬鳴
      thud(t,1.6,0.20,138,66); pluck(deg(0),t,2.2,0.14); pluck(deg(2),t+0.02,2.0,0.09);
      noise(t,0.5,0.06,2600,700,1.2); },
    over(){ stopMusic(1.6); if(!S.on||!ac)return; const t=now();
      [11,9,7,4,0].forEach((d,i)=>pluck(deg(d),t+i*0.16,2.0,0.16));
      thud(t+0.1,2.2,0.18,110,40); },
    ui(){ if(!S.on||!ac)return; pluck(deg(11),now(),0.4,0.08); },
  };
  return api;
})(); */

// ---------- 角色美術 ----------
// 原稿是一張白底剪影,已離線切成「身體」與「劍」兩張透明貼圖,
// 讓劍能獨立揮舞;身體則在遊戲中以逐列橫切位移做出衣袂與髮絲的風動。
const ART={ body:new Image(), sword:new Image(), n:0, ok:false };
['body','sword'].forEach(k=>{
  ART[k].onload=()=>{ if(++ART.n===2) ART.ok=true; };
  ART[k].onerror=()=>{ ART.ok=false; };          // 找不到圖就退回原本的靈石畫法
});
ART.body.src='assets/art/hero-body.png';
ART.sword.src='assets/art/mo-jian.png';   // Master Sword 墨劍,唯一武器
// 主角 sprite:待機 9 幀(不同姿態變體,慢速交叉淡入)+ 受擊 4 幀(連續播放一次)。
// 全部在同一張畫布上以「主體中心 x / 腳底 y」對位,切換不會跳。找不到圖 → 回退舊的程序化剪影。
const HEROSPR={ idle:[], hurt:[], cast:[], death:[], ok:false, aspect:0.9917, foot:0.9906, n:0, need:26 };
(function loadHero(){
  const add=(arr,src)=>{ const im=new Image();
    im.onload=()=>{ HEROSPR.aspect=im.naturalWidth/im.naturalHeight;
                    if(++HEROSPR.n>=HEROSPR.need) HEROSPR.ok=true; };
    im.onerror=()=>{ HEROSPR.ok=false; };
    im.src=src; arr.push(im); };
  const pad=i=>String(i).padStart(2,'0');
  for(let i=1;i<=9;i++) add(HEROSPR.idle,'assets/hero/HERO_idle_'+pad(i)+'.png');
  for(let i=1;i<=4;i++) add(HEROSPR.hurt,'assets/hero/HERO_hurt_'+pad(i)+'.png');
  for(let i=1;i<=6;i++) add(HEROSPR.cast,'assets/hero/HERO_cast_'+pad(i)+'.png');
  for(let i=1;i<=7;i++) add(HEROSPR.death,'assets/hero/HERO_death_'+pad(i)+'.png');
})();
// 女修士:單張「無劍身體」+ 獨立配劍,動態全部程序化。
// 原 7 幀 idle 其實身體幾乎一模一樣,只有配劍位置不同 —— 交叉淡入會讓劍在空中瞬移。
// 故離線以「7 幀 alpha 中位數」合成出乾淨的無劍身體(劍在每幀位置不同,中位數自然把它濾掉),
// 配劍則從殘差取出並做主軸正規化(刀身水平、劍尖朝 +X、護手在 grip 比例處)。
// 身體靠逐列風動+呼吸活起來,配劍與墨痕沿橢圓軌道環繞 → 旋渦感。缺圖時自動退回舊的 7 幀。
const HEROF={ idle:[], cast:[], ok:false, proc:false, framesReady:false,
              aspect:304/419, foot:410/419, n:0, need:12,
              body:null, sword:null, swGrip:0.2013, swAspect:5.2 };
(function loadHeroF(){
  const body=new Image();
  body.onload=()=>{ HEROF.body=body; HEROF.aspect=body.naturalWidth/body.naturalHeight;
                    HEROF.proc=true; HEROF.ok=true; };
  body.src='assets/hero-f/HEROF_body.png';
  const sw=new Image();
  sw.onload=()=>{ HEROF.sword=sw; HEROF.swAspect=sw.naturalWidth/sw.naturalHeight; };
  sw.src='assets/hero-f/HEROF_sword.png';
  const add=(arr,kind,i)=>{ const im=new Image();
    im.onload=()=>{ HEROF.aspect=im.naturalWidth/im.naturalHeight;
                    if(++HEROF.n>=HEROF.need) HEROF.framesReady=true; };
    im.src='assets/hero-f/generated/HEROF_GEN_'+kind+'_'+String(i).padStart(2,'0')+'.png';
    arr.push(im); };
  for(let i=1;i<=6;i++) add(HEROF.idle,'idle',i);
  for(let i=1;i<=6;i++) add(HEROF.cast,'cast',i);
})();
// 玄衣女修:先前完成的彩墨全身母版。單幀以同一套呼吸、轉身、受擊染色與死亡淡出接入戰鬥，
// 不再只留在 references 裡當未使用概念圖；後續可在此陣列繼續補專屬動作幀。
const HEROX={ idle:[], hurt:[], cast:[], death:[], ok:false, aspect:.586, foot:.982 };
(function loadHeroX(){
  const im=new Image();
  im.onload=()=>{ HEROX.aspect=im.naturalWidth/im.naturalHeight; HEROX.ok=true; };
  im.onerror=()=>{ HEROX.ok=false; };
  im.src='assets/references/female-cultivator-master-v2.png'; HEROX.idle.push(im);
})();
// 飛劍使用單一水墨母版；所有方向只旋轉同一輪廓，避免多組 sprite 像不同武器。
const FLYSWORD={ image:new Image(), ok:false, aspect:5.2, grip:0.2013 };
FLYSWORD.image.onload=()=>{ FLYSWORD.aspect=FLYSWORD.image.naturalWidth/FLYSWORD.image.naturalHeight; FLYSWORD.ok=true; };
FLYSWORD.image.onerror=()=>{ FLYSWORD.ok=false; };
FLYSWORD.image.src='assets/sword/FLYING_SWORD_MASTER_v2.png';
const BLADE_SWORDS={
  cultivate_breadth:loadBladeSword('assets/sword/blade-types/FLYING_SWORD_WIDE_MASTER.png',.215,1),
  cultivate_temper:loadBladeSword('assets/sword/blade-types/FLYING_SWORD_SHORT_MASTER.png',.39,.76),
  cultivate_edge:loadBladeSword('assets/sword/blade-types/FLYING_SWORD_LONG_MASTER.png',.23,1.22)
};
function loadBladeSword(src,grip,lengthScale){
  const sword={image:new Image(),ok:false,aspect:5,grip,lengthScale};
  sword.image.onload=()=>{ sword.aspect=sword.image.naturalWidth/sword.image.naturalHeight; sword.ok=true; };
  sword.image.onerror=()=>{ sword.ok=false; };
  sword.image.src=src;
  return sword;
}
// CC0 刀光 FX：只取透明輪廓作水墨著色，取代直線軌跡形成的實心三角緞帶。
const TRAILFX={image:new Image(),ok:false,aspect:2.15};
TRAILFX.image.onload=()=>{TRAILFX.aspect=TRAILFX.image.naturalWidth/TRAILFX.image.naturalHeight;TRAILFX.ok=true;};
TRAILFX.image.onerror=()=>{TRAILFX.ok=false;};
TRAILFX.image.src='assets/vendor/opengameart/slash-effect/slash-desaturated.png';
// 墨劍 sprite:待機 8 幀 + 攻擊 6 幀。素材已離線做「主軸正規化」——
// 刀身水平、劍尖朝 +X、護手固定在畫布 grip 比例處,所以引擎只要照 s.ang 旋轉即可。
const SWDSPR={ idle:[], atk:[], ok:false, aspect:2.504, grip:0.22, blade:0.645, n:0, need:14 };
(function loadSword(){
  const add=(arr,src)=>{ const im=new Image();
    im.onload=()=>{ SWDSPR.aspect=im.naturalWidth/im.naturalHeight;
                    // 先解碼:瀏覽器預設把解碼延到「第一次真的畫出來」。
                    // 出鞘用的 atk 六幀平常完全不會畫,所以每次出劍都在那一幀現場解碼一張
                    // 651×260 的 PNG —— 這就是手機「一出劍就頓一下」。
                    if(im.decode) im.decode().catch(()=>{});
                    if(++SWDSPR.n>=SWDSPR.need){ SWDSPR.ok=true; warmSwordTint(); } };
    im.onerror=()=>{ SWDSPR.ok=false; }; im.src=src; arr.push(im); };
  const pad=i=>String(i).padStart(2,'0');
  for(let i=1;i<=8;i++) add(SWDSPR.idle,'assets/sword/SWORD_idle_'+pad(i)+'.png');
  for(let i=1;i<=6;i++) add(SWDSPR.atk,'assets/sword/SWORD_atk_'+pad(i)+'.png');
})();
// 低血量的紅色劍環會用到上色版貼圖。等到掉血當下才烘,那一幀要一次烘八張,
// 剛好落在「受擊」的瞬間 —— 所以趁閒置時先烘好。
function warmSwordTint(){
  const run=()=>{ try{ for(const im of SWDSPR.idle)
    if(im && im.complete && im.naturalWidth) tintFrame(im,'#a2422b'); }catch(_){} };
  if(typeof requestIdleCallback==='function') requestIdleCallback(run,{timeout:3000});
  else setTimeout(run,600);
}
// 敵人/Boss sprite 載入器:偵測到真透明 PNG 就用,否則回退程序化墨團(見敵人繪製)。
// 檔名對應 docs/ch1-asset-library.md;放進對應資料夾即自動生效,無需改碼。
const ENESPR = { inkling:{frames:[],ok:false}, blade:{frames:[],ok:false}, raven:{frames:[],attack:[],ok:false}, fang:{frames:[],attack:[],ok:false}, spider:{frames:[],attack:[],ok:false},
  boss:{frames:[],attack:[],dissolve:[],p1:{manifest:[],skill:[],hurt:[],projectiles:{heavyCore:[],ringWave:[]},ok:false},top:{idle:null,attack:[]},bottom:{idle:null,attack:[]},ok:false} };
(function(){
  const srcs={
    inkling:['assets/enemies/ENE_INKLING_move_01.png','assets/enemies/ENE_INKLING_move_02.png',
             'assets/enemies/ENE_INKLING_move_03.png','assets/enemies/ENE_INKLING_move_04.png'],
    blade:['assets/enemies/ENE_BLADE_walk_01.png','assets/enemies/ENE_BLADE_walk_02.png',
           'assets/enemies/ENE_BLADE_walk_03.png','assets/enemies/ENE_BLADE_walk_04.png',
           'assets/enemies/ENE_BLADE_walk_05.png','assets/enemies/ENE_BLADE_walk_06.png',
           'assets/enemies/ENE_BLADE_walk_07.png','assets/enemies/ENE_BLADE_walk_08.png',
           'assets/enemies/ENE_BLADE_walk_09.png'],
    raven:['assets/enemies/generated/raven/ENE_INK_RAVEN_move_01.png','assets/enemies/generated/raven/ENE_INK_RAVEN_move_02.png',
           'assets/enemies/generated/raven/ENE_INK_RAVEN_move_03.png','assets/enemies/generated/raven/ENE_INK_RAVEN_move_04.png',
           'assets/enemies/generated/raven/ENE_INK_RAVEN_move_05.png','assets/enemies/generated/raven/ENE_INK_RAVEN_move_06.png'],
    fang:['assets/enemies/generated/fang/ENE_INK_FANG_move_01.png','assets/enemies/generated/fang/ENE_INK_FANG_move_02.png',
          'assets/enemies/generated/fang/ENE_INK_FANG_move_03.png','assets/enemies/generated/fang/ENE_INK_FANG_move_04.png',
          'assets/enemies/generated/fang/ENE_INK_FANG_move_05.png','assets/enemies/generated/fang/ENE_INK_FANG_move_06.png'],
    spider:['assets/enemies/elite/ENE_NETHER_SPIDER_walk_01.png','assets/enemies/elite/ENE_NETHER_SPIDER_walk_02.png',
            'assets/enemies/elite/ENE_NETHER_SPIDER_walk_03.png','assets/enemies/elite/ENE_NETHER_SPIDER_walk_04.png',
            'assets/enemies/elite/ENE_NETHER_SPIDER_walk_05.png','assets/enemies/elite/ENE_NETHER_SPIDER_walk_06.png',
            'assets/enemies/elite/ENE_NETHER_SPIDER_walk_07.png','assets/enemies/elite/ENE_NETHER_SPIDER_walk_08.png'],
    // 第一章正式 Boss 母版：玄冥墨蛟。戰鬥動作與攻擊節奏見
    // docs/ch1-boss-xuanming-master.md；缺圖時仍回退程序化墨團。
    boss:['assets/boss/BOSS_XUANMING_idle_01.png']
  };
  for(const k in ENESPR){ const grp=ENESPR[k];
    srcs[k].forEach((s,i)=>{ const img=new Image();
      img.onload=()=>{ grp.frames[i]=img; grp.ok=grp.frames.filter(Boolean).length>0; };
      img.onerror=()=>{}; img.src=s; });
  }
  for(let i=1;i<=6;i++){ const img=new Image();
    img.onload=()=>{ ENESPR.boss.attack[i-1]=img; };
    img.src='assets/boss/BOSS_XUANMING_lunge_'+String(i).padStart(2,'0')+'.png';
    const dis=new Image(); dis.onload=()=>{ ENESPR.boss.dissolve[i-1]=dis; };
    dis.src='assets/boss/BOSS_XUANMING_dissolve_'+String(i).padStart(2,'0')+'.png';
  }
  for(let i=1;i<=6;i++){ const img=new Image();
    img.onload=()=>{ ENESPR.spider.attack[i-1]=img; };
    img.src='assets/enemies/elite/ENE_NETHER_SPIDER_attack_'+String(i).padStart(2,'0')+'.png';
  }
  for(let i=1;i<=4;i++){ const img=new Image();
    img.onload=()=>{ ENESPR.raven.attack[i-1]=img; };
    img.src='assets/enemies/generated/raven/ENE_INK_RAVEN_attack_'+String(i).padStart(2,'0')+'.png';
  }
  for(let i=1;i<=6;i++){ const img=new Image();
    img.onload=()=>{ ENESPR.fang.attack[i-1]=img; };
    img.src='assets/enemies/generated/fang/ENE_INK_FANG_attack_'+String(i).padStart(2,'0')+'.png';
  }
  for(const dir of ['top','bottom']){
    const bounds=dir==='top'
      ? [[158,90,258,330],[122,101,249,338],[121,99,285,315],[112,85,231,343],[141,85,232,325],[103,89,249,339],[141,94,231,316]]
      : [[107,72,297,400],[82,72,347,400],[89,72,334,400],[92,72,327,400],[74,72,364,400],[98,72,315,400],[82,72,347,400]];
    const idle=new Image(); idle.onload=()=>{ ENESPR.boss[dir].idle=idle; };
    idle._inkBounds=bounds[0];
    idle.src=dir==='bottom'?'assets/boss/BOSS_XUANMING_bottom_idle_v2.png'
                           :'assets/boss/BOSS_XUANMING_top_idle_01.png';
    for(let i=1;i<=6;i++){ const img=new Image();
      img.onload=()=>{ ENESPR.boss[dir].attack[i-1]=img; };
      img._inkBounds=bounds[i];
      img.src=dir==='bottom'?'assets/boss/BOSS_XUANMING_bottom_lunge_v2_'+String(i).padStart(2,'0')+'.png'
                            :'assets/boss/BOSS_XUANMING_top_lunge_'+String(i).padStart(2,'0')+'.png';
    }
  }
})();
// 貼圖上的錨點(比例):手握位置、劍柄位置
// gripX 取在護手位置,劍身自此往 +x 延伸
const HERO={ handX:0.9652, handY:0.5097, gripX:0.279, gripY:0.50,
             aspect:417/620, swAspect:45/520 };

// ---------- 遊戲狀態 ----------
booted=true;

// 詞條(可堆疊)

// ---------- 轉世 · 永久進度(存本機) ----------
// 轉世閣資料改由共用設定檔提供(data/game-config.js)
// (legacy metaUp/metaUnlock 已不再使用:轉世閣改走 runtime 的 getRebirthView/purchaseRebirth)
let meta = { souls:0, best:{kills:0,wave:1,level:1}, up:{}, unlock:{},
             lastSeen:Date.now(), gems:0, offCap:8, skin:'none', mute:false, inkPills:0,
             vol:{ master:0.85, music:0.62, sfx:0.75 } };
window.getInkAudioSettings=()=>meta.vol;
function loadMeta(){
  try{ const s=localStorage.getItem('inkjian_meta'); if(s){ meta=Object.assign(meta,JSON.parse(s)); } }catch(e){}
  meta.up=meta.up||{}; meta.unlock=meta.unlock||{}; meta.best=meta.best||{kills:0,wave:1,level:1};
  meta.gems=meta.gems||0; meta.offCap=meta.offCap||8; meta.skin=meta.skin||'none';
  meta.mute=!!meta.mute; meta.heroSkin = ['m','f','x'].includes(meta.heroSkin)?meta.heroSkin:'f';   // 預設女修
  if(!['n','s','m','l'].includes(meta.shake)) meta.shake='m';            // 震動強度,預設中
  if(!['low','med','high'].includes(meta.quality)) meta.quality='high'; // 畫質,預設高
  if(![30,60,120,0].includes(meta.fps)) meta.fps=60;                    // 幀數上限,0=不限
  if(!['text','effect'].includes(meta.cardText)) meta.cardText='text';  // 劍訣註解:文字/效果
  // 戰鬥模式:wait=三選一時世界靜止(預設)、live=選卡時墨獸照打
  if(!['wait','live'].includes(meta.battleMode)) meta.battleMode='wait';
  meta.vol=Object.assign({master:0.85,music:0.62,sfx:0.75}, meta.vol||{});
  for(const k of ['master','music','sfx'])
    meta.vol[k]=Math.max(0,Math.min(1, isFinite(meta.vol[k])?meta.vol[k]:0.7));
  migrateMetaToRuntime();
}
function saveMeta(){ try{ localStorage.setItem('inkjian_meta',JSON.stringify(meta)); }catch(e){} }
loadMeta();
SND.setOn(!meta.mute);
// 離開時記錄時間,供閉關(離線)收益計算
function stamp(){ meta.lastSeen=Date.now(); saveMeta(); }

// 閉關修煉:離線依歷史最佳波次被動生墨魂(封頂 meta.offCap 小時)
function offlineRate(){ return 5 + meta.best.wave*2; }         // 每小時墨魂
function offlinePending(){
  const hrs=Math.min(meta.offCap, Math.max(0,(Date.now()-(meta.lastSeen||Date.now()))/3600000));
  return Math.floor(hrs*offlineRate());
}
function claimOffline(){ const g=offlinePending(); if(g>0){ meta.souls+=g; } meta.lastSeen=Date.now(); saveMeta(); return g; }

// 課金點(示範,不實際扣款) —— 靈石為硬通貨
const SHOP_IAP=[
  {id:'g100', name:'靈石 ×100',  price:'NT$ 60',  gems:100},
  {id:'g600', name:'靈石 ×600',  price:'NT$ 330', gems:600, tag:'超值'},
  {id:'pass', name:'修行月卡',    price:'NT$ 170', gems:300, note:'每日登入贈墨魂(示範:此處直接給等值靈石)'},
];
const SHOP_SPEND=[
  {id:'souls', name:'墨魂補給 ×200', desc:'靈石兌換墨魂,加速轉世修為', cost:50, repeat:true, grant:()=>{ meta.souls+=200; }},
  {id:'offcap',name:'閉關上限 +4 時', desc:'離線收益封頂提高(現 '+'', cost:80, grant:()=>{ meta.offCap+=4; }, capField:true},
  {id:'skin',  name:'外觀 · 墨金劍痕', desc:'預設墨痕染金芒(純外觀,不影響數值)', cost:120, once:true, grant:()=>{ meta.skin='gold'; }},
  {id:'pill',  name:'洗墨丹 ×1', desc:'重塑劍意時抵免墨魂耗費(局內暫停可用)', cost:40, repeat:true, pillField:true, grant:()=>{ meta.inkPills=(meta.inkPills||0)+1; }},
];

// ---------- 玩家(中央靈石) ----------
function Player(){
  // 神識上限改由 config 決定(轉世閣「識海初開」可加)。start() 已先跑 syncStat,故 stat.hpMax 必有值。
  const hp = (stat && stat.hpMax) || 100;   // 已含道行成長(syncStat 算好)
  this.x=W/2; this.y=H/2; this.r=26; this.hp=hp; this.max=hp; this.pulse=0;
}

// ---------- 敵人 ----------
function beginBossWave(){
  return beginXuanmingWave();
}

const BOSS_STATE_CN={telegraph:'墨氣湧動',manifest:'墨形凝聚',orbit:'伏環蓄勢',guard:'盤鱗架劍',lunge:'近環吐核',evade:'游墨換位',dissolve:'墨散如煙',phase:'墨相蛻變',stagger:'破甲失衡'};
function bossTestAttackCountdown(en){
  if(!en) return 0;
  const left={
    telegraph:Math.max(0,34-en.bossT)+28+54+40,
    manifest:Math.max(0,28-en.bossT)+54+40,
    orbit:Math.max(0,54-en.bossT)+40,
    lunge:Math.max(0,40-en.bossT),
    dissolve:Math.max(0,46-en.bossT)+34+28+54+40,
    phase:Math.max(0,90-en.bossT)+34+28+54+40
  }[en.bossState]||0;
  return Math.max(0,left/60);
}
/* Stage 2b: projectile logic moved to enemy.js.
function legacySpawnBossAttack(en){
  if(en.attackKind==='ring'){ spawnBossRing(en); return; }
  const P=G.player,mouth=[{x:0,y:.52},{x:-.52,y:-.08},{x:0,y:-.52},{x:.52,y:-.08}][en.bossSide];
  const ox=en.x+mouth.x*en.r,oy=en.y+mouth.y*en.r+bossVisualLift(en.bossSide);
  const dx=P.x-ox,dy=P.y-oy,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;
  // 中央重核 + 兩翼快核；三條軌道都能用飛劍逐一斬掉。
  for(const lane of [-34,0,34]){
    const x=ox+nx*lane,y=oy+ny*lane,tx=P.x+nx*lane*.22,ty=P.y+ny*lane*.22;
    const vx=tx-x,vy=ty-y,L=Math.hypot(vx,vy)||1,heavy=lane===0;
    G.bossShots.push({x,y,px:x,py:y,vx:vx/L*(heavy?1.12:1.38),vy:vy/L*(heavy?1.12:1.38),
      r:heavy?15:11,hp:heavy?2:1,max:heavy?2:1,dmg:heavy?18:11,age:0,seed:Math.random()*100});
  }
}
function legacySpawnBossRing(en){
  const P=G.player,N=(en.hp/en.max<=.4)?14:11,R=Math.max(170,Math.min(W,H)*.4);
  // 留兩枚寬的缺口，其他墨滴由四周向中心合攏；飛劍可直接削掉墨浪。
  const gap=en.bossSide/N*Math.PI*2;
  for(let i=0;i<N;i++){
    const a=i/N*Math.PI*2;
    let da=a-gap; while(da>Math.PI)da-=Math.PI*2; while(da<-Math.PI)da+=Math.PI*2;
    if(Math.abs(da)<Math.PI/N*1.3) continue;
    const x=P.x+Math.cos(a)*R,y=P.y+Math.sin(a)*R,spd=(en.hp/en.max<=.4)?1.18:1.02;
    G.bossShots.push({x,y,px:x,py:y,vx:-Math.cos(a)*spd,vy:-Math.sin(a)*spd,
      r:10,hp:1,max:1,dmg:9,age:0,seed:Math.random()*100});
  }
}
function legacySpawnSpiderWebShot(en){
  const P=G.player, dir=en.facing||1;
  const ox=en.x+dir*en.r*.62,oy=en.y-en.r*.18;
  const dx=P.x-ox,dy=P.y-oy,L=Math.hypot(dx,dy)||1,spd=2.05;
  G.bossShots.push({x:ox,y:oy,px:ox,py:oy,vx:dx/L*spd,vy:dy/L*spd,
    r:13,hp:1,max:1,dmg:0,web:true,age:0,seed:Math.random()*100});
}
function legacyUpdateBossShots(){
  const P=G.player;
  for(let i=G.bossShots.length-1;i>=0;i--){
    const q=G.bossShots[i]; q.age++; q.px=q.x; q.py=q.y; q.x+=q.vx; q.y+=q.vy;
    if(Math.hypot(q.x-P.x,q.y-P.y)<q.r+P.r){
      if(q.web){
        G.webT=Math.max(G.webT,105);
        floatText(P.x,P.y-P.r-24,'蛛網封脈','#397b62');
        for(let n=0;n<8;n++){ const a=n*.785; ink(P.x+Math.cos(a)*54,P.y+Math.sin(a)*54,0,0,4); }
        SND.hit(); shake(4); flash(.1,'190,225,205');
      } else {
        if(!G.hpLocked) P.hp=Math.max(0,P.hp-(q.dmg||18)); else P.hp=P.max;
        P.pulse=1; G.hurtT=20; SND.hurt(); shake(8); flash(.18,'176,64,48');
      }
      inkCoreDissolve(q,Math.atan2(q.vy,q.vx)); G.bossShots.splice(i,1); updateHUD();
      if(P.hp<=0){ beginDeath(); return; }
    } else if(q.age>360) G.bossShots.splice(i,1);
  }
}
function legacyInkCoreDissolve(q,ang){
  for(let k=0;k<6;k++){
    const side=(k-2.5)*3.5,a=ang+(k%2?1:-1)*(.12+.08*k);
    G.mists.push({x:q.x-Math.sin(ang)*side,y:q.y+Math.cos(ang)*side,
      vx:Math.cos(a)*(.25+.12*k),vy:Math.sin(a)*(.25+.12*k)-.08,
      r:9+Math.random()*9,age:0,dur:18+((Math.random()*9)|0),color:'39,35,31',
      squash:.16+Math.random()*.14,rot:a});
  }
}

// ---------- 劍 ----------
*/
// 定鋒:串珠飛劍插地成「劍樁」——靜止駐留、對周圍小半徑敵持續斬割
// 定鋒·圓滿 anchorDetonate:劍樁引爆 —— 中等半徑水墨爆擊(傷害基於原飛劍屬性),觸發墨痕。
// 只做效果,不從 G.anchors 移除(由呼叫端負責 splice,避免雙重刪除)。
// 在劍令的某個槽位生出一把劍(接力也走這裡)

// ---------- 粒子 / 墨 ----------
function ink(x,y,vx,vy,r){ const cap=qual().ink; if(cap<=0) return;
  if(G.inks.length>=cap) G.inks.shift();
  G.inks.push({x,y,vx,vy,r,a:0.5,life:1}); }
function burst(x,y,c,n){ const cap=qual().part; if(cap<=0) return;
  for(let i=0;i<n;i++){const a=Math.random()*6.28,s=1+Math.random()*4;
    if(G.particles.length>=cap) G.particles.shift();
    G.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,c});}}
// 潑墨(Ink Engine Splash primitive 內嵌版):不規則墨團 + 徑向墨刺 + 飛濺墨滴。取代圓形爆裂粒子。
function splash(x,y,c,power){
  power=power||1;
  const spikes=[], nSp=5+((Math.random()*6)|0);
  for(let i=0;i<nSp;i++) spikes.push({ang:Math.random()*6.283, len:0.8+Math.random()*1.0, w:0.05+Math.random()*0.11, broken:Math.random()<0.4});
  const corners=[], nC=12+((Math.random()*10)|0);
  for(let i=0;i<nC;i++) corners.push(0.6+Math.random()*0.55);
  G.splashes.push({x,y,r:16+power*10, dur:28, age:0, c, spikes, corners, rot:Math.random()*6.283});
  if(G.splashes.length>16) G.splashes.shift();     // 溢位丟最舊
  burst(x,y,c, 4+((power*3)|0));                    // 墨滴飛濺沿用粒子系統
}
// 墨獸死亡只化為短暫霧團，不潑墨、不落地、不改變畫卷污染層。
function mistDissolve(x,y,power,color){
  power=power||1; color=color||'48,45,41';
  const n=4+Math.min(4,Math.round(power*2));
  for(let i=0;i<n;i++) G.mists.push({
    x:x+(Math.random()-.5)*18*power, y:y+(Math.random()-.5)*22*power,
    vx:(Math.random()-.5)*.42, vy:-.18-Math.random()*.42,
    r:(12+Math.random()*18)*power, age:0, dur:30+((Math.random()*18)|0),
    color, squash:.62+Math.random()*.42
  });
  if(G.mists.length>48) G.mists.splice(0,G.mists.length-48);
}
// 同幀同目標的傷害累加,於 update() 結尾一次跳字
const dmgAcc=new Map();
function pendDamage(en, dmg, crit){
  const e=dmgAcc.get(en);
  if(e){ e.sum+=dmg; e.crit=e.crit||crit; }
  else dmgAcc.set(en,{sum:dmg, crit:!!crit, x:en.x, y:en.y-en.r-10});
}
function flushDamage(){
  if(!dmgAcc.size) return;
  for(const [en,e] of dmgAcc)
    floatText(e.x, e.y, '-'+Math.round(e.sum), e.crit?'#9f3028':'#fffaf0', e.crit);
  dmgAcc.clear();
}
function floatText(x,y,txt,c,critFlag){
  const raw=String(txt);
  const damage=/^-?\d/.test(raw) || /^-\d/.test(raw) || /^[-]?\d+!?$/.test(raw);
  const crit=damage && (critFlag===true || raw.includes('!'));
  // 傷害數值改中文:抓出數字部分翻譯,保留負號與暴擊的「!」
  let show=raw;
  if(damage){
    const m=raw.match(/^(-?)(\d+)(!?)$/);
    if(m) show = num2cn(+m[2]) + (m[3]||'');   // 參考稿的傷害只寫「廿四」,不帶負號(紅字本身就是扣血)
  }
  G.texts.push({x,y,txt:show,c,life:1,age:0,vy:damage?-1.45:-0.75,
    dx:damage?(Math.random()-.5)*0.32:0,damage,crit});
}
// 毛筆劍氣拖尾(Ink Engine 筆劃 primitive 的內嵌版):帶錐度毛邊的填充墨緞帶 + 濃芯 + 飛白
// 飛劍專用 FX：把 CC0 弧形刀光壓成沿軌跡的短促乾筆，不再用封閉多邊形填滿整條尾巴。
// 黑墨、飛白回程都共用這個幾何，只改著色與透明度，因此兩者都不會再變成實心三角。
// 畫面震動 / 頓幀 / 閃光 —— 打擊感三件套
// 震動強度可在靜觀調整:無 / 小 / 中 / 大。大震動會讓戰場很亂,交給玩家自己決定。
const SHAKE_MUL={ n:0, s:0.45, m:1, l:1.7 };
function shakeMul(){ return SHAKE_MUL[meta.shake] != null ? SHAKE_MUL[meta.shake] : 1; }
function shake(v){ const k=shakeMul(); if(k<=0){ G.shake=0; return; } G.shake=Math.min(22,G.shake+v*k); }
function hitstop(f){ G.hitstop=Math.max(G.hitstop,f); }
function flash(a,c){ G.flash=Math.max(G.flash,a); G.flashC=c||'255,255,255'; }
// 宣紙墨漬:斬妖留痕,用預烘貼圖繪製,可保留緩緩滲淡
function stain(x,y,r,c){
  if(!blots) buildBlots();
  if(G.stains.length>70) G.stains.shift();
  G.stains.push({x,y,r:r*1.6,rot:Math.random()*6.283,
                 im:blots[(Math.random()*blots.length)|0], a:0.20});
}

// ---------- 詞條池 ----------
// 詞條池與稀有度改由共用設定檔提供(data/game-config.js)
const RARW = window.INK_CONFIG.rarity.weight;
const RARNAME = window.INK_CONFIG.rarity.name;
// (legacy applyAffix 已移除:升級選卡自 Slice 1 起改走 runtime.applyInsight)
// ===== Runtime 遷移橋接(Slice 1)=====
let runState = null;
// 遊戲永久存檔 meta → runtime permanentSave
function buildPermanentSave(){
  const unlocks = meta.unlock ? Object.keys(meta.unlock).filter(k=>meta.unlock[k]) : [];
  return INK_CONFIG.runtime.migratePermanentSave({
    insight: meta.souls||0, ranks: Object.assign({}, meta.up||{}), permanentUnlocks: unlocks });
}
// runtime permanentSave → 遊戲存檔(purchaseRebirth 回傳的新狀態寫回 meta)
function storePermanentSave(p){
  meta.souls = Math.max(0, Math.round(p.insight||0));
  meta.up = Object.assign({}, p.ranks||{});
  meta.unlock = {};
  (p.permanentUnlocks||[]).forEach(id=>{ meta.unlock[id]=true; });
  saveMeta();
}
// 舊存檔遷移:心法/傳承原本存成 meta.unlock 布林,改記於 meta.up 階數;
// meta.unlock 之後只保存 runtime 的 permanentUnlocks(由已購節點的 unlock 效果推導)。
function migrateMetaToRuntime(){
  const RB = INK_CONFIG.rebirthById;
  const up = meta.up || {}, un = meta.unlock || {};
  Object.keys(un).forEach(id=>{ if(un[id] && RB[id] && !up[id]) up[id]=1; });
  const derived = {};
  Object.keys(up).forEach(id=>{
    const node = RB[id]; if(!node || !up[id]) return;
    node.effects.forEach(e=>{ if(e.op==='unlock' && e.path==='permanentUnlocks') derived[e.value]=true; });
  });
  meta.up = up; meta.unlock = derived;
  if(typeof meta.inkPills !== 'number') meta.inkPills = 0;
}
// 把 runState 數值映射回遊戲沿用的 stat.*(其餘遊戲程式碼不必改動)
function syncStat(){
  if(!runState) return;
  const s=runState.stats, m=runState.mechanics;
  stat.count=s.swordCount; stat.damage=s.damage; stat.size=s.swordWidth; stat.speed=s.swordSpeed;
  stat.crit=s.critChance; stat.critMul=s.critMultiplier;
  stat.homing=m.homingStrength; stat.homingCanCrit=(m.homingCanCrit!==false);
  stat.explode=m.splashRadius; stat.splashDamage=m.splashDamage;
  stat.ret=m.returnEnabled?1:0; stat.returnHits=m.returnHits;
  stat.slowBonus=m.slowBonus||0;   // 鎮痕·小成:額外緩速幅度
  stat.anchorDur=m.anchorDuration||0;      // 定鋒:劍樁存活時長加成(+0.25/rank)
  stat.anchorDmgMul=m.anchorDamageMult||0; // 定鋒:劍樁持續傷倍率加成(+0.08/rank)
  // 道行成長:每重額外加成(config.growth)。加在 syncStat 的最後,不寫回 runState —— 
  // 寫回去的話每次 syncStat 都會再疊一次。
  const GW=INK_CONFIG.growth||{hpPerLevel:0,manaPerLevel:0}, lvUp=Math.max(0,(G.level||1)-1);
  stat.hpMax=s.hpMax + lvUp*GW.hpPerLevel;
  stat.cap=s.swordCap; stat.manaMax=s.manaMax + lvUp*GW.manaPerLevel; stat.manaRegen=s.manaRegen; stat.regen=s.manaOnKill;
  // 道行成長:劍意上限、劍傷、護甲。護甲降低每次命中的耐久消耗(見 durCost)。
  stat.damage = s.damage + lvUp*(GW.damagePerLevel||0);
  stat.armor  = (s.swordArmor||0) + lvUp*(GW.armorPerLevel||0);
  // 劍寬的第二層意義:寬則厚重(護甲高、飛得慢),細則輕快(護甲低、飛得快)。
  // 這兩項**都不掛勾傷害** —— 所以 stat.speed(會轉成傷害的那個)不動,
  // 只調 stat.flySpeed(實際飛行用)。
  const WM=INK_CONFIG.widthModel||{baseWidth:18,armorPerWidth:0,speedPerWidth:0,minFlySpeed:5};
  const dW=(s.swordWidth||WM.baseWidth)-WM.baseWidth;
  stat.armor   += dW>0 ? dW*WM.armorPerWidth : dW*(WM.armorPerWidthThin!=null?WM.armorPerWidthThin:WM.armorPerWidth);
  stat.flySpeed = Math.max(WM.minFlySpeed, stat.speed - dW*WM.speedPerWidth);
  stat.formation = (runState.formation && runState.formation!=='single') ? runState.formation : 'fan';
  // 遊戲專屬、config 未涵蓋的欄位
  stat.element='none'; stat.ember=0; stat.ice=0;
  stat.costBase=s.manaCostBase; stat.costPerPx=s.manaCostPerPixel;   // 耗魔常數改由 config 提供
  // ===== Slice 2:劍意狀態 + 心法 flags(由 getCombatSnapshot 聚合)=====
  const snap = INK_CONFIG.runtime.getCombatSnapshot(runState);
  stat.statuses      = runState.statuses || {};             // erosion 蝕 / suppression 鎮
  stat.statusScale   = snap.statusTimeScale || 1;           // 狀態持續時間倍率
  stat.firstStrike   = !!snap.crit.firstStrikeGuaranteed;   // 明心一斬:每局首劍必暴
  stat.criticalEcho  = !!snap.crit.criticalEcho;            // 飛白千峰:暴擊生殘鋒
  stat.whiteCut      = !!snap.crit.whiteCutOnCrit;          // 斷意/飛白:暴擊留白
  stat.splashOnKill  = !!snap.globalFlags.splashOnKill;     // 破墨心訣/墨海無涯
  stat.returnDry     = !!snap.returnBlade.leaveDryBrush;    // 歸念/歸藏無痕:折返飛白
  stat.returnDmgMul  = snap.returnBlade.damageMultiplier||1;
  // 每像素劍意成本取「實際值」—— 已含劍寬與劍數係數(劍大劍多就貴,見 config COST_MODEL)
  stat.costPerPx     = snap.mana.costPerPixelEffective || s.manaCostPerPixel;
  // ===== 小成/大成/圓滿:新增的 mechanics 與行為旗標 =====
  stat.hitPadding  = m.hitPadding||0;      // 展鋒·大成:命中判定加寬
  stat.manaRefund  = m.manaRefund||0;      // 納息·大成:御劍返還比例
  stat.splashChain = m.splashChain||0;     // 破墨·圓滿:潑墨連鎖層數
  stat.tierFlags   = runState.flags||{};   // 其餘行為旗標,由各玩法位置自行判讀
  stat.beadSlow    = !!(runState.flags||{}).beadSlow;   // 定鋒:串珠鏈內飛劍移速 ×0.92
}
// 命中時把劍意狀態掛到墨獸身上(每次命中疊「該劍意階數」層,封頂 maxStacks,並刷新時間)
function applyIntent(en){
  const defs = stat.statuses; if(!defs) return;
  if(!en.st) en.st={};
  for(const key in defs){
    const cfg = defs[key]; if(!cfg) continue;
    const rank = cfg.rank || 1;
    const maxS = cfg.maxStacks || 6;
    const cur  = en.st[key] || (en.st[key]={stk:0,t:0,acc:0});
    const before = cur.stk;
    cur.stk = Math.min(maxS, cur.stk + (cfg.stacks||1) * rank);
    // 蝕痕·小成「可被重新刷新」:沒有這個階級時,已在身上的蝕痕不會因為再命中而續期,
    // 只會疊層數;有了才會把時間推回滿。
    const full = Math.round((cfg.duration||3) * 60 * (stat.statusScale||1));
    const TFa = stat.tierFlags||{};
    if(key!=='erosion' || TFa.dotRefresh || cur.t<=0) cur.t = full;
    else cur.t = Math.max(cur.t, Math.round(full*0.35));
    if(key==='suppression'){
      // 鎮痕·大成「額外定身三分之一息」:滿層時把墨獸釘住 20 影格。
      if((stat.tierFlags||{}).rootOnSuppress && cur.stk>=maxS && !(en.rootT>0)){
        en.rootT=20; en.rootWC=!!(stat.tierFlags||{}).rootWhiteCut;
      }
      const V = ensureSupV(en);
      V.press = 14;                              // 觸發:腳下重按一橫,再碎成兩側斷墨
      V.maxS  = maxS;
      if(before < maxS && cur.stk >= maxS) V.sink = 18;   // 滿層:瞬間「沉」一下
    }
  }
}
// ══ 鎮痕的視覺狀態 ══════════════════════════════════════════════
// 語意是「鎮、沉、滯」——敵人周圍的墨被壓住,不是把敵人圈起來。
// 所以:永不成完整圓、不旋轉、不發光;只做「向內收束 → 停住 → 淡掉 → 再生一筆」。
// 依 seed 生出 2~4 段弧(起始角、弧長),總覆蓋約 35~55% 圓周
// 一筆乾筆弧:不用 ctx.arc(完美圓弧沒有筆意),逐點取樣並加抖動與飛白缺口
// ══ 蝕痕的視覺狀態 ══════════════════════════════════════════════
// 語意是「墨正在侵蝕敵人」——由內向外腐蝕,不是外面套一個圈。
// 與鎮痕(由外向內壓)剛好相反,兩者的視覺語言不該混。
// 禁止:完整圓環、虛線、規則旋轉。
// 墨裂:從命中點朝外爬的折線,像濕墨沿紙纖維滲開(不是直線,也不是圓弧)
// 留白(飛白斷鋒):暴擊時沿劍身方向刮出一道白痕
function whiteCut(x,y,ang){
  G.cuts.push({x,y,ang,life:1,len:26+Math.random()*22});
}
// (legacy affixWeight 已移除:稀有度權重與傳承加權由 runtime.rollInsights 處理)
// 劍訣註解「效果」模式:產生器在 data/game-config.js(與 validateConfig 的版面檢查同源),
// 主檔只負責排版。行數/行寬超標會在 config 載入時就被 validateConfig 擋下。
// 劍意帳:耗劍意本來完全是暗的 —— 25 道劍訣裡有 11 道會動到每寸成本
// (劍寬、劍數、costMultiplier 都在乘),玩家只會覺得「劍怎麼突然畫不長了」。
// 這裡把當下的實際數字攤開;數字一律取 stat.*(已經是 getCombatSnapshot 算完的實際值),
// 不自己照公式手推,否則畫面會跟引擎慢慢對不上。
// 三選一期間要不要凍結世界。選卡時 down() 本來就擋住畫劍令,
// 所以「即時」等於單方面挨打;預設給「等待」,想要壓力的人自己切回去。
// 每選一張消耗一次待選；戰鬥中新得到的升級會留在佇列，直到全部選完。
// 統一入口:有待選且沒被玩家暫停時才開啟

// ---------- 升級 ----------
function gainXP(n){
  G.xp+=n;
  let gained=0;
  while(G.xp>=G.xpNeed){
    G.xp-=G.xpNeed; G.level++; G.xpNeed=Math.round(G.xpNeed*1.16+4);
    // 原本 ×1.35 是指數,實測第 40 境只到道行 13 重(= 只選過 13 張卡),
    // 完全跟不上敵人 8.4 倍的總血量成長,滿階的悟道也幾乎抽不到。
    G.pendingLevels++; gained++;
  }
  if(gained){
    // 上限提高的同時補回等量 —— 升級要有立即的回饋,不能只是數字變大
    const GW=INK_CONFIG.growth||{hpPerLevel:0,manaPerLevel:0};
    syncStat();
    if(G.player){ G.player.max=stat.hpMax; G.player.hp=Math.min(stat.hpMax, G.player.hp+gained*GW.hpPerLevel); }
    G.mana=Math.min(stat.manaMax, G.mana+gained*GW.manaPerLevel);
    updateHUD();
    SND.level(); flash(0.20,'246,240,214');
    for(let k=0;k<14;k++){ const a=Math.random()*6.283;
      ink(G.player.x,G.player.y,Math.cos(a)*3.4,Math.sin(a)*3.4,10+Math.random()*12); }
    tryLevelUp();
  }
  updateHUD();
}

// ---------- 輸入:畫線 ----------
let drawing=false, path=[], curLen=0, maxed=false;
function pos(e){
  const r=cv.getBoundingClientRect();
  const p=e.touches?e.touches[0]:e;
  return {
    x:(p.clientX-r.left)*(cv.clientWidth/Math.max(1,r.width)),
    y:(p.clientY-r.top)*(cv.clientHeight/Math.max(1,r.height))
  };
}
// 目前劍意還能畫多長的墨痕
function allowedLen(){
  let b=Math.max(0, G.mana-stat.costBase);
  // 劍匣存量:劍意見底但匣裡還有劍時,可畫長度等於「一管滿劍意」——
  // 畫線時的金色截斷線必須跟收筆時的實際計價同一套,否則玩家會被騙。
  if(b<=0 && G.reserve>0) b=Math.max(0, stat.manaMax-stat.costBase);
  return b/stat.costPerPx;
}
function down(e){ if(!G.running||G.paused||levelChoiceOpen())return; e.preventDefault(); drawing=true; path=[pos(e)]; curLen=0; maxed=false; }
function move(e){ if(!drawing)return; e.preventDefault(); const p=pos(e);
  const last=path[path.length-1]; const seg=Math.hypot(p.x-last.x,p.y-last.y);
  if(seg>4){
    // 劍令:畫多長都行,不再凍結筆跡。超出可負擔長度的那一段改用金色提示,
    // 收筆時會被截掉 —— 玩家看得見「哪裡會斷」,而不是筆突然畫不動。
    path.push(p); curLen+=seg;
    maxed = leadInLen(path)+curLen > allowedLen();
  }
}
function up(e){ if(!drawing)return; e.preventDefault(); drawing=false; launchCommand(path); path=[]; curLen=0; maxed=false; }
function cancelDraw(e){
  if(!drawing) return;
  if(e?.cancelable) e.preventDefault();
  drawing=false; path=[]; curLen=0; maxed=false;
}

// ---------- 更新 ----------
// ---------- 戰況遙測(DPS) ----------
// 全部用「實際發生的事」累計,不做任何公式推導 ——
// 傷害走 dmgTo()、劍意走 launchCommand 的扣款、斬妖走 killEnemy,
// 三者都是遊戲真的執行到的那一行,所以面板不可能跟引擎對不上。
const DPS={ win:10, f:0, cur:{d:0,m:0,k:0}, buckets:[], totD:0, totM:0, totK:0, secs:0, open:false };
function dpsReset(){ DPS.f=0; DPS.cur={d:0,m:0,k:0}; DPS.buckets.length=0;
  DPS.totD=0; DPS.totM=0; DPS.totK=0; DPS.secs=0; }
function dpsAdd(k,v){ if(!(v>0)) return; DPS.cur[k]+=v;
  if(k==='d') DPS.totD+=v; else if(k==='m') DPS.totM+=v; else DPS.totK+=v; }
// 每 60 個邏輯影格(= 1 秒,loop 的邏輯是固定 60Hz)收一格
function dpsTick(){
  if(++DPS.f<60) return;
  DPS.f=0; DPS.secs++;
  DPS.buckets.push(DPS.cur); DPS.cur={d:0,m:0,k:0};
  if(DPS.buckets.length>DPS.win) DPS.buckets.shift();
}
function dpsRate(k){
  const n=DPS.buckets.length;
  if(!n) return null;                                   // 不滿一秒:近況還沒有意義
  let sum=0; for(const b of DPS.buckets) sum+=b[k];
  return sum/n;
}
function dpsAvg(k){ return DPS.secs>0 ? (k==='d'?DPS.totD:k==='m'?DPS.totM:DPS.totK)/DPS.secs : 0; }
// 統一的扣血入口 —— 原本 7 個地方各自 en.hp-=,遙測抓不到
function dmgTo(en, v){
  if(v>0){
    // 斷痕·白痕:目標易傷 → 受到的傷害提高(每層 vuln,取自 stat.statuses.whitecut)
    const wc = en.st && en.st.whitecut;
    if(wc && wc.t>0 && wc.stk>0){
      const cfg = stat.statuses && stat.statuses.whitecut;
      if(cfg && cfg.vuln) v *= (1 + cfg.vuln * wc.stk);
    }
    en.hp-=v; dpsAdd('d',v);
  }
}

let truthCooldown=0, truthFx=null;
function refreshTruthButton(){
  const b=document.getElementById('truthbtn'); if(!b) return;
  const item=runState&&runState.activeTruth&&INK_CONFIG.insightById[runState.activeTruth];
  b.hidden=!item||!G.running; if(!item) return;
  const sec=Math.ceil(truthCooldown/60); b.classList.toggle('cooling',truthCooldown>0);
  b.querySelector('span').textContent=item.name;
  b.querySelector('small').textContent=truthCooldown>0?sec+' 息':'200 劍意';
}
function castActiveTruth(){
  if(!G.running||G.paused||!runState?.activeTruth||truthCooldown>0) return;
  const item=INK_CONFIG.insightById[runState.activeTruth], cost=item.active.manaCost;
  if(G.mana<cost){ SND.nomana(); return; }
  if(!TRUTH_POC) G.mana-=cost;
  truthCooldown=TRUTH_POC?0:Math.round(item.active.cooldown*60);
  const swordCount=Math.max(1,(stat.count|0)+(G.reserve|0));
  const authoredDuration=item.id==='truth_ten_thousand'?240:
    item.id==='truth_single_stroke'?210:Math.round((item.active.duration||.9)*60);
  truthFx={id:item.id,t:0,dur:Math.max(54,authoredDuration),hits:new WeakMap(),swordCount};
  SND.cast(Math.max(W,H)); G.banner={txt:'真意 · '+item.name,life:1}; refreshTruthButton(); updateHUD();
}
function updateActiveTruth(){
  if(truthCooldown>0) truthCooldown--;
  if(!truthFx){ if((G.t%30)===0) refreshTruthButton(); return; }
  const F=truthFx, P=G.player; F.t++;
  const progress=Math.min(1,F.t/F.dur), swords=F.swordCount||Math.max(1,stat.count|0), base=stat.damage;
  const diagonal=Math.hypot(W,H), edgeRadius=diagonal*.56;
  for(const en of G.enemies){
    if(en.dead||en.showcaseGhost) continue;
    let hit=false, dmg=base;
    if(F.id==='truth_ten_thousand'){
      const ring=Math.min(5,Math.floor(progress*6)), ringRadius=ring/5*edgeRadius;
      hit=Math.abs(Math.hypot(en.x-P.x,en.y-P.y)-ringRadius)<82;
    } else if(F.id==='truth_single_stroke'){
      const y=H+260-(H+520)*progress;
      const passed=en.y>=y-36, qiSpread=Math.min(W*.5,Math.max(0,F.t-8)*18);
      hit=(Math.abs(en.x-W*.5)<86&&Math.abs(en.y-y)<190)||(passed&&Math.abs(en.x-W*.5)<=qiSpread);
      dmg=base*swords;
    } else if(F.id==='truth_return_hidden'){
      const phase=(F.t%120)/120, radius=(phase<.5?phase*2:(1-phase)*2)*edgeRadius;
      const a=Math.atan2(en.y-P.y,en.x-P.x), slot=Math.round(a/(Math.PI*2)*swords);
      const ray=slot*Math.PI*2/swords, lateral=Math.abs(Math.sin(a-ray)*Math.hypot(en.x-P.x,en.y-P.y));
      hit=Math.abs(Math.hypot(en.x-P.x,en.y-P.y)-radius)<58&&lateral<34;
    } else if(F.id==='truth_moon_return'){
      const radius=Math.min(W,H)*.27, bladeLength=72;
      hit=Math.abs(Math.hypot(en.x-P.x,en.y-P.y)-(radius+bladeLength*.48))<52;
      dmg=base*Math.max(1,stat.flySpeed*swords/14);
    }
    const last=F.hits.get(en)||-99;
    if(hit&&F.t-last>=10){ F.hits.set(en,F.t); dmgTo(en,dmg); applyIntent(en); }
  }
  if(F.t>=F.dur){ truthFx=null; if(TRUTH_POC){ truthCooldown=0; G.mana=Math.max(G.mana,400); refreshTruthButton(); } }
  if((G.t%15)===0) refreshTruthButton();
}
function drawTruthFx(){
  if(!truthFx||!G.player||!FLYSWORD.image.complete) return;
  const F=truthFx,P=G.player,progress=Math.min(1,F.t/F.dur),im=FLYSWORD.image;
  const normalW=44+stat.size*.9, normalH=normalW/FLYSWORD.aspect*2.2;
  ctx.save(); ctx.globalCompositeOperation='multiply';
  const sword=(x,y,a,scale=1,alpha=.76)=>{ ctx.save(); ctx.translate(x,y); ctx.rotate(a); ctx.globalAlpha=alpha;
    ctx.drawImage(im,-normalW*FLYSWORD.grip*scale,-normalH*.5*scale,normalW*scale,normalH*scale); ctx.restore(); };
  if(F.id==='truth_ten_thousand'){
    // A sword-rain front falls from the upper/outside field toward the hero.
    // Every blade keeps the same authored size as the normal flying sword.
    const total=Math.max(72,(F.swordCount||stat.count)*10), columns=12;
    for(let i=0;i<total;i++){
      const row=Math.floor(i/columns), col=i%columns;
      const start=(col%3)*.018+row*.052;
      const fall=Math.max(0,Math.min(1,(progress-start)/.34));
      if(fall<=0||fall>=1) continue;
      const lane=(col+.5)/columns, outerX=lane*W;
      const gather=.48+.52*(1-fall);
      const x=P.x+(outerX-P.x)*gather+Math.sin(i*2.17)*10;
      const y=-normalW+(P.y+normalW*1.2)*fall+row*7;
      sword(x,y,Math.PI/2,1,.9);
    }
  } else if(F.id==='truth_single_stroke'){
    // 一筆開天由下往上貫穿畫卷；劍身本身就是演出，不疊程序墨痕。
    const pass=Math.max(0,Math.min(1,progress/.82));
    const x=P.x, y=H+normalH*10-(H+normalH*20)*pass;
    const giantScale=Math.max(14,H/normalW*.72);
    sword(x,y,-Math.PI/2,giantScale,.86);
  } else if(F.id==='truth_return_hidden'){
    const n=F.swordCount||Math.max(1,stat.count), phase=(F.t%120)/120;
    const outward=phase<.5, r=(outward?phase*2:(1-phase)*2)*Math.hypot(W,H)*.56;
    for(let i=0;i<n;i++){
      const a=i*Math.PI*2/n, facing=outward?a:a+Math.PI;
      ctx.save(); ctx.globalAlpha=.18; ctx.strokeStyle='#211c17'; ctx.lineWidth=Math.max(2,normalH*.45);
      ctx.beginPath(); ctx.moveTo(P.x,P.y); ctx.lineTo(P.x+Math.cos(a)*r,P.y+Math.sin(a)*r); ctx.stroke(); ctx.restore();
      sword(P.x+Math.cos(a)*r,P.y+Math.sin(a)*r,facing,1.15,.82);
    }
  } else if(F.id==='truth_moon_return'){
    const n=F.swordCount||Math.max(1,stat.count), r=Math.min(W,H)*.27;
    const spin=F.t*.012*Math.max(1,stat.flySpeed*n/14);
    ctx.save(); ctx.strokeStyle='rgba(31,27,23,.25)'; ctx.lineWidth=Math.max(3,normalH*.55);
    ctx.beginPath(); ctx.arc(P.x,P.y,r,0,Math.PI*2); ctx.stroke(); ctx.restore();
    for(let i=0;i<n;i++){
      const a=spin+i*Math.PI*2/n;
      // Sprite tip is +x, therefore radial angle means the tip always faces out.
      sword(P.x+Math.cos(a)*r,P.y+Math.sin(a)*r,a,1.15,.84);
    }
  }
  ctx.restore();
}

function update(){
  updateActiveTruth();
  G.t++;
  const P=G.player;
  const TF0=stat.tierFlags||{};
  // 養鋒·圓滿「鋒芒」:每 6 息蓄滿一次,下一擊必暴。
  if(TF0.edgeMoment){
    if(!G.edgeReady){ if(++G.edgeT>=360){ G.edgeT=0; G.edgeReady=true;
      floatText(P.x,P.y-52,'鋒芒','#c08a2e'); } }
  } else { G.edgeReady=false; G.edgeT=0; }
  // 凝神·大成/圓滿:連續命中累積專注,滿層讓下一道劍令化為凝神一劍。
  if(!TF0.focusStacks){ G.focus=0; G.focusReady=false; }
  else if(G.focusIdle!=null && ++G.focusIdle>180){ G.focus=0; G.focusIdle=0; }
  // 隕落動畫期間:戰鬥全部凍結,只推進動畫與特效計時
  if(G.deathT>0){
    G.deathT--;
    if(G.shake>0) G.shake*=0.86;
    if(G.flash>0) G.flash-=0.035;
    for(let i=G.splashes.length-1;i>=0;i--){const sp=G.splashes[i];sp.age++;if(sp.age>=sp.dur)G.splashes.splice(i,1);}
    // 程式消散期間:續噴墨滴、推進墨/潑墨/浮字,讓角色化為一攤散墨
    const hasDeath=(()=>{const S=heroSet();return !!(S.death&&S.death.length);})();
    if(!hasDeath){
      const P=G.player;
      if(G.deathT>G.deathMax*0.45 && G.t%2===0)
        ink(P.x+(Math.random()-.5)*30, P.y-P.r*1.4+(Math.random()-.5)*60,
            (Math.random()-.5)*4.5,(Math.random()-.5)*4.5-0.5, 8+Math.random()*16);
      for(let i=G.inks.length-1;i>=0;i--){const p=G.inks[i];p.x+=p.vx;p.y+=p.vy;p.vx*=0.9;p.vy*=0.9;p.r*=1.02;p.a-=0.012;p.life-=0.01;if(p.a<=0)G.inks.splice(i,1);}
      for(let i=G.texts.length-1;i>=0;i--){const t=G.texts[i];t.age++;t.x+=t.dx||0;t.y+=t.vy||-0.7;if(t.damage)t.vy*=0.94;t.life-=t.damage?0.026:0.02;if(t.life<=0)G.texts.splice(i,1);}
    }
    if(G.deathT<=0) gameOver();
    return;
  }
  if(G.bossTest&&G.bossPreset60&&G.enemies.some(en=>en.isBoss&&!en.showcaseGhost)) G.bossFightFrames++;
  // 劍意回復
  if(G.webT>0) G.webT--;
  if(G.mana<stat.manaMax){
    const webMul=G.webT>0?.45:1;
    G.mana=Math.min(stat.manaMax,G.mana+stat.manaRegen*webMul);
  } else {
    const TFm=stat.tierFlags||{};
    // 回元·大成:劍意滿了之後,溢出的回氣轉成神識
    if(TFm.healOnFullMana && P.hp<P.max){
      P.hp=Math.min(P.max, P.hp + stat.manaRegen*0.35);
      if(G.t%45===0) floatText(P.x,P.y-46,'回元','#4aa0b8');
    }
    // 回元·圓滿:劍意滿盈時每 3 息自行召出一把飛劍
    if(TFm.summonOnFullMana && ++G.summonT>=180){
      G.summonT=0;
      const tg=nearestEnemy(P.x,P.y,1e9);
      if(tg){ spawnAutoCommand(P.x,P.y,tg.x,tg.y,{dmgMul:0.7,intent:true});
        floatText(P.x,P.y-58,'召劍','#c08a2e'); }
    }
  }
  // 自動御劍:定時朝最近之敵直射(收益打折、不計紀錄)
  if(G.auto){
    G.autoTimer++;
    if(G.autoTimer>=34){
      const AUTO_STROKE_MAX=220;
      const contactPadding=stat.size+(stat.hitPadding||0);
      const best=selectAutoTarget(G.enemies,P,AUTO_STROKE_MAX,contactPadding,onScreen);
      if(best){
        const aim=Math.atan2(best.y-P.y,best.x-P.x);
        let ang=aim;
        // 陣型補正:扇形/平行在偶數劍數時左右分岔,原本會夾住目標而全部落空。
        // 這裡反算出「最接近中線的那把劍」的偏移量,預先反向補償,保證它正中目標。
        const n=stat.count; let shift=0;
        if(n>1 && stat.formation==='fan'){
          const spread=Math.min(0.55,0.14*(n-1));
          let bo=1e9;
          for(let i=0;i<n;i++){ const o=(i/(n-1)-0.5)*spread*2; if(Math.abs(o)<Math.abs(bo)) bo=o; }
          ang-=bo;                                   // 反向預旋
        } else if(n>1 && stat.formation==='parallel'){
          const mid=(n-1)/2, gap=stat.size*2.2+10;
          let bo=1e9;
          for(let i=0;i<n;i++){ const o=(i-mid)*gap; if(Math.abs(o)<Math.abs(bo)) bo=o; }
          shift=-bo;                                 // 反向預移(沿法線)
        }
        // 自動御劍固定由玩家中心出發；陣型補正只作用於終點。
        const nx=-Math.sin(ang)*shift, ny=Math.cos(ang)*shift;
        const target={
          x:stat.formation==='parallel'?best.x+nx:P.x+Math.cos(ang)*Math.hypot(best.x-P.x,best.y-P.y),
          y:stat.formation==='parallel'?best.y+ny:P.y+Math.sin(ang)*Math.hypot(best.x-P.x,best.y-P.y)
        };
        // 只畫到劍的掃掠半徑能碰到敵人外緣的位置；不再為命中中心支付整段距離。
        const endpoint=autoCommandEndpoint(P,target,AUTO_STROKE_MAX,(best.r||0)+contactPadding);
        const tx=endpoint.x,ty=endpoint.y,want=endpoint.length;
        if(allowedLen()+.01>=want){
          const before=G.mana; launchSword([{x:P.x,y:P.y},{x:tx,y:ty}]);
          if(G.mana<before){ G.autoUsed=true; G.autoTimer=0; } else { G.autoTimer=28; }
        } else G.autoTimer=28; // 劍意不足以抵達目標：等待回復，不發射半途消散的空劍。
      }
    }
  }
  // 境界以本境斬妖目標推進；倒數歸零仍未完成即失敗。
  if(!G.bossTest && !ACTOR_POC && G.wave<=60){
    G.waveTimer++;
    if(G.waveKills>=realmKillTarget(G.wave)){
      if(G.wave===59) beginBossWave(); else advanceRealm();
    } else if(G.waveTimer>=realmTimeFrames(G.wave)){
      G.banner={txt:'時限已盡',life:1}; gameOver();
    }
  }
  if(!G.bossTest && (!ACTOR_POC||WAVE_POC) && G.wave<60){
    const eliteCount=eliteSpiderCountForWave(G.wave);
    if(eliteCount && !G.eliteSpawned[G.wave]){
      G.eliteSpawned[G.wave]=true;
      spawnNetherSpider(G.wave,eliteCount);
    }
    const q=waveDifficulty(G.wave);
    G.spawnAcc += q.spawn;
    while(G.spawnAcc>=60){ G.spawnAcc-=60; if(G.enemies.length<q.cap) spawnEnemy(); }
  }
  updateBossShots();

  updateEnemies();
  updateCombat();
  // 粒子/墨/浮字
  for(let i=G.particles.length-1;i>=0;i--){const p=G.particles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=0.92;p.vy*=0.92;p.life-=0.03;if(p.life<=0)G.particles.splice(i,1);}
  for(let i=G.splashes.length-1;i>=0;i--){const sp=G.splashes[i];sp.age++;if(sp.age>=sp.dur)G.splashes.splice(i,1);}
  for(let i=G.mists.length-1;i>=0;i--){const m=G.mists[i];m.age++;if(m.age>=m.dur)G.mists.splice(i,1);}
  for(let i=G.inks.length-1;i>=0;i--){const p=G.inks[i];p.x+=p.vx;p.y+=p.vy;p.vx*=0.9;p.vy*=0.9;p.r*=1.02;p.a-=0.012;p.life-=0.01;if(p.a<=0)G.inks.splice(i,1);}
  for(let i=G.texts.length-1;i>=0;i--){const t=G.texts[i];t.age++;t.x+=t.dx||0;t.y+=t.vy||-0.7;
    if(t.damage)t.vy*=0.94;t.life-=t.damage?0.026:0.02;if(t.life<=0)G.texts.splice(i,1);}
  for(let i=G.stains.length-1;i>=0;i--){const st=G.stains[i];st.a-=0.00035;if(st.a<=0)G.stains.splice(i,1);}
  {
    const TFw=stat.tierFlags||{};
    const decay = TFw.whiteCutLingers ? 0.03 : 0.09;   // 斷意·圓滿:飛白滯留兩息不散
    // 飛白本身就是一道斬痕,不是裝飾 —— 每道生成後斬一次。
    // 斷意·大成把它從三成加深到七成。
    const cutMul = TFw.whiteCutSlash ? 0.70 : 0.30;
    for(let i=G.cuts.length-1;i>=0;i--){
      const c=G.cuts[i]; c.life-=decay;
      if(!c.slashed && c.life<0.86){
        c.slashed=true;
        for(const en of G.enemies)
          if(Math.hypot(en.x-c.x,en.y-c.y) < en.r+c.len*0.8){
            dmgTo(en, stat.damage*cutMul); pendDamage(en, stat.damage*cutMul, false); en.hit=6; }
      }
      if(c.life<=0)G.cuts.splice(i,1);
    }
  }
  if(G.shake>0) G.shake*=0.86; if(G.shake<0.2) G.shake=0;
  if(G.flash>0) G.flash-=0.035;
  if(G.banner){ G.banner.life-=0.0085; if(G.banner.life<=0) G.banner=null; }
  // 角色朝向:面向最近的妖魔,平時劍斜垂
  {
    let best=null,bd=1e9;
    for(const en of G.enemies){ if(!onScreen(en)) continue;
      const dd=(en.x-P.x)**2+(en.y-P.y)**2; if(dd<bd){bd=dd;best=en;} }
    const want = best ? Math.atan2(best.y-P.y,best.x-P.x) : (G.facing>0?0.8:Math.PI-0.8);
    let da=want-G.aim; while(da>Math.PI)da-=6.283; while(da<-Math.PI)da+=6.283;
    G.aim+=da*0.09;
    G.facing = Math.cos(G.aim)>=0 ? 1 : -1;
  }
  if(G.intent>0) G.intent=Math.max(0,G.intent-0.045);
  for(let i=G.streaks.length-1;i>=0;i--){ const k=G.streaks[i];
    k.life-=0.085; if(k.life<=0) G.streaks.splice(i,1); }
  if(P.pulse>0)P.pulse-=0.05;
  if(G.hurtT>0)G.hurtT--;
  if(G.castT>0)G.castT--;
  // 開匣·圓滿:劍匣自行存劍。存量上限 = 當下劍數(匣有幾格存幾把),
  // 劍數掉下來時多的存量也要跟著收掉,否則卸掉劍式還留著超額存量。
  if(stat.tierFlags && stat.tierFlags.autoRefill){
    const cap=Math.max(1, stat.count|0);
    if(++G.reserveT>=480){ G.reserveT=0; if(G.reserve<cap){ G.reserve++; G.reserveFlash=1; } }
    if(G.reserve>cap) G.reserve=cap;
  } else { G.reserve=0; G.reserveT=0; }
  if(G.reserveFlash>0) G.reserveFlash-=0.02;
  // 破墨·小成/大成:潑墨處留下的墨滴,碰到墨獸就化開;大成再炸一次。
  for(let i=G.drops.length-1;i>=0;i--){
    const d=G.drops[i]; d.t--;
    if(d.t<=0){ G.drops.splice(i,1); continue; }
    for(const en of G.enemies){
      if(Math.hypot(en.x-d.x,en.y-d.y) < en.r+d.r){
        dmgTo(en, d.dmg); en.hit=6; splash(d.x,d.y,'#3a332a',0.9);
        if(d.boom) for(const e2 of G.enemies)
          if(e2!==en && Math.hypot(e2.x-d.x,e2.y-d.y)<70){ dmgTo(e2,d.dmg*0.6); e2.hit=6; }
        G.drops.splice(i,1); break;
      }
    }
  }
  // 展鋒·圓滿:收筆後劍痕滯留半息,墨獸碰到還會再受一次傷。
  for(let i=G.lingers.length-1;i>=0;i--){
    const L=G.lingers[i]; L.t--;
    if(L.t<=0){ G.lingers.splice(i,1); continue; }
    if(G.t%4) continue;
    for(const en of G.enemies){
      if(L.hit.has(en)) continue;
      for(let k=1;k<L.pts.length;k++)
        if(segCircleDist(L.pts[k-1].x,L.pts[k-1].y,L.pts[k].x,L.pts[k].y,en.x,en.y) < en.r+stat.size){
          dmgTo(en, L.dmg); en.hit=6; L.hit.add(en); break;
        }
    }
  }
  flushDamage();
  dpsTick();
  if(G.t%5===0) updateHUD();
}
// ---------- 角色:程序化動態 ----------
// 呼吸(整體微幅縮放)、逐列風動(衣袂與髮絲)、隨敵轉身、出劍時揮砍與身體前傾。
// ---------- 五行元素調色 ----------
// none=水墨本色 / fire=業火(赤) / ice=寒霜(藍)。決定劍氣、中脊、拖尾、粒子的顏色。
const ELEM = {
  none:{ halo0:'rgba(70,64,56,0)',  halo1:'rgba(70,64,56,0.26)',  halo2:'rgba(120,110,96,0)',
         spine:'rgba(60,52,44,0.6)', trail:'40,34,28',  hit:'#3a332a' },
  fire:{ halo0:'rgba(200,80,36,0)', halo1:'rgba(214,96,42,0.40)', halo2:'rgba(244,182,88,0)',
         spine:'rgba(198,72,28,0.9)', trail:'206,92,40', hit:'#c0532e' },
  ice: {halo0:'rgba(120,178,218,0)',halo1:'rgba(150,200,235,0.40)',halo2:'rgba(224,242,255,0)',
         spine:'rgba(84,150,200,0.9)', trail:'150,196,230', hit:'#5a9cc0' },
};

// 劍身每幀每把重畫要建三個漸層加十幾段路徑;造型只跟劍氣寬度/元素/外觀有關,
// 烘成一張貼圖,之後每把劍只花一次 drawImage。
// ---------- 程序化水墨劍造型(東方素雅劍) ----------
// 本地座標:劍尖朝 +x,劍柄在 -x。比例隨劍氣寬度 stat.size 縮放。
// 墨劍 sprite 繪製:出鞘前 24 影格播攻擊 6 幀,之後待機 8 幀慢速循環。
// ---------- 靜態圖層 ----------
// 宣紙底交給 CSS 背景圖(GPU 合成,零每幀成本);暈影是純 CSS 漸層。
// 畫布只負責會動的東西,每幀用 clearRect 清空。

// 第一章畫卷修復模擬：乾淨原畫放在 DOM 紙層，邪墨在 Canvas 最底層程序化覆蓋。
// 第 1～60 波逐步退去，但第 60 波仍保留 18% 的污染核心；目前以進入第 61 波模擬 Boss 已死。
// 墨漬:預烘六種墨團小貼圖,之後每道墨漬只是一次小 drawImage,可保留漸淡
let blots=null;
function buildBlots(){
  blots=[];
  for(let b=0;b<6;b++){
    const S=128, c=document.createElement('canvas'); c.width=c.height=S;
    const g=c.getContext('2d');
    const m=7+((Math.random()*3)|0), pts=[];
    for(let i=0;i<m;i++) pts.push({a:i/m*6.283, r:S*0.5*(0.55+Math.random()*0.42),
      ox:(Math.random()-.5)*S*0.12, oy:(Math.random()-.5)*S*0.12});
    g.fillStyle='#000'; g.beginPath();
    for(let i=0;i<m;i++){
      const q=pts[i], n=pts[(i+1)%m];
      const ax=S/2+Math.cos(q.a)*q.r+q.ox, ay=S/2+Math.sin(q.a)*q.r+q.oy;
      const bx=S/2+Math.cos(n.a)*n.r+n.ox, by=S/2+Math.sin(n.a)*n.r+n.oy;
      if(i===0) g.moveTo(ax,ay);
      g.quadraticCurveTo(ax+(bx-ax)*.5+Math.cos(q.a)*q.r*.18,
                         ay+(by-ay)*.5+Math.sin(q.a)*q.r*.18, bx,by);
    }
    g.closePath(); g.fill();
    blots.push(c);
  }
}


// 兩套普通怪素材衍生六種玩法時，靠快取染色與極少量附著筆觸建立可讀差異。
// 所有效果都不寫入長效墨層；低畫質只保留色調與輪廓，避免增加手機負擔。
const ENEMY_TONE={
  weaver:'rgba(72,92,101,.38)', orbiter:'rgba(43,96,72,.38)',
  bulwark:'rgba(50,40,58,.24)', charger:'rgba(133,48,39,.38)', reaver:'rgba(34,48,68,.40)'
};

// ---------- 繪製 ----------


// ---------- HUD ----------
// 中文數字:原版只做到 99(百位會算錯)。改為支援到 9999,並沿用傳統的 廿/卅
// (參考稿的傷害寫「廿四」而不是「二十四」)。十位為 1 時省略「一」:十四,不是一十四。
// 畫線時跟著指尖跑的即時計價。玩家在收筆前就知道這一筆要花多少,
// 不用去記「每寸多少」這種抽象數字 —— 數字直接長在他手上。
// 用的是 truncate 後的長度,所以顯示的就是收筆時真的會被扣的錢。


function realmKillTarget(w){ return w>=60?1:Math.min(60,10+Math.floor((w-1)*.72)+(w%10===0?5:0)); }
function realmTimeFrames(w){ return (w>=60?360:45)*60; }
function realmClockText(){
  const left=Math.max(0,Math.ceil((realmTimeFrames(G.wave)-G.waveTimer)/60));
  return String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');
}
function advanceRealm(){
  G.waveTimer=0; G.waveKills=0; G.wave++;
  SND.wave(); SND.intensity(G.wave); flash(.14,'250,244,226');
  G.banner={txt:'第 '+num2cn(G.wave)+' 境',life:1}; updateHUD();
}
// 收合時完全不算,展開才每 5 幀更新一次(跟 updateHUD 同一個節流)
function renderDps(){
  const rd=dpsRate('d'), rm=dpsRate('m'), rk=dpsRate('k');
  const one=v=>v.toFixed(1), two=v=>v.toFixed(2);
  setTxt('dps_d', rd==null ? '—' : one(rd));
  // 劍意是「支出 vs 回氣」:只看支出會誤判,回氣是每幀 stat.manaRegen × 60
  setTxt('dps_m', rm==null ? '—' : one(rm));
  setTxt('dps_k', rk==null ? '—' : two(rk));
  setTxt('dps_f', DPS.secs<1 ? '尚未成局'
    : '近'+Math.min(DPS.win,DPS.buckets.length)+'息 · 回氣 '+one(stat.manaRegen*60)+'/秒');
}

// ---------- 迴圈 ----------
// ---------- 診斷 ----------
// 逐項開關,用來在真實機器上二分出瓶頸(數字鍵 1~6 切換,0 全關)
const FX={ bg:true, vig:true, trail:true, ink:true, part:true, glow:true };
const FXKEY={'1':['bg','背景層'],'2':['vig','暈影'],'3':['trail','拖尾'],
             '4':['ink','墨暈'],'5':['part','粒子'],'6':['glow','靈石光暈']};
// 排除法用:7 停掉所有音訊、9 連 draw() 都不呼叫。
// 若 9 按下去 fps 仍不變,問題就完全不在畫面繪製,而在瀏覽器合成或環境。
let NODRAW=false, NOAUDIO=false;
// 逐段疊加的繪圖層級:0=完全不畫,9=全部畫。用來精準定位是哪一段拖垮 GPU。
let DRAWLV=9;
const LVNAME=['0 什麼都不畫','1 背景圖層','2 墨暈','3 靈石法陣','4 敵人',
              '5 劍(拖尾+劍身)','6 畫痕','7 粒子+浮字','8 題字+閃光','9 暈影圖層'];
// 硬體加速沒開時 Chrome 會退回 SwiftShader 軟體算圖,全螢幕合成會慢上一個數量級
let GPU='(未偵測)';
function detectGPU(){
  try{
    const c=document.createElement('canvas');
    const gl=c.getContext('webgl')||c.getContext('experimental-webgl');
    if(!gl){ GPU='WebGL 不可用 → 硬體加速應已關閉'; return; }
    const e=gl.getExtension('WEBGL_debug_renderer_info');
    let r=e? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    r=String(r).replace(/ANGLE \(|\)$/g,'').slice(0,46);
    const soft=/swiftshader|software|llvmpipe|basic render/i.test(r);
    GPU=(soft?'⚠ 軟體算圖 ':'')+r;
  }catch(err){ GPU='偵測失敗'; }
}
detectGPU();
// 目的是在「你的機器、你的螢幕」上量真實數字,而不是靠開發端推測。
const DIAG={ on:false, hist:[], upd:0, drw:0, last:0, tAcc:0, tN:0, minD:1e9, el:null, next:0 };
function diagFrame(ts){
  if(DIAG.last){
    const d=ts-DIAG.last;
    if(d>0.5&&d<500){ DIAG.hist.push(d); if(DIAG.hist.length>180) DIAG.hist.shift();
      if(d<DIAG.minD) DIAG.minD=d; }
  }
  DIAG.last=ts;
  if(!DIAG.on || ts<DIAG.next) return;
  DIAG.next=ts+250;
  const f=DIAG.hist.slice().sort((a,b)=>a-b); if(!f.length) return;
  const q=x=>f[Math.min(f.length-1,Math.floor(f.length*x))];
  const p50=q(.5), p95=q(.95), mx=f[f.length-1];
  const fps=1000/p50;
  // 用觀察到的最短幀距推估螢幕更新率,才知道 60fps 對你是滿幀還是掉一半
  const hz=DIAG.minD<1e9 ? Math.round(1000/DIAG.minD) : 0;
  const cls=v=>v>1000/50?'bad':v>1000/58?'warn':'';
  const nz=n=>String(n).padStart(4);
  DIAG.el.innerHTML=
    '<b>'+fps.toFixed(0)+' fps</b>  <span class="'+cls(p50)+'">p50 '+p50.toFixed(1)+'ms</span>\n'
    +'p95 '+p95.toFixed(1)+'ms   max '+mx.toFixed(1)+'ms\n'
    +'螢幕上限 ≈ '+hz+' Hz'+(hz>70?'  <span class="warn">(60fps=掉一半)</span>':'')+'\n'
    +'update '+DIAG.upd.toFixed(2)+'ms  draw '+DIAG.drw.toFixed(2)+'ms\n'
    +(hz && p50>1000/hz+3
        ? '<span class="bad">瀏覽器 '+Math.max(0,p50-DIAG.upd-DIAG.drw).toFixed(1)+'ms</span> ← 合成/點陣化\n'
        : '其餘 '+Math.max(0,p50-DIAG.upd-DIAG.drw).toFixed(1)+'ms(等 vsync,正常)\n')
    +'DPR '+DPR+'  畫布 '+(W*DPR|0)+'×'+(H*DPR|0)+'\n'
    +'<span class="'+(/⚠/.test(GPU)?'bad':'')+'">'+GPU+'</span>\n'
    +'1背景'+(FX.bg?'✓':'✗')+' 2暈影'+(FX.vig?'✓':'✗')+' 3拖尾'+(FX.trail?'✓':'✗')+'\n'
    +'4墨暈'+(FX.ink?'✓':'✗')+' 5粒子'+(FX.part?'✓':'✗')+' 6光暈'+(FX.glow?'✓':'✗')+'\n'
    +'7音訊'+(NOAUDIO?'停':'開')+'　9繪圖'+(NODRAW?'停':'開')+'　0全部特效\n'
    +'妖'+nz(G.enemies.length)+' 劍'+nz(G.swords.length)+' 粒'+nz(G.particles.length)+'\n'
    +'墨'+nz(G.inks.length)+' 字'+nz(G.texts.length)+' 波'+nz(G.wave)
    +(ACTOR_POC?'\n\n<b>Actor POC</b>\n'+(actorPocDiag
      ?'actorId '+actorPocDiag.actorId+'\nsource = '+actorPocDiag.source+'\nlogicalDirection '+actorPocDiag.logicalDirection+'\nresolvedAssetDirection '+actorPocDiag.resolvedAssetDirection+'\nflipX '+actorPocDiag.flipX+'\naction '+actorPocDiag.action+'\nframeIndex '+actorPocDiag.frameIndex+'\nrenderer = '+actorPocDiag.renderer
      :'renderer = waiting'):'');
}
// 一鍵自動二分:依序套用六種設定各量 3 秒,直接印出對照表。
// 目的是把「該按哪些鍵、記哪些數字」全部自動化,一次就能定位。
let bisecting=false;
async function bisect(){
  if(bisecting) return; bisecting=true;
  const el=DIAG.el=DIAG.el||document.getElementById('diag');
  el.classList.add('show'); DIAG.on=false;          // 量測期間停掉面板更新
  const saveDPR=DPR, saveFX=Object.assign({},FX);
  const setTestDPR=v=>{ setDPR(v); cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0); };
  const styleOff=document.createElement('style');
  const CASES=[
    ['1 現狀(全開)',       ()=>{}],
    ['2 不畫任何東西',      ()=>{ NODRAW=true; }],
    ['3 音訊全停',          ()=>{ NODRAW=false; SND.hardMute(true); }],
    ['4 不畫 + 無音訊',     ()=>{ NODRAW=true; }],
    ['5 DPR 降到 1',        ()=>{ NODRAW=false; SND.hardMute(false); setTestDPR(1); }],
    ['6 移除毛玻璃',        ()=>{ setTestDPR(saveDPR);
        styleOff.textContent='*{backdrop-filter:none !important}';
        document.head.appendChild(styleOff); }],
  ];
  const rows=[];
  for(const [name,setup] of CASES){
    setup();
    await new Promise(r=>setTimeout(r,400));         // 讓設定生效並穩定
    const gaps=[]; let last=0;
    await new Promise(res=>{
      const t0=performance.now();
      (function f(ts){
        if(last) gaps.push(ts-last); last=ts;
        if(performance.now()-t0<3000) requestAnimationFrame(f); else res();
      })(performance.now());
    });
    gaps.sort((a,b)=>a-b);
    const p50=gaps[gaps.length>>1]||0;
    rows.push([name,(1000/p50).toFixed(0),p50.toFixed(1)]);
    el.textContent='二分中… '+name+'  →  '+(1000/p50).toFixed(0)+' fps';
  }
  // 還原
  NODRAW=false; SND.hardMute(false); setTestDPR(saveDPR); Object.assign(FX,saveFX);
  if(styleOff.parentNode) styleOff.parentNode.removeChild(styleOff);
  const txt='== 自動二分結果 ==\n'
    + rows.map(r=>r[0].padEnd(16)+String(r[1]).padStart(4)+' fps  '+r[2]+'ms').join('\n')
    + '\n螢幕上限 ≈ '+(DIAG.minD<1e9?Math.round(1000/DIAG.minD):'?')+' Hz'
    + '\nDPR '+DPR+'  畫布 '+(W*DPR|0)+'×'+(H*DPR|0)
    + '\n'+GPU;
  el.textContent=txt+'\n\n(已複製到剪貼簿,按 F 收起)';
  try{ navigator.clipboard.writeText(txt); }catch(e){}
  bisecting=false;
}
// 逐段疊加二分:從什麼都不畫,一段一段加回去,fps 在哪一段掉下去就是元凶。
async function bisectDraw(){
  if(bisecting) return; bisecting=true;
  const el=DIAG.el=DIAG.el||document.getElementById('diag');
  el.classList.add('show'); DIAG.on=false;
  const rows=[]; let prev=null, culprit=null;
  for(let lv=0; lv<=9; lv++){
    DRAWLV=lv; NODRAW=(lv===0);
    await new Promise(r=>setTimeout(r,300));
    const gaps=[]; let last=0;
    await new Promise(res=>{
      const t0=performance.now();
      (function f(ts){ if(last) gaps.push(ts-last); last=ts;
        if(performance.now()-t0<2200) requestAnimationFrame(f); else res(); })(performance.now());
    });
    gaps.sort((a,b)=>a-b);
    const p50=gaps[gaps.length>>1]||0, fps=1000/p50;
    rows.push(LVNAME[lv].padEnd(15)+String(fps.toFixed(0)).padStart(3)+' fps '+p50.toFixed(1)+'ms');
    if(prev!==null && !culprit && prev>=45 && fps<45) culprit=LVNAME[lv];
    prev=fps;
    el.textContent='逐段二分中… '+LVNAME[lv]+' → '+fps.toFixed(0)+' fps';
  }
  DRAWLV=9; NODRAW=false; bisecting=false;
  const txt='== 逐段疊加二分 ==\n'+rows.join('\n')
    +(culprit?'\n\n➜ 元凶:'+culprit:'\n\n➜ 沒有單一段落造成落差')
    +'\nDPR '+DPR+'  畫布 '+(W*DPR|0)+'×'+(H*DPR|0);
  el.textContent=txt+'\n\n(已複製到剪貼簿,按 F 收起)';
  try{ navigator.clipboard.writeText(txt); }catch(e){}
}
// 微觀二分:第 1 段就崩,代表問題不在「畫多少」,而在「動到畫布」這件事本身,
// 或畫布上方的 DOM 合成。這裡連塗 4×4 一小塊都測,並試兩種 context 屬性。
async function bisectMicro(){
  if(bisecting) return; bisecting=true;
  const el=DIAG.el=DIAG.el||document.getElementById('diag');
  el.classList.add('show'); DIAG.on=false;
  const saveNo=NODRAW; NODRAW=true;                  // 停掉遊戲自己的繪圖
  const hud=document.getElementById('hud');
  let alt=null, altx=null;
  function mkAlt(opts){
    alt=document.createElement('canvas');
    alt.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:1';
    alt.width=W*DPR; alt.height=H*DPR;
    document.getElementById('wrap').appendChild(alt);
    altx=alt.getContext('2d',opts); altx.setTransform(DPR,0,0,DPR,0,0);
  }
  function rmAlt(){ if(alt){ alt.remove(); alt=null; altx=null; } }
  let off=null;
  const CASES=[
    ['A 完全不畫',            null,null],
    ['B 主畫布 clear 1×1',    null,()=>ctx.clearRect(0,0,1,1)],
    ['C 主畫布 塗 4×4',       null,()=>{ctx.fillStyle='#e9e0cc';ctx.fillRect(0,0,4,4);}],
    ['D 主畫布 滿版塗色',      null,()=>{ctx.fillStyle='#e9e0cc';ctx.fillRect(0,0,W,H);}],
    ['E 主畫布 滿版貼圖',      null,()=>{ if(!off){off=document.createElement('canvas');
        off.width=W*DPR;off.height=H*DPR;const g=off.getContext('2d');
        g.fillStyle='#e9e0cc';g.fillRect(0,0,off.width,off.height);}
        ctx.drawImage(off,0,0,W,H); }],
    ['F 塗 4×4 + 隱藏 HUD',   ()=>{hud.style.display='none';},
                              ()=>{ctx.fillStyle='#e9e0cc';ctx.fillRect(0,0,4,4);}],
    ['G 新畫布 alpha:false',  ()=>{hud.style.display='';rmAlt();mkAlt({alpha:false});},
                              ()=>{altx.fillStyle='#e9e0cc';altx.fillRect(0,0,W,H);}],
    ['H 新畫布 +低延遲',       ()=>{rmAlt();mkAlt({alpha:false,desynchronized:true});},
                              ()=>{altx.fillStyle='#e9e0cc';altx.fillRect(0,0,W,H);}],
  ];
  const rows=[];
  for(const [name,pre,paint] of CASES){
    if(pre) pre();
    await new Promise(r=>setTimeout(r,300));
    const gaps=[]; let last=0;
    await new Promise(res=>{
      const t0=performance.now();
      (function f(ts){ if(last) gaps.push(ts-last); last=ts;
        if(paint) paint();
        if(performance.now()-t0<2200) requestAnimationFrame(f); else res(); })(performance.now());
    });
    gaps.sort((a,b)=>a-b);
    const p50=gaps[gaps.length>>1]||0;
    rows.push(name.padEnd(20)+String((1000/p50).toFixed(0)).padStart(3)+' fps '+p50.toFixed(1)+'ms');
    el.textContent='微觀二分中… '+name+' → '+(1000/p50).toFixed(0)+' fps';
  }
  rmAlt(); hud.style.display=''; NODRAW=saveNo; bisecting=false;
  const txt='== 微觀二分 ==\n'+rows.join('\n')
    +'\nDPR '+DPR+'  畫布 '+(W*DPR|0)+'×'+(H*DPR|0)+'\n'+GPU;
  el.textContent=txt+'\n\n(已複製到剪貼簿,按 F 收起)';
  try{ navigator.clipboard.writeText(txt); }catch(e){}
}
// 頁面級二分:碰一個像素就崩,代表問題在「呈現這張畫布」而非畫什麼。
// 這裡逐項把頁面剝乾淨,最後測畫布尺寸,看成本是否隨面積線性成長。
async function bisectPage(){
  if(bisecting) return; bisecting=true;
  const el=DIAG.el=DIAG.el||document.getElementById('diag');
  el.classList.add('show'); DIAG.on=false;
  const saveNo=NODRAW, savePause=G.paused; NODRAW=true; G.paused=true;
  const wrap=document.getElementById('wrap');
  const stash=[]; const auEls=[];
  const saveW=cv.width, saveH=cv.height, saveCss=cv.style.cssText;
  const measure=async(name)=>{
    await new Promise(r=>setTimeout(r,300));
    const gaps=[]; let last=0;
    await new Promise(res=>{
      const t0=performance.now();
      (function f(ts){ if(last) gaps.push(ts-last); last=ts;
        ctx.clearRect(0,0,2,2);                     // 只碰畫布,不畫東西
        if(performance.now()-t0<2000) requestAnimationFrame(f); else res(); })(performance.now());
    });
    gaps.sort((a,b)=>a-b);
    const p50=gaps[gaps.length>>1]||0;
    el.textContent='頁面二分中… '+name+' → '+(1000/p50).toFixed(0)+' fps';
    return name.padEnd(24)+String((1000/p50).toFixed(0)).padStart(3)+' fps '+p50.toFixed(1)+'ms';
  };
  const rows=[];
  // 對照組:完全不碰畫布(rAF 本身是否正常)
  {
    const gaps=[]; let last=0;
    await new Promise(res=>{ const t0=performance.now();
      (function f(ts){ if(last) gaps.push(ts-last); last=ts;
        if(performance.now()-t0<2000) requestAnimationFrame(f); else res(); })(performance.now()); });
    gaps.sort((a,b)=>a-b); const p50=gaps[gaps.length>>1]||0;
    rows.push('0 完全不碰畫布(對照)'.padEnd(24)+String((1000/p50).toFixed(0)).padStart(3)+' fps '+p50.toFixed(1)+'ms');
  }
  rows.push(await measure('1 現狀'));
  blots=null; G.stains.length=0;
  rows.push(await measure('2 釋放離屏畫布'));
  document.querySelectorAll('audio').forEach(a=>{ try{a.pause();}catch(e){} a.removeAttribute('src'); a.load(); auEls.push(a); });
  rows.push(await measure('3 移除音訊元素'));
  [...wrap.children].forEach(c=>{ if(c!==cv && c.id!=='diag'){ stash.push([c,c.nextSibling]); c.remove(); } });
  rows.push(await measure('4 移除畫布以外的 DOM'));
  cv.style.cssText='position:absolute;left:0;top:0;width:640px;height:400px;z-index:1';
  cv.width=640; cv.height=400; ctx.setTransform(1,0,0,1,0,0);
  rows.push(await measure('5 畫布縮到 640×400'));
  cv.style.cssText='position:absolute;left:0;top:0;width:320px;height:200px;z-index:1';
  cv.width=320; cv.height=200;
  rows.push(await measure('6 畫布縮到 320×200'));
  cv.style.cssText='position:absolute;left:0;top:0;width:64px;height:40px;z-index:1';
  cv.width=64; cv.height=40;
  rows.push(await measure('7 畫布縮到 64×40'));
  // 對照組:同分頁開一個空白 iframe,在裡面用全新畫布量
  try{
    const fr=document.createElement('iframe');
    fr.style.cssText='position:absolute;left:0;top:0;width:320px;height:200px;border:0;z-index:1';
    document.body.appendChild(fr);
    const d=fr.contentDocument, w2=fr.contentWindow;
    const c2=d.createElement('canvas'); c2.width=320; c2.height=200;
    c2.style.cssText='width:320px;height:200px;display:block';
    d.body.style.margin='0'; d.body.appendChild(c2);
    const x2=c2.getContext('2d');
    const gaps=[]; let last=0;
    await new Promise(res=>{ const t0=performance.now();
      (function f(ts){ if(last) gaps.push(ts-last); last=ts;
        x2.clearRect(0,0,2,2);
        if(performance.now()-t0<2000) w2.requestAnimationFrame(f); else res(); })(performance.now()); });
    gaps.sort((a,b)=>a-b); const p50=gaps[gaps.length>>1]||0;
    rows.push('8 空白 iframe 內畫布'.padEnd(24)+String((1000/p50).toFixed(0)).padStart(3)+' fps '+p50.toFixed(1)+'ms');
    fr.remove();
  }catch(err){ rows.push('8 空白 iframe 內畫布      (失敗)'); }
  // 還原
  cv.style.cssText=saveCss; cv.width=saveW; cv.height=saveH; ctx.setTransform(DPR,0,0,DPR,0,0);
  stash.reverse().forEach(([c,ref])=>wrap.insertBefore(c,ref));
  NODRAW=saveNo; G.paused=savePause; bisecting=false; invalidatePaper(); resetHudCache();
  const txt='== 頁面級二分(每幀只 clearRect 2×2)==\n'+rows.join('\n')
    +'\n原畫布 '+saveW+'×'+saveH+'\n'+GPU
    +'\n※ 音訊已停,重新整理即恢復';
  el.textContent=txt+'\n\n(已複製到剪貼簿,按 F 收起)';
  try{ navigator.clipboard.writeText(txt); }catch(e){}
}
function toggleDiag(){
  DIAG.on=!DIAG.on; DIAG.hist.length=0; DIAG.minD=1e9;
  DIAG.el=DIAG.el||document.getElementById('diag');
  DIAG.el.classList.toggle('show',DIAG.on);
}
if(location.search.indexOf('debug')>=0||ACTOR_POC) setTimeout(toggleDiag,0);

// ---------- 開始/結束 ----------
// 開場過場 v2:鏡頭推近桌上畫軸(首頁整體一起放大,LOGO/按鈕自然出框)→ 桌面隱去
// → 畫軸(同張桌面圖切成上下兩半)由中心拉開 → 抵達關卡上下邊緣後淡出 → HUD 淡入。
// 幾何量全部由這裡依實際視窗量測寫入 CSS 變數,不需要手動對位參數。
let openingSeen=false;
// 桌面圖中「畫軸」的位置(以圖片寬高為 1 的正規化座標,量自 assets/scenes/home-desk-bg.png 941×1672)
const DESK_IMG={ w:941, h:1672 };
const SCROLL_UV={ x0:0.100, x1:0.880, y0:0.4700, y1:0.5165, seam:0.4935 };
// 依 background-size:cover 的實際貼合方式,換算畫軸在畫面上的像素矩形
function measureScroll(){
  const wrap=document.getElementById('wrap');
  const vw=wrap.clientWidth, vh=wrap.clientHeight;
  const s=Math.max(vw/DESK_IMG.w, vh/DESK_IMG.h);      // cover
  const dw=DESK_IMG.w*s, dh=DESK_IMG.h*s;
  const ox=(vw-dw)/2, oy=(vh-dh)/2;
  const x0=ox+SCROLL_UV.x0*dw, x1=ox+SCROLL_UV.x1*dw;
  const y0=oy+SCROLL_UV.y0*dh, y1=oy+SCROLL_UV.y1*dh;
  const seam=oy+SCROLL_UV.seam*dh;
  return { vw, vh, x0, x1, y0, y1, seam, cx:(x0+x1)/2, cy:(y0+y1)/2,
           // 推到「畫軸略寬於畫面」,鏡頭感才夠、捲桿也能橫貫整個邊緣
           zoom: Math.max(1, vw/Math.max(1,(x1-x0)) * 2.2) };
}
function applyOpeningVars(){
  const wrap=document.getElementById('wrap'), m=measureScroll(), st=wrap.style;
  const Z=m.zoom, OY=m.cy;
  const zy=y=>OY+(y-OY)*Z;                              // 縮放後的畫面 y
  const EDGE=Math.round(Math.min(46, m.vh*0.055));      // 停在關卡邊緣留一道捲桿的厚度
  st.setProperty('--ox', m.cx.toFixed(1)+'px');
  st.setProperty('--oy', m.cy.toFixed(1)+'px');
  st.setProperty('--zoom', Z.toFixed(4));
  st.setProperty('--sx0', m.x0.toFixed(1)+'px');
  st.setProperty('--sx1', m.x1.toFixed(1)+'px');
  st.setProperty('--sy0', m.y0.toFixed(1)+'px');
  st.setProperty('--sy1', m.y1.toFixed(1)+'px');
  st.setProperty('--seam', m.seam.toFixed(1)+'px');
  st.setProperty('--tTop', (-(zy(m.seam)-EDGE)).toFixed(1)+'px');
  st.setProperty('--tBot', ((m.vh-zy(m.seam))-EDGE).toFixed(1)+'px');
  return m;
}
function playOpening(done){
  const wrap=document.getElementById('wrap'), opening=document.getElementById('opening'),
        splash=document.getElementById('splash'), hud=document.getElementById('hud');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let finished=false, safetyTimer=0;
  const finish=()=>{
    if(finished) return;
    finished=true; clearTimeout(safetyTimer);
    wrap.classList.remove('op'); wrap.style.setProperty('--z','0'); wrap.style.setProperty('--uf','1');
    if(opening){ opening.classList.remove('show'); opening.style.opacity=''; }
    splash.classList.remove('zooming'); splash.style.display='none'; splash.style.opacity='';
    if(hud) hud.style.opacity='';
    done && done();
  };
  // 低畫質裝置跳過大圖縮放、雙層畫軸位移與全畫面 blur；這些 DOM 合成成本
  // 和 Canvas DPR 無關，在手機上即使戰鬥畫質最低仍會造成開局嚴重掉幀。
  if(meta.quality==='low' || reduce || openingSeen){ finish(); return; }
  openingSeen=true;
  applyOpeningVars();
  splash.classList.add('zooming');                       // 首頁保持可見,跟著鏡頭一起推近
  opening.classList.add('show'); opening.style.opacity='1';
  wrap.classList.add('op');
  wrap.style.setProperty('--z','0'); wrap.style.setProperty('--uf','0');
  wrap.style.setProperty('--uiFade','1');
  if(hud) hud.style.opacity='0';
  const ease=t=>1-Math.pow(1-t,3), easeIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const t0=performance.now(), HOLD=0, ZOOM=1100, UNFURL=1400, HUDF=520;
  // 手機掉幀、切到背景或瀏覽器暫停 rAF 時，仍必須完成收尾並打開選陣。
  safetyTimer=setTimeout(finish,HOLD+ZOOM+UNFURL+HUDF+700);
  function frame(now){
    if(finished) return;
    const t=now-t0;
    const z  = t<=HOLD ? 0 : ease(Math.min(1,(t-HOLD)/ZOOM));
    const uf = t<=HOLD+ZOOM ? 0 : easeIO(Math.min(1,(t-HOLD-ZOOM)/UNFURL));
    wrap.style.setProperty('--z', z.toFixed(4));
    wrap.style.setProperty('--uf', uf.toFixed(4));
    wrap.style.setProperty('--uiFade', Math.max(0, 1-Math.max(0,(z-0.42)/0.46)).toFixed(3));
    // 畫軸與桌面同步縮放、全程重合,鏡頭到底後桌面隱去,只剩兩截捲軸;抵達邊緣再淡出
    splash.style.opacity = uf>0 ? Math.max(0,1-uf/0.3).toFixed(3) : '1';
    opening.style.opacity = uf>0.72 ? Math.max(0,1-(uf-0.72)/0.28).toFixed(3) : '1';
    if(hud) hud.style.opacity=Math.max(0,Math.min(1,(t-HOLD-ZOOM-UNFURL*0.5)/HUDF)).toFixed(3);
    if(t < HOLD+ZOOM+UNFURL+HUDF) requestAnimationFrame(frame); else finish();
  }
  requestAnimationFrame(frame);
}
function start(mode){
  // 新局永遠使用完整戰場圖層。效能隔離工具可能在首頁留下 NODRAW / DRAWLV 狀態，
  // 不可讓那個除錯狀態帶進正式戰鬥而令玩家與敵人同時消失。
  NODRAW=false; DRAWLV=9;
  const bossTest=mode==='boss'||mode==='boss-fast';
  const fastRestart=mode==='boss-fast';
  dpsReset();
  // 新局不可繼承上一局/開場期間累積的邏輯與繪圖計時。
  resetBootClock();
  Object.assign(G,{running:true,paused:false,t:0,enemies:[],bossShots:[],swords:[],particles:[],inks:[],texts:[],stains:[],splashes:[],mists:[],commands:[],
    kills:0,waveKills:0,wave:bossTest?60:1,waveTimer:0,spawnAcc:0,eliteSpawned:{},webT:0,bossTest,bossShowcase:false,bossEntered:bossTest,chapterComplete:false,
    bossPreset60:false,bossFightFrames:0,bossKillSecs:null,hpLocked:false,xp:0,xpNeed:6,level:1,pendingLevels:0,mana:100,
    reserve:0,reserveT:0,reserveFlash:0,strokeAvg:0,strokeN:0,
    drops:[],lingers:[],edgeT:0,edgeReady:false,focus:0,focusIdle:0,focusReady:false,summonT:0,
    auto:false,autoUsed:false,autoTimer:0,
    shake:0,hitstop:0,flash:0,flashC:'255,255,255',banner:null,
    aim:0.85,facing:1,intent:0,streaks:[],cuts:[],anchors:[],anchorLinks:[],firstStrikeDone:false,respecWave:0,
    hurtT:0,castT:0,deathT:0,deathMax:56,heroPhase:Math.random()*9});
  renderAutoBtn();          // 開新局時 G.auto 已重設為 false,按鈕也要跟著回到「關」
  // 戰鬥樂不在這裡起 —— 開場過場有 3 秒,要留給首頁樂,過場結束才交棒(見下方 playOpening 回呼)
  SND.unlock(); SND.intensity(bossTest?60:1); SND.duck(false);
  // 以 runtime 建立本局狀態(含永久問道加成),再映射回 stat.*
  runState = INK_CONFIG.runtime.createRunState(buildPermanentSave(), 1);
  truthCooldown=0; truthFx=null; refreshTruthButton();
  syncStat();
  G.mana = stat.manaMax;
  G.player=new Player();
  if(ACTOR_POC) G.hpLocked=true;
  if(bossTest){
    G.player.y=H*BOSS_PLAYER_Y_RATIO;
    spawnXuanmingBoss(true);
    G.banner=null;
  }
  resetPauseState();
  resetLevelChoice();
  drawing=false; path=[]; curLen=0; maxed=false;
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('gameover').style.display='none';
  document.getElementById('meta').classList.remove('show');
  document.getElementById('pause').classList.remove('show');
  document.getElementById('bosstesttools').classList.toggle('show',bossTest);
  renderBossTestTools();
  updateHUD();
  computePlayTop();                       // HUD 此時顯示,量測頂部安全區
  requestAnimationFrame(computePlayTop);  // 佈局穩定後再量一次
  // 先完成入境畫軸；抵達第一境後才顯示四選一，選定前不生怪、不計時。
  G.paused=true;
  pendingFormationStart=()=>continueAfterFormation(fastRestart);
  if(fastRestart) drawStartingFormations();
  else playOpening(()=>{
    if(meta.quality==='low') SND.stopMenu(0);
    drawStartingFormations();
  });
}

function continueAfterFormation(fastRestart){
  if(BLADE_POC && INK_CONFIG.insightById[BLADE_POC]){
    INK_CONFIG.runtime.applyInsight(runState,BLADE_POC);
    syncStat();
  }
  G.paused=false;
  if(WAVE_POC===40||WAVE_POC===55){
    G.wave=WAVE_POC; G.waveTimer=0; G.waveKills=0; G.spawnAcc=0;
  }
  const p1=ENESPR.boss.p1, base='assets/boss/xuanming-p1/';
  const loadP1=(bucket,index,path)=>{ const img=new Image(); img.onload=()=>{ bucket[index]=img; p1.ok=p1.manifest.filter(Boolean).length===4; }; img.src=base+path; };
  for(let i=1;i<=4;i++) loadP1(p1.manifest,i-1,'BOSS_XUANMING_P1_manifest_'+String(i).padStart(2,'0')+'.png');
  for(let i=1;i<=3;i++) loadP1(p1.skill,i-1,'BOSS_XUANMING_P1_skill_'+String(i).padStart(2,'0')+'.png');
  for(let i=1;i<=4;i++) loadP1(p1.hurt,i-1,'BOSS_XUANMING_P1_hurt_'+String(i).padStart(2,'0')+'.png');
  for(let i=1;i<=4;i++){
    loadP1(p1.projectiles.heavyCore,i-1,'projectiles/BOSS_XUANMING_HEAVY_CORE_'+String(i).padStart(2,'0')+'.png');
    loadP1(p1.projectiles.ringWave,i-1,'projectiles/BOSS_XUANMING_RING_WAVE_'+String(i).padStart(2,'0')+'.png');
  }
  SND.startMusic();
  if(ACTOR_POC) spawnActorPocBlade();
}

function startTruthPoc(id){
  if(!INK_CONFIG.insightById[id]) return;
  start('boss-fast');
  const formation=INK_CONFIG.insights.find(item=>item.category==='formation');
  if(formation) INK_CONFIG.runtime.chooseStartingFormation(runState,formation.id);
  pendingFormationStart=null; resetLevelChoice(); G.paused=false;
  runState.activeTruth=id; stat.count=8; G.reserve=2; G.mana=Math.max(stat.manaMax,400); G.hpLocked=true;
  document.getElementById('splash').style.display='none';
  document.getElementById('overlay')?.classList.remove('show');
  const testTools=document.getElementById('bosstesttools');
  testTools.classList.add('show'); testTools.style.display='';
  truthCooldown=0; truthFx=null; refreshTruthButton(); updateHUD();
}

function spawnActorPocBlade(){
  if(!ACTOR_POC||!G.player) return;
  G.enemies=G.enemies.filter(en=>!en.actorPoc);
  const hp=999999;
  G.enemies.push({x:W*.5,y:Math.max(PLAY_TOP+115,H*.30),r:23,hp,max:hp,sp:0,c:'#352f43',tier:1,type:'blade',species:'actorPocBlade',speciesName:'墨刃兵 POC',ai:'seek',
    actorPoc:true,actorPocTick:0,contactDamage:0,xpValue:0,visualScale:1.42,visualHeight:72,animRate:.055,
    aiT:0,aiSeed:0,orbitDir:1,chargeX:0,chargeY:0,anim:0,ember:0,emberT:0,chill:0,hit:0,broken:0,wob:0,st:{}});
}

function renderBossTestTools(){
  const lock=document.getElementById('bosstestlock');
  if(!lock) return;
  lock.classList.toggle('on',!!G.hpLocked);
  lock.setAttribute('aria-pressed',G.hpLocked?'true':'false');
  lock.textContent=G.hpLocked?'鎖血中':'鎖血';
  const preset=document.getElementById('bosstestpreset');
  if(preset) preset.classList.toggle('on',!!G.bossPreset60);
}
function bossTestWave60Preset(){
  if(!G.bossTest||!G.player) return;
  // 無轉世加成的可重現第 60 境單體流派：59 次正式悟道，不直接竄改戰鬥數值。
  // 基準只選一條增劍路線。貫鋒滿階為 6 劍；再把開匣點滿會變 11 劍，
  // 自動御劍時多道連珠重疊成黑牆，既非代表性流派也無法目視檢查劍身。
  const plan={form_chain:5,momentum_swift:5,momentum_return:5,intent_erosion:5,intent_sever:5,
    cultivate_edge:5,cultivate_breath:5,cultivate_temper:5,cultivate_focus:5,cultivate_breadth:5,
    intent_restore:5,momentum_break:4};
  runState=INK_CONFIG.runtime.createRunState({},1);
  for(const id in plan) for(let i=0;i<plan[id];i++) INK_CONFIG.runtime.applyInsight(runState,id);
  G.level=60; G.xp=0; G.xpNeed=6;
  for(let lv=1;lv<60;lv++) G.xpNeed=Math.round(G.xpNeed*1.16+4);
  G.pendingLevels=0; G.bossPreset60=true; G.bossFightFrames=0; G.bossKillSecs=null;
  syncStat(); G.player.max=stat.hpMax; G.player.hp=G.player.max; G.mana=stat.manaMax;
  // 基準戰必須能量到玩家承壓；鎖血仍保留為獨立測試按鈕，不隨預設啟用。
  G.hpLocked=false; G.auto=false; G.autoUsed=false; G.autoTimer=0;
  G.commands.length=0; G.swords.length=0; G.bossShots.length=0; dpsReset();
  const boss=G.enemies.find(en=>en.isBoss&&!en.showcaseGhost);
  if(boss){ boss.hp=boss.max; boss.phaseSeen=1; boss.bossState='manifest'; boss.bossT=0;
    boss.bossSide=0; boss.bossAngle=-Math.PI/2; boss.attackSeq=0; boss.attackKind='triple'; boss.alpha=.08;
    placeBoss(boss,boss.bossAngle,bossOrbitRadius(boss.bossSide)); }
  document.getElementById('overlay').classList.remove('show');
  renderAutoBtn(); renderBossTestTools(); updateHUD();
}
function bossTestLevel(delta){
  if(!G.bossTest||!G.player) return;
  if(delta>0){
    // 測試升級必須走正式經驗入口，才能建立 pendingLevels、播放升級回饋並打開三選一。
    gainXP(Math.max(1,G.xpNeed-G.xp));
    return;
  }
  if(levelChoiceOpen()) return;
  const oldMax=G.player.max||1, ratio=Math.max(0,G.player.hp)/oldMax;
  G.level=Math.max(1,G.level-1);
  G.xp=0; G.xpNeed=Math.max(6,Math.round((G.xpNeed-4)/1.16));
  syncStat();
  G.player.max=stat.hpMax;
  G.player.hp=G.hpLocked?G.player.max:Math.max(1,Math.min(G.player.max,G.player.max*ratio));
  G.mana=Math.min(stat.manaMax,G.mana);
  G.banner={txt:'測試降級 · '+G.level,life:1};
  updateHUD();
}
function toggleBossTestHpLock(){
  if(!G.bossTest||!G.player) return;
  G.hpLocked=!G.hpLocked;
  if(G.hpLocked) G.player.hp=G.player.max;
  renderBossTestTools(); updateHUD();
}
function bossTestSwordCount(delta){
  if(!G.bossTest||!runState) return;
  runState.stats.swordCount=Math.max(1,Math.min(12,(runState.stats.swordCount|0)+delta));
  syncStat();
  G.banner={txt:'測試飛劍 · '+stat.count,life:1};
  updateHUD();
}
function bossTestNextPhase(){
  if(!G.bossTest) return;
  const en=G.enemies.find(x=>x.isBoss); if(!en) return;
  const p=bossPhase(en),ratio=p===1?.69:p===2?.39:.99;
  en.hp=Math.max(1,en.max*ratio); en.attackKind=p===1?'ring':'triple';
  en.attackSeq=(en.attackSeq||0)+1;
  updateHUD();
}
function bossTestFourDirections(){
  if(!G.bossTest) return;
  const real=G.enemies.find(en=>en.isBoss&&!en.showcaseGhost); if(!real) return;
  G.enemies=G.enemies.filter(en=>!en.showcaseGhost);
  G.bossShowcase=((G.bossShowcase||0)+1)%3;
  const btn=document.getElementById('bosstestfour');
  if(btn){ btn.classList.toggle('on',!!G.bossShowcase);
    btn.textContent=G.bossShowcase===1?'四向·待機':G.bossShowcase===2?'四向·攻擊':'四向'; }
  if(!G.bossShowcase){ nextBossManifest(real); return; }
  G.bossShots.length=0; real.bossState=G.bossShowcase===2?'lunge':'orbit'; real.bossT=G.bossShowcase===2?32:0; real.alpha=1;
  for(let side=0;side<4;side++){
    const en=side===0?real:Object.assign({},real,{showcaseGhost:true,st:{}});
    en.bossSide=side; en.bossAngle=[-Math.PI/2,0,Math.PI/2,Math.PI][side];
    placeBoss(en,en.bossAngle,bossOrbitRadius(side)); en.face=Math.atan2(G.player.y-en.y,G.player.x-en.x);
    if(side>0) G.enemies.push(en);
  }
  G.banner={txt:'四向比例檢視',life:1}; updateHUD();
}
// 隱藏測試局專用：只召出一隻高血量墨牙獸，讓移動→蓄勢→撲擊→落地完整循環可重現。
function bossTestFang(){
  if(!G.bossTest||!G.player) return;
  const kind=ENEMY_KINDS.find(k=>k.id==='fang'); if(!kind) return;
  G.enemies.length=0; G.bossShots.length=0; G.commands.length=0; G.swords.length=0; G.anchors.length=0; G.anchorLinks.length=0;
  G.wave=34; G.waveTimer=0; G.spawnAcc=0; G.hpLocked=true; G.player.hp=G.player.max;
  const hp=999999;
  G.enemies.push({x:W*.82,y:H*.34,r:kind.r,hp,max:hp,sp:kind.sp,
    c:kind.c,tier:kind.tier,type:kind.type,species:kind.id,speciesName:kind.name,ai:kind.ai,
    contactDamage:0,xpValue:0,visualScale:kind.visualScale,visualHeight:kind.visualHeight,animRate:kind.animRate,
    aiT:0,aiSeed:0,orbitDir:1,chargeX:0,chargeY:0,anim:0,ember:0,emberT:0,chill:0,
    hit:0,broken:0,wob:0,st:{},facing:1});
  G.banner=null; renderBossTestTools(); updateHUD();
}
// ---------- 暫停 / 繼續 ----------
// 隕落:有專屬 death 幀 → 播 7 幀;否則(女修)→ 程式化墨消散(sprite 淡出 + 潑墨爆散)。
// 播完才進結算畫面;完全無 sprite 時直接結算。
function beginDeath(){
  if(G.deathT>0) return;
  drawing=false; path=[]; G.hurtT=0; G.castT=0; G.commands.length=0; G.swords.length=0; G.anchors.length=0; G.anchorLinks.length=0;
  const S=heroSet();
  if(!S.ok){ gameOver(); return; }
  const hasDeath=!!(S.death&&S.death.length);
  G.deathMax = hasDeath ? 63 : 56;                   // 有幀 7×9;程式消散 ~56 影格
  G.deathT = G.deathMax;
  if(!hasDeath){                                     // 程式消散:當場炸開一團墨,再由 update 續噴
    const P=G.player;
    splash(P.x, P.y-P.r*1.4, '#2b2620', 2.8);
    for(let k=0;k<30;k++) ink(P.x+(Math.random()-.5)*34, P.y-P.r*1.6+(Math.random()-.5)*70,
      (Math.random()-.5)*5.5, (Math.random()-.5)*5.5-0.8, 10+Math.random()*20);
    stain(P.x, P.y+P.r*0.6, P.r*1.6, '44,38,32');
    shake(10); flash(0.14,'40,34,28');
  }
  SND.over();
}
function gameOver(){
  G.running=false; G.pendingLevels=0; if(!heroSet().ok) SND.over();
  document.getElementById('bosstesttools').classList.remove('show');
  resetLevelChoice();
  drawing=false; path=[]; curLen=0; maxed=false;
  document.getElementById('overlay').classList.remove('show');
  // 墨魂結算(用過自動御劍:收益減半且不計歷史最佳)
  let earned = G.kills + G.wave*5 + G.level*3;
  const autoed = G.autoUsed;
  if(autoed) earned = Math.floor(earned*0.5);
  meta.souls += earned;
  let nb=false;
  if(!autoed){
    nb = G.kills>meta.best.kills;
    if(G.kills>meta.best.kills) meta.best.kills=G.kills;
    if(G.wave >meta.best.wave)  meta.best.wave =G.wave;
    if(G.level>meta.best.level) meta.best.level=G.level;
  }
  saveMeta();
  // 下一個快解鎖的目標
  let hint='';
  const nxt = nextGoal();
  if(nxt){ const need=Math.max(0,nxt.cost-meta.souls);
    hint = need>0 ? '再積 <b style="color:#c08a2e">'+need+'</b> 墨魂可習得〈'+nxt.name+'〉'
                  : '墨魂已足以習得〈'+nxt.name+'〉，速入轉世閣'; }
  const line=(k,l,w)=>'斬妖 '+k+' · 道行 '+num2cn(l)+' 重 · 第 '+num2cn(w)+' 境';
  document.getElementById('finaltxt').innerHTML=
      '<div class="fsec"><div class="fh">此 世</div>'
    +   '<div class="fl">'+line(G.kills,G.level,G.wave)
    +   (nb?' <span style="color:#c08a2e">✦ 新猷</span>':'')+'</div></div>'
    + '<div class="fsec"><div class="fh">歷 史 最 佳</div>'
    +   '<div class="fl">'+line(meta.best.kills,meta.best.level,meta.best.wave)+'</div></div>'
    + '<div class="fsec">'
    +   '<div class="fl">獲得墨魂 <b>+'+earned+'</b></div>'
    +   '<div class="fl">現有墨魂 <b>'+meta.souls+'</b></div>'
    +   (autoed?'<div class="fnote">自動御劍 · 收益減半且不計紀錄</div>':'')
    +   (hint?'<div class="fnote">'+hint+'</div>':'')
    + '</div>';
  document.getElementById('gameover').style.display='flex';
}
// 挑一個「最接近解鎖」的目標:所有前置已達成、尚未圓滿的節點中最便宜的一個
function nextGoal(){
  let best=null;
  for(const v of rebirthView()){
    if(v.rank>=v.maxRank || v.purchase.reason==='requirements') continue;
    const c = v.purchase.cost!=null ? v.purchase.cost : v.costs[v.rank];
    if(c!=null && (!best||c<best.cost)) best={name:v.name,cost:c};
  }
  return best;
}

// ---------- 轉世閣 UI(改走 runtime:getRebirthView / purchaseRebirth)----------
function rebirthView(){ return INK_CONFIG.runtime.getRebirthView(buildPermanentSave()); }
// 前置條件轉中文(getRebirthView 回報 requirements 未達時顯示)
// ---------- 洗點:重塑劍意 ----------
// 規則:僅暫停畫面(靜觀)可用 —— 戰鬥進行中禁止;每波次至多一次,避免戰鬥中反覆洗;
//       費用 = calcResetCost(本局已重塑次數)(首次為 0),有洗墨丹則優先抵免。
function respecInfo(){
  const inRun = !!(G.running && runState);
  const times = inRun ? (runState.resetInsightTimes||0) : 0;
  const cost  = INK_CONFIG.runtime.calcResetCost(times);
  const pills = meta.inkPills||0;
  const usedThisWave = inRun && G.respecWave===G.wave;
  let pay='免費', usePill=false, ok=true, why='';
  if(cost>0){
    if(pills>0){ pay='洗墨丹 ×1(存 '+pills+')'; usePill=true; }
    else { pay=cost+' 墨魂(存 '+meta.souls+')'; if(meta.souls<cost){ ok=false; why='墨魂不足'; } }
  }
  if(!inRun){ ok=false; why='未在局中'; }
  else if(usedThisWave){ ok=false; why='本波已重塑 · 下一波再凝神'; }
  return {inRun,times,cost,pills,pay,usePill,ok,why};
}
function doRespec(state){
  if(state.usePill) meta.inkPills=Math.max(0,(meta.inkPills||0)-1);
  else if(state.cost>0) meta.souls-=state.cost;
  saveMeta();
  runState.resetInsightTimes=(runState.resetInsightTimes||0)+1;
  G.respecWave=G.wave;
  INK_CONFIG.runtime.resetAllInsights(runState);
  syncStat();
  G.mana=Math.min(G.mana,stat.manaMax);
  G.enemies.forEach(enemy=>{ enemy.st={}; });
  floatText(G.player.x,G.player.y-40,'劍意重塑','#7a5a2b');
  SND.pick(); flash(0.16,'240,232,210');
  updateHUD();
}
// 自動御劍開關
function renderAutoBtn(){
  const b=document.getElementById('autobtn');
  b.innerHTML='<span class="vt"><b>御</b><b>劍</b></span>';
  b.classList.toggle('on',!!G.auto);
  b.setAttribute('aria-pressed',String(!!G.auto));
  b.title=G.auto?'自動御劍：開':'自動御劍：關';
}
function toggleAuto(){
  if(!G.running) return;
  G.auto=!G.auto; SND.ui();
  renderAutoBtn();
}
// ---------- 音量設定 ----------
// 暫停時背景樂是完全停止的,拖音樂拉桿會聽不到。這裡讓它暫時響起試聽,
// 停止拖曳 1.6 秒後若仍在暫停中就再次靜下。

// 音律開關(記錄於本機)

// ---------- 商城 ----------

// 點按潑墨回饋:任何 .btn 按下時,在指標處炸開一團墨(中央墨塊+飛濺墨滴+淡光圈)
function inkSplashAt(x,y){
  let layer=document.getElementById('inkfx');
  if(!layer){ layer=document.createElement('div'); layer.id='inkfx'; document.body.appendChild(layer); }
  const wrap=document.createElement('div'); wrap.style.position='absolute'; wrap.style.left=x+'px'; wrap.style.top=y+'px';
  const ring=document.createElement('div'); ring.className='ink-splat';
  ring.style.left='0'; ring.style.top='0'; ring.style.width='64px'; ring.style.height='64px';
  ring.style.background='radial-gradient(rgba(232,222,198,.30),rgba(232,222,198,0) 70%)';
  ring.style.animation='inkRing .5s ease-out forwards'; wrap.appendChild(ring);
  for(let i=0;i<4;i++){ const c=document.createElement('div'); c.className='ink-splat';
    const s=(18+Math.random()*22); c.style.left=((Math.random()-.5)*16)+'px'; c.style.top=((Math.random()-.5)*16)+'px';
    c.style.width=s+'px'; c.style.height=s+'px'; c.style.animation='inkCore .5s ease-out forwards'; wrap.appendChild(c); }
  const n=9+((Math.random()*5)|0);
  for(let i=0;i<n;i++){ const d=document.createElement('div'); d.className='ink-splat';
    const ang=Math.random()*6.283, dist=30+Math.random()*70, s=3+Math.random()*8;
    d.style.left='0'; d.style.top='0'; d.style.width=s+'px'; d.style.height=s+'px';
    d.style.setProperty('--dx',(Math.cos(ang)*dist).toFixed(1)+'px');
    d.style.setProperty('--dy',(Math.sin(ang)*dist).toFixed(1)+'px');
    d.style.animation='inkOut '+(0.45+Math.random()*0.25).toFixed(2)+'s ease-out forwards'; wrap.appendChild(d); }
  layer.appendChild(wrap); setTimeout(()=>wrap.remove(), 850);
}
const ART_CATEGORY_NAME={form:'劍陣',momentum:'劍行',intent:'劍痕',cultivation:'劍稟',blade:'劍型',truth:'真意'};
const ART_RANK_NAME=['零階','一階','二階','三階','四階','五階'];
function artTierName(rank){ return ART_RANK_NAME[Math.max(0,Math.min(5,Number(rank)||0))]; }
function renderSwordArts(){
  const list=document.getElementById('artslist'); if(!list) return;
  const learned=INK_CONFIG.insights.filter(a=>runState&&Number(runState.ranks[a.id]||0)>0);
  if(!learned.length){ list.innerHTML='<div class="artempty">尚未習得劍訣</div>'; return; }
  const groups={}; for(const a of learned) (groups[a.category]||(groups[a.category]=[])).push(a);
  list.innerHTML=Object.keys(groups).map(cat=>'<section class="artgroup"><h3>'+ART_CATEGORY_NAME[cat]+'</h3>'+
    groups[cat].map(a=>{ const rank=Number(runState.ranks[a.id]||0);
      const totals=INK_CONFIG.runtime.cumulativeEffectLines(a,rank);
      const tier=runState.tierLevel?.[a.id]||0, kills=runState.tierKills?.[a.id];
      const mastery=tier>0?['','小成','大成','圓滿'][tier]:(kills==null?'':'精進中');
      const killText=kills==null?'':' · '+kills+' 斬';
      return '<div class="artrow"><div class="arttitle"><b>'+a.name+'</b><span>'+artTierName(rank)+(mastery?' · '+mastery:'')+killText+'</span></div>'+
        '<ul class="arttotals">'+totals.map(line=>'<li>'+line+'</li>').join('')+'</ul></div>'; }).join('')+'</section>').join('');
}
function toggleSwordArts(force){
  const panel=document.getElementById('artsPanel'), open=force==null?!panel.classList.contains('show'):!!force;
  if(open) renderSwordArts(); panel.classList.toggle('show',open); panel.setAttribute('aria-hidden',String(!open));
  if(G.running) G.paused=open||isPausedByUser();
  if(!meta.mute) SND.ui();
}
renderSoundButton(); bindVolumeSettings(); renderVolumeSettings();
// 首次互動即解鎖音訊(瀏覽器自動播放限制);還在首頁就淡入首頁 BGM(game_op_loop,Loop)。
// 這裡刻意不用 {once:true}:玩家很可能第一下就點在靜音鍵上、或當下 meta.mute 還是開的,
// 一旦把唯一一次機會用掉,之後整局都不會再有首頁樂。改為「播起來才解除監聽」。
function startMenuFromGesture(){
  SND.unlock();
  if(G.running||meta.mute) return false;
  SND.startMenu();
  return SND.menuPlaying();
}
bindHeroChoices();
// 劍訣精進:列出已滿階的悟道與三層進度。滿階那一刻才開始累計,所以沒滿階的不列。
// 左上狀態列與右上吊牌切齊下緣。吊牌的高度含固定 20px 間距與字級 clamp 下限,
// 那些不隨 cqw 縮放,所以純比例在窄螢幕一定會有落差(實測 941 寬差 28px、360 寬差 41px)。
// 改成量完版面再把差額平均補到兩個行距上,任何寬度都會對齊。
function alignHud(){
  /* 新 HUD 各區依參考稿獨立定位，不再強迫左右下緣對齊。 */
  computePlayTop();   // HUD 佈局(含字體載入後)變動時,重新量測頂部安全區
}
bindSettingsSegments();
applyQuality();
// 字體載入後版面會再變一次,所以多對一次
alignHud();
if(document.fonts && document.fonts.ready) document.fonts.ready.then(()=>requestAnimationFrame(alignHud));
setTimeout(alignHud, 600);
bindPauseTabs();
// 靜觀面板:拖曳捲動。捲軸已隱藏,滑鼠沒有把手可抓,所以讓空白處也能拖。
// 落在滑桿/按鈕/可點元素上的拖曳不接管,避免把調音量變成捲頁面。
uiEnableDragScroll('pausepanel');
uiEnableDragScroll('metabox');
uiEnableDragScroll('shopbox');
function handleGlobalKeydown(e){
  if(e.key==='Escape'||e.key==='p'||e.key==='P'){ e.preventDefault(); togglePause(); }
  else if(e.key==='a'||e.key==='A'){ e.preventDefault(); toggleAuto(); }
  else if(e.key==='m'||e.key==='M'){ e.preventDefault(); toggleSound(); }
  else if(e.key==='f'||e.key==='F'){ e.preventDefault(); toggleDiag(); }
  else if(FXKEY[e.key]){ e.preventDefault(); const k=FXKEY[e.key][0]; FX[k]=!FX[k];
    DIAG.hist.length=0; if(!DIAG.on) toggleDiag(); }
  else if(e.key==='7'){ e.preventDefault(); NOAUDIO=!NOAUDIO;
    SND.hardMute(NOAUDIO); DIAG.hist.length=0; if(!DIAG.on) toggleDiag(); }
  else if(e.key==='b'||e.key==='B'){
    e.preventDefault();
    if(!G.running){
      const b=document.getElementById('bosstestbtn');
      b.classList.toggle('show');
      if(b.classList.contains('show')) b.focus();
    }
  }
  else if((e.key==='v'||e.key==='V')&&!G.running){ e.preventDefault(); bisectDraw(); }
  else if((e.key==='n'||e.key==='N')&&!G.running){ e.preventDefault(); bisectMicro(); }
  else if((e.key==='k'||e.key==='K')&&!G.running){ e.preventDefault(); bisectPage(); }   // P 已是暫停,改用 K
  else if(e.key==='9'&&!G.running){ e.preventDefault(); NODRAW=!NODRAW;
    DIAG.hist.length=0; if(!DIAG.on) toggleDiag(); }
  else if(e.key==='0'&&!G.running){ e.preventDefault();
    const off=Object.keys(FX).some(k=>FX[k]);
    Object.keys(FX).forEach(k=>FX[k]=!off);
    DIAG.hist.length=0; if(!DIAG.on) toggleDiag(); }
}

let lastLoopErrorAt=0;
configureBoot({
  diagFrame:ts=>diagFrame(ts), getDiag:()=>DIAG, getFps:()=>meta.fps,
  isNoDraw:()=>NODRAW, update:()=>update(), draw:()=>{ draw(); drawTruthFx(); },
  degradeQuality:()=>{
    if(meta.quality==='low'&&!FX.vig&&!FX.trail&&!FX.ink&&!FX.part&&!FX.glow) return;
    meta.quality='low'; applyQuality(); saveMeta();
  },
  onLoopError:error=>{
    // 單幀錯誤後清掉時間欠步，避免恢復時補算暴衝；保留下一幀繼續運作。
    resetBootClock();
    const now=performance.now();
    if(!lastLoopErrorAt||now-lastLoopErrorAt>1000){
      lastLoopErrorAt=now;
      console.error('[Inkblade] recovered frame error',error);
    }
  }
});
bindBootEvents({
  inkSplashAt,
  stamp,
  canvas:{down,move,up,cancel:cancelDraw},
  menuGesture:startMenuFromGesture,
  keydown:handleGlobalKeydown,
  clicks:{
    startbtn:start, bosstestbtn:()=>start('boss'), bosstestswordup:()=>bossTestSwordCount(1),
    bosstestsworddown:()=>bossTestSwordCount(-1), bosstestpreset:bossTestWave60Preset,
    bosstestup:()=>bossTestLevel(1), bosstestdown:()=>bossTestLevel(-1), bosstestphase:bossTestNextPhase,
    bosstestfour:bossTestFourDirections, bosstestfang:bossTestFang, bosstestlock:toggleBossTestHpLock,
    bosstestretry:()=>start('boss-fast'), againbtn:start, metabtn:uiOpenMeta, splashmetabtn:uiOpenMeta,
    metaplaybtn:start, metaclosebtn:uiCloseMeta, swordartsbtn:()=>toggleSwordArts(true),
    artsclose:()=>toggleSwordArts(false), artsPanel:e=>{ if(e.target.id==='artsPanel') toggleSwordArts(false); },
    pausebtn:()=>togglePause(), autobtn:toggleAuto, truthbtn:castActiveTruth, rerollbtn:rerollCards,
    sndbtn:toggleSound, resumebtn:()=>togglePause(false), respecbtn:requestRespec,
    pausequitbtn:()=>{ togglePause(false); gameOver(); }, splashshopbtn:uiOpenShop,
    metashopbtn:uiOpenShop, shopclosebtn:uiCloseShop
  }
});
startBoot();
if(TRUTH_POC) setTimeout(()=>startTruthPoc(TRUTH_POC),1400);
})();
