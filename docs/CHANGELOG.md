# 墨劍訣 · 變更記錄(Ink Engine 整合)

> 規則:每次改動主檔都在此記錄——改了什麼、為什麼、如何還原(附原始碼片段)。
> 最終還原依據以 git 為準;下列片段供快速手動復原。

---

## [2026-08-07] #7 洗點系統底層 + 存檔遷移 + 戰鬥快照(併入 config runtime)
**檔案**:`data/game-config.js`
**新增**:`calcResetCost`、`undoInsight`、`resetAllInsights`、`migratePermanentSave`、`getCombatSnapshot`(皆掛入 runtime);`BASE_RUN_STATE.resetInsightTimes:0`;`createRunState` 額外存 `permanentSnapshot`。
**修正(重要,偏離使用者原貼碼之處,已驗證)**:
1. `applyInsight` 對「真意」原會把數值效果**套用兩次**(truth op 處理器內一次 + 外層 forEach 再一次)→ 改為真意只執行 truth op,套一次。
2. 使用者原 `resetAllInsights` 會對真意/劍式**重複回滾**且 `mul` 反向有順序誤差 → 改為「從 permanentSnapshot 重建」回到 base+永久問道,數值精準無漂移,保留洗點次數。
**驗證**:狂疊真意+劍式+修持+劍勢後洗點,count/cap/damage/manaMax 皆精準回到開局值,ranks 清空,真意卸載;calcResetCost=0/30/80/150/250(封頂);migratePermanentSave 補全舊存檔;getCombatSnapshot 聚合輸出正常。
**已知限制**:`undoInsight` 單條撤銷對含 mul 的悟道有順序誤差(詳見 docs/respec-plan.md);精準歸零請用 resetAllInsights。
**還原依據**:git checkout 前一版 config;或移除上述函數與 resetInsightTimes/permanentSnapshot、還原 applyInsight 的 else 分支。

## [2026-08-07] #6 config 換為使用者 v2.1.0(完整引擎版)
**檔案**:`data/game-config.js`(整檔替換)
**內容**:使用者提供的 v2.1.0——INSIGHTS/REBIRTH DSL、runtime(createRunState/rollInsights/applyInsight/purchaseRebirth…)、legacy 相容層(affixes/metaUp/metaUnlock/rarity/homingBoost)。自我 validateConfig 通過。
**相容性警示(未解)**:主檔 `inkblade.html` 現用的扁平 `applyAffix` 讀 `e.count` 等,而 legacy affix.effect 改為巢狀 `{add,mul,flags,status}` 且丟棄 `set formation` → 舊橋接下**升級選卡效果會失效、陣型切不動**。正解是主檔改用 `INK_CONFIG.runtime`(見 docs/respec-plan.md 與待辦)。此為待決策的主檔遷移工作,尚未進行。
**還原依據**:git checkout 前一版 game-config.js。

## [2026-08-07] #5 相容使用者大改版的 game-config.js
**檔案**:`inkblade.html`
**背景**:使用者大幅擴充/改名 `data/game-config.js`(新增 schema、terminology、opSchema、insights、rebirth、fx…;詞條與轉世項目全部改名)。主檔依賴的鍵仍在,遊戲可跑;但改名造成兩處失效,已修:
1. `affixWeight` 原寫死 `a.id==='homing'`,追蹤詞條已改名(momentum_guide)。改為判斷 `a.effect.homing`,不再依賴 id → 御劍傳承加權恢復作用(驗證:解鎖後權重 x2.2)。
2. metaUp 移除了 label/bonusText,`metaBonusText` 會顯示原始鍵。於主檔新增 `STAT_LABEL`/`STAT_FIXED` 對照表作為 fallback(顯示恢復中文,如「靈力上限 +60」)。

**未處理(待使用者決定)**:新 config 有 10 個 metaUnlock,但目前只有 `inherit_guide`(加權)與 `inherit_ten_thousand`(gate 詞條)被引擎接上;其餘 8 個(mind_* 與其餘 inherit_*)買得到但無效果,需後續依設計接線。

**還原依據**:把 `affixWeight` 改回 `a.id==='homing'`;移除 `STAT_LABEL`/`STAT_FIXED` 與 metaBonusText 的 fallback。或 git checkout。

## [2026-08-07] #4 轉世閣/詞條 抽成共用設定檔(資料驅動)
**檔案**:`data/game-config.js`(新增)、`inkblade.html`
**目的**:把「升級三選一詞條」與「轉世閣永久強化/解鎖/稀有度」抽到單一設定檔,之後調平衡/加內容只改該檔,不動引擎。

**變更內容**
1. 新增 `data/game-config.js`,曝露 `window.INK_CONFIG`:rarity(權重/名稱)、affixes(含宣告式 `effect`、`locked`)、metaUp(含 `per`/`label`/`fixed`/`bonusText`)、metaUnlock、homingBoost。
2. `inkblade.html` 主 `<script>` 之前加入 `<script src="data/game-config.js"></script>`。
3. 主檔內聯表改為讀設定:`META_UP/META_UNLOCK/AFFIXES/RARW/RARNAME = window.INK_CONFIG.*`。
4. 新增通用套用器 `applyAffix(a)` 解讀 `effect`,取代每條寫死的 `apply` 閉包;升級選卡呼叫由 `a.apply()` 改為 `applyAffix(a)`。
5. `drawCards` 鎖定過濾一般化:`a.locked && !meta.unlock[a.locked]`(原本寫死 storm)。
6. `affixWeight` 追蹤加權改讀 `INK_CONFIG.homingBoost`。
7. `start()` 轉世加成改為依 `META_UP.per` 的通用迴圈(行為等同原本 ling×15/gu×3/xing×1/qi×0.05/twin)。
8. `metaBonusText()` 承襲總覽改為依設定檔通用產生(顯示不變)。
**驗證**:node 模擬確認靈台/連珠/萬劍歸宗/寒霜、轉世 per 迴圈、locked 過濾結果與原邏輯一致。

