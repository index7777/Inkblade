import { G, stat } from './core.js';
import { updatePaperPhase } from './render.js';

let hooks={};
export function configureUI(nextHooks){ hooks=nextHooks||{}; }

let pausedByUser=false;
let previewTimer=null;
const VOLUME_CONTROLS=[['volMaster','master'],['volMusic','music'],['volSfx','sfx']];
const REBIRTH_BRANCH_HEAD={foundation:'築基 · 永久數值',mind:'心法 · 改變節奏',inheritance:'傳承 · 開啟悟道池'};
let respecArmed=false;

const hudCache={};
const CN=['零','一','二','三','四','五','六','七','八','九','十'];
const CN_TENS={2:'廿',3:'卅'};

export function num2cn(n){
  n=Math.max(0,Math.round(n));
  if(n<=10) return CN[n];
  if(n<100){
    const t=Math.floor(n/10), o=n%10;
    const head = t===1 ? '十' : (CN_TENS[t] || CN[t]+'十');
    return head + (o?CN[o]:'');
  }
  if(n<10000){
    const units=['','十','百','千'], d=String(n).split('').map(Number);
    let out='', zero=false;
    for(let i=0;i<d.length;i++){
      const v=d[i], u=units[d.length-1-i];
      if(v===0){ zero=true; continue; }
      if(zero && out) out+='零';
      zero=false;
      out += (v===1 && u==='十' && i===0) ? '十' : CN[v]+u;
    }
    return out;
  }
  return String(n);                      // 破萬就不硬翻了,維持數字
}

export function setTxt(id,v){ if(hudCache[id]!==v){ const e=document.getElementById(id); if(!e) return;
  hudCache[id]=v; e.textContent=v; } }

export function setW(id,v){ if(hudCache['w'+id]!==v){ const e=document.getElementById(id); if(!e) return;
  hudCache['w'+id]=v; e.style.width=v;
  const bar=e.parentElement; if(bar) bar.style.setProperty('--p',parseFloat(v)||0); } }

export function renderManaBill(){
  const el=document.getElementById('manabill'); if(!el) return;
  const perPx=Math.max(0.001, stat.costPerPx);
  // 「滿劍可畫 225 寸」對玩家太抽象 —— 他要問的是「那到底是幾劍」。
  // 用他自己近期的出手長度換算,不用我編的參考值。
  const DEFAULT_STROKE=300;
  const ref = G.strokeN>0 ? G.strokeAvg : DEFAULT_STROKE;
  const oneCost = stat.costBase + ref*perPx;                 // 依他的手感,一劍多少錢
  const casts = oneCost>0 ? stat.manaMax/oneCost : 0;        // 滿劍意能出幾劍
  // 全部用「劍意 / 劍」講話。寸是內部單位,玩家對它沒有感覺,
  // 只在最底下的換算依據裡出現一次(那裡需要說明數字為什麼會變)。
  const rows=[
    // 只點一下不拉線的最低出手成本。升階不會動到它 ——
    // 這正是玩家要知道的事:劍訣升上去不會讓你出不了手,只會讓你畫不長。
    ['最省一劍', Math.round(stat.costBase)+' 劍意', 0],
    ['你的一劍', Math.round(oneCost)+' 劍意', 0],
    ['滿劍意可出', casts.toFixed(1)+' 劍', 1]
  ];
  el.innerHTML = rows.map(r=>'<span class="'+(r[2]?'key':'')+'">'+r[0]+'<b>'+r[1]+'</b></span>').join('')
    + '<span class="note">'+(G.strokeN>0
        ? '依你近期出手 '+Math.round(ref)+' 寸估'
        : '依 '+DEFAULT_STROKE+' 寸估(還沒出過劍)')+'</span>';
}

export function resetHudCache(){
  Object.keys(hudCache).forEach(key=>delete hudCache[key]);
}

