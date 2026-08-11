import { G, stat } from './core.js';
import { ctx, W, H, DPR } from './viewport.js';
import { HERO_VISUAL_SCALE, HERO_BODY_SCALE } from './constants.js';
import { bossVisualLift } from './enemy.js';
import { leadInLen, cmdLife } from './combat.js';
import { supHash } from './geom.js';

let hooks={};
let paperDone=false;
export function configureRender(nextHooks){ hooks=nextHooks||{}; }
export function invalidatePaper(){ paperDone=false; }

export function drawSplash(target,sp){
  const t=sp.age/sp.dur;
  const grow=t<0.15?t/0.15:1;
  const a=t<0.6?1:Math.max(0,1-(t-0.6)/0.4);
  const R=sp.r*(0.6+grow*0.4);
  target.save(); target.translate(sp.x,sp.y); target.rotate(sp.rot);
  target.globalAlpha=a*0.85; target.fillStyle=sp.c;
  const nC=sp.corners.length;
  target.beginPath();
  for(let i=0;i<nC;i++){ const th=i/nC*6.283,r=R*0.5*sp.corners[i];
    const px=Math.cos(th)*r,py=Math.sin(th)*r;i===0?target.moveTo(px,py):target.lineTo(px,py); }
  target.closePath(); target.fill();
  for(const s of sp.spikes){
    const len=R*s.len,midR=s.broken?len*0.6:len;
    target.beginPath();
    target.moveTo(Math.cos(s.ang-s.w)*R*0.4,Math.sin(s.ang-s.w)*R*0.4);
    target.lineTo(Math.cos(s.ang)*midR,Math.sin(s.ang)*midR);
    target.lineTo(Math.cos(s.ang+s.w)*R*0.4,Math.sin(s.ang+s.w)*R*0.4);
    target.closePath(); target.fill();
  }
  target.restore(); target.globalAlpha=1;
}

export function drawMistDissolve(target,m){
  const t=m.age/m.dur,ease=1-Math.pow(1-t,2),r=m.r*(.72+ease*.78),a=Math.pow(1-t,1.7);
  target.save(); target.translate(m.x+m.vx*m.age,m.y+m.vy*m.age); target.rotate(m.rot||0); target.scale(1,m.squash);
  const fog=target.createRadialGradient(-r*.16,-r*.12,r*.05,0,0,r);
  fog.addColorStop(0,'rgba('+m.color+','+(a*.30)+')');
  fog.addColorStop(.42,'rgba('+m.color+','+(a*.16)+')');
  fog.addColorStop(1,'rgba('+m.color+',0)');
  target.fillStyle=fog; target.beginPath(); target.arc(0,0,r,0,6.283); target.fill();
  if(m.rot!=null){
    target.strokeStyle='rgba('+m.color+','+(a*.22)+')';target.lineCap='round';
    for(let k=0;k<3;k++){const yy=(k-1)*r*.24,reach=r*(.65+k*.17);target.lineWidth=Math.max(.7,r*(.055-k*.012));
      target.beginPath();target.moveTo(-reach*.6,yy);target.bezierCurveTo(-reach*.15,yy-r*.12,reach*.35,yy+r*.14,reach,yy-r*.08);target.stroke();}
  }
  target.restore();
}

export function swordFxTrail(target,tr,size,rgb){
  const n=tr.length;if(n<2)return;
  const trailFx=hooks.getTrailFx?.(),pale=rgb==='196,186,168';
  if(trailFx?.ok){
    const col=pale?'rgba(238,232,217,1)':'rgba('+rgb+',1)';
    const im=hooks.tintFrame?.(trailFx.image,col);
    for(const t of [.42,.68]){
      const i=Math.max(1,Math.min(n-1,Math.round((n-1)*t))),p=tr[i],q=tr[i-1];
      const w=Math.max(8,size*(pale?2.8:3.3)),h=w/trailFx.aspect;
      target.save();target.translate(p.x,p.y);target.rotate(Math.atan2(p.y-q.y,p.x-q.x));
      target.globalAlpha*=pale?.16:.12;target.drawImage(im,-w,-h*.5,w,h);target.restore();
    }
  }
  target.save();target.lineCap='round';
  for(let i=1;i<n;i++){
    if(i%4===1&&i<n-1)continue;
    const p=tr[i],q=tr[i-1],t=i/(n-1),nx=-(p.y-q.y),ny=p.x-q.x,d=Math.hypot(nx,ny)||1;
    const j=Math.sin(i*17.17)*size*.08;
    target.strokeStyle='rgba('+rgb+','+((pale?.11:.16)+t*(pale?.16:.22))+')';
    target.lineWidth=Math.max(.55,size*(.10+t*.22));target.beginPath();
    target.moveTo(q.x+nx/d*j,q.y+ny/d*j);target.lineTo(p.x+nx/d*j,p.y+ny/d*j);target.stroke();
  }
  target.restore();
}

export function enemyVariantFrame(en,img){
  const tone=hooks.getEnemyTone?.(en.species);
  return tone?hooks.tintFrame?.(img,tone):img;
}

