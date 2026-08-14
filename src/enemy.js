import { G, stat } from './core.js';
import { W, H, PLAY_TOP } from './viewport.js';

let hooks={};
export function configureEnemy(nextHooks){ hooks=nextHooks||{}; }

export function onScreen(en){
  return en.x>=-en.r && en.x<=W+en.r && en.y>=-en.r && en.y<=H+en.r;
}

export const ENEMY_KINDS=[
  {id:'wisp',    name:'游墨', unlock:1,  type:'inkling',tier:0,hp:13,r:14,sp:.88,dmg:6,xp:1,c:'#51433f',ai:'seek',visualHeight:44,animRate:.075,
    weight:w=>Math.max(10,62-w*.85)},
  {id:'weaver',  name:'織影', unlock:5,  type:'inkling',tier:0,hp:10,r:12,sp:1.22,dmg:6,xp:1,c:'#3f4b50',ai:'weave',visualHeight:44,animRate:.105,
    weight:w=>18+Math.min(18,(w-5)*.55)},
  {id:'bulwark', name:'墨甲', unlock:10, type:'blade',   tier:1,hp:46,r:23,sp:.57,dmg:12,xp:2,c:'#352f43',ai:'seek',visualScale:1.42,visualHeight:72,animRate:.055,
    weight:w=>12+Math.min(22,(w-10)*.58)},
  {id:'orbiter', name:'環煞', unlock:17, type:'inkling',tier:1,hp:27,r:17,sp:.96,dmg:10,xp:2,c:'#334842',ai:'orbit',visualHeight:44,animRate:.085,
    weight:w=>11+Math.min(20,(w-17)*.62)},
  {id:'raven',   name:'墨羽妖',unlock:22, type:'raven',   tier:1,hp:24,r:16,sp:1.02,dmg:11,xp:2,c:'#3f2828',ai:'swoop',visualScale:1,visualHeight:58,animRate:.08,
    weight:w=>9+Math.min(20,(w-22)*.68)},
  {id:'charger', name:'破陣', unlock:27, type:'blade',   tier:1,hp:35,r:19,sp:.72,dmg:15,xp:3,c:'#533633',ai:'charge',visualScale:1.38,visualHeight:72,animRate:.07,
    weight:w=>9+Math.min(22,(w-27)*.72)},
  {id:'fang',    name:'墨牙獸',unlock:34, type:'fang',    tier:2,hp:76,r:27,sp:.76,dmg:19,xp:4,c:'#40372a',ai:'pounce',visualScale:1,visualHeight:62,animRate:.06,
    weight:w=>8+Math.min(22,(w-34)*.88)},
  {id:'reaver',  name:'劫墨', unlock:41, type:'blade',   tier:2,hp:105,r:29,sp:.68,dmg:20,xp:5,c:'#292f35',ai:'reaver',visualScale:1.48,visualHeight:72,animRate:.065,
    weight:w=>8+Math.min(28,(w-41)*1.35)}
];

export function waveEnemyKind(w){
  const pool=ENEMY_KINDS.filter(k=>w>=k.unlock);
  const decade=(w%10===0), surge=(w%5===0);
  let total=0, weights=pool.map(k=>{
    let n=k.weight(w);
    if(decade && (k.id==='bulwark'||k.id==='fang'||k.id==='reaver')) n*=1.85;
    if(surge && (k.id==='weaver'||k.id==='raven'||k.id==='charger')) n*=1.55;
    total+=n; return n;
  });
  let roll=Math.random()*total;
  for(let i=0;i<pool.length;i++){ roll-=weights[i]; if(roll<=0)return pool[i]; }
  return pool[0];
}

export function waveDifficulty(w){
  const x=Math.max(0,w-1);
  return {
    hp:1+x*.065+x*x*.00165,
    speed:1+Math.min(.34,x*.006),
    damage:1+Math.min(.72,x*.012),
    spawn:.58+w*.082+Math.floor(w/10)*.16+(w%5===0?.55:0),
    cap:Math.min(66,18+Math.floor(w*.78))
  };
}

