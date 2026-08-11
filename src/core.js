// 共享狀態(跨模組)。架構遷移 Stage 2b:抽出全案最常被引用的兩個全域。
// 皆為 const 物件 —— 只會「改屬性」不會「重新賦值」,故可安全 export/import。
'use strict';

// 遊戲執行期狀態
export const G = {
  running:false, paused:false, t:0,
  player:null, enemies:[], bossShots:[], swords:[], particles:[], inks:[], texts:[], stains:[], splashes:[], mists:[],commands:[],
  drops:[], lingers:[], edgeT:0, edgeReady:false, focus:0, focusIdle:0, focusReady:false, summonT:0,
  kills:0, wave:1, waveTimer:0, spawnAcc:0, eliteSpawned:{}, webT:0,
  xp:0, xpNeed:6, level:1, pendingLevels:0,
  shake:0, hitstop:0, flash:0, flashC:'255,255,255', banner:null,
  aim:0.85, facing:1, intent:0, streaks:[], cuts:[], anchors:[], anchorLinks:[], firstStrikeDone:false, respecWave:0,
  hurtT:0, castT:0, deathT:0, deathMax:56, heroPhase:0,
};

// 詞條(可堆疊)—— syncStat 由 runState 映射進來,遊戲各處讀取
export const stat = {
  count:1,          // 同時飛出的劍數
  formation:'fan',  // 陣型:fan 扇形 / parallel 平行 / inline 連珠
  damage:24,        // 單劍傷害
  size:9,           // 劍氣寬度
  speed:11,         // 飛行速度
  pierce:1,         // 可貫穿敵人數
  homing:0,         // 追蹤強度
  explode:0,        // 爆裂範圍
  element:'none',   // 劍的元素:none/fire/ice
  ember:0,          // 業火:灼燒層數
  ice:0,            // 寒霜:冰緩層數
  ret:0,            // 迴劍
  crit:0.05,        // 暴擊率
  regen:0,          // 每斬回靈
  cap:6,            // 同屏飛劍數上限
  manaMax:100,      // 劍意上限
  manaRegen:0.34,   // 每幀劍意回復
  costBase:6,       // 出劍基礎劍意(開局值由 config.baseRunState.stats.manaCostBase 決定)
  costPerPx:0.13,   // 每單位劍痕長度的劍意(同上 manaCostPerPixel;滿劍意約可畫 700px)
};