export function drawBossShots(){
  for(const q of G.bossShots){
    ctx.save(); ctx.translate(q.x,q.y); ctx.rotate(G.t*.025+q.seed);
    if(q.web){
      const pulse=1+Math.sin(G.t*.18+q.seed)*.08;
      ctx.scale(pulse,pulse);
      ctx.fillStyle='rgba(232,238,220,.9)';ctx.strokeStyle='rgba(48,74,61,.78)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(0,0,q.r*.72,0,6.283);ctx.fill();ctx.stroke();
      ctx.strokeStyle='rgba(72,102,84,.7)';ctx.lineWidth=1;
      for(let k=0;k<4;k++){const a=k*1.571;ctx.beginPath();ctx.arc(0,0,q.r*(.38+k*.12),a,a+2.35);ctx.stroke();}
      ctx.restore();continue;
    }
    const tail=Math.min(42,8+q.age*.6),v=Math.hypot(q.vx,q.vy)||1,ux=q.vx/v,uy=q.vy/v;
    ctx.rotate(-(G.t*.025+q.seed));
    const grd=ctx.createLinearGradient(-ux*tail,-uy*tail,0,0);
    grd.addColorStop(0,'rgba(45,40,35,0)');grd.addColorStop(1,'rgba(38,33,29,.42)');
    ctx.strokeStyle=grd;ctx.lineWidth=q.r*1.25;ctx.lineCap='round';ctx.beginPath();
    ctx.moveTo(-ux*tail,-uy*tail);ctx.lineTo(0,0);ctx.stroke();
    ctx.rotate(G.t*.025+q.seed);
    ctx.fillStyle='rgba(24,22,20,.9)';ctx.beginPath();
    for(let k=0;k<14;k++){const a=k/14*6.283,rr=q.r*(.75+.22*Math.sin(k*4.17+q.seed));
      const x=Math.cos(a)*rr,y=Math.sin(a)*rr;k?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(133,47,39,.78)';ctx.lineWidth=1.6;ctx.lineCap='round';
    for(let k=0;k<q.hp;k++){const a=-.7+k*1.35;ctx.beginPath();ctx.moveTo(-2,1);
      ctx.lineTo(Math.cos(a)*q.r*.48,Math.sin(a)*q.r*.48);ctx.lineTo(Math.cos(a+.18)*q.r*.72,Math.sin(a+.18)*q.r*.72);ctx.stroke();}
    ctx.strokeStyle='rgba(31,28,25,.46)';ctx.lineWidth=2;
    for(let k=0;k<3;k++){const a=k*2.094+G.t*.018;ctx.beginPath();ctx.arc(0,0,q.r+4+k*2,a,a+1.05);ctx.stroke();}
    ctx.restore();
  }
}

export function drawSwordSprite(ctx,s){
  const SWDSPR=hooks.getSwordSprite?.(); if(!SWDSPR) return;
  const speed=Math.hypot(s.vx||0,s.vy||0), k=stat.size;
  const BL=38+k*1.8+Math.min(12,speed*.7);          // 沿用原本的刀身長度手感
  const w=BL/SWDSPR.blade, h=w/SWDSPR.aspect;
  let im;
  if(s.age<24){ im=SWDSPR.atk[Math.min(5,Math.floor(s.age/4))]; }
  else { const t=(G.t*0.055+s.age*0.02+(s.seed||0)); im=SWDSPR.idle[Math.floor(((t%8)+8)%8)]; }
  if(!im||!im.complete||!im.naturalWidth) return;
  ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.ang);
  ctx.drawImage(im, -w*SWDSPR.grip, -h/2, w, h);
  ctx.restore();
}
export function drawInkFlyingSword(ctx,s){
  const speed=Math.hypot(s.vx||0,s.vy||0), k=stat.size*swMul(s).size;
  const BL=38+k*1.8+Math.min(12,speed*.7), bw=2.8+k*.22;
  const EL=hooks.getElement?.(stat.element)||hooks.getElement?.('none'), phase=(G.t+s.age*3)*.08;
  ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.ang);
  ctx.lineCap='round'; ctx.lineJoin='round';

  // 柄後破筆墨絲：長短錯落，隨飛行微幅擺動。
  for(let i=0;i<4;i++){
    const y=(i-1.5)*bw*.75, sway=Math.sin(phase+i*1.7)*bw*.9;
    ctx.strokeStyle='rgba(24,21,18,'+(0.48-i*.07)+')';
    ctx.lineWidth=Math.max(.55,bw*(.54-i*.08));
    ctx.beginPath(); ctx.moveTo(-8,y*.45); ctx.quadraticCurveTo(-20-i*3,y+sway,-30-i*5,y*.5+sway*1.35); ctx.stroke();
  }
  // 速度殘影：比劍身更淡、更扁，形成示意圖中的放射飛劍感。
  ctx.fillStyle='rgba(30,27,23,.16)';
  ctx.beginPath(); ctx.moveTo(-BL*.82,-bw*1.7); ctx.lineTo(BL*.72,-bw*.58);
  ctx.lineTo(BL*.92,0); ctx.lineTo(-BL*.9,bw*1.3); ctx.closePath(); ctx.fill();

  // 深墨劍身，劍尖保持銳利；根部略為不規則，像濕墨收筆。
  const blade=ctx.createLinearGradient(-3,0,BL,0);
  blade.addColorStop(0,'rgba(18,16,14,.98)'); blade.addColorStop(.58,'rgba(38,35,31,.96)'); blade.addColorStop(1,'rgba(13,12,10,.92)');
  ctx.fillStyle=blade; ctx.strokeStyle='rgba(8,7,6,.92)'; ctx.lineWidth=1.1;
  ctx.beginPath(); ctx.moveTo(-3,-bw*.92); ctx.quadraticCurveTo(BL*.48,-bw*1.08,BL,0);
  ctx.quadraticCurveTo(BL*.45,bw*.92,-3,bw*.78); ctx.lineTo(-7,bw*.28); ctx.lineTo(-4,-bw*.2); ctx.closePath();
  ctx.fill(); ctx.stroke();

  // 劍脊與飛白裂痕，讓黑色輪廓仍保有水墨材質。
  ctx.strokeStyle=stat.element==='none'?'rgba(205,198,181,.38)':EL.spine; ctx.lineWidth=.9;
  ctx.beginPath(); ctx.moveTo(2,0); ctx.lineTo(BL*.9,0); ctx.stroke();
  ctx.strokeStyle='rgba(241,235,221,.42)'; ctx.lineWidth=.75;
  ctx.beginPath(); ctx.moveTo(BL*.22,-bw*.18); ctx.lineTo(BL*.43,-bw*.1);
  ctx.moveTo(BL*.52,bw*.12); ctx.lineTo(BL*.68,bw*.04); ctx.stroke();

  // 墨色護手、短柄與劍首。
  ctx.fillStyle='#171411';
  ctx.beginPath(); ctx.moveTo(-4,-bw*2.15); ctx.quadraticCurveTo(1,-bw*1.25,1,0);
  ctx.quadraticCurveTo(1,bw*1.25,-4,bw*2.15); ctx.lineTo(-7,bw*1.25); ctx.lineTo(-7,-bw*1.25); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#2c2721'; ctx.fillRect(-17,-bw*.62,11,bw*1.24);
  ctx.strokeStyle='rgba(8,7,6,.75)'; ctx.lineWidth=.8;
  for(let x=-16;x<-7;x+=2.7){ctx.beginPath();ctx.moveTo(x,-bw*.6);ctx.lineTo(x+1.4,bw*.6);ctx.stroke();}
  ctx.fillStyle='#15120f'; ctx.beginPath(); ctx.arc(-18,0,bw*.72,0,6.283); ctx.fill();
  ctx.restore();
}
// 分裂移除後每把劍威力都是全額,不再需要「裂劍畫小一點」。保留函式簽名免得四處改呼叫點。
const SW_FULL={size:1, alpha:1};
// 聚鋒(A):領頭劍依存活數放大寬度(mergeScale);其餘劍不會被繪製(mergeHidden 已在繪製迴圈跳過)。
export function swMul(s){ return (s && s.mergeScale && s.mergeScale!==1) ? {size:s.mergeScale, alpha:1} : SW_FULL; }
export function drawJian(ctx, s){
  const FLYSWORD=hooks.getFlyingSword?.();
  // 飛出去的是同一把母版飛劍；劍寬只小幅影響尺寸，避免升級後變成巨型黑針。
  if(FLYSWORD.ok){
    const speed=Math.hypot(s.vx||0,s.vy||0);
    const M=swMul(s);
    const TFd=stat.tierFlags||{};
    // 疾影·小成:身後留下殘影(先畫,才會在劍身後面)
    if(TFd.afterimage && s.trail && s.trail.length>3){
      ctx.save();
      for(let g=1;g<=2;g++){
        const q=s.trail[Math.max(0,s.trail.length-1-g*3)]; if(!q) continue;
        ctx.globalAlpha=0.20/g;
        const gw=(44+stat.size*.9)*M.size*(1-g*0.08), gh=gw/FLYSWORD.aspect;
        ctx.save(); ctx.translate(q.x,q.y); ctx.rotate(s.ang);
        ctx.drawImage(FLYSWORD.image,-gw*FLYSWORD.grip,-gh/2,gw,gh); ctx.restore();
      }
      ctx.restore();
    }
    // 養鋒·小成:劍身拉長
    const longK = TFd.longBlade ? 1.28 : 1;
    const w=(44+stat.size*.9+Math.min(5,speed*.22))*(s.echo?.88:1)*M.size*longK;
    // 加寬只作用於立繪，不改飛劍碰撞半徑。
    const h=w/FLYSWORD.aspect*2.2;
    ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.ang);
    ctx.globalAlpha*=(s.echo?.72:.94)*M.alpha;
    // 母版原有銀白刃線縮到手機尺寸會讀成去背白邊；以 alpha 為輪廓統一壓成深墨剪影。
    ctx.drawImage(hooks.tintFrame?.(FLYSWORD.image,'#181512'),-w*FLYSWORD.grip,-h/2,w,h);
    ctx.restore();
    return;
  }
  drawInkFlyingSword(ctx,s);
}
// 墨劍永遠不改造型、不改配色 —— 元素只表現在劍氣與墨痕上。
// 「劍沒有變,變的是劍勢。」
// 劍穗:從劍首垂下的三節繩結,依運動方向拖曳,待機時微微擺動
export function drawTassel(x,y,ang,len,phase,alpha){
  const seg=3, sw=len*0.34;
  let px=x, py=y, a=ang;
  ctx.save(); ctx.lineCap='round';
  for(let i=0;i<seg;i++){
    const sway=Math.sin(phase*0.055 - i*0.9)*0.30*(i+1)/seg;
    a += sway*0.5 + (i?0.12:0.22);
    const nx=px+Math.cos(a)*sw/seg*1.6, ny=py+Math.sin(a)*sw/seg*1.6;
    ctx.strokeStyle='rgba(38,34,30,'+(alpha*(0.72-i*0.16))+')';
    ctx.lineWidth=(2.1-i*0.5)*Math.max(0.4,len/60);
    ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(nx,ny); ctx.stroke();
    px=nx; py=ny;
  }
  ctx.restore();
}

