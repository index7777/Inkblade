# 墨劍訣 · 變更記錄(Ink Engine 整合)

> 規則:每次改動主檔都在此記錄——改了什麼、為什麼、如何還原(附原始碼片段)。
> 最終還原依據以 git 為準;下列片段供快速手動復原。

---

## [2026-08-07] #27 主角 26 幀重製 + 隕落動畫、墨劍 14 幀、開場疊合/停頓修正
**檔案**:`assets/hero/*`(重製 + 死亡 7 幀)、`assets/sword/*`(新)、`inkblade.html`

### A. 開場過場修正(驗收回報:鏡頭動兩次像卡一下、拉開前畫軸明顯重疊沒疊好)
兩個症狀是同一個根因:`.op-scroll` 用的是**最終** `scale(var(--zoom))`,而 `#splash` 還在漸進放大 —— 畫軸浮在半縮放的桌面上,所以疊不準;等它在 z>0.55 時被 opacity 切進來,又造成第二次「跳動」。
1. `.op-scroll` 改用與 `#splash` **完全相同**的漸進縮放 `scale(calc(1 + var(--z) * (var(--zoom) - 1)))` → 全程像素級重合。
2. 畫軸**全程可見**(opacity 從 1 開始),不再有「接手」那一下;只保留抵達邊緣後的淡出。
3. `HOLD` 由 260ms 改為 **0**(ZOOM 拉長到 1100ms)—— 按下入局鏡頭立刻走,不再有開頭定格。