export function spawnEnemy(){
  const edge=Math.floor(Math.random()*4); let x,y;
  const M=8,top=Math.max(M,PLAY_TOP);
  if(edge===0){ x=Math.random()*W; y=top; }
  else if(edge===1){ x=W-M; y=top+Math.random()*Math.max(1,H-top-M); }
  else if(edge===2){ x=Math.random()*W; y=H-M; }
  else { x=M; y=top+Math.random()*Math.max(1,H-top-M); }
  const kind=waveEnemyKind(G.wave),q=waveDifficulty(G.wave),hp=kind.hp*q.hp;
  G.enemies.push({x,y,r:kind.r,hp,max:hp,sp:kind.sp*q.speed,
    c:kind.c,tier:kind.tier,type:kind.type,species:kind.id,speciesName:kind.name,ai:kind.ai,
    contactDamage:Math.round(kind.dmg*q.damage),xpValue:kind.xp,visualScale:kind.visualScale,visualHeight:kind.visualHeight,animRate:kind.animRate,
    aiT:(Math.random()*120)|0,aiSeed:Math.random()*6.283,orbitDir:Math.random()<.5?-1:1,
    chargeX:0,chargeY:0,anim:Math.random()*1000,ember:0,emberT:0,chill:0,hit:0,broken:0,wob:Math.random()*7,st:{}});
}

export function eliteSpiderCountForWave(w){ return w===30?1:w===40?2:w===55?3:0; }

export function spawnNetherSpider(w=30,count=1){
  const q=waveDifficulty(w),hp=850*q.hp;
  for(let i=0;i<count;i++){
    const x=count===1?W*.5:W*(.28+.44*(i/(count-1)));
    G.enemies.push({x,y:Math.max(18,PLAY_TOP+42+(i%2)*18),r:42,hp,max:hp,sp:.78*q.speed,c:'#173e31',tier:2,type:'spider',
      species:'netherSpider',speciesName:'幽冥墨蛛',ai:'spider',isElite:true,
      contactDamage:Math.round(24*q.damage),xpValue:12,aiT:i*17,aiSeed:Math.random()*6.283,orbitDir:i%2?-1:1,
      chargeX:0,chargeY:1,anim:i*41,ember:0,emberT:0,chill:0,hit:0,broken:0,wob:Math.random()*7,st:{}});
  }
  G.banner={txt:'第 '+w+' 境 · 幽冥墨蛛 ×'+count,life:1};
  if(hooks.floatText) hooks.floatText(W*.5,H*.22,'小精英現形','#25684f');
  if(hooks.playWave) hooks.playWave();
  if(hooks.flash) hooks.flash(.12,'190,225,205');
}

export const XUANMING_HP=600000;
export const XUANMING_CONFIG={
  baseHP:XUANMING_HP,
  phaseThresholds:[.70,.35,.10],
  moveBounds:{xMin:.16,xMax:.84,yMin:.20,yMax:.40},
  evade:{charges:2,rechargeFrames:240,cooldownFrames:72,submergeMaxFrames:120},
  defense:{rollingWindowFrames:72,triggerRatio:.07,cooldownFrames:300,coilFrames:90,coilDamageReduction:.60},
  phase3:{bodyDamageMultiplier:.20,headDamageMultiplier:1.0},
  attacks:{
    headLunge:{telegraph:33,active:15,recovery:51},
    inkBreath:{telegraph:48,active:90,recovery:45},
    tailSlash:{telegraph:27,active:21,recovery:42},
    inkOrbs:{telegraph:21,shots:3,recovery:33},
    breakInk:{telegraph:36,active:12,recovery:45},
    doubleShadow:{telegraph:54,recovery:48},
    coilSky:{telegraph:42,loops:2,recovery:60},
    inkTide:{telegraph:48,active:72,recovery:54},
    xuanmingPierce:{telegraph:18,passes:3,recovery:48},
    xuanmingBreath:{telegraph:72,active:144,recovery:72},
    myriadHeads:{telegraph:54,headsMin:3,headsMax:5,recovery:54},
    coilField:{telegraph:54,loops:3,recovery:72}
  },
  assets:{
    idle:'boss_xuanming_idle',aim:'boss_xuanming_aim',lunge:'boss_xuanming_lunge',
    breathCharge:'boss_xuanming_breath_charge',twist:'boss_xuanming_twist',fastSwim:'boss_xuanming_fast_swim',
    coilGuard:'boss_xuanming_coil_guard',halfDissolve:'boss_xuanming_half_dissolve',
    phase3Head:'boss_xuanming_head_phase3',dying:'boss_xuanming_dying'
  }
};

export const BOSS_PLAYER_Y_RATIO=.64;

export function spawnXuanmingBoss(testMode){
  const hp=XUANMING_HP;
  const en={
    x:W*.5,y:H*.19,r:72,hp,max:hp,sp:0,c:'#211f1d',tier:2,type:'boss',isBoss:true,
    bossState:testMode?'manifest':'telegraph',bossT:testMode?28:0,bossSide:0,bossAngle:-Math.PI/2,bossHit:false,alpha:testMode?.72:.05,
    attackSeq:0,attackKind:'triple',phaseSeen:1,pendingPhase:0,
    evadeCharges:XUANMING_CONFIG.evade.charges,evadeCooldown:0,defenseCooldown:0,rollingDamage:0,
    anim:0,ember:0,emberT:0,chill:0,hit:0,broken:0,wob:Math.random()*7,st:{}
  };
  G.enemies.push(en);
  return en;
}