export function updateHUD(){
  const P=G.player;
  updatePaperPhase();
  setW('hpfill',Math.max(0,P.hp/P.max*100).toFixed(1)+'%');
  setTxt('hptxt',Math.max(0,Math.round(P.hp))+' / '+P.max);
  const mpr=G.mana/stat.manaMax;
  setW('mpfill',Math.max(0,mpr*100).toFixed(1)+'%');
  const mpEl=document.getElementById('mpfill'); if(mpEl) mpEl.classList.toggle('low',mpr<0.25);
  setTxt('mptxt',Math.round(G.mana)+' / '+stat.manaMax);
  setW('xpfill',Math.max(0,Math.min(100,G.xp/G.xpNeed*100)).toFixed(1)+'%');
  setTxt('lvtxt',num2cn(G.level));
  const realmTarget=hooks.realmKillTarget?.(G.wave), realmKills=G.waveKills||0;
  setTxt('killtxt',String(realmKills)+' / '+realmTarget);
  setTxt('remainkilltxt',Math.max(0,realmTarget-realmKills)+' 妖');
  setTxt('scoreclocktxt',hooks.realmClockText?.());
  setTxt('wavetxt','第 '+num2cn(G.wave)+' 境');
  setTxt('realmclock',hooks.realmClockText?.());
  { const clock=document.getElementById('realmclock'); if(clock) clock.classList.toggle('danger',hooks.realmTimeFrames?.(G.wave)-G.waveTimer<=600); }
  if(G.bossTest){
    const boss=G.enemies.find(en=>en.isBoss&&!en.showcaseGhost), out=document.getElementById('bosstestreadout');
    const dist=boss&&G.player?Math.round(Math.hypot(boss.x-G.player.x,boss.y-G.player.y)):0;
    if(out) out.textContent='每令 '+Math.max(1,stat.count|0)+'　在場 '+G.swords.length+'　命中 '+(boss?(boss.testHits||0):0)+
      '\nHP '+(boss?Math.max(0,Math.round(boss.hp)):0)+'　距 '+dist+'　位 '+(boss?boss.bossSide:'-')+'　墨核 '+G.bossShots.length+
      '\n'+(boss?(hooks.getBossStateLabel?.(boss.bossState)||boss.bossState):'已擊破')+'　下擊 '+hooks.bossTestAttackCountdown?.(boss).toFixed(1)+'秒'
      +(G.bossPreset60?'\n六十境基準　'+((G.bossFightFrames||0)/60).toFixed(1)+'秒':'');
  }
  { const boss=G.enemies.find(en=>en.isBoss&&!en.showcaseGhost), ui=document.getElementById('bossui');
    ui.classList.toggle('show',!!boss);
    ui.classList.toggle('phase',!!boss&&boss.bossState==='phase');
    if(boss){
      document.getElementById('bossfill').style.width=Math.max(0,boss.hp/boss.max*100).toFixed(2)+'%';
      // 血條不預告轉境門檻或下一招。
      document.getElementById('bossphase').textContent='墨軀盤卷';
    }
  }
  if(hooks.isDpsOpen?.()) hooks.renderDps?.();
}

let levelChoiceLocked=false, levelRerolls=2, startingFormationOpen=false, truthSelectionOpen=false;
const CARD_CATEGORY_NAME={form:'陣',momentum:'行',intent:'痕',cultivation:'稟',blade:'型',truth:'意'};
const CARD_RANK_CN=['','一','二','三','四','五'];

export function levelChoiceOpen(){
  return document.getElementById('overlay').classList.contains('show');
}

export function isLevelChoiceLocked(){ return levelChoiceLocked; }

export function resetLevelChoice(){
  levelChoiceLocked=false;
  startingFormationOpen=false;
  document.getElementById('cardbox')?.classList.remove('formation-draft','compact-draft','truth-draft');
  document.getElementById('overlay')?.classList.remove('show');
}

export function renderReroll(){
  const button=document.getElementById('rerollbtn');
  button.disabled=levelRerolls<=0 || levelChoiceLocked;
  document.getElementById('rerollleft').textContent='剩餘次數：'+num2cn(levelRerolls);
}

export function cardBody(item){
  if(hooks.getMeta?.().cardText!=='effect') return '<div class="cdesc">'+item.description+'</div>';
  const lines=hooks.getRuntime?.().effectLines(item.id);
  if(!lines.length) return '<div class="cdesc">'+item.description+'</div>';
  return '<div class="cfx n'+lines.length+'">'+lines.map(text=>'<span>'+text+'</span>').join('')+'</div>';
}

export function cardOfferedRank(item){
  const runState=hooks.getRunState?.();
  const current=Math.max(0,Math.min(5,runState.ranks[item.id]||0));
  return CARD_RANK_CN[Math.min(item.maxRank||1,current+1)]+'階';
}

