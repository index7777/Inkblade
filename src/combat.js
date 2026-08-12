import { G, stat } from './core.js';
import { FAN_PHI, BASE_SPEED, MERGE_SPEED_K, MERGE_WIDTH_K, SOLO_TURN, HOMING_RANGE } from './constants.js';
import { W, H } from './viewport.js';
import { truncatePath, segCircleDist } from './geom.js';
import { onScreen, killEnemy, inkCoreDissolve } from './enemy.js';

let hooks={};
let cmdSeq=0;

export function configureCombat(nextHooks){ hooks=nextHooks||{}; }

export function pathLen(path){ let L=0; for(let i=1;i<path.length;i++) L+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y); return L; }

// 人工可在畫面任意處落筆，但飛劍仍視為由玩家中心御出；遠端落筆距離必須一併計價。
export function leadInLen(path){
  const P=G.player,s=path&&path[0];
  return P&&s?Math.hypot(s.x-P.x,s.y-P.y):0;
}

// 劍身實際長度；連珠的車廂間距要靠它。
export function bladeLength(){ return 44 + stat.size*0.9; }
export function inlineGap(){ return bladeLength() + 28; }
export function inlineTipLead(){ return bladeLength() * 0.8; }

export function autoCommandEndpoint(player,target,maxStroke=220,contactReach=0){
  if(!player||!target) return null;
  const dx=target.x-player.x,dy=target.y-player.y,distance=Math.hypot(dx,dy);
  if(distance<=0) return {x:player.x,y:player.y,length:0};
  const length=Math.min(maxStroke,Math.max(0,distance-Math.max(0,contactReach)));
  return {x:player.x+dx/distance*length,y:player.y+dy/distance*length,length};
}

export function selectAutoTarget(enemies,player,maxStroke=220,contactReach=0,isVisible=()=>true){
  if(!player) return null;
  let best=null,bestDistance=Infinity;
  for(const enemy of enemies||[]){
    if(!enemy||!isVisible(enemy)) continue;
    const distance=Math.hypot(enemy.x-player.x,enemy.y-player.y);
    const reach=maxStroke+Math.max(0,contactReach)+(enemy.r||0);
    if(distance<=reach&&distance<bestDistance){ best=enemy; bestDistance=distance; }
  }
  return best;
}

export function fanPose(c, a){
  const dx=c.x-c.ox, dy=c.y-c.oy, ca=Math.cos(a), sa=Math.sin(a);
  let x=c.ox + dx*ca - dy*sa, y=c.oy + dx*sa + dy*ca;
  const CAP=Math.min(300, W*0.28);
  const ox=x-c.x, oy=y-c.y, m=Math.hypot(ox,oy);
  if(m>CAP){ const k=CAP/m; x=c.x+ox*k; y=c.y+oy*k; }
  return { x, y, ang:c.ang + a };
}

export function formationOffset(formation, i, n, spacing, spread){
  if(n<=1) return {along:0, side:0};
  const mid=(n-1)/2, t=(i-mid)/Math.max(1,mid);
  if(formation==='merge')    return {along:0, side:0};
  if(formation==='parallel') return {along:0, side:t*spacing};
  if(formation==='inline')   return {along:-inlineTipLead()-i*inlineGap(), side:0};
  return { along:0, side:0, ang:t*FAN_PHI, fan:true };
}

export function cmdLife(len){
  const LM=(window.INK_CONFIG && INK_CONFIG.lifeModel) || {pixelsPerLife:120, maxBonus:12};
  const bonus=Math.min(LM.maxBonus, Math.floor(Math.max(0,len)/LM.pixelsPerLife));
  return Math.max(1, 1 + bonus);
}

export function speedMul(c){
  const sp=(stat.speed||BASE_SPEED)*((c&&c.speedMul)||1);
  return 1 + Math.max(-0.4, (sp/BASE_SPEED - 1)) * 0.6;
}

export function durCost(dmg){
  const base=Math.max(1, stat.damage||1);
  const AM=(window.INK_CONFIG && INK_CONFIG.armorModel) || {perPoint:0.10};
  const soak=Math.max(0.5, 1 + (stat.armor||0)*AM.perPoint);
  return Math.max(0.05, dmg/base/soak);
}

export function swordDissolve(sw){
  hooks.mistDissolve?.(sw.x,sw.y,1.15,'46,42,38');
  hooks.splash?.(sw.x,sw.y,'#2b2620',1);
  for(let k=0;k<5;k++) hooks.ink?.(sw.x,sw.y,(Math.random()-.5)*3,(Math.random()-.5)*3,7+Math.random()*9);
}

export function spawnAnchor(sw){
  const baseDur=300,t=Math.round(baseDur*(1+(stat.anchorDur||0)));
  const dmg=stat.damage*(1+(stat.anchorDmgMul||0));
  const visual={x:sw.x,y:sw.y-11,ang:Math.PI/2,vx:0,vy:0,age:30,seed:sw.seed||0,trail:[]};
  G.anchors.push({x:sw.x,y:sw.y,ang:sw.ang,r:44,sr:26,t,tMax:t,dmg,hitSet:new Set(),visual});
  if(G.anchors.length>40) G.anchors.shift();
  hooks.splash?.(sw.x,sw.y,'#2b2620',1.1);
  for(let k=0;k<6;k++) hooks.ink?.(sw.x,sw.y,(Math.random()-.5)*2.2,(Math.random()-.5)*2.2,6+Math.random()*7);
}

export function detonateAnchor(A){
  const R=88,dmg=A.dmg*1.4;
  hooks.splash?.(A.x,A.y,'#c0662e',2.4); hooks.playBoom?.(); hooks.shake?.(7);
  for(let k=0;k<10;k++) hooks.ink?.(A.x,A.y,(Math.random()-.5)*4,(Math.random()-.5)*4,10+Math.random()*14);
  for(const en of G.enemies){
    if(en.isBoss&&en.bossState!=='orbit'&&en.bossState!=='lunge') continue;
    if((en.x-A.x)**2+(en.y-A.y)**2<R*R){ hooks.dmgTo?.(en,dmg); en.hit=6; }
  }
  const TF=stat.tierFlags||{};
  if(TF.inkDropOnSplash){
    for(let k=0;k<3;k++){ const a=Math.random()*6.283,r=20+Math.random()*30;
      G.drops.push({x:A.x+Math.cos(a)*r,y:A.y+Math.sin(a)*r,r:14,t:300,dmg:stat.damage*0.35,boom:!!TF.inkDropExplode}); }
    if(G.drops.length>24) G.drops.splice(0,G.drops.length-24);
  }
  hooks.floatText?.(A.x,A.y-A.r-10,'鋒碎','#c0662e');
}

