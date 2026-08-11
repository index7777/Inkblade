# 架構遷移 · 進度與續作(SEAMLESS HANDOFF)

> 供任何新對話/另一台機器無縫接手。總體計畫見 `docs/architecture-migration-plan.md`。
> 最後更新:2026-08-11。

## 一、目前進度

- **Stage 0 ✅** 內聯 `<script>` 抽成外部檔(逐位元組一致)。
- **Stage 2a ✅** 導入 esbuild。`src/main.js`(= 原碼,單一 `'use strict'` iife)→ 打包成 `game.js`(iife)。`inkblade.html` 載入 `data/game-config.js` → `data/sound-system.js` → `game.js`。
- **Stage 2b 進行中**(把 `src/main.js` 逐塊抽成 ES module):
  - 增量1 ✅ `src/geom.js` — 純幾何/數學(offsetPath/rotatePath/truncatePath/segCircleDist/supHash)。
  - 增量2 ✅ `src/core.js`(`G`、`stat`)+ `src/constants.js`(HERO_VISUAL_SCALE/HERO_BODY_SCALE/FAN_PHI/BASE_SPEED/MERGE_SPEED_K/MERGE_WIDTH_K/SOLO_TURN/HOMING_RANGE)。
  - 增量3 ✅ `src/viewport.js` — `cv/ctx/W/H/DPR/PLAY_TOP`、畫質設定、resize 與頂部安全區量測；跨模組副作用由 hooks 銜接。
  - 增量4 ✅ 舊 `SND_LEGACY` 已確認零引用並退役；現行音訊唯一來源為先載入的 `data/sound-system.js`，舊實作不再進入 `game.js`。
  - 增量5 ✅ `src/enemy.js` 第一批 — 敵人種類表、波次抽樣、難度曲線、可視範圍判定。
  - 增量6 ✅ `src/enemy.js` 第二批 — 普通敵人的邊界生成點、安全區避讓與實體建立。
  - 增量7 ✅ `src/enemy.js` 第三批 — 第三十境幽冥墨蛛生成；浮字、音效與閃光以 hooks 銜接。
  - 增量8 ✅ `src/enemy.js` 第四批 — 玄冥 HP、階段／招式／素材設定、Boss 構圖比例與正式／測試生成。
  - 增量9 ✅ `src/enemy.js` 第五批 — 玄冥階段判定、四向定位、視覺位移、安全換邊與下一次顯形決策。
  - 增量10 ✅ `src/enemy.js` 第六批 — 玄冥第一階段狀態機、階段切換與消散／重新凝形墨霧；攻擊、震動與閃光以 hooks 銜接。
  - 增量11 ✅ `src/enemy.js` 第七批 — 玄冥三連墨核／環形墨浪、幽冥墨蛛網彈、Boss 彈幕更新與墨核消散；UI、音效、震動與死亡以 hooks 銜接。
  - 增量12 ✅ `src/enemy.js` 第八批 — 玄冥波次開始、殘敵退場、Boss 登場與擊破收尾；階段切換沿用模組內狀態機，音樂、HUD 與視覺以 hooks 銜接。
  - 增量13 ✅ `src/combat.js` — 路徑／陣型計算、劍令建立、飛劍推進、命中傷害、耐久、折返與定鋒劍樁生命週期；`main.update()` 僅呼叫 `updateCombat()`。
  - 增量14 ✅ `src/render.js` — 角色、普通敵人、Boss、飛劍、劍樁、粒子、狀態特效、紙張背景與總戰場繪製；退役零引用的舊程序化劍身與污染畫布。
  - **待使用者實測**:`dev.bat` → 6(離線)或 4(線上)跑一局,確認敵人生成、波次難度與自動瞄準正常。

## 二、開發/建置流程(詳見 DEV.md)

- 只改 `src/`;改完 `npm run build`(或 `dev.bat` 2/3)。`game.js` 是產物但仍 commit(離線雙擊免 build)。
- 線上測 `npm run serve`(或 `dev.bat` 4,自動開瀏覽器);根路徑有 `index.html` 轉址。
- 每次 push 前務必 `npm run build`,讓 `game.js` 與 `src/` 同步。

## 三、抽模組的標準流程(每次一小塊)

1. 選一塊**低耦合**的碼(純函式最安全;其次是只讀共享狀態的)。
2. 新增 `src/xxx.js`,把定義 `export` 出來。
3. `src/main.js` 頂端加 `import {...} from './xxx.js'`(import 在最外層,IIFE 會 closure 到);刪掉原定義。
4. `npm run build` → `node --check game.js`。
5. **驗證(關鍵,因無法在此實跑瀏覽器)**:
   - 每個搬走的識別字:main.js 中定義數=0、且**都出現在某 import 行**(漏 import = silent runtime error,esbuild 不會報)。
   - `game.js` 無 `^import|^export` 殘留(自足 iife)。
6. 交使用者實測 → 過了再進下一塊。

**安全網**:ES module「匯入變數不可重賦值」會在**建置期**報錯 → 會被重賦值的共享狀態放錯模組會 build fail(不是隱性 bug)。但「漏 import」不會 build fail(當成全域)→ 所以第 5 步的 grep 驗證必做。

## 四、下一步:共享「可變」狀態(最需小心)

以下頂層 `let`(會被**重新賦值**)還在 `main.js`。它們若被搬到別的模組、又在 main 重賦值 → build fail。處理原則:**把某狀態的「寫入者」和宣告放同一模組**,其他模組只 `import` 來讀(ES module live binding,讀沒問題)。必要時提供 setter 函式。

清單(重賦值的共享 let):`W,H,DPR,booted`、`jianSprite,jianKey,jianOX,jianOY`、`PLAY_TOP`、`meta`、`runState`、`levelChoiceLocked,levelRerolls`、`drawing,path,curLen,maxed`、`heroCv,heroHurtCv,heroH,heroW`、`hfCv...`、`paperDone`、`corruptionCv,corruptionKey`、`blots`、`NODRAW,NOAUDIO,DRAWLV,GPU`、`bisecting`、`idleFrame,perfBuf...`、`logicAcc,renderAcc,lastFrameTs`、`openingSeen`、`pausedByUser`、`respecArmed`、`previewT`。

建議的下一批(由易到難):
1. enemy、combat(飛劍/劍令/劍陣)、render(繪製)、ui(HUD/選卡/暫停/轉世閣/商城)、boot(所有開機執行碼集中,最後執行)。

## 五、遷移之後排隊的設計/功能(見 HANDOFF)

- **劍陣改「開局四選一・鎖定一路」**(定案,`docs/formation-draft-redesign.md`)——排在 Stage 2b 收段落後。
- 轉世閣前置 → 真意主動四式(含一筆開天=聚鋒極致版、卡片文字更新)。

## 六、注意

- 兩機協作:動大手術前先 pull/push 對齊;`node_modules`/`*.map`/`*.bak` 已 gitignore。
- 無法在本工具環境實跑瀏覽器 → 每個增量都需使用者實測把關。