export function cardDisplayName(item){
  const name=String(item.name||'劍訣');
  return item.category==='form'?name.replace(/式$/,'陣'):name;
}

export function drawCards(isReroll=false){
  if(!G.running) return;
  if(!isReroll) levelRerolls=2;
  levelChoiceLocked=false;
  hooks.resetSwordDrawing?.();
  const runtime=hooks.getRuntime?.(), runState=hooks.getRunState?.();
  if(!runState.activeForm){ drawStartingFormations(); return; }
  startingFormationOpen=false;
  document.getElementById('cardbox')?.classList.remove('formation-draft','compact-draft','truth-draft');
  document.querySelector('#cardbox h2').textContent='悟 · 選一道劍訣';
  document.querySelector('#cardbox p.tip').textContent='道行精進，天地賜法。點選一張以承其力。';
  document.getElementById('rerollbtn').hidden=false;
  document.getElementById('rerollleft').hidden=false;
  const choices=runtime.rollInsights(runState,3);
  const box=document.getElementById('cards'); box.innerHTML='';
  if(!choices.length){
    G.pendingLevels=0;
    document.getElementById('overlay').classList.remove('show');
    levelChoiceLocked=false;
    G.paused=pausedByUser;
    return;
  }
  choices.forEach(item=>{
    const displayName=cardDisplayName(item);
    const displayRune=Array.from(displayName)[0]||'劍';
    const element=document.createElement('div');
    element.className='card';
    const category=CARD_CATEGORY_NAME[item.category]||'訣';
    const offeredRank=cardOfferedRank(item);
    element.innerHTML=`<div class="cardcategory" aria-label="類別：${category}">${category}</div>
      <div class="cardrank" aria-label="選擇後為${offeredRank}">${offeredRank}</div>
      <div class="rune">${displayRune}</div>
      <div class="cname">${displayName}</div>
      ${cardBody(item)}`;
    element.onclick=()=>selectInsightCard(item);
    box.appendChild(element);
  });
  const queue=document.getElementById('lvqueue');
  queue.textContent=G.pendingLevels>1?'連升 '+num2cn(G.pendingLevels)+' 重 · 尚餘 '+num2cn(G.pendingLevels-1)+' 次待選':'';
  renderManaBill();
  renderReroll();
  document.getElementById('overlay').classList.add('show');
  applyBattleMode();
}

function drawTruthChoices(){
  const runtime=hooks.getRuntime?.(), runState=hooks.getRunState?.();
  if(!G.running||!runtime||!runState||runState.activeTruth) return false;
  const choices=runtime.getUnlockedTruths(runState);
  if(!choices.length) return false;
  truthSelectionOpen=true; levelChoiceLocked=false;
  hooks.resetSwordDrawing?.();
  document.getElementById('cardbox')?.classList.remove('formation-draft');
  document.getElementById('cardbox')?.classList.add('compact-draft','truth-draft');
  document.querySelector('#cardbox h2').textContent='真意 · 選一式鎖定';
  document.querySelector('#cardbox p.tip').textContent='劍陣五階，真意初成。本局選定後不可更換。';
  document.getElementById('rerollbtn').hidden=true;
  document.getElementById('rerollleft').hidden=true;
  document.getElementById('manabill').innerHTML='<b>共通</b><span>消耗 200 劍意 · 冷卻 30 秒</span>';
  document.getElementById('lvqueue').textContent='';
  const box=document.getElementById('cards'); box.innerHTML='';
  choices.forEach(item=>{
    const element=document.createElement('div'); element.className='card truth-card';
    element.innerHTML=`<div class="cardcategory">意</div><div class="rune">${item.rune}</div>
      <div class="cname">${item.name}</div><div class="cdesc">${item.description}</div>
      <div class="ctrade">${item.active.duration?'持續 '+item.active.duration+' 秒':'瞬發'}</div>`;
    element.onclick=()=>selectInsightCard(item); box.appendChild(element);
  });
  document.getElementById('overlay').classList.add('show'); G.paused=true;
  return true;
}