export function drawEnemies(){
  const enemySprites=hooks.getEnemySprites?.()||{};
  // 敵人(墨團妖魔)
  for(const en of G.enemies){
    const grp=enemySprites[en.type];
    if(grp && grp.ok){
      // 真透明 sprite:多幀時隨機起始+慢速交叉淡入(變體感+煙霧晨變);單幀直接畫
      const dirGrp=en.isBoss&&en.bossSide===0?grp.top:en.isBoss&&en.bossSide===2?grp.bottom:null;
      const bossIdle=dirGrp&&dirGrp.idle?dirGrp.idle:(en.isBoss?grp.frames[0]:null);
      const atkSrc=dirGrp?dirGrp.attack:grp.attack;
      const bossAtk=en.isBoss&&en.bossState==='lunge'&&atkSrc&&atkSrc.filter(Boolean).length===6
        ? atkSrc.filter(Boolean) : null;
      const bossDis=en.isBoss&&(en.bossSide===1||en.bossSide===3)&&en.bossState==='dissolve'&&grp.dissolve&&grp.dissolve.filter(Boolean).length===6
        ? grp.dissolve.filter(Boolean) : null;
      const spiderAtk=en.type==='spider'&&(en.aiT%180)<54&&grp.attack&&grp.attack.filter(Boolean).length===6
        ? grp.attack.filter(Boolean) : null;
      const ravenT=en.type==='raven'?en.aiT%170:-1, fangT=en.type==='fang'?en.aiT%138:-1;
      const expectedAtk=en.type==='fang'?6:4;
      const creatureAtk=((en.type==='raven'&&ravenT>=84&&ravenT<132)||(en.type==='fang'&&fangT>=38&&fangT<98))
        &&grp.attack&&grp.attack.filter(Boolean).length===expectedAtk ? grp.attack.filter(Boolean) : null;
      const fr=bossAtk||bossDis||spiderAtk||creatureAtk||(bossIdle?[bossIdle]:grp.frames.filter(Boolean)), n=fr.length,
            scale=en.visualScale||1,
            baseHH=en.visualHeight||(en.isBoss&&(en.bossSide===1||en.bossSide===3)
              ?Math.min(en.r*2.1*scale,W*.58):en.r*2.1*scale),
            // 新墨牙獸攻擊幀共用 420×265 畫布。按 265/201 補償後，像素縮放率
            // 與 362×201 的移動幀完全一致，不再因撲擊姿態變高而被壓扁。
            hh=(creatureAtk&&en.type==='fang')?baseHH*(265/201):baseHH,
            base=(en.hit>0?0.9:1)*(en.alpha==null?1:en.alpha);
      const visualLift=en.isBoss?bossVisualLift(en.bossSide):0;
      const fangGroundFix=(creatureAtk&&en.type==='fang')?-.42*(hh-baseHH):0;
      const put=(img,al)=>{
        const src=en.isBoss?img:enemyVariantFrame(en,img);
        const iw=src.naturalWidth||src.width||1, ih=src.naturalHeight||src.height||1, b=img._inkBounds;
        ctx.globalAlpha=al;
        if(en.isBoss&&b&&(en.bossSide===0||en.bossSide===2)){
          // 正面幀依透明墨形的實際邊界繪製；每幀統一有效高度，不再受畫布留白影響。
          const bodyH=en.r*1.85*scale, bodyW=bodyH*(b[2]/b[3]);
          const cy=Math.max(16+bodyH/2,Math.min(H-18-bodyH/2,en.y+visualLift));
          ctx.drawImage(src,b[0],b[1],b[2],b[3],en.x-bodyW/2,cy-bodyH/2,bodyW,bodyH);
        } else {
          const ww=hh*(iw/ih), y=Math.max(12,Math.min(H-hh-18,en.y-hh*.58+visualLift+fangGroundFix));
          ctx.drawImage(src,en.x-ww/2,y,ww,hh);
        }
      };
      ctx.save();
      if(en.isBoss){
        // Boss 浮於畫卷空間，不畫平台式橢圓陰影；左右共用側面素材，左側水平鏡像。
        ctx.translate(en.x,en.y);
        if(en.bossSide===3) ctx.scale(-1,1);
        ctx.translate(-en.x,-en.y-en.r*(scale-1)*.18);
      } else if(en.type==='blade'||en.type==='spider'||en.type==='raven'||en.type==='fang'){
        // 僅鏡像敵人立繪；後面另畫的狀態環、血條與特效維持原方向。
        ctx.translate(en.x,0);
        ctx.scale(en.facing||1,1);
        ctx.translate(-en.x,0);
        if(en.type==='raven') ctx.translate(0,Math.sin(en.aiT*.14+en.aiSeed)*2.2);
      }
      if(bossAtk){
        const fi=Math.max(0,Math.min(5,Math.floor(en.bossT/58*6)));
        put(fr[fi],base);
      } else if(bossDis){
        const fi=Math.max(0,Math.min(5,Math.floor(en.bossT/46*6)));
        // 首八幀與待機母版交叉淡入，避免最後一張攻擊姿態瞬間跳成消散姿態。
        if(en.bossT<8&&bossIdle) put(bossIdle,base*(1-en.bossT/8));
        put(fr[fi],base*Math.min(1,en.bossT/8));
      } else if(spiderAtk){
        put(fr[Math.max(0,Math.min(5,Math.floor((en.aiT%180)/9)))],base);
      } else if(creatureAtk){
        const p=en.type==='raven'?(ravenT-84)/48:(fangT-38)/60;
        put(fr[Math.max(0,Math.min(n-1,Math.floor(p*n)))],base);
      } else if(n<=1){ put(fr[0], base); }
      else {
        // move / walk 檔是真正的連續動作幀。舊版墨靈同時交叉畫兩張會重影、
        // 墨刃兵則固定在隨機一幀上滑行；改為依各種類移速播放離散幀。
        const rate=en.animRate||.07;
        put(fr[Math.floor(G.t*rate+en.anim)%n],base);
      }
      ctx.restore(); ctx.globalAlpha=1;
      // 部位提示必須由正式角色／受創素材呈現，不再疊加程序線條。
    } else {
      // 回退:程序化墨團 + 眼
      ctx.save(); ctx.translate(en.x,en.y);
      const wob=Math.sin(en.wob)*2;
      ctx.fillStyle=en.hit>0?'#d8cdb0':en.c;
      ctx.beginPath();
      for(let a=0;a<6.28;a+=0.5){ const rr=en.r+Math.sin(a*3+en.wob)*2.5+wob;
        const x=Math.cos(a)*rr,y=Math.sin(a)*rr; a===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.closePath(); ctx.fill();
      ctx.fillStyle='#e9e0cc'; ctx.beginPath(); ctx.arc(-en.r*0.3,-2,2.4,0,6.28);
      ctx.arc(en.r*0.3,-2,2.4,0,6.28); ctx.fill();
      ctx.restore();
    }
    // 狀態環(sprite / 程序化皆繪製)
    const stEro = en.st && en.st.erosion && en.st.erosion.t>0 ? en.st.erosion : null;
    const stSup = en.st && en.st.suppression && en.st.suppression.t>0 ? en.st.suppression : null;
    if(en.ember>0 || en.chill>0 || stEro || stSup){ ctx.save(); ctx.translate(en.x,en.y);
      if(en.ember>0){ ctx.strokeStyle='rgba(200,102,46,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,en.r+3,0,6.28); ctx.stroke(); }
      if(en.chill>0){ ctx.strokeStyle='rgba(120,180,220,.85)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,en.r+3,0,6.28); ctx.stroke(); }
      ctx.restore(); }
    // 蝕:附著在墨身上的活墨裂痕(由內向外腐蝕,不是外圈)
    if(stEro) hooks.drawErosion?.(en, stEro);
    // 鎮:沉墨壓痕(不成圓、不旋轉、不發光)。用世界座標畫,因為弧痕有拖滯,
    // 位置與敵人本體不同步,不能沿用上面那個 translate。
    if(stSup) hooks.drawSuppression?.(en, stSup);
    // 敵方血條：深墨底槽、朱紅血量與一像素框線，對齊示意圖的細長比例。
    if(!en.isBoss&&(en.isElite||en.hp<en.max)){
      const w=Math.max(30,Math.min(62,en.r*2.45)), h=4, x=en.x-w/2, y=en.y-en.r-12;
      ctx.fillStyle='rgba(20,17,14,.88)'; ctx.fillRect(x-1,y-1,w+2,h+2);
      ctx.fillStyle='rgba(76,66,55,.72)'; ctx.fillRect(x,y,w,h);
      ctx.fillStyle='#a22f2b'; ctx.fillRect(x,y,Math.max(0,w*Math.min(1,en.hp/en.max)),h);
      ctx.fillStyle='rgba(235,218,188,.28)'; ctx.fillRect(x,y,w,1);
      if(en.isElite){
        ctx.fillStyle='#173e31'; ctx.font='600 11px "Noto Serif TC",serif';
        ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText(en.speciesName,en.x,y-4);
      }
    }
  }


}

export function drawPlayer(){
  const drawLevel=hooks.getDrawLevel?.()||0;
  const fx=hooks.getFX?.()||{};
  const {ART:art}=hooks.getHeroAssets();
  const swordSprite=hooks.getSwordSprite?.();
  const P=G.player;
  // 中央:劍客本人。腳下改為「墨劍環繞的結界」——待機劍幀沿橢圓軌道旋繞,取代綠色地陣。
  if(drawLevel>=3){
  ctx.save();
  const feet=P.y+P.r*1.05;
  const hpr=Math.max(0,P.hp/P.max), urg=1+(1-hpr)*2.0, low=hpr<0.4;
  // 地面淡墨暈(取代原本的綠色光暈)
  if(fx.glow){
    const glow=ctx.createRadialGradient(P.x,feet,4,P.x,feet,P.r+30+P.pulse*26);
    const gc=low?'176,64,48':'40,34,28';
    glow.addColorStop(0,'rgba('+gc+',.26)'); glow.addColorStop(1,'rgba('+gc+',0)');
    ctx.save(); ctx.translate(P.x,feet); ctx.scale(1,0.4); ctx.translate(-P.x,-feet);
    ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(P.x,feet,P.r+30+P.pulse*26,0,6.28); ctx.fill();
    ctx.restore();
  }
  // 劍環結界:待機劍幀環繞,劍尖朝外、護手朝內;軌道壓扁貼地,前大後小做出景深。
  if(swordSprite.ok && fx.glow){
    const N=6, spin=G.t*0.006*urg;
    const rx=P.r+26+G.intent*8, ry=rx*0.42;
    ctx.save(); ctx.translate(P.x,feet);
    const order=[]; for(let i=0;i<N;i++) order.push(i);
    order.sort((p,q)=>Math.sin(spin+p/N*6.283)-Math.sin(spin+q/N*6.283)); // 後方先畫
    for(const i of order){
      const a=spin+i/N*6.283, px=Math.cos(a)*rx, py=Math.sin(a)*ry;
      const depth=(Math.sin(a)+1)/2;                       // 0 後 → 1 前
      const im=swordSprite.idle[(i*2+Math.floor(G.t*0.04))%swordSprite.idle.length];
      if(!im||!im.complete||!im.naturalWidth) continue;
      const L=P.r*(0.95+depth*0.5)*1.15;                   // 劍長:前排略長(整體放大 15%)
      const w=L/swordSprite.blade, hh=w/swordSprite.aspect;
      const dir=Math.atan2(py,px);                         // 離心方向(劍尖朝外)
      ctx.save(); ctx.translate(px,py); ctx.rotate(dir);
      ctx.globalAlpha=0.24+depth*0.5;
      ctx.drawImage(low?tintFrame(im,'#a2422b'):im, -w*swordSprite.grip, -hh/2, w, hh);
      ctx.restore();
    }
    ctx.globalAlpha=1; ctx.restore();
  }
  ctx.restore();
  if(G.webT>0 && drawLevel>=4){
    const a=Math.min(.42,G.webT/70*.42), rr=52+Math.sin(G.t*.08)*3;
    ctx.save(); ctx.translate(P.x,P.y); ctx.strokeStyle='rgba(35,92,70,'+a+')'; ctx.lineWidth=1.1;
    ctx.beginPath();
    for(let n=0;n<8;n++){ const th=n*Math.PI/4; ctx.moveTo(0,0); ctx.lineTo(Math.cos(th)*rr,Math.sin(th)*rr); }
    ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,rr*.55,0,6.283); ctx.arc(0,0,rr,0,6.283); ctx.stroke(); ctx.restore();
  }
  if(art.ok || heroSet().ok) drawHero(P);
  else {                                            // 貼圖沒載到:退回原本的靈石
    ctx.fillStyle=P.pulse>0.3?'#b04030':'#4a5a3a';
    ctx.beginPath(); ctx.arc(P.x,P.y,P.r,0,6.28); ctx.fill();
    ctx.strokeStyle='#2b2620'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#e9e0cc'; ctx.font='22px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('靈',P.x,P.y+1);
  }
  ctx.restore();
  }


}

export function draw(){
  const FX=hooks.getFX?.()||{};
  const DRAWLV=hooks.getDrawLevel?.()||0;
  const {drawing,path,curLen,meta,ELEM}=hooks.getDrawState();
  const allowedLen=hooks.allowedLen;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  buildPaper();
  ctx.clearRect(0,0,W,H);                    // 紙層在畫布底下,由 CSS 合成
  // 怪物與範圍技能不可在紙面留下長效墨痕；畫卷污染只由背景階段圖控制。
  // G.stains 僅保留舊存檔/除錯相容，不再繪入戰場。


  // 畫面震動:整個戰場位移(HUD 不動)
  // 暫停時震動與閃光一律凍結:衰減寫在 update() 裡,靜觀時不跑,
  // 但 draw() 仍會每幾幀重繪 —— 不擋的話 Math.random() 會讓畫面永遠在抖。
  if(G.shake>0 && !G.paused){
    const a=Math.random()*6.283, m=G.shake*0.55;
    ctx.translate(Math.cos(a)*m, Math.sin(a)*m);
  }

  // 墨暈
  if(FX.ink&&DRAWLV>=2) for(const p of G.inks){ ctx.globalAlpha=Math.max(0,p.a); ctx.fillStyle='#2b2620';
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.28); ctx.fill(); }
  ctx.globalAlpha=1;

  drawPlayer();
  drawBossShots();
  // 敵人與 Boss sprite、狀態環、血條
  if(DRAWLV>=4) drawEnemies();
  // 赴筆:劍離背掠向落筆處的細墨痕
  if(DRAWLV>=5) for(const k of G.streaks){
    ctx.strokeStyle='rgba(40,34,28,'+(k.life*0.34)+')';
    ctx.lineWidth=1.6*k.life+0.4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(k.x1,k.y1); ctx.lineTo(k.x2,k.y2); ctx.stroke();
  }

  // 留白斷鋒:暴擊處刮出的白痕(斷意 / 飛白千峰)
  if(DRAWLV>=4) for(const c of G.cuts){
    ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.ang); ctx.lineCap='round';
    const L=c.len*(1.15-c.life*0.15);
    ctx.strokeStyle='rgba(250,247,238,'+(c.life*0.85)+')'; ctx.lineWidth=2.6*c.life+0.6;
    ctx.beginPath(); ctx.moveTo(-L*0.5,0); ctx.lineTo(L*0.5,0); ctx.stroke();
    ctx.strokeStyle='rgba(250,247,238,'+(c.life*0.32)+')'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-L*0.34,-3.2); ctx.lineTo(L*0.42,-3.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-L*0.42,3.0); ctx.lineTo(L*0.30,3.0); ctx.stroke();
    ctx.restore();
  }

  // 定鋒·大成:墨鏈(深灰靜態連線,分圖層、位於劍樁下方)
  if(DRAWLV>=4 && G.anchorLinks.length){
    ctx.save(); ctx.strokeStyle='rgba(26,23,19,0.32)'; ctx.lineWidth=2.2; ctx.lineCap='round';
    for(const Lk of G.anchorLinks){
      ctx.beginPath(); ctx.moveTo(Lk.ax,Lk.ay); ctx.lineTo(Lk.bx,Lk.by); ctx.stroke();
    }
    ctx.restore();
  }
  // 定鋒:劍樁 + 淡墨圓暈墨域(位於飛行串珠劍下層)
  const anchorFieldOn=(stat.tierFlags||{}).anchorField;
  if(DRAWLV>=4) for(const A of G.anchors){
    const fade=Math.min(1, A.t/30);                       // 將盡時淡出
    // 墨域圓暈=小成 anchorField 才有;基礎劍樁只畫劍身
    if(anchorFieldOn){
      const pulse=0.5+0.5*Math.sin(G.t*0.05+A.x*0.01);    // 圓暈緩慢翻滾
      ctx.save();
      ctx.globalAlpha=0.10*fade*(0.7+0.3*pulse);
      ctx.fillStyle='#4a453d';
      ctx.beginPath(); ctx.arc(A.x,A.y,A.r*(0.92+0.08*pulse),0,6.283); ctx.fill();
      ctx.globalAlpha=0.16*fade;
      ctx.strokeStyle='#3a352d'; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.arc(A.x,A.y,A.r,0,6.283); ctx.stroke();
      ctx.restore();
    }
    // 劍樁沿用現行飛劍母版；紙面遮掉劍尖與下半段，只露出插在畫中的部分。
    ctx.save();
    ctx.globalAlpha*=fade;
    const groundY=A.y+7;
    if(!A.visual) A.visual={x:A.x,y:groundY-18,ang:Math.PI/2,vx:0,vy:0,age:30,seed:A.x+A.y,trail:[]};
    A.visual.x=A.x; A.visual.y=groundY-18;
    // clip 代表宣紙表面：groundY 以下的劍身已刺入畫中，不再可見。
    ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,groundY); ctx.clip();
    drawJian(ctx,A.visual); ctx.restore();
    // 插入點最後覆上一道濕墨縫與短裂痕，讓截斷看起來是刺入而非被裁圖。
    ctx.fillStyle='rgba(28,25,21,.58)';
    ctx.beginPath(); ctx.ellipse(A.x,groundY,11,2.7,0,0,6.283); ctx.fill();
    ctx.strokeStyle='rgba(45,40,34,.38)'; ctx.lineWidth=1; ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(A.x-7,groundY+1); ctx.lineTo(A.x-15,groundY+5);
    ctx.moveTo(A.x+6,groundY+1); ctx.lineTo(A.x+14,groundY+4);
    ctx.moveTo(A.x-3,groundY+2); ctx.lineTo(A.x-7,groundY+7);
    ctx.stroke();
    ctx.restore();
  }

  // 劍氣
  if(DRAWLV>=5) for(const s of G.swords){
    if(s.mergeHidden) continue;   // 聚鋒(A):同位重疊劍只畫領頭那把(聚合大鋒)
    // 墨痕拖尾:沿飛行軌跡的毛筆掃痕,近劍身濃寬、末端漸淡收(依元素著色)
    ctx.lineCap='round'; ctx.lineJoin='round';
    let rgb=(ELEM[stat.element]||ELEM.none).trail;
    if(stat.element==='none' && meta.skin==='gold') rgb='198,150,60'; // 外觀:墨金劍痕
    // 歸念 / 歸藏無痕:折返後的劍痕轉為淡飛白(易辨識回程);殘鋒較細
    if(s.returned && stat.returnDry) rgb='196,186,168';
    // 養鋒·大成:劍氣拖尾轉為飛白乾筆
    if((stat.tierFlags||{}).dryBrushTrail) rgb='206,196,178';
    if(FX.trail){
      // 貫鋒的多把劍在同一軸上，拖尾必須更短、更淡，才不會把劍間留白塗成黑牆。
      const inline=s.cmd&&s.cmd.formation==='inline';
      const keep=inline?2:7;
      const shortTrail=s.trail.length>keep?s.trail.slice(-keep):s.trail;
      const TM=swMul(s);
      ctx.save(); ctx.globalAlpha=(s.echo?.35:(inline ? .18 : .58))*TM.alpha;
      swordFxTrail(ctx,shortTrail,Math.max(1.1,stat.size*(inline ? .18 : .42))*(s.echo?.7:1)*TM.size,rgb);
      ctx.restore();
    }
    // 劍身(統一水墨母版)
    drawJian(ctx, s);
  }

  // 破墨:場上的墨滴
  if(DRAWLV>=4) for(const d of G.drops){
    const k=Math.min(1,d.t/40);
    ctx.globalAlpha=0.34*k+0.12; ctx.fillStyle='#2b2620';
    ctx.beginPath(); ctx.arc(d.x,d.y,d.r*(0.8+0.2*Math.sin(G.t*0.09+d.x)),0,6.283); ctx.fill();
    ctx.globalAlpha=1;
  }
  // 展鋒·圓滿:滯留的劍痕
  if(DRAWLV>=6) for(const L of G.lingers){
    ctx.save(); ctx.globalAlpha=Math.min(0.5, L.t/36*0.5);
    ctx.strokeStyle='rgba(43,38,32,.8)'; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.lineWidth=2+stat.size*0.35;
    ctx.beginPath(); ctx.moveTo(L.pts[0].x,L.pts[0].y);
    for(let k=1;k<L.pts.length;k++) ctx.lineTo(L.pts[k].x,L.pts[k].y);
    ctx.stroke(); ctx.restore();
  }
  // 當前畫痕
  if(DRAWLV>=6 && drawing&&path.length>1){
    // 分段上色:累計長度在可負擔範圍內 → 墨色;超出 → 金色(收筆時這段會被截掉)
    const totalBudget=allowedLen(), lead=leadInLen(path), budget=Math.max(0,totalBudget-lead);
    drawLiveCommandInk(path,budget);
    // 箭頭指示
    const a=path[Math.max(0,path.length-4)],b=path[path.length-1];
    const ang=Math.atan2(b.y-a.y,b.x-a.x);
    ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(ang); ctx.fillStyle='#7a2b2b';
    ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(2,7); ctx.lineTo(2,-7); ctx.closePath(); ctx.fill(); ctx.restore();
    const strokeCharged=Math.min(curLen,budget);
    drawStrokeCost(b.x, b.y, lead+strokeCharged, strokeCharged);
  }

  // 墨獸死亡霧團：短暫播放後完全清除，不參與畫卷污染。
  if(DRAWLV>=3) for(const m of G.mists) drawMistDissolve(ctx,m);
  // 粒子
  if(DRAWLV>=4) for(const sp of G.splashes) drawSplash(ctx,sp);
  if(FX.part&&DRAWLV>=7) for(const p of G.particles){ ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.c;
    ctx.beginPath(); ctx.arc(p.x,p.y,2.5*p.life+0.5,0,6.28); ctx.fill(); }
  ctx.globalAlpha=1;
  // 浮字：傷害使用白色斜體與粗墨描邊；狀態字維持原本的書法色。
  ctx.textAlign='center'; ctx.textBaseline='middle';
  if(DRAWLV>=7) for(const t of G.texts){
    ctx.save(); ctx.globalAlpha=Math.max(0,Math.min(1,t.life*1.45));
    if(t.damage){
      const pop=t.age<6?.72+t.age*.055:1, size=t.crit?26:22;
      ctx.translate(t.x,t.y); ctx.scale(pop,pop);
      // 中文數值:用襯線體、不加外框(外框會把筆畫糊成一團)。
      // 可讀性改靠一層極淡的紙色柔暈,不是描邊。
      ctx.font=(t.crit?'700 ':'600 ')+size+'px "Noto Serif TC","STKaiti","KaiTi",serif';
      ctx.shadowColor='rgba(250,246,238,.9)'; ctx.shadowBlur=6; ctx.shadowOffsetY=0;
      ctx.fillStyle=t.c; ctx.fillText(t.txt,0,0);
      ctx.shadowColor='transparent';
    }else{
      ctx.font='bold 16px serif'; ctx.fillStyle=t.c; ctx.fillText(t.txt,t.x,t.y);
    }
    ctx.restore();
  }
  ctx.globalAlpha=1;

  // ---- 以下不受震動影響 ----
  ctx.setTransform(DPR,0,0,DPR,0,0);

  // 劍匣存量:畫面下緣一排朝上的劍,像彈匣存量。超過三把改用「劍 ×N」免得佔滿寬度。
  if(G.reserve>0) drawReserve();

  // 波次題字:如落款鈐印般淡入淡出
  if(DRAWLV>=8 && G.banner){
    const L=G.banner.life, al=Math.min(1,L*2.4)*Math.min(1,(1-L)*6+0.2);
    ctx.save(); ctx.globalAlpha=Math.max(0,Math.min(1,al))*0.82;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#2b2620'; ctx.font='700 46px "Noto Serif TC",serif';
    ctx.letterSpacing&&(ctx.letterSpacing='10px');
    ctx.fillText(G.banner.txt, W/2, H*0.22+(1-L)*10);
    ctx.strokeStyle='rgba(122,43,43,.75)'; ctx.lineWidth=1.4;
    const bw=120; ctx.beginPath();
    ctx.moveTo(W/2-bw,H*0.22+34); ctx.lineTo(W/2+bw,H*0.22+34); ctx.stroke();
    ctx.restore();
  }

  // 全屏閃光(暴擊、受傷、升級、換波)
  if(DRAWLV>=8 && G.flash>0 && !G.paused){
    ctx.fillStyle='rgba('+G.flashC+','+Math.max(0,G.flash)+')';
    ctx.fillRect(0,0,W,H);
  }


}