export function beginXuanmingWave(){
  for(const en of G.enemies){
    if(!en.isBoss && hooks.mistDissolve) hooks.mistDissolve(en.x,en.y,.72,'58,54,49');
  }
  G.enemies.length=0;
  G.bossShots.length=0;
  G.spawnAcc=0;
  G.waveTimer=0;
  G.wave=60;
  G.waveKills=0;
  G.bossEntered=true;
  G.chapterComplete=false;
  if(G.player) G.player.y=H*BOSS_PLAYER_Y_RATIO;
  const boss=spawnXuanmingBoss(false);
  G.banner=null;
  if(hooks.playWave) hooks.playWave();
  if(hooks.setIntensity) hooks.setIntensity(60);
  if(hooks.flash) hooks.flash(.18,'250,244,226');
  if(hooks.updateHUD) hooks.updateHUD();
  return boss;
}

export function completeXuanmingWave(en){
  if(!en || !en.isBoss || G.chapterComplete) return false;
  G.bossShots.length=0;
  G.wave=61;
  G.waveTimer=0;
  G.chapterComplete=true;
  if(G.bossTest&&G.bossPreset60) G.bossKillSecs=(G.bossFightFrames||0)/60;
  G.banner={txt:G.bossKillSecs!=null?'基準擊破 · '+G.bossKillSecs.toFixed(1)+'秒':'玄冥墨蛟 · 墨散卷復',life:1};
  if(hooks.stopMusic) hooks.stopMusic(1.2);
  if(hooks.updateHUD) hooks.updateHUD();
  return true;
}

export function bossPhase(en){
  const r=en?en.hp/en.max:1;
  return r>.70?1:r>.35?2:3;
}

export function bossVisualLift(side){ return side===0?-24:side===2?-42:0; }

export function bossOrbitRadius(side){
  const visualR=Math.max(210,Math.min(300,W*.48,Math.min(W,H)*.46));
  if(side===0) return visualR+bossVisualLift(0);
  if(side===2) return visualR-bossVisualLift(2);
  return visualR;
}

export function placeBoss(en,ang,r){
  // 玄冥墨蛟固定盤踞於玩家前方。攻擊狀態可以改變動作，但不再幻型到四側。
  en.bossSide=0;
  en.bossAngle=-Math.PI/2;
  en.x=W*.5;
  en.y=H*.38-bossVisualLift(0);
}

export function bossSafeSide(en){
  return 0;
}

export function bossMoveToSide(en,side,state){
  en.bossSide=0;
  en.bossAngle=-Math.PI/2;
  placeBoss(en,en.bossAngle,bossOrbitRadius(0));
  en.bossState=state; en.bossT=0; en.bossHit=false;
}

export function nextBossManifest(en){
  bossMoveToSide(en,bossSafeSide(en),'telegraph');
  en.alpha=.06;
  en.attackSeq=(en.attackSeq||0)+1;
  const ratio=en.hp/en.max;
  en.attackKind=ratio>.7?'triple':ratio>.4?'ring':((en.attackSeq&1)?'ring':'triple');
  placeBoss(en,en.bossAngle,bossOrbitRadius(en.bossSide));
}