export function drawStartingFormations(){
  if(!G.running) return;
  const runtime=hooks.getRuntime?.(), runState=hooks.getRunState?.();
  if(!runtime||!runState||runState.activeForm) return;
  startingFormationOpen=true;
  levelChoiceLocked=false;
  levelRerolls=0;
  hooks.resetSwordDrawing?.();
  const cardbox=document.getElementById('cardbox');
  cardbox.classList.add('formation-draft','compact-draft');
  cardbox.querySelector('h2').textContent='定 · 選一座劍陣';
  cardbox.querySelector('p.tip').textContent='此陣將鎖定本局，選定後不可更換。';
  const box=document.getElementById('cards'); box.innerHTML='';
  runtime.getStartingFormations().forEach(item=>{
    const displayName=cardDisplayName(item), displayRune=Array.from(displayName)[0]||'陣';
    const element=document.createElement('div'); element.className='card';
    element.innerHTML=`<div class="cardcategory" aria-label="類別：陣">陣</div>
      <div class="cardrank" aria-label="選擇後為一階">一階</div>
      <div class="rune">${displayRune}</div><div class="cname">${displayName}</div>${cardBody(item)}`;
    element.onclick=()=>selectInsightCard(item);
    box.appendChild(element);
  });
  document.getElementById('lvqueue').textContent='四陣擇一 · 必選';
  document.getElementById('manabill').innerHTML='';
  renderReroll();
  document.getElementById('rerollbtn').hidden=true;
  document.getElementById('rerollleft').hidden=true;
  document.getElementById('overlay').classList.add('show');
  G.paused=true;
}

export function selectInsightCard(item){
  if(levelChoiceLocked || !G.running) return;
  levelChoiceLocked=true;
  hooks.playPick?.();
  const runtime=hooks.getRuntime?.(), runState=hooks.getRunState?.();
  const rankBefore=runState.ranks[item.id]||0;
  if(startingFormationOpen) runtime.chooseStartingFormation(runState,item.id);
  else if(truthSelectionOpen) runtime.chooseActiveTruth(runState,item.id);
  else runtime.applyInsight(runState,item.id);
  hooks.syncStat?.();
  if(item.category==='form'){
    runtime.recomputeForFormation(runState);
    hooks.syncStat?.();
  }
  if(item.effects.some(effect=>effect.op==='max'&&effect.path==='stats.mana')){
    G.mana=stat.manaMax;
    hooks.floatText?.(G.player.x,G.player.y-38,'劍意盈滿','#4aa0b8');
  }
  if(item.maxRank>1&&rankBefore+1>=item.maxRank&&item.tiers&&item.tiers.length){
    G.banner={txt:item.name+' 滿階 · 小成 '+item.tiers[0].kills+' 斬',life:1};
    hooks.floatText?.(G.player.x,G.player.y-56,item.name+' 滿階','#c08a2e');
  }
  if(truthSelectionOpen){
    truthSelectionOpen=false;
    document.getElementById('overlay').classList.remove('show');
    levelChoiceLocked=false; G.banner={txt:'真意 · '+item.name,life:1};
    hooks.onTruthChosen?.(item);
    if(G.pendingLevels>0&&G.running) drawCards(); else G.paused=pausedByUser;
  } else if(startingFormationOpen){
    startingFormationOpen=false;
    document.getElementById('cardbox').classList.remove('formation-draft','compact-draft','truth-draft');
    document.getElementById('overlay').classList.remove('show');
    levelChoiceLocked=false;
    hooks.onFormationChosen?.(item);
  } else closeLevelUp();
}

export function applyBattleMode(){
  if(!levelChoiceOpen()) return;
  G.paused=hooks.getMeta?.().battleMode==='wait'||pausedByUser;
  if(G.paused) G.shake=0;
}

export function rerollCards(){
  if(!G.running||levelChoiceLocked||levelRerolls<=0||!levelChoiceOpen()) return;
  levelRerolls--;
  hooks.playUI?.();
  drawCards(true);
}

export function closeLevelUp(){
  if(G.pendingLevels>0) G.pendingLevels--;
  if(drawTruthChoices()) return;
  if(G.pendingLevels>0&&G.running){ drawCards(); return; }
  document.getElementById('overlay').classList.remove('show');
  levelChoiceLocked=false;
  G.paused=pausedByUser;
}

export function tryLevelUp(){
  if(!G.running||G.pendingLevels<=0||pausedByUser||levelChoiceOpen()) return;
  drawCards();
}

export function isPausedByUser(){ return pausedByUser; }