export function spawnCmdSword(c, slot, delay){
  // 出鞘就直接站到陣型位置。原本一律生在 c.x/c.y(筆尖),
  // 第一次被排位時整把劍瞬移一兩百 px 過去,那段距離沒有任何命中判定。
  const _o=formationOffset(c.formation, slot, c.slots, c.spacing, c.age*(stat.flySpeed||stat.speed||14));
  let _x, _y;
  if(_o.fan && c.ox!=null){ const q=fanPose(c,_o.ang); _x=q.x; _y=q.y; }
  else { const _ca=Math.cos(c.ang), _sa=Math.sin(c.ang);
         _x=c.x + _ca*_o.along - _sa*_o.side;
         _y=c.y + _sa*_o.along + _ca*_o.side; }
  const sw={ cmd:c, slot:slot, x:_x, y:_y, px:_x, py:_y, ang:c.ang+(_o.ang||0), vx:0, vy:0,
             trail:[], age:0,
             // 聚形要看起來是一把劍,連貼圖動畫幀都得對齊,所以整道劍令共用一個 seed
             seed:(c.formation==='merge' && c.seed!=null) ? c.seed : Math.random()*8,
             delay:delay||0,
             // 聚鋒(A):錯開耐久 —— 第 k 把多 k 份耐久,讓重疊的劍一把一把剝落(平滑「破掉變小」),
             // 而非同幀同耗、一次全消。其餘陣型維持原耐久。
             pierceLeft: (c.life||1) + (c.formation==='merge' ? slot : 0),
             hitSet:new Set(), hitPass:new Map(), shotPass:new Map(), passId:0, runDir:null, runTravel:0,
             returned:false, echo:false };
  c.swords[slot]=sw; G.swords.push(sw);
  return sw;
}
// 最近的墨獸(只看畫面內)
export function nearestEnemy(x,y,maxD){
  let best=null,bd=(maxD||1e9)**2;
  for(const en of G.enemies){ if(!onScreen(en)) continue;
    const d=(en.x-x)**2+(en.y-y)**2; if(d<bd){bd=d;best=en;} }
  return best;
}
// 劍令末端延伸:在筆跡尾巴接上一段通往目標的新節點。
// 這是「引鋒」的實作方式 —— 延長的是劍令,不是讓劍自己找路(劍不思考)。
export function extendCommand(c, tx, ty){
  const last=c.pts[c.pts.length-1];
  const d=Math.hypot(tx-last.x, ty-last.y);
  if(d<1) return false;
  const steps=Math.max(2, Math.round(d/18));
  for(let i=1;i<=steps;i++)
    c.pts.push({ x:last.x+(tx-last.x)*i/steps, y:last.y+(ty-last.y)*i/steps });
  c.len+=d;
  if(c.step<0){ c.step=1; }            // 倒走中被延伸 → 轉回順走去追那一段
  c.seg=Math.max(1, Math.min(c.seg, c.pts.length-1));
  c.alive=true;
  return true;
}
// 自動生成的短劍令(殘鋒、回刺)—— 系統裡不存在沒有劍令的劍
export function spawnAutoCommand(x0,y0,x1,y1,opts){
  if(G.commands.length>=28) return null;
  opts=opts||{};
  const _len=Math.hypot(x1-x0,y1-y0);
  const c={ id:++cmdSeq, pts:[{x:x0,y:y0},{x:x1,y:y1}], len:_len, life:cmdLife(_len), ox:x0, oy:y0,
    seg:1, step:1, x:x0, y:y0, ang:Math.atan2(y1-y0,x1-x0),
    formation:'single', spacing:0, swords:[null], slots:1,
    returnsLeft:opts.returns||0, alive:true, age:0,
    // 這幾個欄位主劍令有、自動劍令也必須有 —— 命中處理是共用的,
    // 少一個 hitOrder 就會在第一次命中丟例外,把後面的破甲/齊斬/歸鋒整串打斷。
    hitOrder:[], volley:0, frameHit:null, extended:0, anyHit:false, free:false,
    freeBack:false, passAt:[0,0],
    auto:true, dmgMul:opts.dmgMul||1, noIntent:!opts.intent };
  G.commands.push(c);
  const sw=spawnCmdSword(c,0,0);
  sw.echo=true;
  if(opts.skip){ sw.hitSet.add(opts.skip); sw.hitPass.set(opts.skip,sw.passId); }
  return c;
}
// 預先把手繪折線切成「揮行段」。方向真正反轉且新方向至少延伸 24px 才算下一段；
// 直接依筆跡判定，不受幀率、陣型位移或折返點插值抖動影響。
export function buildStrokePasses(pts){
  const out=new Array(pts.length).fill(0);
  let pass=0,run=null;
  for(let i=1;i<pts.length;i++){
    const dx=pts[i].x-pts[i-1].x,dy=pts[i].y-pts[i-1].y,L=Math.hypot(dx,dy);
    if(L<0.5){ out[i]=pass; continue; }
    const dir={x:dx/L,y:dy/L};
    if(!run) run=dir;
    else if(dir.x*run.x+dir.y*run.y < -0.35){
      let travel=0;
      for(let j=i;j<pts.length&&travel<24;j++){
        const ux=pts[j].x-pts[j-1].x,uy=pts[j].y-pts[j-1].y,ul=Math.hypot(ux,uy);
        if(ul<0.5) continue;
        if((ux/ul)*dir.x+(uy/ul)*dir.y<0.35) break;
        travel+=ul;
      }
      if(travel>=24){ pass++; run=dir; }
    }
    out[i]=pass;
  }
  return out;
}
export function launchCommand(path){
  if(!path || path.length<2) return;
  const s0=path[0];
  // 收筆計價:成本 = 長度 × 每像素成本(每像素成本已含劍寬/劍數係數)
  const perPx=Math.max(0.001, stat.costPerPx);
  let budget=Math.max(0, G.mana - stat.costBase);
  // 劍匣存量:劍意連起手都付不出來時,燒掉一把存劍,整道免費。
  // 免費那道的長度上限 = 滿劍意能畫的長度 —— 存量等於「一管滿劍意」,不是無限,
  // 否則玩家會在劍意見底時畫一條橫跨全場的超長劍令白嫖。
  const freeCast = (budget<=0 && G.reserve>0);
  if(freeCast) budget=Math.max(0, stat.manaMax - stat.costBase);
  if(budget<=0){
    hooks.floatText?.(s0.x,s0.y-14,'劍意不足','#c08a2e'); hooks.burst?.(s0.x,s0.y,'#8a7a5a',5); hooks.playNoMana?.(); return;
  }
  const leadLen=leadInLen(path), strokeBudget=budget/perPx-leadLen;
  if(strokeBudget<=0){
    hooks.floatText?.(s0.x,s0.y-14,'落筆太遠','#c08a2e'); hooks.burst?.(s0.x,s0.y,'#8a7a5a',5); hooks.playNoMana?.(); return;
  }
  const cut=truncatePath(path, strokeBudget);
  if(!cut){
    hooks.floatText?.(s0.x,s0.y-14,'劍意不足','#c08a2e'); hooks.burst?.(s0.x,s0.y,'#8a7a5a',5); hooks.playNoMana?.(); return;
  }
  const len=pathLen(cut), paidLen=leadLen+len;
  // 平均消耗長度包含遠端落筆；耐久仍只看真正畫出的筆畫長度。
  G.strokeN++;
  G.strokeAvg = G.strokeAvg ? (G.strokeAvg*0.75 + paidLen*0.25) : paidLen;
  const TFc=stat.tierFlags||{};
  // 展鋒·圓滿:收筆後劍痕滯留半息,墨獸碰到還會再受一次傷
  if(TFc.strokeLingers){
    G.lingers.push({pts:cut.slice(), t:36, dmg:stat.damage*0.5, hit:new Set()});
    if(G.lingers.length>6) G.lingers.shift();
  }
  // 納息·圓滿:劍意滿盈時,這一道免費
  const fullFree = TFc.freeCastAtFull && G.mana>=stat.manaMax-0.01;
  if(fullFree){
    hooks.floatText?.(s0.x, s0.y-14, '定息', '#4aa0b8');
  } else if(freeCast){
    G.reserve--; G.reserveFlash=1;
    hooks.floatText?.(s0.x, s0.y-14, '劍匣', '#c08a2e');
  } else {
    const spend=Math.min(G.mana, stat.costBase + paidLen*perPx);
    G.mana=Math.max(0, G.mana - spend); hooks.dpsAdd?.('m', spend);
  }
  hooks.playCast?.(len);
  G.castT=24;                                      // 施放 6 幀 × 4 影格
  G.intent=1;                                      // 意念起 —— 只反映在腳下法陣,身體不動
  { const P=G.player, p1=cut[Math.min(3,cut.length-1)];
    G.aim=Math.atan2(p1.y-P.y, p1.x-P.x);
  }

  const n=Math.max(1, stat.count|0);
  const c={
    id:++cmdSeq, pts:cut, len:len,
    ox:cut[0].x, oy:cut[0].y,                       // 出鞘點:散鋒的旋轉中心
    life: cmdLife(len),                             // 這道劍令買到的「命」(每把劍能斬幾隻)
    seg:1, step:1,                                  // step 1=順走,-1=倒走(歸鋒)
    x:cut[0].x, y:cut[0].y,
    ang:Math.atan2(cut[1].y-cut[0].y, cut[1].x-cut[0].x),
    formation:stat.formation,
    seed:Math.random()*8,                           // 聚形共用:讓 N 把劍的動畫幀完全一致
    // 齊鋒式·小成「飛劍間距收窄,自動集火」
    spacing:(stat.size*2.2+10) * ((stat.tierFlags||{}).volleyTighten ? 0.6 : 1),
    swords:new Array(n).fill(null),
    slots:n,
    // 連珠逐把從同一落點接出：指令走完一個劍距時，才生成下一把。
    inlineSpawnEvery:stat.formation==='inline'
      ? Math.max(2,Math.ceil(inlineGap()/Math.max(1,stat.flySpeed||stat.speed||14))) : 0,
    // 折返只有「畫面上讀成一把劍」的劍式能用:單式與聚形。
    // 齊鋒/散鋒/連珠折返時整列會前後對調,那一幀讀起來是瞬移不是掉頭 —— 演出不成立。
    returnsLeft: (canReturn(stat.formation) && stat.ret) ? Math.max(1, stat.returnHits||1) : 0,
    alive:true, age:0,
    hitOrder:[], volley:0, frameHit:null, extended:0, dmgMul:1, anyHit:false, free:false,
    freeBack:false, passAt:buildStrokePasses(cut)
  };
  G.commands.push(c);
  // 連珠只先生成領頭劍；後續空槽由更新迴圈依劍距逐把接上。
  if(c.formation==='inline') spawnCmdSword(c,0,0);
  else for(let i=0;i<n;i++) spawnCmdSword(c,i,0);
}
// 脫隊追跡的每幀轉向上限(弧度)。0.075 ≈ 4.3°/幀:看得出在拐彎,但拐不出直角。
// 引鋒的感知範圍。超過這個距離不修正,否則一出鞘就整道劍令被拉直往怪飛,
// 玩家畫的線變成裝飾。520 約等於畫面短邊的六成。
// 哪些劍式可以折返(#88)。改這裡就等於改折返的適用範圍。
export function canReturn(f){ return f==='single' || f==='merge'; }
// 相容:舊呼叫點仍叫 launchSword
export function launchSword(path){ return launchCommand(path); }