export function drawStrokeCost(x, y, chargedLen, lifeLen){
  const free = (G.mana - stat.costBase <= 0) && G.reserve > 0;
  const cost = stat.costBase + chargedLen * Math.max(0.001, stat.costPerPx);
  const life = cmdLife(lifeLen==null?chargedLen:lifeLen);
  const txt  = (free ? '劍匣 · 免費' : '-' + Math.round(cost) + ' 劍意') + '　耐久 ' + life;
  // 指尖會蓋住正下方,所以往上擺;靠畫面邊緣時翻到另一側,不要被切掉
  const up = (y > 96);
  const dx = (x > W - 96) ? -1 : 1;
  const tx = x + dx * 26, ty = y + (up ? -34 : 34);
  ctx.save();
  ctx.textAlign = dx > 0 ? 'left' : 'right';
  ctx.textBaseline = 'middle';
  ctx.font = '700 17px "Noto Serif TC","STKaiti","KaiTi",serif';
  // 可讀性靠紙色柔暈,不用描邊(描邊會把筆畫糊成一團,跟傷害數字同一套規則)
  ctx.shadowColor = 'rgba(250,246,238,.95)'; ctx.shadowBlur = 7;
  // 劍意還夠 → 墨色;這一筆會把劍意畫空 → 朱砂紅;動用劍匣 → 金
  ctx.fillStyle = free ? '#c08a2e'
                : (cost >= G.mana - 0.5 ? '#7a2b2b' : 'rgba(43,38,32,.92)');
  ctx.fillText(txt, tx, ty);
  ctx.shadowColor = 'transparent';
  ctx.restore();
}
export function drawLiveCommandInk(pts,budget){
  let run=0; ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
  for(let k=1;k<pts.length;k++){
    const a=pts[k-1],b=pts[k],seg=Math.hypot(b.x-a.x,b.y-a.y); run+=seg;
    const over=run>budget,t=k/Math.max(1,pts.length-1),base=5.8+stat.size*.48+t*3.8,ink=over?'192,138,46':'30,28,25';
    ctx.strokeStyle='rgba('+ink+',.18)'; ctx.lineWidth=base*1.75; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    ctx.strokeStyle='rgba('+ink+','+(over?.82:.9)+')'; ctx.lineWidth=base*(.82+.13*Math.sin(k*1.73));
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    if(k%3!==0&&seg>1){ const nx=-(b.y-a.y)/seg,ny=(b.x-a.x)/seg;
      for(let j=-1;j<=1;j+=2){ const off=j*base*(.31+.08*Math.sin(k*2.31+j));
        ctx.strokeStyle='rgba('+ink+','+(over?.35:.43)+')'; ctx.lineWidth=Math.max(.7,base*.105);
        ctx.beginPath(); ctx.moveTo(a.x+nx*off,a.y+ny*off); ctx.lineTo(b.x+nx*off*.72,b.y+ny*off*.72); ctx.stroke(); }
    }
  }
  ctx.restore();
}
// 劍匣存量指示:用飛劍 sprite 轉 -90° 朝上畫。沒有 sprite 就退回一個簡單的墨劍形。
export function drawReserve(){
  const SWDSPR=hooks.getSwordSprite?.();
  const n=G.reserve, show=Math.min(n,3);
  const BL=34, gap=BL*0.62;
  const y=H-30, flash=Math.max(0,G.reserveFlash);
  ctx.save();
  ctx.globalAlpha=0.86+flash*0.14;
  const im=(SWDSPR.ok&&SWDSPR.idle[0]&&SWDSPR.idle[0].complete&&SWDSPR.idle[0].naturalWidth)?SWDSPR.idle[0]:null;
  const totalW=(show-1)*gap;
  for(let i=0;i<show;i++){
    const x=W/2 - totalW/2 + i*gap;
    ctx.save(); ctx.translate(x,y); ctx.rotate(-Math.PI/2);
    if(im){
      const w=BL/SWDSPR.blade, h=w/SWDSPR.aspect;
      ctx.drawImage(im, -w*SWDSPR.grip, -h/2, w, h);
    } else {
      ctx.strokeStyle='rgba(43,38,32,.86)'; ctx.lineCap='round';
      ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(-BL*0.28,0); ctx.lineTo(BL*0.72,0); ctx.stroke();
      ctx.lineWidth=3.4; ctx.beginPath(); ctx.moveTo(-BL*0.3,-4); ctx.lineTo(-BL*0.3,4); ctx.stroke();
    }
    ctx.restore();
  }
  if(n>3){
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.font='700 15px "Noto Serif TC",serif';
    ctx.fillStyle='rgba(43,38,32,.9)';
    ctx.shadowColor='rgba(250,246,238,.9)'; ctx.shadowBlur=5;
    ctx.fillText('×'+n, W/2 + totalW/2 + BL*0.42, y-BL*0.42);
    ctx.shadowColor='transparent';
  }
  // 剛存進一把時整排亮一下,告訴玩家「多了一發」
  if(flash>0){
    ctx.globalAlpha=flash*0.45; ctx.fillStyle='rgba(246,240,226,1)';
    ctx.beginPath(); ctx.ellipse(W/2, y-BL*0.35, totalW/2+BL*0.7, BL*0.75, 0,0,6.283); ctx.fill();
  }
  ctx.restore();
}