export function updateBossP1(en){
  const entering=bossPhase(en);
  if(entering>(en.phaseSeen||1)) en.pendingPhase=Math.max(en.pendingPhase||0,entering);
  en.bossT++;
  const R=bossOrbitRadius(en.bossSide); let state=en.bossState;
  if(en.pendingPhase>(en.phaseSeen||1)&&(state==='orbit'||state==='telegraph')){
    en.phaseSeen=en.pendingPhase; en.pendingPhase=0; en.bossState='phase'; state='phase'; en.bossT=0; en.bossHit=false;
    G.bossShots.length=0;
    if(hooks.shake) hooks.shake(7);
    if(hooks.flash) hooks.flash(.16,'238,226,204');
  }
  const telegraphFrames=G.bossTest?34:72;
  const manifestFrames=G.bossTest?28:42;
  const orbitFrames=G.bossTest?54:100;
  if(state==='phase'){
    placeBoss(en,en.bossAngle,R);
    en.alpha=1;
    if(en.bossT%3===0) bossDissolveMist(en);
    if(en.bossT>=90) nextBossManifest(en);
  } else if(state==='telegraph'){
    placeBoss(en,en.bossAngle,R); en.alpha=1;
    if(en.bossT>=telegraphFrames){ en.bossState='manifest'; en.bossT=0; }
  } else if(state==='manifest'){
    placeBoss(en,en.bossAngle,R); en.alpha=1;
    if(en.bossT>=manifestFrames){ en.bossState='orbit'; en.bossT=0; en.alpha=1; }
  } else if(state==='orbit'){
    placeBoss(en,en.bossAngle,R); en.alpha=1;
    if(en.bossT>=orbitFrames){ placeBoss(en,en.bossAngle,R); en.bossState='lunge'; en.bossT=0; en.bossHit=false; }
  } else if(state==='lunge'){
    const t=Math.min(1,en.bossT/58);
    placeBoss(en,en.bossAngle,R); en.alpha=1;
    if(!en.bossHit&&t>=.68){
      en.bossHit=true;
      spawnBossAttack(en);
    }
    if(en.bossT>=58){ en.bossState='dissolve'; en.bossT=0; }
  } else if(state==='dissolve'){
    en.alpha=1;
    if(en.bossT>=46) nextBossManifest(en);
  }
  en.depth=Math.max(0,Math.min(1,(en.y-(G.player.y-R))/(R*2)));
  en.visualScale=2.12;
  en.lean=Math.max(-.16,Math.min(.16,(en.x-(en.px==null?en.x:en.px))*.025));
  en.face=Math.atan2(G.player.y-en.y,G.player.x-en.x);
  en.px=en.x; en.py=en.y;
  if(state==='dissolve'&&en.bossT%4===0) bossDissolveMist(en);
  if(en.hit>0) en.hit--;
}

export function bossDissolveMist(en){
  const f=en.face||0,progress=Math.min(1,en.bossT/46);
  for(let k=0;k<(progress<.68?3:1);k++){
    const local=-en.r*.85+en.r*1.55*Math.min(1,progress+Math.random()*.22);
    const side=(Math.random()-.5)*en.r*.75;
    const x=en.x+Math.cos(f)*local-Math.sin(f)*side;
    const y=en.y+Math.sin(f)*local+Math.cos(f)*side;
    G.mists.push({x,y,vx:-Math.sin(f)*(.35+Math.random()*.45)*(k%2?1:-1),
      vy:Math.cos(f)*(.2+Math.random()*.35)*(k%2?1:-1)-.28,
      r:18+Math.random()*24,age:0,dur:32+((Math.random()*18)|0),color:'38,35,32',
      squash:.32+Math.random()*.3,rot:f+(Math.random()-.5)*.8});
  }
  const sides=[-Math.PI/2,0,Math.PI/2,Math.PI],next=sides[(en.bossSide+1)%4];
  const R=bossOrbitRadius((en.bossSide+1)%4);
  if(progress>=.38){
    const mx=G.player.x+Math.cos(next)*R;
    const my=G.player.y+Math.sin(next)*R+bossVisualLift((en.bossSide+1)%4);
    const gather=Math.min(1,(progress-.38)/.62);
    G.mists.push({x:mx+(Math.random()-.5)*(1-gather)*42,y:my+(Math.random()-.5)*(1-gather)*34,
      vx:(mx-en.x)*.0015*(1-gather)-Math.sin(next)*.18,
      vy:(my-en.y)*.0015*(1-gather)+Math.cos(next)*.18-.08,
      r:18+Math.random()*14,age:0,dur:22+((Math.random()*9)|0),color:'40,37,33',
      squash:.28+Math.random()*.14,rot:next+Math.PI/2});
  }
}