### B. 主角 sprite 重製為 26 幀(含隕落)
新增死亡 7 幀。更重要的是**改變對位策略**:
- 原本(#26)每幀各自以「主體中心 / 腳底」對位 —— 這對 idle 這種各自生成的變體是對的,但會把**受擊 / 施放 / 隕落等連續動作自身的位移吃掉**。
- 改為**全域統一裁切 + 統一縮放**(原圖皆 2048×2048 且構圖一致):固定裁切框 (56,104)-(1960,2024),統一縮到高 360 → 畫布 357×360,`foot=0.9906`(站立幀腳底在畫布中的比例)。動作序列的位移完整保留,站立幀之間仍然對齊。
- 存成 **LA(灰階+alpha)**:原稿本就是灰階墨、RGB 與 alpha 高度相關,省一半通道 → 26 幀 1.79MB(RGBA 版為 4.5MB)。
- `drawHeroSprite` 改用 `HEROSPR.foot` 對齊地面。
- **隕落**:`beginDeath()` 先播 7 幀(每幀 9 影格,共 63 影格),期間 `update()` 完全凍結戰鬥(只推進動畫與震屏/閃光/潑墨計時),播完才進結算畫面;沒有 sprite 則直接結算。

### C. 墨劍 sprite 14 幀(待機 8 / 攻擊 6)
素材是各種角度的獨立出圖,直接用會無法依飛行方向旋轉。離線做了**主軸正規化**:
1. 取濃墨(alpha>150)做 PCA 求刀身主軸 → 旋轉成水平;
2. 以「厚度剖面最大值 = 護手」判斷柄端在哪一側,必要時水平翻轉 → **劍尖一律朝 +X**;
3. 統一刀身長度(420px)、護手固定在畫布 `grip=0.22` 處、刀身軸線對齊畫布中線 → 畫布 651×260。
引擎端只要 `ctx.rotate(s.ang)` 再以 grip 為錨點貼圖即可。`drawJian` 改為有 sprite 走 `drawSwordSprite`,否則回退程序化 `drawInkFlyingSword`。出鞘前 24 影格播攻擊 6 幀,之後待機 8 幀慢速循環(每把劍帶隨機相位 `s.seed`,整排劍不會同步閃)。14 張僅 317KB。

**驗證(headless Chromium 實跑)**:主角 26 張全載入、待機/受擊/施放/隕落四組皆正確播放且腳底穩定;`beginDeath` → 動畫播完自動進結算(`running=false`、gameover 顯示)。墨劍 14 張全載入,朝右/下/左/上/斜五個方向出劍,劍尖皆正確指向飛行方向。無 console / page error。
**還原依據**:git checkout。手動還原見各段落所述的新增函式與狀態(`HEROSPR.foot`/`G.deathT`/`beginDeath`、`SWDSPR`/`drawSwordSprite`/`s.seed`、`.op-scroll` 的 transform 與 `HOLD`)。

## [2026-08-07] #26 主角 sprite 入庫(待機 9 / 受擊 4 / 施放 6)+ 動畫接線
**檔案**:`assets/hero/HERO_{idle_01..09,hurt_01..04,cast_01..06}.png`(新)、`inkblade.html`

**素材處理**(沿用 `tools/ink_to_alpha.py` 的白底黑墨 → 真透明工作流)
1. 去右下角浮水印 → 亮度轉 alpha(白→透明、黑→不透明,煙霧與飄帶自然成半透明)→ 裁切。
2. **19 幀共用同一張畫布(604×394)並統一對位**:以「濃墨主體(alpha>150)」求出每幀的水平中心與腳底,主體高度統一縮到 340px,再以「中心 x 對齊、腳底 y 對齊」貼上。這是三組動畫互相切換不會跳動的關鍵。
3. 全透明像素的 RGB 統一填墨色 → PNG 體積由 ~3.6MB 降到 2.1MB(外觀不變)。
灰底合成預覽確認:無白邊、飄帶完整、19 幀腳底同高。

**主檔接線**
- 新增 `HEROSPR{idle[9], hurt[4], cast[6], ok, aspect}` 載入器;19 張都載完才 `ok=true`,任一張缺失即回退舊的程序化剪影(`drawHeroProc`,逐列風動版保留未刪)。
- `drawHero()` 改為分流:有 sprite → `drawHeroSprite()`,否則走舊版。
- **待機**:9 幀慢速交叉淡入(相鄰兩幀 cross-fade),每局隨機相位 `G.heroPhase`;起劍時(`G.intent`)略微加速。
- **受擊**:`G.hurtT=20`(4 幀 × 5 影格),於墨獸觸及靈石時觸發。
- **施放**:`G.castT=24`(6 幀 × 4 影格),於 `launchSword` 成功扣魔後觸發。
- 保留呼吸(整體微縮放 + 上下浮動)與依最近墨獸轉身(水平翻轉)。

**驗證(headless Chromium 實跑)**:`HEROSPR.ok=true`、19 張全載入、aspect 1.533;逐格截圖確認待機晨變、受擊 4 幀、施放 6 幀皆正確播放且腳底穩定不飄;`launchSword` 後 `G.castT=24`。無 console / page error。
**還原依據**:移除 `HEROSPR` 載入器與 `drawHeroSprite`,`drawHero` 改回直接呼叫 `drawHeroProc` 的內容,移除 `G.hurtT/castT/heroPhase` 三處狀態與觸發點。或 git checkout。

## [2026-08-07] #25 開場過場 v2(鏡頭推近畫軸 → 上下拉開 → 邊緣淡出)+ 生成點/射程修正
**檔案**:`inkblade.html`

### A. 開場過場重做(依驗收 4 點)
**問題(#19–#21 留下的)**:zoom 進場的捲桿框(`assets/ui/scroll-*-roller.png`,偏白)與桌面畫軸(暖深木)顏色不符,且需要手動對位 `--ox/--oy/--zoom`。

**新做法 —— 不再有第二套素材,全部取自同一張 `home-desk-bg.png`,顏色天生一致、也不需要手動對位:**
1. **鏡頭推近**:整個 `#splash`(桌面圖 + LOGO + 標語 + 按鈕)以「桌上畫軸中心」為 `transform-origin` 一起 `scale`。LOGO / 按鈕被推出畫面外,同時在推近後半段(z 0.42→0.88)淡出(`--uiFade`),鏡頭到底時畫面上只剩畫軸。
2. **畫軸接手**:`#opening` 兩層 `.op-scroll` 用**同一張桌面圖、同樣的 cover 貼圖與同樣的 transform**,只是用 `clip-path` 沿中央繫繩切出畫軸的上半 / 下半 → 與 zoom 後的畫面**像素級對齊**,交接看不出接縫。
3. **上下拉開**:兩半由中心往上下移動,抵達關卡上下邊緣(留一道捲桿厚度 ≈ 46px)後淡出;同時 `#paper/#game` 由模糊轉清晰、HUD 最後淡入。
4. **移除常駐捲桿框** `#scrollframe`:過場結束捲軸就淡掉,遊戲中不再有邊框 —— 顏色不符的問題從根源消失。`assets/ui/scroll-top/bottom-roller.png` 與 `assets/scenes/scroll-rod-*.png` 自此未被引用(留檔備用)。

**幾何量全自動**:新增 `DESK_IMG`(941×1672)與 `SCROLL_UV`(畫軸在圖中的正規化座標,量測值 x 0.100–0.880、y 0.4700–0.5165、繫繩 0.4935),`measureScroll()` 依 `background-size:cover` 的實際貼合換算出畫軸在畫面上的像素矩形,`applyOpeningVars()` 寫入 CSS 變數(`--ox/--oy/--zoom/--sx0/--sx1/--sy0/--sy1/--seam/--tTop/--tBot`)。**不再需要人工調 `--ox/--oy/--zoom`**;換裝置、換長寬比都自動對位。
**唯一手感參數**:`measureScroll()` 內的 `* 2.2`(推近倍率,以「畫軸剛好等於畫面寬」為 1.0 的倍數)。調大 = 鏡頭推更近、捲桿更粗。
**時間軸**:HOLD 260 / ZOOM 1000 / UNFURL 1400 / HUD 520 ms。`prefers-reduced-motion` 與再次遊玩仍直接跳過。
**`start()` 調整**:不再立刻隱藏 `#splash`(否則首頁無法跟著鏡頭推近);改由 `playOpening` 的 `finish()` 收尾隱藏。

### B. 墨獸生成點與射程(驗收回報:怪生在畫面外、自動禦劍朝畫面外出劍)
1. `spawnEnemy()` 生成點由**畫面外 30px** 改為**貼著畫面邊緣內側 8px** —— 入場即可見,不再有「打得到卻看不到」的怪。
2. 新增 `onScreen(en)`;**自動禦劍瞄準、追蹤(引鋒)、角色朝向**三處都只鎖定畫面內的墨獸。
3. 飛劍飛出畫面(邊界外 40px)即消散;有迴劍(`stat.ret`)時本來就會在邊界折返,不受影響。

**驗證(headless Chromium 420×820 實跑)**
- 過場跑完:`#splash` 隱藏、`#opening` 隱藏、HUD opacity=1、`G.paused=false`;逐格截圖確認鏡頭推近 → UI 出框 → 畫軸拉開 → 邊緣淡出,顏色全程一致(附 `opening-preview.gif`)。
- 生成點:40 幀內所有墨獸座標**皆在畫布範圍內**。
- 自動禦劍開啟跑 600 幀:**沒有任何一幀**出現超出畫面 60px 的飛劍(修正前會直接朝畫面外出劍);斬殺正常。
- 無 console / page error。

**還原依據**:`git checkout` 前一版 `inkblade.html`。手動還原需:恢復 `#scrollframe` 與 `.scroll-art` CSS/HTML 及 `start()` 內的 `display='block'`、把 `.op-scroll` 換回 `.op-desk` 兩半桌面、`playOpening` 改回 `--z/--uf` 手調版本、`start()` 恢復 `splash.style.display='none'`;並把 `spawnEnemy` 邊距改回 −30、移除 `onScreen` 三處過濾與飛劍出界消散。

## [2026-08-07] #24 抽劍畫線耗魔常數收進 config
**檔案**:`data/game-config.js`、`inkblade.html`
**背景**:出劍耗魔是最後兩個還寫死在主檔的手感常數(`stat.costBase=6`、`stat.costPerPx=0.13`),調手感得改遊戲層。

**變更**
1. `BASE_RUN_STATE.stats` 新增 `manaCostBase: 6`、`manaCostPerPixel: 0.13`(數值與原本相同,行為不變)。
2. `OP_SCHEMA` 的 `add` / `mul` 允許作用於這兩條路徑 —— 之後要加「節墨」類劍意或「省墨」問道,寫一行 `op('mul','stats.manaCostPerPixel',0.85)` 即可,不必動引擎。
3. `clampAllStats` 加上界:`manaCostBase` 0~60、`manaCostPerPixel` 0.01~1(避免疊到 0 或負數變成無限畫線)。
4. `getCombatSnapshot().mana` 一併輸出 `costBase` / `costPerPixel` / `maxStrokeLength`(= 滿靈力可畫長度,供 UI 或教學提示直接讀)。
5. 主檔 `syncStat()` 改為 `stat.costBase = s.manaCostBase; stat.costPerPx = s.manaCostPerPixel;`(原本寫死 6 / 0.13)。`stat` 字面值的 6 / 0.13 保留為開局前的 fallback。

**驗證(headless Chromium 實跑)**:開局 `costBase/costPerPx` = 6 / 0.13 與 config 一致;`maxStrokeLength` 723 與 `allowedLen()` 相符;畫 200px 實扣 32 靈力(6+200×0.13);把 `runState.stats.manaCostPerPixel` 乘 0.5 後 `syncStat()`,同一條線改扣 19(6+200×0.065)、可畫長度同步變長。眡 console / page error。
**還原依據**:移除 config 這兩個 stats 欄位與其 OP_SCHEMA/clamp/snapshot 條目,主檔 `syncStat` 改回 `stat.costBase=6; stat.costPerPx=0.13;`。或 git checkout。

## [2026-08-07] #23 Runtime 遷移 · Slice 3(轉世閣改走 runtime + 洗點「重塑劍意」)
**檔案**:`inkblade.html`

**A. 轉世閣全面改走 runtime**
原本用 legacy 的 `metaUp`(築基)/`metaUnlock`(其餘)兩張扁平表,**完全忽略節點的 `requires`** —— 玩家可以在沒有「劍骨凝成 3 階」的情況下直接買「破墨心訣」,而且 maxRank>1 的心法被當成布林。
現改為:
- `renderMeta()` 走 `runtime.getRebirthView(buildPermanentSave())`,依 `branch` 分三區顯示(築基 / 心法 / 傳承;HTML 新增 `#metainherit` 與三個 `#mheadN`)。
- 購買走 `runtime.purchaseRebirth()`,前置未達顯示「未達」並列出中文前置條件(`reqText`),魂魄不足由 runtime 判定 disable。
- 新增 `storePermanentSave(p)`:把 purchase 回傳的 permanent state 寫回 `meta`(souls/up/unlock)。
- `metaBonusText()` / `nextGoal()` 改由 rebirth view 產生(nextGoal 只挑「前置已達成」的最便宜節點)。
- `buildPermanentSave()` 外包一層 `migratePermanentSave`。

**存檔遷移(`migrateMetaToRuntime`,於 `loadMeta` 尾端執行)**
舊存檔把心法/傳承存成 `meta.unlock[id]=true`;現改為所有節點階數一律記在 `meta.up`,`meta.unlock` 只保存 runtime 的 `permanentUnlocks`(由已購節點的 `unlock` 效果推導)。實測舊檔 `{unlock:{mind_clear_strike,inherit_guide}}` → `up:{mind_clear_strike:1,inherit_guide:1}`、`unlock:{inherit_guide:true}`,開局 flags 正確生效。

**B. 洗點 UI:重塑劍意(暫停畫面)**
- HTML/CSS 新增 `#respec` 區塊(暫停面板內)。
- `respecInfo()` 聚合狀態,`renderRespec()` 繪製,`doRespec()` 執行(**二次確認**:第一次按進入紅色「確認重塑」,第二次才生效)。
- 規則:
  1. **戰鬥中禁止** —— 面板只存在於暫停畫面;選卡中 `togglePause` 本來就不開。
  2. **每波次至多一次**(`G.respecWave`),避免戰鬥中反覆洗點刷數值。
  3. **費用** = `runtime.calcResetCost(本局已重塑次數)` → 0 / 30 / 80 / 150 / 250(封頂),即**首次免費**。
  4. **洗墨丹**優先抵免(`meta.inkPills`),沒有丹才扣魂魄;魂魄不足則 disable。
- 執行:`resetInsightTimes+1` → `runtime.resetAllInsights(runState)`(由永久快照重建,精準歸零)→ `syncStat()` → 清空場上墨獸的 `en.st` → 浮字/音效/HUD 更新。
- 商城新增「洗墨丹 ×1 · 靈石 40」(可重複購買),轉世閣與商城標頭顯示存量。

**C. 清掉 Slice 1/3 之後的死碼**
`META_UP`/`META_UNLOCK`/`AFFIXES` 常數、`applyAffix()`、`affixWeight()` 已無任何呼叫點(升級選卡自 Slice 1 起走 `rollInsights`/`applyInsight`,轉世閣自本次起走 runtime),一併移除並留註解說明去向。

**驗證(headless Chromium 實跑主檔,含真實 DOM 點擊)**
- 轉世閣:分區 5/4/6;7 個前置未達節點正確顯示「未達」且 `purchaseRebirth` 回 `requirements`;補足「劍骨凝成 3 階」(30+65+125)後「破墨心訣」可買(210),共扣 430 魂魄;開局 `damage=33`、`splashOnKill/firstStrikeCrit` 皆生效。
- 洗點:升級選一張(`form_scatter`)→ 暫停 → 面板顯示「已重塑 0 次 · 現有劍意 1 項 · 免費」→ 第一次點按轉為「確認重塑(再按一次)」→ 第二次執行,劍意歸零、傷害由 51 回到 33、`statuses` 清空、`times=1`;同波再按被擋(「本波已重塑 · 下一波再凝神」),換波後解除;第二次洗點以洗墨丹抵免(魂魄不變、丹 1→0),第三次扣 80 魂魄。
- 商城洗墨丹購買正常(靈石 500→460,丹 0→1)。全程無 console / page error。

**還原依據**:`git checkout` 前一版 `inkblade.html`。手動還原則需:移除 `#respec` 區塊與其 CSS、`respecInfo/renderRespec/doRespec/respecArmed/G.respecWave`、`storePermanentSave/migrateMetaToRuntime/rebirthView/reqText/rebirthRow/BRANCH_HEAD`,把 `renderMeta/metaBonusText/nextGoal` 改回讀 `META_UP/META_UNLOCK`,並復原 `applyAffix/affixWeight/AFFIXES` 與 `#metaunlock` 的兩區版面。

## [2026-08-07] #22 Runtime 遷移 · Slice 2(劍意狀態 + 心法 flags 實際接線)
**檔案**:`inkblade.html`、`data/game-config.js`

**A. config 修一個會丟例外的 bug(`data/game-config.js`)**
`resolveValue` 原本「字串含 `.` 就當成 state 路徑」,於是 `op('unlock','runUnlocks','returnDamageMultiplier:1.65')` 的值被解析成 `undefined` 推進 `runUnlocks`;之後 `getCombatSnapshot` 對它 `.split(':')` **直接丟 TypeError**(取「歸藏無痕」後開戰即崩)。改為只有符合 `/^(stats|mechanics|flags)\./` 才視為路徑參照(現行唯一用到的是 `op('max','stats.mana','stats.manaMax')`)。修正後 `truth_return_hidden` 的 `damageMultiplier` 正確回報 1.65。
**還原依據**:把 `resolveValue` 改回 `value.includes('.')` 判斷(會重現上述崩潰)。

**B. 主檔 `syncStat()` 併入戰鬥快照**
新增 `stat.statuses / statusScale / firstStrike / criticalEcho / whiteCut / splashOnKill / returnDry / returnDmgMul`,值全部取自 `runtime.getCombatSnapshot(runState)`,不再各處自行解讀 flags。

**C. 劍意狀態(蝕 / 鎮)真正生效**
- 新增 `applyIntent(en)`:命中時把 `runState.statuses` 掛到墨獸 `en.st[key]={stk,t,acc}`;每次命中疊「該劍意階數」層(封頂 `maxStacks`)並刷新持續時間(乘 `mechanics.statusDuration`)。
- 敵人更新迴圈新增狀態 tick:`damagePerSecond × 層數 / 60` 累積扣血(整數化,避免浮點碎傷)、`slow × 層數` 取最大值套用於移速(封頂 70%)、到期清零;`stat.statuses` 缺該項(洗點卸下劍意)時場上狀態一併失效。
- 敵人 `spawnEnemy` 加 `st:{}`;狀態環繪製加「蝕=旋轉斷續枯墨環」「鎮=內縮留白細環」。
- 舊 `ember/chill`(業火/寒霜)保留但休眠(`stat.ember/ice` 恆為 0),供還原。

**D. 心法 / 真意 flags 接線**
| flag | 來源 | 玩法效果 |
|---|---|---|
| `firstStrikeCrit` | 明心一斬 | 每局第一次打中必暴(`G.firstStrikeDone`,`start()` 重置) |
| `whiteCutOnCrit` | 斷意 / 飛白千峰 | 暴擊處刮出白痕:新增 `whiteCut()` + `G.cuts` + 繪製層 |
| `criticalEcho`(runUnlocks) | 飛白千峰 | 暴擊後生一道半傷殘鋒(`echo:true`,不遞迴、拖尾較細) |
| `splashOnKill` | 破墨心訣 / 墨海無涯 | 潰散時潑墨,半徑 `54+splashRadius×0.35`、傷害 `damage×0.28×splashDamage` |
| `returnLeavesDryBrush` | 歸念 / 歸藏無痕 | 折返後劍痕轉淡飛白色(`s.returned`) |
| `returnDamageMultiplier` | 歸藏無痕 | 回程傷害 ×1.65(`s.returned` 時套用) |

**E. 折返改為「回程可重新命中」**
原本 `hitSet` 終生不清,折返回程對打過的墨獸完全無效。改為每次撞牆折返清一次 `hitSet` 並補回 `pierceLeft`,**次數上限 = `mechanics.returnHits`**(不會無限刷)。

**F. 順手修既有漏洞**
波及傷害(裂空/潑墨)把血打到 0 的墨獸原本不會死、要再被打一次才消;敵人迴圈開頭統一收屍 `if(en.hp<=0){killEnemy(i);continue;}`。

**驗證(node + headless Chromium 實跑主檔)**
- config:`statuses` 累階正確;三真意快照 `splashOnKill/criticalEcho/whiteCut/returnBlade` 皆如預期;`resetAllInsights` 後 `statuses` 清空。
- 實跑:旗標全開後開局 → 首劍必暴生效(`firstStrikeDone`)、`G.cuts` 出現留白、蝕 2 層 3 秒扣 27、鎮 2.6 秒到期、潑墨波及鄰近墨獸掉血、折返 `retCount` 精準停在 2 且回程確實再命中(共 3 次)。無 console / page error。
**未接**:洗點 UI(費用/免費次數/戰鬥禁止/洗墨丹)、轉世閣改走 `purchaseRebirth`/`getRebirthView` — 下一輪。
**還原依據**:移除 `applyIntent`/`whiteCut`/`G.cuts`、`syncStat` 的 Slice 2 區塊、敵人迴圈狀態 tick 與收屍行、命中處四段 flag 分支、`killEnemy` 的 splashOnKill 區塊、折返 `bounce()`、`spawnEnemy` 的 `st:{}`、狀態環新增分支。或 git checkout。

## [2026-08-07] #21 LOGO 重切(去殘框)+ 開場改兩段式(zoom→拉開)
**檔案**:`assets/ui/logo.png`(+cn/en)、`inkblade.html`
1. **LOGO 沒拆好修正**:原亮度鍵殘留中階木頭 → 首頁 logo 後有深色方塊。改為亮度 smoothstep(120→185)+ 把「暖色木頭(R-B>22 且暗)」判為背景去除,消除殘框;紅印章一併去除。木色底檢查無殘留。
2. **開場改兩段式**:依指示「先 camera zoom 到畫軸=打開後寬度 → 再拉開」。拆成 `--z`(zoom 段,畫軸放大)與 `--uf`(拉開段,虹膜開展+捲桿到邊緣)兩變數,playOpening 依 HOLD300/ZOOM900/UNFURL1300/HUDF500 分段。
**待調(瀏覽器)**:`--ox/--oy`(畫軸中心)、`--zoom`(現1.7,調到「畫軸剛好=打開後寬度」)。
**待你決定**:框捲桿(assets/ui/*-roller,偏白)與桌面畫軸(暖深)顏色不一致——換成同色版或把框調暖。
## [2026-08-07] #20 畫軸改「保留原色」切法(對齊桌面顏色)
**檔案**:`assets/scenes/scroll-closed.png`、`scroll-rod-top/bottom.png`
**問題**:先前用亮度鍵把深木軸頭去掉、只剩奶白紙面,顏色偏白,與桌上畫軸(暖色深木軸)不符。
**修正**:改用膠囊形遮罩從桌面圖直接裁,**保留原始 RGB**(深木軸+黑軸頭+舊宣紙+繫繩),與桌面畫軸同色(同一張圖切下)。上/下捲桿同步更新。
**待你決定**:是否把 #scrollframe 遊戲框(現用 assets/ui/scroll-*-roller.png)換成這組同色畫軸,或反過來把框的顏色調成暖色以求開場無縫。
## [2026-08-07] #19 首頁/過場修正:點按潑墨、捲桿入局前隱藏、開場改中心 zoom
**檔案**:`inkblade.html`
1. **點按潑墨**:任何 .btn 按下時於指標處炸開墨團(中央墨塊+飛濺墨滴+淡光圈),CSS 動畫 ~0.5s,獨立最上層,不影響按鈕動作。
2. **捲桿入局前隱藏**:`#scrollframe` 預設 display:none,`start()` 才顯示(首頁不再看到上下捲桿)。
3. **開場改「中心 zoom in + 虹膜開展」**:改用兩張同底桌面各 clip 上/下半、以畫軸中心(--ox/--oy)一起 zoom(--zoom)放大、中央 inset 開展,取代原本兩半平移;捲桿(#scrollframe)仍由 --open 同步展開。
**可調變數(需在瀏覽器對準畫軸)**:`--ox/--oy`(縮放原點=桌面畫軸中心)、`--zoom`(放大倍率,現1.5)、`playOpening` 的 UNFURL 時長。
**限制**:兩段畫軸「大小寬高完全一致」的像素級對位需你在瀏覽器實測微調上述變數(必要時 #scrollframe 捲桿圖寬度也要配合桌面畫軸寬度);我無法在此看到 render。
## [2026-08-07] #18 首頁重排(LOGO 圖 + 標語 + 直排三鈕)
**檔案**:`inkblade.html`
**變更**:#splash 依 mockup 重排——`assets/ui/logo.png`(已去印章)置頂、標語改為「一筆成劍 一墨斬妖」(移除原玩法說明與落款)、中間留白讓桌面畫卷透出、入局/轉世閣/商城改為直排(.btncol)。按鈕沿用現有 id/樣式,未拆素材。justify-content 改 flex-start 配合置頂排版。
**驗證**:語法通過;合成預覽符合 mockup 版面。
## [2026-08-07] #17 LOGO 去背拆出(去紅印章)
**檔案**:`assets/ui/logo.png`、`logo-cn.png`、`logo-en.png`(新)
**內容**:由木紋底 LOGO 圖用亮度轉 alpha 拆出「墨劍訣 / INKBLADE」透明字;以紅色偵測移除右側紅印章;裁切並拆成完整/中文/英文三版。灰底驗證乾淨、無木底、無印章。
**用途**:首頁標題可改用 logo.png 圖片替代現有文字(待接)。
## [2026-08-07] #16 開場畫卷過場 + 墨刃兵攻擊/消散幀入庫
**檔案**:`inkblade.html`、`assets/enemies/ENE_BLADE_attack_01/02.png`、`ENE_BLADE_death_01/02.png`
**A. 開場過場(依 docs/opening-scroll.md)**
- 以 CSS 變數 `--open`(0→1)驅動:`#opening` 桌面兩半(home-desk-bg)由中央滑開;重用現有 `#scrollframe` 捲桿(加 transform,由中央回到上下邊緣);`#wrap.op #paper/#game` 模糊隨展開轉清晰;HUD 最後淡入。
- `playOpening(done)`:rAF 動畫(HOLD450+UNFURL1500+HUDF500),完成才 `done()`。`start()` 改為過場期間 `G.paused=true`,過場結束才解除、開始生怪/計時。
- 支援 `prefers-reduced-motion` 與再次遊玩(openingSeen)→ 直接跳過淡入。
- 常態 `--open:1`(捲桿在邊緣,identity transform),不影響一般遊玩。
**B. 墨刃兵攻擊/消散幀**:使用者提供 4 張白底黑墨,ink_to_alpha 轉透明+去浮水印+壓 512;依底部煙霧量自動分類:煙少→attack_01/02、煙多→death_01/02。入庫供後續攻擊/死亡動畫(尚未接動畫循環)。
**驗證**:主檔語法通過。動畫需在瀏覽器實測。
**注意**:主檔多機同步,本次於此端編輯;換機前先 push。
## [2026-08-07] #15 從書案圖切出開場捲桿素材
**檔案**:`assets/scenes/scroll-closed.png`、`scroll-rod-top.png`、`scroll-rod-bottom.png`(新)
**內容**:由 home-desk-bg 裁出中央閉合畫卷(582×102),拆成上/下捲桿(各 582×51),對應 docs/opening-scroll.md 的上/下捲桿素材。
**更新(去背)**:已用亮度鍵抽出乾淨的奶白紙捲圓柱(木頭/銅軸去除),上/下捲桿邊緣透明,可直接在遊戲底圖上滑動做展開,不帶深木邊。中央保留一點繫繩缺口(自然)。
## [2026-08-07] #14 首頁背景:書案圖
**檔案**:`inkblade.html`、`assets/scenes/home-desk-bg.png`(新)
**變更**:`#splash` 首頁改用書案背景圖(cover、置中)+ 極淡暗罩(保標題/按鈕對比);覆寫原共用暗底,不影響 #gameover。此圖亦為開場畫卷(docs/opening-scroll.md)第一階段「桌面出現」的素材。
## [2026-08-07] #13 記錄開場畫卷展開規劃(未實作)
**檔案**:`docs/opening-scroll.md`(新)
**內容**:記錄點「入局」後約 3 秒的畫卷展開過場做法——四階段(桌面→展開→世界浮現→進入)、技術結構、動畫重點(translateY 捲桿、clip-path 揭露、Canvas 一開始就在只是暫停被遮罩、prefers-reduced-motion、再玩可略過),以及與 start()/#paper/G.paused 的接點。狀態:規劃待實作。
## [2026-08-07] #12 墨刃兵素材入庫(9 張)+ 人形隨機變體
**檔案**:`inkblade.html`、`assets/enemies/ENE_BLADE_walk_01..09.png`
**變更**:
1. 使用者提供 9 張白底黑墨持刀武者,經 ink_to_alpha 轉真透明、去浮水印、裁切、壓 512px 高,入庫為 ENE_BLADE_walk_01..09;idle_01 = walk_01。
2. 載入器 blade 改吃 9 張陣列。
3. 繪製:依類型分流——墨靈(inkling)慢速晨變;人形(blade 等)每隻固定隨機一張靜態變體(不晨變,避免人形變形怪異)。
**驗證**:灰底合成確認透明乾淨、無白框;主檔語法通過。
## [2026-08-07] #11 墨靈動畫層:隨機變體 + 慢速晨變
**檔案**:`inkblade.html`
**變更**:
1. `ENESPR` 由單張改為多幀陣列(inkling=move_01..04;blade/boss 單張 idle)。
2. `spawnEnemy` 敵人加 `anim`(隨機相位)。
3. 敵人繪製:多幀時依 `G.t*0.006+anim` 在相鄰兩幀交叉淡入(慢速晨變),隨機相位造成整群變體;單幀直接畫;無圖回退程序化墨團。
**調參**:晨變速度 = 繪製分支的 `G.t*0.006`。
**備註**:第三種「連續走幀」需同姿態逐格變形的素材,現有四張為不同構圖,故以晨變替代。
**注意**:本次編輯時偵測到主檔已被另一端修改;我的改動已套用於當前磁碟版本。換機器前務必先 push,避免與另一端分歧。
## [2026-08-07] #10 墨靈素材入庫 + 去背工作流修正
**檔案**:`docs/ch1-asset-library.md`、`tools/ink_to_alpha.py`(新)、`assets/enemies/ENE_INKLING_*`
**問題**:AI 出圖的「透明」是假透明(棋盤格/發光背景),半透明煙霧無法用 rembg 乾淨去背。
**修正**:
1. 墨靈提詞改為「純白底、純黑墨、無發光/漸層/網點」+ 負面提詞;去背改為「亮度轉 alpha」(白→透明、黑→不透明),飄帶濃淡自然成半透明、紅眼保留。
2. 新增 `tools/ink_to_alpha.py`(白底黑墨→真透明)。
3. 使用者提供 4 張白底墨靈,已轉真透明、去浮水印、裁切置中、壓至 512px 高,入庫為 `ENE_INKLING_move_01..04.png`;`float_01` = move_01 供 Slice1 載入器即時顯示。灰底預覽確認無白邊、飄帶完整。
**注意**:move_01..04 為不同姿態(可作隨機變體或慢速晨變;非嚴格連續走幀)。動畫循環為後續工作(載入器目前顯示單張)。
## [2026-08-07] #9 主檔 runtime 遷移 · Slice 1(修好升級/陣型阻塞點)
**檔案**:`inkblade.html`
**策略**:不逐一改 stat.*,改用橋接——遊戲照舊讀 `stat.*`,build 變動後由 `syncStat()` 從 `runState` 映射。
**變更**:
1. 新增 `runState`、`buildPermanentSave()`(meta.souls/up/unlock → {insight,ranks,permanentUnlocks})、`syncStat()`(runState.stats/mechanics/formation → stat.*)。
2. `start()`:改以 `INK_CONFIG.runtime.createRunState(buildPermanentSave(),1)` 建局 + `syncStat()`,取代手動 stat 重置與 META_UP 迴圈。
3. 升級選卡 `drawCards()`:改用 `runtime.rollInsights(runState,3)` 抽池;卡片顯示用 insight 的 rune/name/rarity/description;選取→`applyInsight(runState,id)`+`syncStat()`。真意/劍式互斥、稀有度權重、解鎖/聽墨全交給 runtime。
4. 命中計算:移除遊戲端寫死的追蹤 −25%(已由 config 的 mul 併入 damage,避免雙重);暴擊倍率改讀 `critMul`;可否暴擊看 `homingCanCrit`。
**驗證**:node 模擬 createRunState→syncStat→applyInsight(貫鋒/萬劍/養鋒/凝神)→數值正確;真意只套一次;rollInsights 互斥正常;主檔語法通過。
**基準值變動提醒**:數值基準現由 `config.baseRunState` 決定,與舊手調值不同(劍寬 18 vs 9、劍速 14 vs 11、manaRegen 0.85 vs 0.34、劍匣上限 4 vs 6)。手感要調請改 `baseRunState`。
**Slice 2 待辦(尚未接)**:
- 劍意狀態:`intent_erosion`(蝕)/`intent_suppress`(鎮)只寫進 runState.statuses,敵人 DoT/緩速尚未讀取套用(舊 ember/chill 已休眠)。
- 心法 flags:`firstStrikeCrit`/`listenToInk`(rollInsights 內已支援)/`splashOnKill`/`whiteCutOnCrit` 的實際玩法效果。
- 洗點 UI:`resetAllInsights`+費用/免費次數/戰鬥禁止/洗墨丹(遊戲層)。
- 轉世閣購買改走 `purchaseRebirth`/`getRebirthView`(目前仍走舊 meta 路徑,可運作但未用 runtime 驗證)。
- 抽劍畫線耗魔仍用遊戲常數 costBase/costPerPx(config 未涵蓋)。
- 可選:改用 `getCombatSnapshot` 統一戰鬥數值讀取。
**還原依據**:移除橋接三函式與 start/drawCards/命中三處改動,還原為 legacy applyAffix 流程。或 git checkout。

## [2026-08-07] #8 敵人/Boss sprite 載入器(純附加,無圖等同現狀)
**檔案**:`inkblade.html`、`assets/enemies/`、`assets/boss/`(新資料夾+README)
**目的**:step 3——先接好素材載入,之後丟真透明 PNG 即自動生效。
**變更**:
1. 新增 `ENESPR` 載入器(近 ART):載入 `assets/enemies/ENE_INKLING_float_01.png`、`ENE_BLADE_idle_01.png`、`assets/boss/BOSS_MOSHOU_idle_01.png`;`onerror` 則不啟用。
2. `spawnEnemy` 敵人物件加 `type`(tier0=inkling,tier1/2=blade)。
3. 敵人繪製:`ENESPR[en.type].ok` 為真→依原圖比例 drawImage;否則回退原程序化墨團+眼。狀態環(業火/寒霜)與血條照舊。
**注意**:目前無真透明素材(參考表為假透明),故實際仍顯示程序化墨團,行為與先前一致;不破壞現狀。
**還原依據**:移除 ENESPR 區塊、`type` 欄位,及敵人繪製的 if(spr.ok) 分支(回到單一程序化墨團)。

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