export function buildPaper(){
  if(paperDone) return;
  const paper=document.getElementById('paper');
  // 第一章四階段畫卷：所有圖共用同一構圖，以 opacity 交叉淡化。
  for(const el of [paper]){
    el.style.backgroundColor='#e9e0cc';
    el.style.backgroundImage=
      'radial-gradient(circle at 50% 45%, rgba(20,18,14,0), rgba(20,18,14,.035) 82%),'
     +"url('assets/scenes/pomo-valley-restored-v2.png')";
    el.style.backgroundSize='cover';
    el.style.backgroundPosition='center center';
    el.style.backgroundRepeat='no-repeat';
  }
  document.getElementById('paperlight').style.backgroundImage="url('assets/scenes/pomo-valley-cleansing-v2.png')";
  document.getElementById('papermid').style.backgroundImage="url('assets/scenes/pomo-valley-recovering-v2.png')";
  document.getElementById('paperheavy').style.backgroundImage="url('assets/scenes/pomo-valley-corrupted-v2.png')";
  updatePaperPhase();
  paperDone=true;
}

export function updatePaperPhase(){
  const heavy=document.getElementById('paperheavy'), mid=document.getElementById('papermid'), light=document.getElementById('paperlight');
  if(!heavy||!mid||!light) return;
  const w=Math.max(1,G.wave||1); let oh=0,om=0,ol=0;
  if(w<=20){ const t=(w-1)/19; oh=1-t; om=t; }
  else if(w<=40){ const t=(w-21)/19; om=1-t; ol=t; }
  else if(w<=60){ const t=(w-41)/19; ol=1-t*.22; } // Boss 活著時仍保留至少 78% 輕污染
  heavy.style.opacity=oh.toFixed(3); mid.style.opacity=om.toFixed(3); light.style.opacity=ol.toFixed(3);
}