export function resetPauseState(){
  pausedByUser=false;
  document.getElementById('pause')?.classList.remove('show');
}

export function togglePause(force){
  if(!G.running||levelChoiceOpen()) return;
  const paused=typeof force==='boolean'?force:!pausedByUser;
  pausedByUser=paused;
  G.paused=paused;
  hooks.playUI?.();
  if(paused){ G.shake=0; G.flash=0; G.hitstop=0; hooks.stopMusic?.(0.25); }
  else hooks.startMusic?.();
  document.getElementById('pause').classList.toggle('show',paused);
  if(paused){
    renderVolumeSettings();
    renderSettingsSegments();
    hooks.renderHeroChoices?.();
    hooks.renderTierList?.();
    hooks.resetRespec?.();
    hooks.renderRespec?.();
  }else tryLevelUp();
}

export function renderVolumeSettings(){
  const meta=hooks.getMeta?.();
  for(const [id,key] of VOLUME_CONTROLS){
    const input=document.getElementById(id); if(!input) continue;
    const value=Math.round(meta.vol[key]*100);
    input.value=value;
    document.getElementById(id+'V').textContent=value;
    input.disabled=meta.mute;
  }
  const muteButton=document.getElementById('muteBtn');
  if(muteButton){ muteButton.textContent='靜 音:'+(meta.mute?'開':'關'); muteButton.classList.toggle('on',meta.mute); }
  const controls=document.getElementById('audioControls');
  if(controls) controls.style.opacity=meta.mute?0.55:1;
}

export function previewMusic(){
  if(hooks.getMeta?.().mute) return;
  hooks.unlockAudio?.();
  hooks.startMusic?.();
  clearTimeout(previewTimer);
  previewTimer=setTimeout(()=>{ if(!G.running||G.paused) hooks.stopMusic?.(0.6); },1600);
}

export function bindVolumeSettings(){
  const meta=hooks.getMeta?.();
  for(const [id,key] of VOLUME_CONTROLS){
    const input=document.getElementById(id); if(!input) continue;
    input.addEventListener('input',()=>{
      hooks.unlockAudio?.();
      meta.vol[key]=Math.max(0,Math.min(1,(+input.value||0)/100));
      document.getElementById(id+'V').textContent=Math.round(meta.vol[key]*100);
      hooks.applyVolume?.();
      if(key!=='sfx') previewMusic();
    });
    input.addEventListener('change',()=>{
      hooks.saveMeta?.();
      if(key!=='music'&&!meta.mute) hooks.playUI?.();
    });
  }
  const muteButton=document.getElementById('muteBtn');
  if(muteButton) muteButton.onclick=toggleSound;
}

export function toggleSound(){
  const meta=hooks.getMeta?.();
  meta.mute=!meta.mute;
  hooks.saveMeta?.();
  hooks.setSoundEnabled?.(!meta.mute);
  if(!meta.mute){
    hooks.unlockAudio?.();
    if(G.running) hooks.startMusic?.();
    hooks.playUI?.();
  }else hooks.applyVolume?.();
  renderSoundButton();
  renderVolumeSettings();
}

export function renderSoundButton(){
  const button=document.getElementById('sndbtn'); if(!button) return;
  const muted=hooks.getMeta?.().mute;
  button.textContent='♪ 音律:'+(muted?'關':'開');
  button.classList.toggle('off',muted);
}

export function renderSettingsSegments(){
  const meta=hooks.getMeta?.();
  const groups=[
    ['#shakerow .seg','shake',meta.shake],
    ['#qualrow .seg','qual',meta.quality],
    ['#fpsrow .seg','fps',meta.fps|0],
    ['#cardtextrow .seg','cardtext',meta.cardText],
    ['#bmoderow .seg','bmode',meta.battleMode]
  ];
  groups.forEach(([selector,key,value])=>document.querySelectorAll(selector).forEach(element=>
    element.classList.toggle('on',key==='fps'?+element.dataset[key]===value:element.dataset[key]===value)));
  const hint=document.getElementById('bmodehint');
  if(hint) hint.textContent=meta.battleMode==='wait'
    ?'三選一時世界靜止,可以慢慢看。'
    :'三選一時墨獸照樣進逼,但你畫不了劍令。';
}

