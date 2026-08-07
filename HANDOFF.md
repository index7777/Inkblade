# 墨劍訣 · HANDOFF（交接說明）

> 產生日期:2026-08-07
> 用途:記錄本階段改了什麼、目前狀態、已知問題與下一步。細節逐筆見 `docs/CHANGELOG.md`。

## ⚠️ 最重要:一個未解的阻塞點
`data/game-config.js` 已換成 **v2.1.0 完整引擎版**,但主檔 `inkblade.html` 仍用舊的扁平 `applyAffix`。
v2.1.0 的相容層 `affixes[].effect` 是巢狀 `{add,mul,flags,status}`,且丟棄了 `set formation`。
**後果:直接開遊戲,升級選卡的效果會失效、陣型切不動。**
→ 正解是把主檔改用 `INK_CONFIG.runtime`(見「下一步」)。**Slice 1 已完成:升級選卡/陣型已改用 runtime(rollInsights/applyInsight)並驗證。** 其餘見 CHANGELOG #9 的 Slice 2 待辦。

## 這階段改了哪些東西

### A. 特效(inkblade.html,玩法不變)
- 新增 `inkTrail()`:劍氣拖尾改為多層毛筆筆劃(填充緞帶+毛邊+濃芯+飛白),沿用元素配色與 FX 開關。(CHANGELOG #1)
- 新增 `splash()`/`drawSplash()` + `G.splashes`:命中/斬殺/裂空的圓形粒子爆裂改為不規則潑墨。(#2)

### B. 關卡背景(inkblade.html + 新圖)
- `buildPaper()` 由程序化宣紙改為場景圖 `assets/scenes/level01-bg.png`(cover)。程序化 tile 函式保留。(#3)

### C. 資料驅動:設定檔抽離(inkblade.html)
- 詞條/轉世/稀有度改讀 `window.INK_CONFIG`;新增通用 `applyAffix()`;`start()`/`metaBonusText()`/`drawCards()` 改為依設定檔通用產生。(#4)
- 主檔 `<script>` 前新增 `<script src="data/game-config.js"></script>`。
- `affixWeight` 改判斷 `effect.homing`(不依賴會變的 id);新增 `STAT_LABEL` 顯示 fallback。(#5)

### D. 設定檔引擎(data/game-config.js)
- 整檔換為使用者 v2.1.0(INSIGHTS/REBIRTH DSL、runtime、legacy 相容層)。自我 validateConfig 通過。(#6)
- 併入洗點/存檔遷移/戰鬥快照:`calcResetCost`、`undoInsight`、`resetAllInsights`、`migratePermanentSave`、`getCombatSnapshot`;加 `BASE_RUN_STATE.resetInsightTimes`;`createRunState` 存 `permanentSnapshot`。(#7)
- **修了兩個會數值爆炸的 bug**(偏離使用者原貼碼,已驗證):
  1. `applyInsight` 對真意重複套用兩次 → 改為套一次。
  2. `resetAllInsights` 改為「從永久快照重建」,避免 mul 反向順序誤差與真意/劍式殘留;實測洗點精準回到開局值。

### E. 美術資產
- `assets/references/ch1-enemies-ref.png`(墨靈+墨刃兵設定表)、`assets/references/moshou-ref.png`(墨獸,本章 Boss)。
- `docs/ch1-asset-library.md`:逐動作提詞+檔名+用途+資產清單(墨靈/墨刃兵/墨獸)。
- `docs/art-spec.md`:美術規範(水墨語言、紅色只用於靈魂核/元素、FX 對應 config.fx、禁止清單)。

### F. 文件
- `docs/ink-engine-方向與開發計畫.md`、`docs/ink-engine-spec-review.md`、`docs/respec-plan.md`、`docs/CHANGELOG.md`(全程逐筆)、`music-prompts.md`、獨立 PoC `ink-engine.html`。

## 目前可運作 / 已驗證
- `data/game-config.js`:node 載入、validateConfig、createRunState、rollInsights、applyInsight(真意/劍式互斥)、purchaseRebirth、resetAllInsights(精準歸零)、calcResetCost、migratePermanentSave、getCombatSnapshot 全部通過。
- 特效(拖尾/潑墨)、背景圖:已接入主檔,語法通過。

## 已知問題
1. **(阻塞)主檔未接 runtime**,升級/陣型在新 config 下失效——見最上方。
2. `undoInsight` 單條撤銷對含 mul 的悟道有順序誤差;精準歸零請用 `resetAllInsights`。(docs/respec-plan.md)
3. v2.1.0 有 10 個傳承/心法解鎖:`inherit_*` 已用 requires 綁對應真意;`mind_*`(首劍必暴/折返飛白/潰散潑墨/聽墨)為 flag,需在主檔遷移時於對應玩法位置接線。
4. 洗點的費用扣除/免費次數/戰鬥禁止/洗墨丹/UI 為遊戲層,尚未接主檔。

## 下一步(建議順序)
1. **主檔 runtime 遷移**(大工程,分段):stat.* → runState.stats.*;升級選卡 → rollInsights+applyInsight;轉世閣 → getRebirthView+purchaseRebirth;戰鬥數值 → getCombatSnapshot;洗點 → resetAllInsights + 遊戲層費用/次數/戰鬥禁止(參考使用者 handleResetAllBuild 範例)。
2. 接 `mind_*` 心法 flag 的實際玩法效果。
3. **已進行**:sprite 載入器已接(assets/enemies、assets/boss;採 tier0=墨靈、tier1/2=墨刃兵)。待你產出真透明 PNG 丟進就自動顯示。
4. 直式目標畫布:1080×1920(9:16)——runtime 遷移/版面時套用。

## 同步提醒
config 與主檔為多機同步(SYNC.bat → GitHub index7777/Inkblade)。換機器前先在本機 push,另一台再 pull,避免衝突。