export function killEnemy(idx){
  const en=G.enemies[idx];
  const runState=hooks.getRunState?hooks.getRunState():null; hooks.mistDissolve(en.x,en.y,1+en.tier*.22,'45,42,38');
  // 斬殺只化霧消散：不留墨漬、不潑墨、不生成會被誤認為畫卷污染的飛墨。
  hooks.playKill(en.tier); hooks.shake(2+en.tier*2.6); if(en.tier===2){ hooks.hitstop(4); hooks.flash(0.10,'220,210,190'); }
  // 破墨心訣 / 墨海無涯:潰散時留下小片潑墨,低額波及傷害
  if(stat.splashOnKill){
    const R = 54 + (stat.explode||0)*0.35;
    const sd = stat.damage * 0.28 * (stat.splashDamage||1);
    hooks.mistDissolve(en.x,en.y,1.18,'54,49,43');
    for(const e2 of G.enemies){
      if(e2!==en && Math.hypot(e2.x-en.x,e2.y-en.y)<R){ hooks.dmgTo(e2,sd); e2.hit=6; }   // 收屍交給敵人迴圈
    }
  }
  // 蝕痕滿層只讓消散霧色更深，不在紙面留下焦墨斑。
  if(en.eroV && en.st && en.st.erosion && en.st.erosion.stk>=4){
    hooks.mistDissolve(en.x,en.y,1.45,'28,25,22');
  }
  // 蝕痕·圓滿:潰散時把剩下的蝕傷一次爆出來
  if((stat.tierFlags||{}).dotBurst && en.st && en.st.erosion && en.st.erosion.t>0){
    const e=en.st.erosion, left=e.stk*4*(e.t/60);
    if(left>0){ hooks.splash(en.x,en.y,'#5a4a3a',1.8);
      for(const e2 of G.enemies) if(e2!==en && Math.hypot(e2.x-en.x,e2.y-en.y)<86){ hooks.dmgTo(e2,left); e2.hit=6; }
      hooks.floatText(en.x,en.y-en.r-30,'蝕爆','#7a6a58'); }
  }
  G.kills++; G.waveKills=(G.waveKills||0)+1; hooks.dpsAdd('k',1);
  // 回元的 manaOnKill 是擊殺回復劍意，不是回復神識。
  G.mana=Math.min(stat.manaMax,G.mana+(stat.regen||0));
  // 階級推進:每個滿階技能各自累計局內擊殺,達 300/500/1000 進小成/大成/圓滿
  if(runState){
    const gained=INK_CONFIG.runtime.noteKill(runState,1);
    if(gained.length){ hooks.syncStat();
      G.tierToast=(G.tierToast||[]).concat(gained.map(g=>g.name+' · '+g.tier));
      G.banner={txt:gained[0].name+' · '+gained[0].tier, life:1};
      hooks.playLevel();
    }
  }
  hooks.gainXP(en.xpValue || (en.tier===2?4:en.tier===1?2:1));
  G.enemies.splice(idx,1); hooks.updateHUD();
  if(en.isBoss){
    completeXuanmingWave(en);
  }
}