function bindSettingGroup(selector,onSelect){
  document.querySelectorAll(selector).forEach(element=>{
    element.onclick=()=>{
      onSelect(element);
      hooks.saveMeta?.();
      renderSettingsSegments();
      if(!hooks.getMeta?.().mute) hooks.playUI?.();
    };
  });
}

export function bindSettingsSegments(){
  const meta=hooks.getMeta?.();
  bindSettingGroup('#shakerow .seg',element=>{ meta.shake=element.dataset.shake; if(meta.shake==='n') G.shake=0; });
  bindSettingGroup('#qualrow .seg',element=>{ meta.quality=element.dataset.qual; hooks.applyQuality?.(); });
  bindSettingGroup('#fpsrow .seg',element=>{ meta.fps=+element.dataset.fps; hooks.resetRenderAccumulator?.(); });
  bindSettingGroup('#bmoderow .seg',element=>{ meta.battleMode=element.dataset.bmode; applyBattleMode(); });
  bindSettingGroup('#cardtextrow .seg',element=>{
    meta.cardText=element.dataset.cardtext;
    if(levelChoiceOpen()&&!levelChoiceLocked) drawCards(true);
  });
  renderSettingsSegments();
}

export function bindPauseTabs(){
  document.querySelectorAll('#pausetabs .tab').forEach(tab=>{
    tab.onclick=()=>{
      const pane=tab.dataset.pane;
      document.querySelectorAll('#pausetabs .tab').forEach(item=>item.classList.toggle('on',item===tab));
      document.querySelectorAll('#pausepanel .pane').forEach(item=>item.classList.toggle('on',item.dataset.pane===pane));
      const panel=document.getElementById('pausepanel'); if(panel) panel.scrollTop=0;
      if(pane==='run') hooks.renderTierList?.();
      if(!hooks.getMeta?.().mute) hooks.playUIMove?.();
    };
  });
}

function rebirthView(){ return hooks.getRebirthView?.()||[]; }

export function rebirthRequirementText(node){
  const byId=hooks.getRebirthById?.()||{};
  return (node.requires||[]).map(requirement=>{
    const [id,rankText]=String(requirement).split(':'), definition=byId[id];
    const rank=Number(rankText||1);
    return (definition?definition.name:id)+(rank>1?' '+rank+' 階':'');
  }).join('、');
}

export function metaBonusText(){
  const purchased=rebirthView().filter(item=>item.rank>0).map(item=>
    item.maxRank>1?item.name+' '+item.rank+'/'+item.maxRank:item.name.replace(/^.*·\s*/,''));
  return purchased.length?purchased.join('、'):'尚無 — 快去凝聚第一縷修為';
}

export function createRebirthRow(item){
  const maxed=item.rank>=item.maxRank;
  const cost=item.purchase.cost!=null?item.purchase.cost:item.costs[Math.min(item.rank,item.costs.length-1)];
  const blocked=!maxed&&item.purchase.reason==='requirements';
  const row=document.createElement('div'); row.className='mrow';
  row.innerHTML='<div class="mi"><div class="mn">'+item.name
    +(item.maxRank>1?'　<span class="ml">'+item.rank+'/'+item.maxRank+'</span>':'')
    +'</div><div class="md">'+item.description
    +(blocked?'<br><span style="color:#a2422b">需先:'+rebirthRequirementText(item)+'</span>':'')+'</div></div>';
  const button=document.createElement('button'); button.className='mbuy';
  if(maxed){ button.textContent=item.maxRank>1?'圓滿':'已悟'; button.classList.add('done'); button.disabled=true; }
  else if(blocked){ button.textContent='未達'; button.disabled=true; }
  else{
    button.textContent=(item.rank>0?'精進 · ':'參悟 · ')+cost;
    button.disabled=!item.purchase.ok;
    button.onclick=()=>{ if(hooks.purchaseRebirth?.(item.id)){ hooks.playUI?.(); renderMeta(); } };
  }
  row.appendChild(button);
  return row;
}