**還原依據**:移除 config script 標籤與 `applyAffix`,把 `META_UP/META_UNLOCK/AFFIXES/RARW/RARNAME` 改回原本內聯定義(含各自 `apply` 閉包)、`a.apply()` 呼叫、`start()` 五行硬編加成、`metaBonusText` 原版、`drawCards` 的 `a.id==='storm'` 過濾。或 `git checkout` 前一版並刪除 `data/game-config.js`。

## [2026-08-07] #3 關卡背景 → 場景圖(潑墨山谷)
**檔案**:`inkblade.html`、`assets/scenes/level01-bg.png`(新增圖)
**目的**:把程序化宣紙背景換成指定的場景圖。

**變更內容**
1. 新增背景圖 `assets/scenes/level01-bg.png`(來源:使用者上傳 ChatGPT Image 2026-08-07 10_54_56)。
2. `buildPaper()` 改為將 `#paper` 底圖設為該場景圖(cover、置中、不重複),疊一層極淡墨徑向漸層,並加宣紙底色 fallback。程序化紙紋函式 `makePaperTile()` 保留未刪(供還原)。

**還原依據**:把 `buildPaper()` 內容改回原本(重新啟用 makePaperTile 那段):
```
const tile=makePaperTile();
const el=document.getElementById('paper');
el.style.backgroundImage='url('+tile.toDataURL('image/png')+')';
el.style.backgroundSize=(tile.width/ (window.devicePixelRatio>1?2:1))+'px auto';
el.style.backgroundImage=
  'radial-gradient(circle at 18% 22%, rgba(138,122,90,.085), rgba(138,122,90,0) 42%),'
 +'radial-gradient(circle at 62% 48%, rgba(138,122,90,.07), rgba(138,122,90,0) 46%),'
 +'radial-gradient(circle at 88% 78%, rgba(138,122,90,.075), rgba(138,122,90,0) 44%),'
 +el.style.backgroundImage;
paperDone=true;
```

## [2026-08-07] #2 命中爆裂 → 潑墨(Splash primitive)
**檔案**:`inkblade.html`
**目的**:把打擊的圓形粒子爆裂換成不規則潑墨,統一成水墨語言。玩法不變,單一 Canvas。

**變更內容**
1. 新增 `splash(x,y,c,power)` 與 `drawSplash(ctx,sp)`(接在 `burst` 函式之後):不規則墨團 + 徑向墨刺(部分斷裂)+ 沿用粒子系統的飛濺墨滴;含 16 個溢位丟最舊。
2. 狀態物件與 `start()` 重置各加入 `splashes:[]`。
3. 更新迴圈:粒子更新後加 `for(...G.splashes...) sp.age++` 到期移除。
4. 繪製:粒子繪製前加 `if(DRAWLV>=4) for(const sp of G.splashes) drawSplash(ctx,sp);`
5. 四處 `burst` 打擊改為 `splash`:
   - 妖觸靈石:`burst(en.x,en.y,en.c,10)` → `splash(en.x,en.y,en.c,1)`
   - 劍命中:`burst(s.x,s.y,(ELEM...).hit,6)` → `splash(...,1)`
   - 裂空爆裂:`burst(s.x,s.y,'#c0662e',18)` → `splash(...,2.2)`
   - 斬殺:`burst(en.x,en.y,en.c,16)` → `splash(en.x,en.y,en.c,1.8)`
   - (保留)靈力不足小噴 `burst(s0.x,s0.y,'#8a7a5a',5)` 不變。

**還原依據**:刪除 `splash`/`drawSplash` 兩個函式、移除狀態/重置/更新/繪製的 splashes 相關行,並把上述四處改回原本的 burst 呼叫(數值如上)。或 `git checkout` 前一版。

---

## [2026-08-07] #1 劍氣拖尾 → 毛筆筆劃(BrushStroke primitive)
**檔案**:`inkblade.html`
**目的**:飛劍劍氣從單層漸細線升級成真毛筆筆劃(填充緞帶 + 毛邊 + 濃芯 + 飛白)。玩法不變。

**變更內容**
1. 新增 `inkTrail(ctx, tr, size, rgb)`(接在 `floatText` 之後)。
2. 劍氣繪製處的拖尾迴圈改為呼叫 `if(FX.trail) inkTrail(ctx, s.trail, stat.size, rgb);`

**還原依據**:刪除 `inkTrail` 函式,並把該呼叫改回原始迴圈:
```
if(FX.trail) for(let k=1;k<s.trail.length;k++){
  const a=k/s.trail.length, ease=a*a;          // 尾端收得更急,像毛筆提起
  ctx.strokeStyle='rgba('+rgb+','+(ease*0.58)+')';
  ctx.lineWidth=stat.size*1.8*ease;
  ctx.beginPath(); ctx.moveTo(s.trail[k-1].x,s.trail[k-1].y); ctx.lineTo(s.trail[k].x,s.trail[k].y); ctx.stroke();
  // 飛白:乾筆刮過的細白絲
  if(k>s.trail.length-5){
    ctx.strokeStyle='rgba(250,246,236,'+(ease*0.30)+')'; ctx.lineWidth=stat.size*0.32*ease;
    ctx.beginPath(); ctx.moveTo(s.trail[k-1].x,s.trail[k-1].y-1); ctx.lineTo(s.trail[k].x,s.trail[k].y-1); ctx.stroke();
  }
}
```