export function updateEnemies(){
  const P=G.player;
  // 敵人
  for(let i=G.enemies.length-1;i>=0;i--){
    const en=G.enemies[i];
    if(en.broken>0) en.broken--;                    // 破甲計時(貫鋒式·大成)
    // 波及傷害(潑墨/破墨)可能已把血打光,統一在此收屍
    if(en.hp<=0){ killEnemy(i); continue; }
    if(en.isBoss){ if(!G.bossShowcase) updateBossP1(en); continue; }
    if(en.actorPoc){
      en.actorPocTick=(en.actorPocTick||0)+1;
      const dirs=['N','NE','E','SE','S','SW','W','NW'];
      const dir=dirs[Math.floor(en.actorPocTick/90)%dirs.length];
      const vectors={N:[0,-1],NE:[1,-1],E:[1,0],SE:[1,1],S:[0,1],SW:[-1,1],W:[-1,0],NW:[-1,-1]};
      const v=vectors[dir]; en.moveDir=Math.atan2(v[1],v[0]); en.hit=0; continue;
    }
    const dx=P.x-en.x, dy=P.y-en.y, d=Math.hypot(dx,dy)||1;
    let sp=en.sp; if(en.chill>0){ en.chill--; sp*=0.45; } // 寒霜冰緩(舊元素系統,現休眠)
    // ===== 劍意狀態:蝕(持續潰散)/ 鎮(行止遲滯 + 微幅損血)=====
    if(en.st){
      let slow=0, dead=false;
      for(const key in en.st){
        const e=en.st[key]; if(!e || e.t<=0) continue;
        const cfg = stat.statuses && stat.statuses[key];
        if(!cfg){ e.t=0; e.stk=0; continue; }            // 洗點後劍意消失 → 場上狀態一併失效
        e.t--;
        if(cfg.slow) slow = Math.max(slow, cfg.slow * e.stk + (key==='suppression'?(stat.slowBonus||0):0));
        if(cfg.damagePerSecond){
          e.acc += cfg.damagePerSecond * e.stk / 60;
          if(e.acc>=1){
            const hurt=Math.floor(e.acc); e.acc-=hurt; hooks.dmgTo(en,hurt);
            if(key==='erosion'){                       // 蝕:每次結算裂痕短暫加深並滲出墨滴
              const EV=hooks.ensureEroV(en); EV.flash=12; if(e.stk>=3) EV.suck=10;
              const a=Math.random()*6.283, rr=en.r*0.7;
              hooks.ink(en.x+Math.cos(a)*rr, en.y+Math.sin(a)*rr, Math.cos(a)*0.5, Math.sin(a)*0.5+0.4, 3+Math.random()*4);
            }
            if(G.t%20===0) hooks.floatText(en.x,en.y-en.r, key==='erosion'?'蝕':'鎮',
                                     key==='erosion'?'#7a6a58':'#5a6a80');
            // 蝕痕·大成:每次跳傷有機會把一層蝕痕帶給附近的墨獸
            if(key==='erosion' && (stat.tierFlags||{}).dotSpread && Math.random()<0.34){
              for(const e2 of G.enemies){
                if(e2===en || Math.hypot(e2.x-en.x,e2.y-en.y)>92) continue;
                if(!e2.st) e2.st={};
                const c2=e2.st.erosion || (e2.st.erosion={stk:0,t:0,acc:0});
                if(c2.stk<6){ c2.stk++; c2.t=Math.max(c2.t, 90); }
                break;
              }
            }
            if(en.hp<=0){ dead=true; break; }
          }
        }
        if(e.t<=0) e.stk=0;
      }
      if(dead){ killEnemy(i); continue; }
      if(en.rootT>0){
        en.rootT--; sp=0;
        // 鎮痕·圓滿:定身結束時炸開一道留白斬
        if(en.rootT===0 && en.rootWC){ hooks.whiteCut(en.x,en.y,Math.random()*6.283);
          hooks.dmgTo(en, stat.damage*0.9); en.hit=6; hooks.splash(en.x,en.y,'#efe4cc',1.4); }
      }
      if(slow>0) sp *= (1 - Math.min(0.7, slow));
      // 鎮痕視覺:收束循環與拖滯(放在 update 才會跟著靜觀一起凍結)
      const sup=en.st.suppression;
      if(sup && sup.t>0){
        const V=hooks.ensureSupV(en);
        V.lx += (en.x-V.lx)*0.16; V.ly += (en.y-V.ly)*0.16;   // 弧痕慢半拍跟上
        if(V.press>0) V.press--;
        if(V.sink>0)  V.sink--;
        if(++V.t>=90){ V.t=0; V.cyc++; }                       // 1.5 秒一輪,重生一筆
      } else if(en.supV) en.supV=null;
      // 蝕痕視覺:滲→收→滲(同樣放在 update,靜觀時凍結)
      const ero=en.st.erosion;
      if(ero && ero.t>0){
        const EV=hooks.ensureEroV(en);
        if(EV.flash>0) EV.flash--;
        if(EV.suck>0)  EV.suck--;
        if(++EV.t>=42){ EV.t=0; EV.cracks=null; }   // 重新長一批裂痕,不旋轉
      } else if(en.eroV) en.eroV=null;
    }
    // 定鋒·小成 anchorField:劍樁「墨域」內敵移速 −18%(核心劍樁為基礎,墨域減速要小成才有)
    if(G.anchors.length && (stat.tierFlags||{}).anchorField){
      for(const A of G.anchors){
        if((en.x-A.x)**2+(en.y-A.y)**2 < (A.r+en.r)**2){ sp*=0.82; break; }
      }
    }
    en.aiT=(en.aiT||0)+1;
    let mx=dx/d,my=dy/d;
    if(en.ai==='weave'){
      const sway=Math.sin(en.aiT*.095+en.aiSeed)*.82;
      mx=dx/d+(-dy/d)*sway; my=dy/d+(dx/d)*sway;
      const ml=Math.hypot(mx,my)||1; mx/=ml; my/=ml;
    } else if(en.ai==='orbit'){
      const side=(en.orbitDir||1)*(d>150?.78:.98), inward=d>135?.7:.18;
      mx=dx/d*inward+(-dy/d)*side; my=dy/d*inward+(dx/d)*side;
      const ml=Math.hypot(mx,my)||1; mx/=ml; my/=ml;
    } else if(en.ai==='swoop'){
      // 墨羽妖先繞在玩家外圈，再鎖定當下方向俯衝；錯身後主動拉開重整。
      const t=en.aiT%170;
      if(t<84){
        const inward=d>210?.72:d<165?-.38:.05, side=(en.orbitDir||1)*.92;
        mx=dx/d*inward+(-dy/d)*side; my=dy/d*inward+(dx/d)*side;
      } else if(t<104){
        if(t===84){ en.chargeX=dx/d; en.chargeY=dy/d; }
        mx=en.chargeX; my=en.chargeY; sp*=.18;
      } else if(t<132){
        mx=en.chargeX; my=en.chargeY; sp*=3.15;
      } else {
        mx=-dx/d*.74+(-dy/d)*(en.orbitDir||1)*.26;
        my=-dy/d*.74+(dx/d)*(en.orbitDir||1)*.26;
      }
      const ml=Math.hypot(mx,my)||1; mx/=ml; my/=ml;
    } else if(en.ai==='charge'||en.ai==='reaver'){
      const cycle=en.ai==='reaver'?125:155, t=en.aiT%cycle;
      if(t===1){ en.chargeX=dx/d; en.chargeY=dy/d; }
      if(t<26){ sp*=.22; }
      else if(t<48){ mx=en.chargeX; my=en.chargeY; sp*=en.ai==='reaver'?3.05:2.65; }
      else if(en.ai==='reaver'){
        mx=dx/d*.45+(-dy/d)*(en.orbitDir||1)*.72; my=dy/d*.45+(dx/d)*(en.orbitDir||1)*.72;
      }
    } else if(en.ai==='pounce'){
      // 墨牙獸貼地追獵，停步壓身後作短距離猛撲，不會一路高速黏住玩家。
      const t=en.aiT%138;
      if(t<38){ sp*=.82; }
      else if(t<56){
        if(t===38){ en.chargeX=dx/d; en.chargeY=dy/d; }
        mx=en.chargeX; my=en.chargeY; sp*=.12;
      } else if(t<76){
        mx=en.chargeX; my=en.chargeY; sp*=3.35;
      } else if(t<98){ sp*=.34; }
    } else if(en.ai==='spider'){
      const t=en.aiT%180;
      if(t<54){
        // 壓低蓄勢 → 張顎吐絲；絲球實際生成後才可能對玩家施加封脈。
        sp*=.08; mx=dx/d; my=dy/d;
        if(t===38) spawnSpiderWebShot(en);
      } else if(t<126){
        const inward=d>185?.58:d<145?-.35:.08, side=(en.orbitDir||1)*.92;
        mx=dx/d*inward+(-dy/d)*side; my=dy/d*inward+(dx/d)*side;
      } else if(t<152){
        if(t===126){ en.chargeX=dx/d; en.chargeY=dy/d; }
        mx=en.chargeX; my=en.chargeY; sp*=2.8;
      } else { mx=-dx/d*.32+(-dy/d)*(en.orbitDir||1)*.55; my=-dy/d*.32+(dx/d)*(en.orbitDir||1)*.55; }
      const ml=Math.hypot(mx,my)||1; mx/=ml; my/=ml;
    }
    // 素材原生朝左：向右移動時才鏡像。接近垂直則沿用上一方向，避免左右抖動。
    if(en.type==='blade'||en.type==='spider'||en.type==='raven'||en.type==='fang'){
      if(Math.abs(mx)>.045) en.facing=mx>=0?-1:1;
      else if(en.facing==null) en.facing=dx>=0?-1:1;
      en.moveDir=Math.atan2(my,mx);
    }
    en.x+=mx*sp; en.y+=my*sp;
    // 頂部安全區:非 BOSS 墨獸不進入 HUD 帶,避免被常駐 HUD 遮住
    if(!en.isBoss && PLAY_TOP>0 && en.y<PLAY_TOP+en.r) en.y=PLAY_TOP+en.r;
    en.wob+=0.1;
    if(en.hit>0)en.hit--;
    // 業火灼燒
    if(en.ember>0){ en.emberT++; if(en.emberT%18===0){ hooks.dmgTo(en,2*en.ember);
      hooks.floatText(en.x,en.y-en.r,'焱','#c0662e'); if(en.hp<=0){killEnemy(i);continue;} } }
    // 寒霜霜傷
    if(en.chill>0){ if(en.chill%22===0){ hooks.dmgTo(en,1.5*stat.ice);
      hooks.floatText(en.x,en.y-en.r,'凍','#5a9cc0'); if(en.hp<=0){killEnemy(i);continue;} } }
    // 觸及靈石
    if(d < en.r+P.r){
      // BOSS 測試的「鎖血」只保護玩家神識；Boss 仍照常受傷、死亡。
      if(!G.hpLocked) P.hp -= en.contactDamage || (en.tier===2?18:en.tier===1?11:7);
      else P.hp=P.max;
      P.pulse=1; G.hurtT=20;   // 受擊 4 幀 × 5 影格
      hooks.splash(en.x,en.y,en.c,1); G.enemies.splice(i,1); hooks.updateHUD();
      hooks.playHurt(); hooks.shake(9+en.tier*3); hooks.flash(0.22,'176,64,48'); hooks.hitstop(4);
      if(P.hp<=0){ hooks.beginDeath(); return; }
    }
  }

}