export function renderMeta(){
  const meta=hooks.getMeta?.();
  document.getElementById('metasouls').innerHTML='墨魂　<b>'+meta.souls+'</b>'+((meta.inkPills||0)>0?'　·　洗墨丹 <b>'+meta.inkPills+'</b>':'');
  document.getElementById('metabonus').innerHTML='承襲修為 · <b>'+metaBonusText()+'</b>';
  const offline=document.getElementById('metaoffline'), pending=hooks.getOfflinePending?.()||0, rate=hooks.getOfflineRate?.()||0;
  if(pending>0){
    offline.innerHTML='閉關所得 '+pending+' 墨魂(每時 '+rate+'，封頂 '+meta.offCap+' 時)<span class="claim" id="claimbtn">領取</span>';
    document.getElementById('claimbtn').onclick=()=>{ hooks.claimOffline?.(); renderMeta(); };
  }else offline.innerHTML='<span style="color:#8a7a5a">閉關修煉中 · 每時凝 '+rate+' 墨魂(封頂 '+meta.offCap+' 時)</span>';
  const boxes={foundation:document.getElementById('metalist'),mind:document.getElementById('metaunlock'),inheritance:document.getElementById('metainherit')};
  Object.values(boxes).forEach(box=>{ if(box) box.innerHTML=''; });
  document.getElementById('mhead1').textContent=REBIRTH_BRANCH_HEAD.foundation;
  document.getElementById('mhead2').textContent=REBIRTH_BRANCH_HEAD.mind;
  document.getElementById('mhead3').textContent=REBIRTH_BRANCH_HEAD.inheritance;
  rebirthView().forEach(item=>(boxes[item.branch]||boxes.foundation).appendChild(createRebirthRow(item)));
}

export function openMeta(){ renderMeta(); document.getElementById('meta').classList.add('show'); }
export function closeMeta(){ document.getElementById('meta').classList.remove('show'); }

export function resetRespecConfirmation(){ respecArmed=false; }

export function renderRespec(){
  const state=hooks.getRespecInfo?.(), runState=hooks.getRunState?.();
  const button=document.getElementById('respecbtn'), info=document.getElementById('respecinfo');
  const ranks=G.running&&runState?Object.keys(runState.ranks||{}).length:0;
  info.innerHTML='本局已重塑 <b>'+state.times+'</b> 次 · 現有劍意 <b>'+ranks+'</b> 項<br>重塑代價:<b>'+state.pay+'</b>'
    +(state.ok?'<br><span style="color:#8a7a5a">卸下本局所有劍意/劍式/真意,道行與波次不變。</span>':'<br><span class="warn">'+state.why+'</span>');
  button.classList.toggle('off',!state.ok);
  button.classList.toggle('armed',respecArmed&&state.ok);
  button.textContent=respecArmed&&state.ok?'確認重塑(再按一次)':'重 塑';
}

export function requestRespec(){
  const state=hooks.getRespecInfo?.();
  if(!state.ok){ hooks.playNoMana?.(); return; }
  if(!respecArmed){ respecArmed=true; hooks.playUI?.(); renderRespec(); return; }
  hooks.performRespec?.(state);
  respecArmed=false;
  renderRespec();
}

export function renderHeroChoices(){
  const selected=hooks.getMeta?.().heroSkin;
  document.querySelectorAll('#herochoices [data-hero]').forEach(button=>{
    const active=button.dataset.hero===selected;
    button.classList.toggle('on',active);
    button.setAttribute('aria-checked',String(active));
  });
}

export function setHeroSkin(skin){
  if(!['m','f','x'].includes(skin)) return;
  const meta=hooks.getMeta?.();
  if(!meta) return;
  meta.heroSkin=skin;
  hooks.saveMeta?.(); hooks.playUI?.(); renderHeroChoices();
}

export function bindHeroChoices(){
  document.querySelectorAll('#herochoices [data-hero]').forEach(button=>button.onclick=()=>setHeroSkin(button.dataset.hero));
}

export function renderShop(){
  const meta=hooks.getMeta?.(), catalog=hooks.getShopCatalog?.()||{iap:[],spend:[]};
  document.getElementById('shopgems').innerHTML='靈石　<b>'+meta.gems+'</b>　·　墨魂 '+meta.souls+((meta.inkPills||0)>0?'　·　洗墨丹 '+meta.inkPills:'');
  const iap=document.getElementById('shopiap'); iap.innerHTML='';
  catalog.iap.forEach(item=>iap.appendChild(createShopRow(item,'iap')));
  const spend=document.getElementById('shopspend'); spend.innerHTML='';
  catalog.spend.forEach(item=>spend.appendChild(createShopRow(item,'spend')));
}