export function inkTrail(ctx, tr, size, rgb, dryWhite){
  const n=tr.length; if(n<2) return;
  ctx.lineCap='round'; ctx.lineJoin='round';
  // 1) 主墨緞帶:沿軌跡法線外擴成寬窄變化的封閉形,近劍身寬、末端急收,邊緣加毛邊抖動
  const left=[], right=[];
  for(let i=0;i<n;i++){
    const p=tr[i], a=tr[Math.max(0,i-1)], b=tr[Math.min(n-1,i+1)];
    let nx=-(b.y-a.y), ny=(b.x-a.x); const L=Math.hypot(nx,ny)||1; nx/=L; ny/=L;
    const t=i/(n-1), ease=t*t;                       // 0 尾 → 1 頭
    const w=size*0.95*ease;
    const j=0.8+(Math.sin(i*12.9898)*0.5+0.5)*0.4;   // 0.8~1.2 毛邊
    left.push({x:p.x+nx*w*j, y:p.y+ny*w*j});
    right.push({x:p.x-nx*w*j, y:p.y-ny*w*j});
  }
  ctx.fillStyle='rgba('+rgb+',0.48)';
  ctx.beginPath(); ctx.moveTo(left[0].x,left[0].y);
  for(let i=1;i<n;i++) ctx.lineTo(left[i].x,left[i].y);
  for(let i=n-1;i>=0;i--) ctx.lineTo(right[i].x,right[i].y);
  ctx.closePath(); ctx.fill();
  // 2) 濃芯線:中央更深一道,讓墨色有濃淡
  ctx.strokeStyle='rgba('+rgb+',0.5)';
  for(let i=1;i<n;i++){ const e=(i/(n-1))*(i/(n-1)); ctx.lineWidth=Math.max(0.5,size*0.5*e);
    ctx.beginPath(); ctx.moveTo(tr[i-1].x,tr[i-1].y); ctx.lineTo(tr[i].x,tr[i].y); ctx.stroke(); }
  if(dryWhite!==false){
    // 飛白只保留給場景墨筆；飛劍本體不用白色條帶，避免看成 UI 箭頭。
    for(let s=0;s<3;s++){
      const off=(s-1)*size*0.4;
      for(let i=Math.max(1,n-6);i<n;i++){
        if(((i*7+s*13)%3)===0) continue;
        const p=tr[i], a=tr[i-1];
        let nx=-(p.y-a.y), ny=(p.x-a.x); const L=Math.hypot(nx,ny)||1; nx/=L; ny/=L;
        const e=(i/(n-1))*(i/(n-1));
        ctx.strokeStyle='rgba(250,246,236,'+(e*0.26)+')'; ctx.lineWidth=Math.max(0.5,size*0.14*e);
        ctx.beginPath(); ctx.moveTo(a.x+nx*off,a.y+ny*off); ctx.lineTo(p.x+nx*off,p.y+ny*off); ctx.stroke();
      }
    }
  }
}

export function ensureSupV(en){
  if(!en.supV) en.supV={ seed:Math.floor(Math.random()*9999), t:0, cyc:0,
                         lx:en.x, ly:en.y, press:0, sink:0, maxS:4 };
  return en.supV;
}

export function supArcs(seed, stk){
  const n = 2 + Math.floor(supHash(seed)*3);            // 2~4 段
  const total = (0.35 + supHash(seed+7)*0.20) * 6.283;  // 35~55%
  const out=[];
  let used=0;
  for(let i=0;i<n;i++){
    const share = (0.7 + supHash(seed+i*13)*0.6);
    const len = total/n*share;
    const gap = (6.283-total)/n;
    const a0 = used + gap*(0.35+supHash(seed+i*31)*0.5);
    out.push({a0, len, w:1.6+supHash(seed+i*17)*1.0});
    used = a0 + len + gap*0.5;
  }
  return out;
}

export function drawDryArc(cx,cy,r,a0,len,w,alpha,seed){
  const N=Math.max(6, Math.round(len*14));
  ctx.lineCap='round'; ctx.lineWidth=w;
  let drawing=false;
  for(let i=0;i<=N;i++){
    const t=i/N, a=a0+len*t;
    // 飛白:沿弧隨機斷開,兩端本來就比較虛
    const edge=Math.min(t,1-t)*2;
    const solid = supHash(seed+i*3.7) < (0.55+edge*0.45);
    const jr = r + (supHash(seed+i*5.1)-0.5)*1.9;       // 半徑抖動
    const x=cx+Math.cos(a)*jr, y=cy+Math.sin(a)*jr*0.30; // 壓扁貼地(接近正俯視的地面環)
    if(solid){
      if(!drawing){ ctx.beginPath(); ctx.moveTo(x,y); drawing=true; }
      else ctx.lineTo(x,y);
    } else if(drawing){
      ctx.strokeStyle='rgba(78,84,82,'+(alpha*(0.55+edge*0.45)).toFixed(3)+')';
      ctx.stroke(); drawing=false;
    }
  }
  if(drawing){ ctx.strokeStyle='rgba(78,84,82,'+alpha.toFixed(3)+')'; ctx.stroke(); }
}

export function drawSuppression(en, st){
  const FX=hooks.getFX?.()||{}, SWDSPR=hooks.getSwordSprite?.();
  const V=ensureSupV(en);
  const stk=Math.max(1, st.stk|0), maxS=V.maxS||4;
  const full = stk>=maxS;
  // 收束循環:1.5 秒一輪。向內收 3~5px → 停住 → 淡掉 → 再生一筆(不旋轉)
  const T=V.t/90, ease=T<0.55 ? (1-Math.pow(1-T/0.55,3)) : 1;
  const draw=3+supHash(V.seed)*2;
  const sink=V.sink>0 ? (V.sink/18)*3 : 0;
  const r=en.r*1.02+5 - ease*draw - sink;               // 半徑貼著身形,弧痕落在腳下的紙面
  const fade=T<0.72 ? 1 : Math.max(0, 1-(T-0.72)/0.28);
  const base=(0.34+stk*0.07)*fade;                      // 落在紙上就要夠沉,不然看不見
  const cx=V.lx, cy=V.ly+en.r*0.95;                     // 正下方的地面(比照玩家腳下的劍環)
  // 二層以上:腳下淡墨暈;三層以上更沉
  if(stk>=2 && FX.glow){
    const gr=ctx.createRadialGradient(cx,cy,1,cx,cy,en.r*1.5);
    const a=(stk>=3?0.20:0.11)*fade + (V.sink>0?0.10:0);
    gr.addColorStop(0,'rgba(58,64,62,'+a.toFixed(3)+')'); gr.addColorStop(1,'rgba(58,64,62,0)');
    ctx.save(); ctx.translate(cx,cy); ctx.scale(1,0.32); ctx.translate(-cx,-cy);
    ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(cx,cy,en.r*1.5,0,6.28); ctx.fill(); ctx.restore();
  }
  // 觸發:腳下重按一橫 → 碎成兩側斷墨
  if(V.press>0){
    const k=1-V.press/14, halfW=en.r*(0.9+k*0.5), split=k*en.r*0.5;
    ctx.strokeStyle='rgba(66,72,70,'+(0.55*(1-k)+0.12).toFixed(3)+')';
    ctx.lineWidth=2.6-k*1.2; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-halfW, cy+split*0.35); ctx.lineTo(cx-split, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+split, cy); ctx.lineTo(cx+halfW, cy+split*0.35); ctx.stroke();
  }
  // 斷弧本體(地面上的壓痕)
  for(const seg of supArcs(V.seed+V.cyc*97, stk))
    drawDryArc(cx, cy, r, seg.a0, seg.len, seg.w, base, V.seed+V.cyc*97+seg.a0*100);
  // 鎮劍:2~5 把劍壓在腳下的地面,**劍尖朝內**、隨循環緩慢內收。
  // 與玩家腳下那圈劍尖朝外的劍環正好成對:玩家是散發,鎮痕是壓制。
  {
    const n=Math.min(5, 1+stk);
    const press=r*(0.30+ease*0.16) + sink*0.6;          // 內收量:收束時劍再往內壓一點
    for(let i=0;i<n;i++){
      // 不等距:每把劍的角度帶固定偏移,避免看起來像規則的圓陣
      const a=(i/n)*6.283 + supHash(V.seed+i*53)*1.1;
      const px=cx+Math.cos(a)*(r-press), py=cy+Math.sin(a)*(r-press)*0.30;
      const dir=Math.atan2(-Math.sin(a)*0.30, -Math.cos(a));   // 劍尖朝圓心
      const L=en.r*(0.62+supHash(V.seed+i*29)*0.28);
      const al=(base*1.5+(V.sink>0?0.18:0));
      ctx.save(); ctx.translate(px,py); ctx.rotate(dir);
      if(SWDSPR.ok){
        const w=L/SWDSPR.blade, hh=w/SWDSPR.aspect;
        ctx.globalAlpha=Math.min(0.85, al);
        ctx.drawImage(SWDSPR.idle[(i*3+V.cyc)%SWDSPR.idle.length], -w*SWDSPR.grip, -hh/2, w, hh);
        ctx.globalAlpha=1;
      } else {                                           // 沒有貼圖時的回退:一筆帶錐度的墨劃
        ctx.strokeStyle='rgba(58,64,62,'+Math.min(0.8,al).toFixed(3)+')';
        ctx.lineCap='round'; ctx.lineWidth=2.0;
        ctx.beginPath(); ctx.moveTo(-L*0.5,0); ctx.lineTo(L*0.5,0); ctx.stroke();
      }
      ctx.restore();
    }
  }
  // 三層以上:少量向下垂的枯筆絲
  if(stk>=3){
    ctx.lineWidth=0.9; ctx.strokeStyle='rgba(78,84,82,'+(base*0.7).toFixed(3)+')';
    for(let i=0;i<3;i++){
      const a=supHash(V.seed+i*23)*6.283, L=4+supHash(V.seed+i*41)*7;
      const x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r*0.30;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+(supHash(V.seed+i*11)-0.5)*2, y+L); ctx.stroke();
    }
  }
  // 滿層:短促的壓墨震紋
  if(V.sink>0){
    const k=V.sink/18;
    ctx.strokeStyle='rgba(58,64,62,'+(0.34*k).toFixed(3)+')'; ctx.lineWidth=1.1;
    for(let i=0;i<2;i++){
      const rr=en.r*(1.1+i*0.35)+ (1-k)*7;
      ctx.beginPath(); ctx.ellipse(cx,cy,rr,rr*0.26,0,0,6.283); ctx.stroke();
    }
  }
}