export function spawnBossAttack(en){
  if(en.attackKind==='ring'){ spawnBossRing(en); return; }
  const P=G.player,mouth=[{x:0,y:.52},{x:-.52,y:-.08},{x:0,y:-.52},{x:.52,y:-.08}][en.bossSide];
  const ox=en.x+mouth.x*en.r,oy=en.y+mouth.y*en.r+bossVisualLift(en.bossSide);
  const dx=P.x-ox,dy=P.y-oy,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;
  for(const lane of [-34,0,34]){
    const x=ox+nx*lane,y=oy+ny*lane,tx=P.x+nx*lane*.22,ty=P.y+ny*lane*.22;
    const vx=tx-x,vy=ty-y,L=Math.hypot(vx,vy)||1,heavy=lane===0;
    G.bossShots.push({x,y,px:x,py:y,vx:vx/L*(heavy?1.12:1.38),vy:vy/L*(heavy?1.12:1.38),
      r:heavy?15:11,hp:heavy?2:1,max:heavy?2:1,dmg:heavy?18:11,age:0,seed:Math.random()*100});
  }
}

export function spawnBossRing(en){
  const P=G.player,N=(en.hp/en.max<=.4)?14:11,R=Math.max(170,Math.min(W,H)*.4);
  const gap=en.bossSide/N*Math.PI*2;
  for(let i=0;i<N;i++){
    const a=i/N*Math.PI*2;
    let da=a-gap; while(da>Math.PI)da-=Math.PI*2; while(da<-Math.PI)da+=Math.PI*2;
    if(Math.abs(da)<Math.PI/N*1.3) continue;
    const x=P.x+Math.cos(a)*R,y=P.y+Math.sin(a)*R,spd=(en.hp/en.max<=.4)?1.18:1.02;
    G.bossShots.push({x,y,px:x,py:y,vx:-Math.cos(a)*spd,vy:-Math.sin(a)*spd,
      r:10,hp:1,max:1,dmg:9,ring:true,age:0,seed:Math.random()*100});
  }
}