export function createShopRow(item,type){
  const meta=hooks.getMeta?.(), row=document.createElement('div'); row.className='mrow';
  const owned=type==='spend'&&item.once&&meta.skin==='gold'&&item.id==='skin';
  const description=type==='iap'?(item.note||'獲得靈石 ×'+item.gems)
    :item.capField?'離線收益封頂提高(現 '+meta.offCap+' 時)':item.pillField?item.desc+'(存 '+(meta.inkPills||0)+' 顆)':item.desc;
  row.innerHTML='<div class="mi"><div class="mn">'+item.name+(item.tag?'<span class="mtag">'+item.tag+'</span>':'')+'</div><div class="md">'+description+'</div></div>';
  const button=document.createElement('button'); button.className='mbuy';
  if(owned){ button.textContent='已擁有'; button.classList.add('done'); button.disabled=true; }
  else{
    button.textContent=type==='iap'?item.price+' · 購買':'靈石 '+item.cost;
    button.disabled=type==='spend'&&meta.gems<item.cost;
    button.onclick=()=>{ if(hooks.purchaseShopItem?.(type,item)) renderShop(); };
  }
  row.appendChild(button); return row;
}

export function openShop(){ renderShop(); document.getElementById('shop').classList.add('show'); }
export function closeShop(){ document.getElementById('shop').classList.remove('show'); }

export function renderTierList(){
  const box=document.getElementById('tierlist'), runState=hooks.getRunState?.(); if(!box) return;
  if(!runState){ box.innerHTML=''; return; }
  const runtime=hooks.getRuntime?.(), view=runtime.getTierView(runState);
  if(!view.length){ box.innerHTML='<div class="tempty">尚無滿階劍訣。<br>同一道劍訣領悟至滿階後,便開始累計本局斬妖數,<br>依序臻至 小成 · 大成 · 圓滿。</div>'; return; }
  const names=['小成','大成','圓滿'], escape=text=>String(text).replace(/[&<>]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[char]));
  box.innerHTML=view.map(item=>{
    const rows=names.map((name,index)=>{ const tier=item.tiers?.[index], lines=runtime.tierLines(item.id,index), reached=item.level>index;
      const text=lines.length?lines.join('、'):(tier?.description||'').replace(/。$/,'');
      return '<div class="tline'+(reached?' on':'')+'"><b>'+name+'</b><span>'+escape(text)+'</span><em>'+(reached?'已臻':tier?tier.kills+' 斬':'')+'</em></div>'; }).join('');
    if(!item.nextName) return '<div class="trow"><div class="tname">'+item.rune+' '+item.name+' <i class="tdone">圓滿</i></div><div class="tsub">本局已斬 '+item.kills+' 頭</div>'+rows+'</div>';
    const previous=item.level>0?item.tiers[item.level-1].kills:0, percent=Math.max(0,Math.min(100,(item.kills-previous)/(item.nextAt-previous)*100));
    return '<div class="trow"><div class="tname">'+item.rune+' '+item.name+' <i>'+(item.tierName?'已臻 '+item.tierName:'累計中')+'</i></div><div class="tbar"><i style="width:'+percent.toFixed(1)+'%"></i></div><div class="tsub">'+item.kills+' / '+item.nextAt+' 斬 · 下一層 '+item.nextName+'</div>'+rows+'</div>';
  }).join('');
}

export function enableDragScroll(id){
  const panel=document.getElementById(id); if(!panel) return;
  const skip='input,button,.setbtn,.seg,.btn,label,.mbuy,.tab,.card,.claim';
  let active=false,startY=0,startTop=0,moved=0;
  panel.addEventListener('pointerdown',event=>{ if(event.target.closest?.(skip)) return; active=true; moved=0; startY=event.clientY; startTop=panel.scrollTop; panel.setPointerCapture?.(event.pointerId); });
  window.addEventListener('pointermove',event=>{ if(!active) return; const delta=event.clientY-startY; moved=Math.max(moved,Math.abs(delta)); panel.scrollTop=startTop-delta; if(moved>4&&event.cancelable) event.preventDefault(); },{passive:false});
  const end=event=>{ if(!active) return; active=false; try{ panel.releasePointerCapture?.(event.pointerId); }catch(_){} };
  window.addEventListener('pointerup',end); window.addEventListener('pointercancel',end);
}