export function ensureEroV(en){
  if(!en.eroV) en.eroV={ seed:Math.floor(Math.random()*9999), t:0, flash:0, suck:0, stk:0, cracks:null };
  return en.eroV;
}

export function buildCracks(seed, stk, r){
  const n = Math.min(5, 1 + stk);                       // 1~5 條
  const out=[];
  for(let i=0;i<n;i++){
    const a0 = supHash(seed+i*29)*6.283;
    const pts=[{x:0,y:0}];
    let a=a0, rad=r*0.12;
    const segs = 4 + Math.floor(supHash(seed+i*7)*3);
    for(let k=0;k<segs;k++){
      a += (supHash(seed+i*13+k*3.1)-0.5)*1.25;         // 每節轉折
      rad += r*(0.14+supHash(seed+i*5+k)*0.12);
      pts.push({x:Math.cos(a)*rad, y:Math.sin(a)*rad});
    }
    // 二層以上開始分叉
    const branch=[];
    if(stk>=2 && pts.length>3){
      const bi=2+Math.floor(supHash(seed+i*17)*(pts.length-3));
      let ba=a0+(supHash(seed+i*23)-0.5)*2.0, br=Math.hypot(pts[bi].x,pts[bi].y);
      const bp=[pts[bi]];
      for(let k=0;k<3;k++){
        ba += (supHash(seed+i*31+k)-0.5)*1.4; br += r*0.13;
        bp.push({x:Math.cos(ba)*br, y:Math.sin(ba)*br});
      }
      branch.push(bp);
    }
    out.push({pts, branch, w:0.9+supHash(seed+i*11)*0.9});
  }
  return out;
}