export function spawnSpiderWebShot(en){
  const P=G.player,dir=en.facing||1;
  const ox=en.x+dir*en.r*.62,oy=en.y-en.r*.18;
  const dx=P.x-ox,dy=P.y-oy,L=Math.hypot(dx,dy)||1,spd=2.05;
  G.bossShots.push({x:ox,y:oy,px:ox,py:oy,vx:dx/L*spd,vy:dy/L*spd,
    r:13,hp:1,max:1,dmg:0,web:true,age:0,seed:Math.random()*100});
}

export function updateBossShots(){
  const P=G.player;
  for(let i=G.bossShots.length-1;i>=0;i--){
    const q=G.bossShots[i]; q.age++; q.px=q.x; q.py=q.y; q.x+=q.vx; q.y+=q.vy;
    if(Math.hypot(q.x-P.x,q.y-P.y)<q.r+P.r){
      if(q.web){
        G.webT=Math.max(G.webT,105);
        if(hooks.floatText) hooks.floatText(P.x,P.y-P.r-24,'蛛網封脈','#397b62');
        if(hooks.ink) for(let n=0;n<8;n++){ const a=n*.785; hooks.ink(P.x+Math.cos(a)*54,P.y+Math.sin(a)*54,0,0,4); }
        if(hooks.playHit) hooks.playHit();
        if(hooks.shake) hooks.shake(4);
        if(hooks.flash) hooks.flash(.1,'190,225,205');
      } else {
        if(!G.hpLocked) P.hp=Math.max(0,P.hp-(q.dmg||18)); else P.hp=P.max;
        P.pulse=1; G.hurtT=20;
        if(hooks.playHurt) hooks.playHurt();
        if(hooks.shake) hooks.shake(8);
        if(hooks.flash) hooks.flash(.18,'176,64,48');
      }
      inkCoreDissolve(q,Math.atan2(q.vy,q.vx));
      G.bossShots.splice(i,1);
      if(hooks.updateHUD) hooks.updateHUD();
      if(P.hp<=0){ if(hooks.beginDeath) hooks.beginDeath(); return; }
    } else if(q.age>360) G.bossShots.splice(i,1);
  }
}

export function inkCoreDissolve(q,ang){
  for(let k=0;k<6;k++){
    const side=(k-2.5)*3.5,a=ang+(k%2?1:-1)*(.12+.08*k);
    G.mists.push({x:q.x-Math.sin(ang)*side,y:q.y+Math.cos(ang)*side,
      vx:Math.cos(a)*(.25+.12*k),vy:Math.sin(a)*(.25+.12*k)-.08,
      r:9+Math.random()*9,age:0,dur:18+((Math.random()*9)|0),color:'39,35,31',
      squash:.16+Math.random()*.14,rot:a});
  }
}