export function updateCombat(){
  // ── 劍令執行 ──────────────────────────────────────────────────
  // 中心點沿筆跡前進;飛劍繞著中心排列。飛劍死了不影響進度,補一把接手即可。
  for(let ci=G.commands.length-1;ci>=0;ci--){
    const c=G.commands[ci];
    c.age++;
    const TF=stat.tierFlags||{};
    c.frameHit=null;                                   // 齊斬:每幀重置同幀命中統計
    c.mergeIntentFrame=null;                            // 聚鋒:每幀重置「本幀已上墨痕的敵」集合
    // 聚鋒(A):存活飛劍數 → 速度曲線(重則慢)與聚合大鋒視覺寬度
    const mLive = c.formation==='merge'
      ? Math.max(1, c.swords.reduce((a,s)=>a+(s&&!s.dead?1:0),0)) : 1;
    c.mLive = mLive;
    // 1) 推進中心點(歸鋒·小成:回程加速三成)
    const goingBack = (c.free ? c.freeBack : c.step<0);
    let budget=(stat.flySpeed||stat.speed) * ((goingBack && TF.returnFaster) ? 1.3 : 1) * (c.speedMul||1)
               * ((stat.beadSlow && c.formation==='inline') ? 0.92 : 1)   // 定鋒:串珠鏈內移速 ×0.92
               * (c.formation==='merge' ? 1/(1+MERGE_SPEED_K*(mLive-1)) : 1);   // 聚鋒:重則飛慢(只作用 flySpeed)
    // 續飛:筆跡走完後,劍令沿最後方向繼續前進,直到飛出畫面。
    // 劍沒打到東西就憑空消失不合理 —— 筆跡定義的是「怎麼去」,不是「走完就結束」。
    if(c.free){
      // 引鋒(stats→mechanics.homingStrength):**只修正續飛段**。
      // 手畫的筆跡是玩家的意志,不能被系統偷偷掰彎;筆跡走完之後才輪到劍自己找路。
      // 這條在 #89 之前只有賦值、沒有任何地方讀 —— 引鋒 1~4 階等於純扣傷,是漏接線。
      // 引鋒為齊鋒陣(parallel)專屬:非齊陣(如散鋒)不套用,否則散鋒會被掰彎、動作詭異。
      if(stat.homing>0 && !c.auto && c.formation==='parallel'){
        const tg=nearestEnemy(c.x, c.y, HOMING_RANGE);
        if(tg){
          let dd=Math.atan2(tg.y-c.y, tg.x-c.x)-c.ang;
          while(dd> Math.PI) dd-=6.283185; while(dd<-Math.PI) dd+=6.283185;
          const turn=Math.max(-stat.homing, Math.min(stat.homing, dd));
          if(Math.abs(turn)>1e-4){ c.ang+=turn; c.homed=true; }
        }
      }
      c.x+=Math.cos(c.ang)*budget; c.y+=Math.sin(c.ang)*budget;
      // 邊緣折返:碰到戰場邊界才掉頭。用「畫面內縮」而不是畫面外,
      // 否則玩家會看到劍先飛出去消失一下再冒回來,讀不出「掉頭」。
      const EDGE=16;
      const atEdge = (c.x<EDGE||c.x>W-EDGE||c.y<EDGE||c.y>H-EDGE);
      if(atEdge && c.returnsLeft>0){
        c.x=Math.max(EDGE,Math.min(W-EDGE,c.x));
        c.y=Math.max(EDGE,Math.min(H-EDGE,c.y));
        doReturn(c);
      } else {
        // 沒有飛行壽命 —— 劍不會自己老死,只有飛出戰場(且折返次數用盡)才算走完。
        // 折返次數是有限的,所以不會無限來回。
        const OUT=60;
        if(c.x<-OUT||c.x>W+OUT||c.y<-OUT||c.y>H+OUT){ cmdFinish(c); c.alive=false; }
      }
      budget=0;
    }
    while(budget>0 && c.alive){
      const tgt=c.pts[c.seg];
      if(!tgt){ cmdReachedEnd(c); break; }
      const dx=tgt.x-c.x, dy=tgt.y-c.y, d=Math.hypot(dx,dy)||1e-4;
      if(d<=budget){
        c.x=tgt.x; c.y=tgt.y; c.ang=Math.atan2(dy,dx); budget-=d; c.seg+=c.step;
        if(c.seg>=c.pts.length || c.seg<0){ cmdReachedEnd(c); break; }
      } else { c.x+=dx/d*budget; c.y+=dy/d*budget; c.ang=Math.atan2(dy,dx); budget=0; }
    }
    if(!c.alive){
      for(const sw of c.swords) if(sw && !sw.solo) sw.dead=true;
      G.commands.splice(ci,1);
      continue;
    }
    // 2) 依陣型把劍擺到中心周圍;空槽補劍(接力)
    const ca=Math.cos(c.ang), sa=Math.sin(c.ang);
    for(let k=0;k<c.slots;k++){
      let sw=c.swords[k];
      // 穿透耗盡而死的劍不再接力補上 —— 死了就少一把,劍令帶著剩下的劍繼續走。
      if(sw && (sw.dead || sw.solo)) continue;
      // 只有「從來沒填過」的空槽才生劍(自動劍令會用到)。
      // 接力關掉後這裡不再有延遲可調 —— 開匣·大成已改成直接加劍速。
      if(!sw){
        if(c.formation==='inline' && k>0 && c.age<k*c.inlineSpawnEvery) continue;
        sw=spawnCmdSword(c,k,0);
      }
      if(sw.delay>0){ sw.delay--; sw.trail.length=0; continue; }
      const off=formationOffset(c.formation, k, c.slots, c.spacing, c.age*(stat.flySpeed||stat.speed||14));
      if(off.fan && c.ox!=null){
        const q=fanPose(c, off.ang);
        if(sw.snap){ sw.px=q.x; sw.py=q.y; sw.snap=false; } else { sw.px=sw.x; sw.py=sw.y; }
        sw.vx=q.x-sw.x; sw.vy=q.y-sw.y;
        sw.x=q.x; sw.y=q.y; sw.ang=q.ang; sw.age++;
        sw.trail.push({x:sw.x,y:sw.y}); if(sw.trail.length>18) sw.trail.shift();
        continue;
      }
      let oa=off.along, os=off.side;
      const nx=c.x + ca*oa - sa*os;
      const ny=c.y + sa*oa + ca*os;
      // 掃掠命中要知道這一幀是從哪走到哪。折返那一幀整列會前後對調(等於瞬移),
      // 那一幀用 snap 標記跳過掃掠,否則會斬到整條路徑上本來碰不到的墨獸。
      if(sw.snap){ sw.px=nx; sw.py=ny; sw.snap=false; }
      else { sw.px=sw.x; sw.py=sw.y; }
      sw.vx=nx-sw.x; sw.vy=ny-sw.y;
      sw.x=nx; sw.y=ny; sw.ang=c.ang+(off.ang||0); sw.age++;
      if(!c.free&&c.passAt) sw.passId=c.passAt[Math.max(0,Math.min(c.passAt.length-1,c.seg))]||0;
      if(hooks.getFX?.()?.trail){
        sw.trail.push({x:sw.x,y:sw.y});
        if(sw.trail.length>18) sw.trail.shift();
      } else if(sw.trail.length) sw.trail.length=0;
    }
    // 聚鋒(A):標記聚合大鋒的繪製 —— 只畫存活的領頭劍,寬度隨存活數放大;其餘同位重疊劍不重畫。
    // 存活減少 → 領頭寬度縮小 → 大鋒「破掉變小」。
    if(c.formation==='merge'){
      let lead=-1;
      for(let k=0;k<c.swords.length;k++){ const sw=c.swords[k]; if(sw && !sw.dead){ lead=k; break; } }
      const wScale=1+MERGE_WIDTH_K*(c.mLive-1);
      for(let k=0;k<c.swords.length;k++){ const sw=c.swords[k]; if(!sw) continue;
        sw.mergeHidden=(k!==lead); sw.mergeScale=(k===lead)?wScale:1; }
    }
  }
  // 執行一次折返(端點觸發與命中觸發共用)。回傳是否成功。
  // 邊緣折返。折返一律發生在續飛階段(筆跡走完 → 續飛 → 撞到邊界),
  // 所以不再有「沿原路倒走」那條分支。
  function doReturn(c){
    if(c.returnsLeft<=0) return false;
    const TF=stat.tierFlags||{};
    c.returnsLeft--;
    c.ang += Math.PI; c.freeBack = !c.freeBack;
    c.returnsDone=(c.returnsDone||0)+1;
    // 歸藏無痕:回程劍速大增(速度本身就會轉成傷害,見 speedMul)
    if(TF.returnHaste) c.speedMul=Math.min(2.6,(c.speedMul||1)*1.35);
    // 歸鋒·大成:掉頭時不是死板的 180°,而是朝最近的墨獸回切。
    // (舊實作掛在「回程走完再延伸劍令」上,新模型沒有筆跡可延伸,語意改掛在這裡)
    if(TF.returnSeek && !c.auto){
      const en=nearestEnemy(c.x,c.y,1e9);
      if(en) c.ang=Math.atan2(en.y-c.y, en.x-c.x);
    }
    // 折返**不補耐久**,也不再分裂(#88 分裂整個移除)。
    // 折返買到的是「同一批耐久多掃一趟」—— 覆蓋面來自來回,不是來自變多把。
    for(const sw of c.swords) if(sw && !sw.dead){
      sw.hitSet.clear(); sw.hitPass.clear(); sw.shotPass.clear(); sw.passId++;
      sw.runDir=null; sw.runTravel=0; sw.returned=true;
      sw.snap=true;                                   // 這一幀整列前後對調,不做掃掠
      // 歸鋒·圓滿「歸而不竭」:折返保留三成耐久 —— 這是「折返不補耐久」唯一的例外,
      // 而且是上限制的補(補到不超過這道劍令原本的耐久)。
      if(TF.returnKeep) sw.pierceLeft=Math.min(c.life||1, sw.pierceLeft + (c.life||1)*0.3);
    }
    if(stat.returnDry) hooks.whiteCut?.(c.x,c.y,c.ang);
    return true;
  }
  // 劍令真的結束(飛出畫面/壽命到)才結算的收尾效果
  function cmdFinish(c){
    const TF=stat.tierFlags||{};
    // 貫鋒式·圓滿:整道劍令走完後回刺第一個被斬中的墨獸。
    // 舊版寫在抵達筆跡端點,但那時劍令還要續飛與折返,回刺放太早。
    if(!c.auto && TF.pierceRecoil && c.hitOrder.length){
      const first=c.hitOrder.find(en=>G.enemies.includes(en));
      if(first) spawnAutoCommand(c.x,c.y,first.x,first.y,{dmgMul:0.8,intent:true});
    }
  }
  // 劍令抵達端點:歸鋒則倒走一次,否則整道結束
  function cmdReachedEnd(c){
    const TF=stat.tierFlags||{};
    // 引鋒:劍令末端自動延伸(延伸的是劍令,不是劍自己找路)。引鋒為齊鋒陣專屬 → 限 parallel。
    if(!c.auto && c.step>0 && c.extended<6 && c.formation==='parallel'){
      const R = TF.guideExtend ? 260 : 150;
      const seek = TF.guideNeverMiss && !c.anyHit;      // 圓滿:整道沒打中就一定要找到
      if(TF.guideExtend || seek){
        const en=nearestEnemy(c.x,c.y, seek?1e9:R);
        if(en && extendCommand(c,en.x,en.y)){ c.extended++; return; }
      }
    }
    // 齊鋒式:筆跡走完的那一刻,凡是「一隻都沒斬到」的劍脫離陣列自行追跡。
    // 齊鋒的弱點是轉向遲緩、整排一起撲空;讓撲空的劍自己去找目標,
    // 等於把「沒斬到」這件事本身變成它的機制,而不是白白飛出畫面。
    if(c.formation==='parallel' && !c.auto){
      for(const sw of c.swords) if(sw && !sw.dead && sw.hitSet.size===0 && sw.pierceLeft>0){
        sw.solo=true; sw.px=sw.x; sw.py=sw.y;
      }
    }
    // 筆跡走完 → 轉續飛(不是消散)。折返改在邊界觸發,這裡不再掉頭。
    c.free=true;
    c.ang=Math.atan2(c.y-(c.py!=null?c.py:c.y), c.x-(c.px!=null?c.px:c.x)) || c.ang;
    { // 用筆跡最後兩點決定方向,比用上一幀位移穩定
      const a=c.pts[Math.max(0,c.pts.length-2)], b=c.pts[c.pts.length-1];
      if(a&&b&&(a!==b)) c.ang = c.step>0 ? Math.atan2(b.y-a.y,b.x-a.x)
                                         : Math.atan2(c.pts[0].y-c.pts[1].y, c.pts[0].x-c.pts[1].x);
    }
  }

  // 劍(命中判定與生命週期)
  for(let i=G.swords.length-1;i>=0;i--){
    const s=G.swords[i];
    if(s.dead){ G.swords.splice(i,1); continue; }
    if(s.delay>0) continue;
    // 脫隊追跡(齊鋒):不再由劍令擺位,自己轉向、自己前進、自己出界。
    if(s.solo){
      const sp=(stat.flySpeed||stat.speed||14);
      const tg=nearestEnemy(s.x,s.y,1e9);
      if(tg){
        let d=Math.atan2(tg.y-s.y,tg.x-s.x)-s.ang;
        while(d> Math.PI) d-=6.283185; while(d<-Math.PI) d+=6.283185;
        const lim=SOLO_TURN+(stat.homing||0);                  // 有轉向上限,不然像磁鐵吸過去;引鋒直接加在上面
        s.ang+=Math.max(-lim,Math.min(lim,d));
      }
      s.px=s.x; s.py=s.y;
      s.vx=Math.cos(s.ang)*sp; s.vy=Math.sin(s.ang)*sp;
      s.x+=s.vx; s.y+=s.vy; s.age++;
      if(hooks.getFX?.()?.trail){ s.trail.push({x:s.x,y:s.y}); if(s.trail.length>18) s.trail.shift(); }
      else if(s.trail.length) s.trail.length=0;
      if(s.x<-60||s.x>W+60||s.y<-60||s.y>H+60){ s.dead=true; G.swords.splice(i,1); continue; }
    }
    // passId 已由原始手繪折線預先計算；一段同方向揮行對同一目標只傷一次。
    if(!s.hitPass) s.hitPass=new Map();
    if(!s.shotPass) s.shotPass=new Map();
    // 墨核是獨立的兩段耐久投射物；每把劍每次行進方向只可削一層。
    for(let qj=G.bossShots.length-1;qj>=0;qj--){
      const q=G.bossShots[qj], pass=s.passId||0;
      if(s.shotPass.get(q)===pass) continue;
      if(segCircleDist(s.px,s.py,s.x,s.y,q.x,q.y)<q.r+stat.size+(stat.hitPadding||0)){
        s.shotPass.set(q,pass); q.hp--; hooks.splash?.(q.x,q.y,'#3c3630',1.15); hooks.playHit?.(); hooks.shake?.(1.8);
        hooks.floatText?.(q.x,q.y-22,'破墨','#efe4cc');
        if(q.hp<=0){ inkCoreDissolve(q,s.ang); G.bossShots.splice(qj,1); }
      }
    }
    // 命中
    for(let j=G.enemies.length-1;j>=0;j--){
      const en=G.enemies[j];
      if(en.showcaseGhost) continue;
      if(en.isBoss&&en.bossState!=='orbit'&&en.bossState!=='lunge') continue;
      if(s.hitPass.get(en)===(s.passId||0)) continue;
      // 掃掠判定:用「這一幀走過的線段」對圓,而不是只測落點。
      // 只測落點的話,劍速夠快或陣型轉向時整把劍一幀跳過一大段,
      // 中間的墨獸會被整個略過 —— 畫面上劍明明穿過去了卻沒傷害。
      if(segCircleDist(s.px, s.py, s.x, s.y, en.x, en.y) < en.r+stat.size+(stat.hitPadding||0)){
        const TF=stat.tierFlags||{}, C=s.cmd;
        if(s.pierceLeft<=0) continue;                    // 耐久已盡:這一幀還沒被收掉,先別再打
        let dmg=stat.damage;
        let isCrit = Math.random()<stat.crit;
        if(stat.firstStrike && !G.firstStrikeDone){ isCrit=true; G.firstStrikeDone=true; }
        // 引鋒的代價「引鋒本身不能暴擊」:被追蹤掰彎過的那道劍令,這一擊不暴擊。
        if(!stat.homingCanCrit && C && C.homed) isCrit=false;
        // 養鋒·圓滿「鋒芒」:蓄滿後的下一擊必定暴擊
        if(G.edgeReady){ isCrit=true; G.edgeReady=false; hooks.whiteCut?.(en.x,en.y,s.ang); }
        // 凝神·圓滿:專注滿層時,這一擊化為凝神一劍
        if(TF.focusStrike && G.focusReady){ G.focusReady=false; G.focus=0;
          dmg*=2.2; hooks.splash?.(en.x,en.y,'#c08a2e',2.4); hooks.floatText?.(en.x,en.y-en.r-40,'凝神一劍','#c08a2e'); }
        if(isCrit) dmg*=(stat.critMul||2);
        if(s.returned) dmg*=(stat.returnDmgMul||1);      // 歸鋒:回程傷害加成
        if(s.echo) dmg*=0.5;                              // 殘鋒為半傷
        if(C && C.dmgMul) dmg*=C.dmgMul;                  // 自動劍令(回刺)的倍率
        if(en.broken>0) dmg*=1.35;                        // 貫鋒式·大成掛的破甲狀態:受創加深
        // 分裂後每把劍的威力被攤薄:一把打 80 的劍裂成兩把,每把打 40。
        // 傷害變小 → durCost 也跟著變小,所以總傷害不變,換到的是覆蓋面。
        // 聚鋒式·圓滿:聚形不分裂,改用折返把威力疊上去。
        if(TF.mergeHeavy && C && C.formation==='merge' && C.returnsDone)
          dmg *= 1 + 0.3*C.returnsDone;
        // 耐久消耗以「速度加成之前」的傷害計算,加速才不會變成白做。
        const dmgForDur = dmg;
        dmg *= speedMul(C);
        // 貫鋒式·小成:同一把劍每多穿透一名墨獸,傷害遞增半成
        if(TF.pierceRamp){ dmg*=1+0.05*(s.hitSet.size); }
        // 定鋒·大成:串珠穿過任一墨鏈 → 瞬間小爆,本擊 +22%
        if(TF.anchorLink && C && C.formation==='inline' && G.anchorLinks.length){
          for(const Lk of G.anchorLinks){
            if(segCircleDist(Lk.ax,Lk.ay,Lk.bx,Lk.by,s.x,s.y) < stat.size+6){
              dmg*=1.22; hooks.splash?.(s.x,s.y,'#5a5148',1.1); break;
            }
          }
        }
        // 齊鋒式·大成:同一道劍令的多把劍在同一幀命中同一名墨獸 → 末劍齊斬
        let volley=false;
        if(TF.volleyStrike && C && !C.auto && C.slots>1){
          if(!C.frameHit) C.frameHit=new Map();
          const nHit=(C.frameHit.get(en)||0)+1; C.frameHit.set(en,nHit);
          if(nHit>=2){ volley=true; dmg*=1.6; }
        }
        hooks.dmgTo?.(en,dmg); en.hit=6; s.hitSet.add(en); s.hitPass.set(en,s.passId||0);
        if(G.bossTest&&en.isBoss) en.testHits=(en.testHits||0)+1;
        if(C){ C.anyHit=true; if(!C.hitOrder.includes(en)) C.hitOrder.push(en); }
        // 貫鋒陣·圓滿 滿貫:一道劍令的全部 N 把劍都命中同一敵 → 額外總傷 50%
        if(TF.fullPierce && C && C.slots>1 && C.formation==='inline'){
          if(!C.mgHit) C.mgHit=new Map();
          let mset=C.mgHit.get(en); if(!mset){ mset=new Set(); C.mgHit.set(en,mset); }
          mset.add(s.slot);
          if(mset.size>=C.slots){
            mset.clear();
            const bonus = 0.5 * dmgForDur * C.slots;    // 全 N 把單劍傷總和的一半
            hooks.dmgTo?.(en, bonus); en.hit=6;
            hooks.splash?.(en.x,en.y,'#c08a2e',2.0);
            hooks.floatText?.(en.x,en.y-en.r-30,'滿貫','#c08a2e');
            hooks.floatText?.(en.x,en.y-en.r-12,'-'+Math.round(bonus),'#f1d18a');
          }
        }
        // 散鋒式·大成:殘鋒也能觸發墨痕(否則自動劍令不上狀態)
        // 墨痕:蝕 / 鎮。聚鋒(A)本質是一把劍 → 同幀同敵只上一層,不吃 N 把疊層流。
        if(!(C && C.noIntent) || TF.scatterEchoIntent){
          if(C && C.formation==='merge'){
            if(!C.mergeIntentFrame) C.mergeIntentFrame=new Set();
            if(!C.mergeIntentFrame.has(en)){ C.mergeIntentFrame.add(en); hooks.applyIntent?.(en); }
          } else hooks.applyIntent?.(en);
        }
        // 貫鋒式·大成:被這道劍令斬到的最後一名墨獸受破甲
        if(TF.pierceBreak && C && !C.auto) en.broken=90;
        // 齊鋒式·圓滿:每四次齊斬,自行引出一記重斬
        if(volley && C){
          C.volley=(C.volley||0)+1;
          if(TF.volleyHeavy && C.volley%4===0){
            hooks.splash?.(en.x,en.y,'#2b2620',3.2); hooks.shake?.(8); hooks.hitstop?.(4); hooks.playBoom?.();
            for(const e2 of G.enemies) if(Math.hypot(e2.x-en.x,e2.y-en.y)<110){ hooks.dmgTo?.(e2,stat.damage*1.2); e2.hit=6; }
            hooks.floatText?.(en.x,en.y-en.r-26,'重斬','#8a2b2b');
          } else hooks.floatText?.(en.x,en.y-en.r-26,'齊斬','#5a4e3c');
        }
        // 散鋒式·小成:命中後向兩側各分出一道殘鋒(帶自動生成的短劍令)
        if(TF.scatterEcho && C && !C.auto && !s.echo){
          const L=60+stat.size*1.6;
          // 圓滿「墨濺四方」:兩側各一 → 四面各一。
          const dirs = TF.scatterQuad ? [-1,1,-2.2,2.2] : [-1,1];
          for(const sgn of dirs){
            const ea=s.ang+sgn*(0.7+Math.random()*0.35);
            spawnAutoCommand(s.x,s.y, s.x+Math.cos(ea)*L, s.y+Math.sin(ea)*L,
              { dmgMul:0.2, skip:en, intent:!!TF.scatterEchoIntent,
                returns: 0 });
          }
        }
        // 折返不再由命中觸發 —— 劍完整穿過去,一路飛到戰場邊緣才掉頭(見 update 的邊緣折返)
        // 引鋒·大成:擊殺後立即再延伸一段去找下一個目標。引鋒為齊鋒陣專屬 → 限 parallel,
        // 否則「齊陣學到引鋒、切回扇陣」時此處仍會把扇型劍令往目標延伸,造成動作詭異。
        if(TF.guideRetarget && C && !C.auto && C.formation==='parallel' && en.hp<=0 && C.extended<6){
          const nx=nearestEnemy(en.x,en.y,300);
          if(nx && nx!==en && extendCommand(C,nx.x,nx.y)) C.extended++;
        }
        if(stat.ember>0){ en.ember=Math.max(en.ember,stat.ember); }
        if(stat.ice>0){ en.chill=100; }
        // 分裂後每把劍只打全額的 1/N,逐把跳字會變成一串「五」「五」「五」——
        // 看起來像撓癢,但總傷害其實跟沒分裂一樣。所以同一幀打同一隻墨獸的傷害
        // 全部累加成一個數字,玩家看到的是這一擊真正的總量。
        // 暴擊旗標由第三個參數帶進去(floatText 原本靠字串裡的「!」判斷,那個已移除)。
        // 凝神·大成:連續命中累積專注,滿八層待發
        if(TF.focusStacks){ G.focusIdle=0;
          if(!G.focusReady && ++G.focus>=8){ G.focus=8; G.focusReady=true;
            hooks.floatText?.(G.player.x,G.player.y-52,'凝神','#c08a2e'); } }
        // 破墨·小成:潑墨處留下墨滴(大成的墨滴會再炸一次)
        if(TF.inkDropOnSplash && stat.explode>0 && Math.random()<0.5){
          const a=Math.random()*6.283, r=18+Math.random()*24;
          G.drops.push({x:en.x+Math.cos(a)*r, y:en.y+Math.sin(a)*r, r:14, t:300,
                        dmg:stat.damage*0.35, boom:!!TF.inkDropExplode});
          if(G.drops.length>24) G.drops.shift();
        }
        // 疾影·大成/圓滿:殘影補刀。大成只補在同一目標身上,圓滿讓殘影自己找目標。
        if(TF.afterimageHits && s.trail && s.trail.length>4){
          const g=s.trail[Math.max(0,s.trail.length-5)];
          // pendDamage 只負責跳字,實際扣血一定要走 dmgTo —— 少了它殘影就是純特效。
          if(TF.afterimageSolid){
            for(const e2 of G.enemies)
              if(e2!==en && Math.hypot(e2.x-g.x,e2.y-g.y)<e2.r+stat.size){
                hooks.dmgTo?.(e2, dmg*0.25); hooks.pendDamage?.(e2, dmg*0.25, false); e2.hit=6; break; }
          } else { hooks.dmgTo?.(en, dmg*0.25); hooks.pendDamage?.(en, dmg*0.25, false); }
        }
        hooks.pendDamage?.(en, dmg, isCrit);
        hooks.splash?.(s.x,s.y,hooks.getElementHitColor?.(stat.element),1);
        if(isCrit){ hooks.playCrit?.(); hooks.shake?.(4); hooks.hitstop?.(3); flash(0.12,'240,220,160');
          if(stat.whiteCut){
            hooks.whiteCut?.(s.x,s.y,s.ang);
            // 斷意·小成:暴擊改留兩道飛白(交叉)
            if(TF.whiteCutTwin) hooks.whiteCut?.(s.x+(Math.random()-.5)*18, s.y+(Math.random()-.5)*18, s.ang+1.1);
          }
          // 飛白千峰:暴擊生一道殘鋒 —— 給它一段自動生成的短劍令,系統裡不存在沒有劍令的劍
          // 一律走 spawnAutoCommand —— 手寫劍令物件漏欄位會在命中時丟例外
          // (這裡原本自己組物件,少了 hitOrder,只有解鎖飛白千峰才會踩到)
          if(stat.criticalEcho && !s.echo){
            const ea=s.ang+(Math.random()-0.5)*0.9, L=70+stat.size*2;
            spawnAutoCommand(s.x, s.y, s.x+Math.cos(ea)*L, s.y+Math.sin(ea)*L,
              { dmgMul:0.5, skip:en, intent:true });
          }
        }
        else { hooks.playHit?.(); hooks.shake?.(1.1); }
        if(stat.explode>0){
          // 範圍傷害只播放短暫爆墨與霧散；禁止把半透明墨斑寫進紙面長效層。
          hooks.splash?.(s.x,s.y,'#c0662e',2.2); hooks.playBoom?.(); hooks.shake?.(7);
          for(const e2 of G.enemies){ if(e2!==en && Math.hypot(e2.x-s.x,e2.y-s.y)<stat.explode){
            hooks.dmgTo?.(e2,stat.damage*0.6); e2.hit=6; }}
          for(let k=0;k<8;k++)hooks.ink?.(s.x,s.y,(Math.random()-.5)*4,(Math.random()-.5)*4,10+Math.random()*14);
        }
        if(en.hp<=0){ killEnemy(j); }
        // 耐久制:**每一次命中都扣**,回頭重斬同一隻也一樣。扣多少看這一擊有多重。
        // 能穿過墨獸,是因為耐久還沒耗盡;耗盡就當場化墨消散。
        s.pierceLeft -= durCost(dmgForDur);
        if(s.pierceLeft<=0){
          // 定鋒(基礎):串珠飛劍耐久耗盡不消散,改插地成劍樁駐留(學了定鋒即有,以 beadSlow 為「已學」訊號)。
          // 墨域減速/回補=小成、墨鏈=大成、引爆=圓滿,分別在各自邏輯處以 tier 旗標再加。
          if(C && C.formation==='inline' && stat.beadSlow){ spawnAnchor(s); s.dead=true; break; }
          s.dead=true; swordDissolve(s); break;
        }
      }
    }
    if(s.dead){
      // 槽位「留著屍體」而不是清成 null —— 清成 null 的話劍令那邊的空槽補劍
      // 會把它當成從沒填過的槽,又生一把新的出來(等於接力沒關掉)。
      G.swords.splice(i,1);
    }
  }

  // 定鋒:劍樁 —— 壽命、週期斬割、回補穿透;圓滿引爆(到期/手動)
  {
    const TFa2=stat.tierFlags||{};
    let anchorHitSound=false;
    for(let ai=G.anchors.length-1;ai>=0;ai--){
      const A=G.anchors[ai];
      A.t--;
      // 圓滿 anchorDetonate:壽終不默默消失 → 引爆
      if(A.t<=0){ if(TFa2.anchorDetonate) detonateAnchor(A); G.anchors.splice(ai,1); continue; }
      // 圓滿:手繪劍跡(仍在描筆跡、未進續飛的劍令中心)命中劍樁 → 提前引爆
      if(TFa2.anchorDetonate){
        let boom=false;
        for(const c of G.commands){
          if(c.free || c.auto) continue;
          if((c.x-A.x)**2+(c.y-A.y)**2 < (A.r*0.7)**2){ boom=true; break; }
        }
        if(boom){ detonateAnchor(A); G.anchors.splice(ai,1); continue; }
      }
      // 週期斬割(每 18 幀一次),對「小半徑」內敵造成持續傷(基礎行為);同一輪每敵僅一次
      if(G.t%18===0){
        A.hitSet.clear();
        const sr=A.sr||26;
        for(const en of G.enemies){
          if(en.isBoss && en.bossState!=='orbit' && en.bossState!=='lunge') continue;
          if(A.hitSet.has(en)) continue;
          if((en.x-A.x)**2+(en.y-A.y)**2 < (sr+en.r)**2){
            hooks.dmgTo?.(en, A.dmg*0.5); en.hit=6; A.hitSet.add(en);
            anchorHitSound=true;
            hooks.splash?.(en.x,en.y,'#3a332a',0.8);
          }
        }
      }
      // 小成 anchorField:新串珠飛劍經過劍樁範圍可回補穿透耐久(每顆對每樁最多 1 次、+1)
      if(TFa2.anchorField) for(const sw of G.swords){
        if(sw.dead || !sw.cmd || sw.cmd.formation!=='inline') continue;
        if(!sw.anchorFed) sw.anchorFed=new Set();
        if(sw.anchorFed.has(A)) continue;
        if((sw.x-A.x)**2+(sw.y-A.y)**2 < (A.r+stat.size)**2){
          sw.anchorFed.add(A);
          sw.pierceLeft=Math.min(sw.cmd.life||1, sw.pierceLeft+1);
        }
      }
    }
    // 同一幀多座劍樁／多隻怪只播一次，保留斬擊回饋且避免音效疊爆。
    if(anchorHitSound) hooks.playHit?.();
    // 大成 anchorLink:相鄰劍樁連墨鏈(有上限,不無限擴散);路徑上敵週期切傷
    if(TFa2.anchorLink && G.anchors.length>1){
      G.anchorLinks.length=0;
      const LINK=170, MAXL=24;
      for(let a=0;a<G.anchors.length && G.anchorLinks.length<MAXL;a++){
        for(let b=a+1;b<G.anchors.length && G.anchorLinks.length<MAXL;b++){
          const A=G.anchors[a], B=G.anchors[b];
          if((A.x-B.x)**2+(A.y-B.y)**2 < LINK*LINK)
            G.anchorLinks.push({ax:A.x, ay:A.y, bx:B.x, by:B.y});
        }
      }
      if(G.t%18===9){
        const cut=stat.damage*0.4*(1+(stat.anchorDmgMul||0));
        for(const Lk of G.anchorLinks){
          for(const en of G.enemies){
            if(en.isBoss && en.bossState!=='orbit' && en.bossState!=='lunge') continue;
            if(segCircleDist(Lk.ax,Lk.ay,Lk.bx,Lk.by,en.x,en.y) < en.r+6){ hooks.dmgTo?.(en, cut); en.hit=6; }
          }
        }
      }
    } else if(G.anchorLinks.length){ G.anchorLinks.length=0; }
  }


}