export function drawErosion(en, st){
  const V=ensureEroV(en);
  const stk=Math.max(1, st.stk|0);
  if(!V.cracks || V.stk!==stk){ V.cracks=buildCracks(V.seed, stk, en.r); V.stk=stk; }
  // 滲 → 收 → 滲:0.4~0.7 秒向外長一點,tick 時瞬間變濃,再慢慢退回
  const grow = 0.72 + 0.28*Math.min(1, V.t/38);
  const suck = V.suck>0 ? 1-(V.suck/10)*0.10 : 1;        // 三層以上的「吸墨」收縮
  const k = grow*suck;
  const hot = V.flash>0 ? V.flash/12 : 0;
  const base = Math.min(0.72, 0.25 + (stk-1)*0.11) + hot*0.30;
  ctx.save(); ctx.translate(en.x, en.y);
  // 滿層:核心周圍一塊不規則焦墨斑
  if(stk>=4){
    ctx.fillStyle='rgba(24,21,18,'+(0.26+hot*0.22).toFixed(3)+')';
    ctx.beginPath();
    const NC=11;
    for(let i=0;i<NC;i++){ const a=i/NC*6.283;
      const rr=en.r*(0.42+supHash(V.seed+i*19)*0.46)*k;
      const x=Math.cos(a)*rr, y=Math.sin(a)*rr;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
    ctx.closePath(); ctx.fill();
  }
  // 墨斑(二層起):裂痕途中的局部積墨
  if(stk>=2){
    for(let i=0;i<Math.min(4,stk);i++){
      const c=V.cracks[i%V.cracks.length]; const p=c.pts[Math.min(c.pts.length-1,2)];
      const rr=en.r*(0.16+supHash(V.seed+i*37)*0.14)*k;
      ctx.fillStyle='rgba(28,24,20,'+((stk>=3?0.30:0.19)+hot*0.20).toFixed(3)+')';
      ctx.beginPath(); ctx.arc(p.x*k,p.y*k,rr,0,6.283); ctx.fill();
    }
  }
  // 裂痕本體:錐度收尾,末端更虛
  ctx.lineCap='round'; ctx.lineJoin='round';
  for(const c of V.cracks){
    const seq=[c.pts].concat(c.branch);
    for(let b=0;b<seq.length;b++){
      const pts=seq[b];
      for(let i=1;i<pts.length;i++){
        const t=i/(pts.length-1);
        ctx.strokeStyle='rgba(22,19,16,'+(base*(1-t*0.55)*(b?0.7:1)).toFixed(3)+')';
        ctx.lineWidth=c.w*(1-t*0.6)*(b?0.7:1);
        ctx.beginPath();
        ctx.moveTo(pts[i-1].x*k, pts[i-1].y*k);
        ctx.lineTo(pts[i].x*k,   pts[i].y*k);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}
export function bakeHero(h){
  const {HERO,ART}=hooks.getHeroAssets();
  if(heroCv && heroH===h) return;
  heroH=h; heroW=Math.round(h*HERO.aspect);
  const mk=tint=>{
    const c=document.createElement('canvas');
    c.width=Math.max(1,heroW*DPR); c.height=Math.max(1,h*DPR);
    const g=c.getContext('2d'); g.setTransform(DPR,0,0,DPR,0,0);
    g.drawImage(ART.body,0,0,heroW,h);
    if(tint){ g.globalCompositeOperation='source-atop'; g.fillStyle=tint; g.fillRect(0,0,heroW,h); }
    return c;
  };
  heroCv=mk(null); heroHurtCv=mk('rgba(176,56,40,0.85)');
}
export function heroSet(){
  const {meta,HEROX,HEROF,HEROSPR}=hooks.getHeroAssets();
  if(meta.heroSkin==='x'&&HEROX.ok) return HEROX;
  if(meta.heroSkin==='f'&&HEROF.ok) return HEROF;
  return HEROSPR;
}
export function drawHero(P){
  const {HEROF}=hooks.getHeroAssets();
  const S=heroSet();
  if(S===HEROF && HEROF.proc){ drawHeroF(P); return; }   // 女修:單張身體 + 全程序化演出
  if(S.ok){ drawHeroSprite(P); return; }
  drawHeroProc(P);
}
// Sprite 版:呼吸(整體微縮放 + 上下浮動)、轉身、待機 9 幀慢速交叉淡入、受擊 4 幀連播。
// 受擊紅光:把 sprite 幀畫進離屏、source-atop 填紅,回貼主畫布(不需為每幀預烘)
// 上色後的貼圖要快取。原本每呼叫一次就重畫一張離屏畫布(clearRect + drawImage + fillRect),
// 而低血量時腳下的劍環每幀要上色 6 把 —— 劍的原圖是 651×260,等於每幀重繪
// 約 100 萬像素三遍。實測(6 倍 CPU 節流)血滿 2.4ms/幀、血低於四成 37.4ms/幀,差 15.6 倍,
// 這就是「受擊之後開始卡」的真正原因(受擊 → 掉到四成以下 → 劍環開始每幀重新上色)。
const _tintCache=new WeakMap();
export function tintFrame(im,col){
  let byCol=_tintCache.get(im);
  if(!byCol){ byCol=new Map(); _tintCache.set(im,byCol); }
  let cv=byCol.get(col);
  if(cv) return cv;
  const W=im.naturalWidth, H=im.naturalHeight;
  cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  const g=cv.getContext('2d');
  g.drawImage(im,0,0);
  g.globalCompositeOperation='source-atop'; g.fillStyle=col; g.fillRect(0,0,W,H);
  g.globalCompositeOperation='source-over';
  byCol.set(col,cv);
  return cv;
}
export function drawHeroSprite(P){
  const S=heroSet();
  const h=P.r*5.0*HERO_BODY_SCALE, w=h*S.aspect, feet=P.y+P.r*1.18;
  const dying=G.deathT>0;
  const hasDeath=!!(S.death&&S.death.length), hasHurt=!!(S.hurt&&S.hurt.length);
  const br=dying?0:Math.sin(G.t*0.042);
  // 程式消散(沒有 death 幀的角色,如女修):sprite 隨 deathT 淡出
  const fade = (dying && !hasDeath) ? Math.max(0, G.deathT/G.deathMax) : 1;
  // 受擊紅光(沒有 hurt 幀時啟用;有專屬受擊幀的角色不疊紅)
  const glow = (!hasHurt) ? Math.min(1, P.pulse||0) : 0;
  ctx.save();
  ctx.translate(P.x, feet+br*1.1);
  ctx.scale(dying?1:G.facing, 1+br*0.013);            // 轉身 + 呼吸(死亡時定住)
  // 素材為全域統一裁切,腳底落在畫布 foot 比例處 → 以此對齊地面
  const put=(im,a)=>{ if(!im||!im.complete||!im.naturalWidth) return;
    ctx.globalAlpha=a*fade; ctx.drawImage(im,-w/2,-h*S.foot,w,h);
    if(glow>0){ ctx.globalAlpha=a*fade*glow*0.72;
      ctx.drawImage(tintFrame(im,'#c83828'),-w/2,-h*S.foot,w,h); ctx.globalAlpha=a; } };
  if(dying && hasDeath){
    // 隕落幀:7 幀連續播放(每幀 9 影格),最後一幀是落地的墨漬
    const k=Math.min(6, 6-Math.floor(G.deathT/9));
    put(S.death[Math.min(S.death.length-1,Math.max(0,k))],1);
  } else if(G.hurtT>0 && hasHurt){
    const k=Math.min(3, 3-Math.floor(G.hurtT/5));
    put(S.hurt[Math.min(S.hurt.length-1,Math.max(0,k))],1);
  } else {
    // 御劍是意念施放，角色身體維持待機呼吸。舊 cast 素材在胸腹中央帶有額外墨印，
    // 與原角色設計不符，因此攻擊時不再切換 cast 幀。
    const sp=0.0042*(1+G.intent*0.6), t=G.t*sp+G.heroPhase;
    const n=S.idle.length, f=((t%n)+n)%n, i0=Math.floor(f);
    // 角色輪廓不可交叉淡入：兩張全身剪影同時存在會直接讀成殘影。
    put(S.idle[i0],1);
  }
  ctx.globalAlpha=1;
  ctx.restore();
}
// ---------- 女修士:程序化演出(逐列風動身體 + 環繞墨痕 + 配劍旋渦) ----------
// 身體是一張無劍墨繪,用「腳下錨定、往上遞增」的逐列水平位移做衣袂與髮絲的風動,
// 再疊呼吸(整體微縮放 + 上下浮動)。配劍與墨痕各自沿一個很扁的橢圓繞著她轉:
// sin(θ)<0 = 轉到身後 → 先畫(被身體蓋住);sin(θ)>0 = 轉到身前 → 後畫。近大遠小 + 近濃遠淡。
let hfCv=null, hfRed=null, hfH=0, hfW=0;
export function bakeHeroF(h,w){
  const {HEROF}=hooks.getHeroAssets();
  if(hfCv && hfH===h) return;
  hfH=h; hfW=w;
  const mk=tint=>{
    const c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(w*DPR)); c.height=Math.max(1,Math.round(h*DPR));
    const g=c.getContext('2d'); g.setTransform(DPR,0,0,DPR,0,0);
    g.drawImage(HEROF.body,0,0,w,h);
    if(tint){ g.globalCompositeOperation='source-atop'; g.fillStyle=tint; g.fillRect(0,0,w,h); }
    return c;
  };
  hfCv=mk(null); hfRed=mk('rgba(200,56,40,0.9)');
}
// 環繞軌道:圓心在腰腹偏下(視覺上像從腳邊繞起),ry 很小 → 幾乎正側看的橢圓
export function hfOrbit(P){
  const {HEROF}=hooks.getHeroAssets();
  const h=P.r*5.0*HERO_VISUAL_SCALE, w=h*HEROF.aspect, feet=P.y+P.r*1.18;
  return { cx:P.x, cy:feet-h*0.20, rx:w*0.62, ry:h*0.088, h:h, w:w };
}
export function drawHeroFBody(P,alpha){
  const {HEROF}=hooks.getHeroAssets();
  const h=P.r*5.0*HERO_BODY_SCALE, w=h*HEROF.aspect, feet=P.y+P.r*1.18;
  bakeHeroF(h,w);
  const dying=G.deathT>0;
  const br=dying?0:Math.sin(G.t*0.042);
  const glow=Math.min(1,P.pulse||0);
  ctx.save();
  ctx.translate(P.x, feet+br*1.1);
  ctx.scale(dying?1:G.facing, 1+br*0.013);
  // 女修專屬幀：待機只動袖帶與裙緣；御劍只抬手結劍指，不做近戰揮砍。
  // 全組共用畫布與腳點，環繞劍/墨帶仍由 drawHeroF 的獨立圖層繪製。
  const top=-h*HEROF.foot;
  const put=(im,a)=>{ if(!im||!im.complete||!im.naturalWidth) return;
    ctx.globalAlpha=alpha*a; ctx.drawImage(im,-w/2,top,w,h);
    if(glow>0.02){ ctx.globalAlpha=alpha*a*glow*0.7;
      ctx.drawImage(tintFrame(im,'#c83828'),-w/2,top,w,h); } };
  if(HEROF.framesReady && G.castT>0){
    const k=Math.min(5,Math.max(0,5-Math.floor(G.castT/4)));
    put(HEROF.cast[k],1);
  } else if(HEROF.framesReady){
    const t=G.t*0.020+G.heroPhase, f=((t%6)+6)%6, i0=Math.floor(f);
    // 女修每次只畫一張完整身體，避免寬袖與飄帶疊成第二道人影。
    put(HEROF.idle[i0],1);
  } else {
    ctx.globalAlpha=alpha; ctx.drawImage(hfCv,-w/2,top,w,h);
    if(glow>0.02){ ctx.globalAlpha=alpha*glow*0.7; ctx.drawImage(hfRed,-w/2,top,w,h); }
  }
  ctx.globalAlpha=1; ctx.restore();
}
// 配劍:沿橢圓公轉,劍尖順著切線方向;身後淡而小、身前濃而大,後面拖一道乾筆墨痕。
export function drawHeroFSword(P,front,fade){
  const {HEROF}=hooks.getHeroAssets();
  const S=HEROF.sword; if(!S||!S.complete||!S.naturalWidth) return;
  const o=hfOrbit(P);
  const th=G.t*(0.0155*(1+G.intent*1.2)) + G.heroPhase*2.0;
  const sn=Math.sin(th);
  if((sn>0)!==front) return;
  const dep=sn*0.5+0.5;                                   // 0 最遠 → 1 最近
  const x=o.cx+Math.cos(th)*o.rx, y=o.cy+sn*o.ry;
  const ang=Math.atan2(Math.cos(th)*o.ry, -Math.sin(th)*o.rx);   // 橢圓切線
  if(hooks.getFX?.()?.trail){                                           // 尾巴:同一條軌道往回取樣
    const tr=[];
    for(let i=9;i>=1;i--){ const a=th-i*0.072;
      tr.push({x:o.cx+Math.cos(a)*o.rx, y:o.cy+Math.sin(a)*o.ry}); }
    tr.push({x:x,y:y});
    ctx.globalAlpha=(0.16+dep*0.30)*fade;
    hooks.inkTrail?.(ctx,tr,2.6+dep*2.4,'46,40,34');
  }
  const BL=o.w*(0.46+dep*0.14), hq=BL/HEROF.swAspect;
  ctx.save();
  ctx.globalAlpha=(0.46+dep*0.50)*fade;
  ctx.translate(x,y); ctx.rotate(ang);
  ctx.drawImage(S,-BL*HEROF.swGrip,-hq/2,BL,hq);
  ctx.restore(); ctx.globalAlpha=1;
}
// 環繞墨痕:三條不同半徑/高度/速度的墨帶,用劍氣拖尾的筆刷畫,營造墨氣旋繞。
export function drawHeroFInk(P,front,fade){
  if(!hooks.getFX?.()?.trail) return;
  const o=hfOrbit(P);
  for(let k=0;k<3;k++){
    const th=G.t*(0.0102+k*0.0026) + k*2.094 + G.heroPhase;
    const sn=Math.sin(th);
    if((sn>0)!==front) continue;
    const rx=o.rx*(0.80+k*0.13), ry=o.ry*(0.72+k*0.34), yo=-o.h*(0.02+k*0.085);
    const tr=[];
    for(let i=11;i>=0;i--){ const a=th-i*0.108;
      tr.push({ x:o.cx+Math.cos(a)*rx,
                y:o.cy+yo+Math.sin(a)*ry+Math.sin(a*3+G.t*0.03)*o.h*0.014 }); }
    ctx.globalAlpha=(0.20+(sn*0.5+0.5)*0.26)*fade;
    hooks.inkTrail?.(ctx,tr,2.1+k*0.8,'56,48,40');
  }
  ctx.globalAlpha=1;
}
function drawHeroF(P){
  const dying=G.deathT>0;
  const fade=dying?Math.max(0,G.deathT/G.deathMax):1;
  const fx=((hooks.getDrawLevel?.()||0)>=4);
  if(fx){ drawHeroFInk(P,false,fade); drawHeroFSword(P,false,fade); }
  drawHeroFBody(P,fade);
  if(fx){ drawHeroFSword(P,true,fade); drawHeroFInk(P,true,fade); }
}
// 舊的程序化剪影(逐列風動),沒有 sprite 時的回退
export function drawHeroProc(P){
  const {HERO}=hooks.getHeroAssets();

  const h=P.r*4.7*HERO_BODY_SCALE;
  bakeHero(h);
  const w=heroW, feet=P.y+P.r*1.05;
  const br=Math.sin(G.t*0.042);
  const src=P.pulse>0.15 ? heroHurtCv : heroCv;
  ctx.save();
  ctx.translate(P.x, feet+br*1.1);
  // 出劍時身體不做任何動作 —— 御劍是意念,不是招式。只有呼吸與風。
  ctx.scale(G.facing, 1+br*0.014);               // 轉身 + 呼吸
  const N=28, sh=h/N, sDPR=src.height/h;
  for(let i=0;i<N;i++){
    const y0=i*sh, ry=(y0+sh*0.5)/h;
    // 風動幅度:腳下錨定為 0,腰以下的衣袂最大;頭頂髮絲另給一份小幅
    const robe=Math.max(0,Math.min(1,(ry-0.30)/0.42))*(1-Math.max(0,Math.min(1,(ry-0.87)/0.13)));
    const hair=Math.max(0,1-Math.abs(ry-0.14)/0.17);
    const amp=(robe*0.085+hair*0.05)*w*(1+G.intent*0.18);   // 起劍時衣袂僅微鼓
    const dx=Math.sin(ry*7.4-G.t*0.052)*amp + Math.sin(ry*3.0-G.t*0.029)*amp*0.45;
    ctx.drawImage(src, 0, y0*sDPR, src.width, sh*sDPR+1,
                       -w/2+dx, -h+y0, w, sh+0.7);
  }
  ctx.restore();
}
// 待機時劍不現身 —— 劍令一起,劍才自修士身側浮現而出。
// 背後不再放一把常駐的劍。


// 實際把劍畫在原點朝 +x —— 只在烘貼圖時呼叫一次
