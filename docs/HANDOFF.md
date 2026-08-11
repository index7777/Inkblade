# 交接文件 HANDOFF(給下一段對話無縫接手)

> **AUTHORITATIVE HANDOFF — 2026-08-11**
> 本節是目前唯一有效的接手基準。下方 2026-08-10 舊交接僅供歷史參考，裡面的單檔行號、待辦順序與「卡片 UI 不要動」均已過時。

## Current objective

繼續 Stage 2b 模組拆分。既定五個 subsystem 中，`enemy.js`、`combat.js`、`render.js`、`ui.js` 已完成；下一步只剩 `boot.js`：啟動流程、事件綁定、遊戲迴圈初始化。不要擴大 gameplay scope，也不要順手實作新功能。

## Completed module boundaries

- `src/enemy.js`：普通敵人 AI、移動、接觸傷害、死亡流程、玄冥 Boss 狀態與波次生命週期。
- `src/combat.js`：飛劍、劍令、劍陣、命中、傷害、定鋒／劍樁相關戰鬥流程。
- `src/render.js`：角色、敵人、Boss、飛劍、特效、紙張背景與總繪製入口。
- `src/ui.js`：HUD、選卡、重抽、暫停、設定、音量、轉世閣、重塑確認、角色選擇、商城、劍訣精進列表、面板拖曳捲動。
- `src/main.js`：目前 2097 行，仍是 gameplay orchestration 與待拆 `boot.js` 的 source。
- `src/ui.js`：目前 522 行。UI 透過 `configureUI()` hooks 呼叫存檔、runtime、音效與 gameplay mutation；UI 不複製 production domain logic。

## Important ownership decisions

- 轉世購買的 authoritative mutation 仍由 main hook 呼叫 `runtime.purchaseRebirth()` 並保存 permanent state；`ui.js` 只建立／刷新介面。
- 重塑規則與成本計算仍在 `respecInfo()`；實際清除 insights 的 mutation 仍在 main 的 `doRespec(state)`。二次確認狀態與按鈕呈現在 `ui.js`。
- 商城 catalog 仍在 main；購買 mutation 經 `purchaseShopItem` hook 執行。`ui.js` 只繪製商品與派送選擇。
- `game.js` 是 `src/main.js` 的 esbuild bundle，不是 authoritative source。不要直接修改 `game.js`。

## Next task: boot.js

1. 先用 `graphify query` 找出啟動、DOM event bindings、`requestAnimationFrame`／timer、loop 初始化與 splash/menu lifecycle。
2. 用 Serena 定位 named symbols 與 references；避免整檔讀取 `src/main.js`。
3. 建立 `src/boot.js`，只抽啟動／事件／loop orchestration；不要搬 gameplay state transitions 或改 gameplay behavior。
4. 保持重要入口為可被 Serena 定位的 named symbols，避免新的 anonymous mega-IIFE 或無意義 wrappers。
5. 完成後跑 tests、build、check、`graphify update .`，再做至少 5 個核心 symbol 的 Find Symbol / Find References / Read Symbol Body 驗收。

## Verification baseline

- `npm test`：PASS，15/15。
- `npm run build`：PASS；產生 `game.js`。
- `npm run check`：PASS。
- `graphify update .`：PASS；目前 graph 為 1673 nodes / 2203 edges / 114 communities。
- UI 是 DOM/browser integration；目前沒有自動化瀏覽器測試，不能宣稱 UI interaction 已被 unit tests 覆蓋。拆 `boot.js` 時應維持此項為明示 testability gap，不要造 placeholder tests。

## Tooling requirements

- `graphify-out/graph.json` 存在；codebase 工作先用 `graphify query/path/explain`，修改後執行 `graphify update .`。
- Serena authoritative root 是 `src/`；smoke test 使用 exported/named symbols，不使用 bundled `game.js`。
- tests/build 必須維持 PASS。不要修改 generated `game.js`，只由 build 更新。
- Asset Pipeline runtime 保持 ON_DEMAND；本階段不要安裝 ComfyUI、Pixelorama、dedup 或模型。

## Working tree / sync warning

- 工作樹目前有大量既有 modified/untracked files，都是本專案既有 Bootstrap 與拆分成果；不要 reset、checkout 或清除。
- 本對話沒有建立 commit、沒有 push、也沒有執行 sync。使用者會自行 sync；下一個對話開始時先檢查實際 branch/status，不要假設已上傳。

---

## Archived handoff (2026-08-10, obsolete)

> 最後更新:2026-08-10。前一段對話過長,此文件用於接軌。
> **原則不變**:類別純度(劍陣/劍行/劍痕/劍稟 + 真意);ES-classic 單檔雙擊即跑;
> 改 config 一律 `node --check` + validateConfig;改主檔 `inkblade.html` 一律抽 script 跑 `node --check`。
> 另一台機器在改「卡片樣式」——**卡片 UI 不要動**,避免同檔衝突;切機器前先 push。

---

## 〇、待修問題(使用者回報 2026-08-10)

1. **手機音量控制**(音效已修 #33;音樂**決定不改**):音量條 input 先 `SND.unlock()`,音效(WebAudio)手機可作用。
   - 音樂在 iOS+`file://` 無法控(iOS 忽略 HTMLAudio 音量,且 file:// 不能走 WebAudio)。屬平台限制,與「單檔雙擊即跑」原則衝突。
   - **使用者決定:此項不改(音樂問題都不改)。** 未來勿再自動回頭處理;除非改為 http 提供才有解。

2. **常駐 HUD 蓋怪物 ✅ 已修(#34)**:`PLAY_TOP`/`computePlayTop` 量測頂部 HUD 底邊;非 BOSS 墨獸生成/移動皆擋在其下方。

3. **散鋒動作詭異 ✅ 已修(#34)**:真因為**引鋒被套到散鋒**(homing 掰彎)。引鋒為齊鋒陣專屬 → 續飛轉向與末端延伸都加 `c.formation==='parallel'` 守門。(扇型 `fanPose`/`ox` 碼本身正確,非剛體問題。)

4. **角色立繪大小 ✅ 已修(#34)**:`HERO_BODY_SCALE` 改 `HERO_VISUAL_SCALE*.72`(使用者指定)。

---

## 一、已完成(對照 CHANGELOG)

- **#27** 換陣重算 hook:選卡 pick handler 內,若 `a.category==='form'` → `recomputeForFormation(runState)+syncStat()`。
  → 已投入的劍行「隨劍陣走」:不在對應陣時停用,回到該陣恢復(以 history 重播實作,ranks/境界保留)。
- **#28** 斷痕白痕(易傷)+ 鎮痕 slowBonus:
  - 斷痕:命中走既有通用 `applyIntent` 掛 `whitecut` 狀態;`dmgTo(en,v)` 依層數 `×(1+vuln*stk)` 放大受傷;通用 tick 消退。
  - 鎮痕:`syncStat` 帶出 `stat.slowBonus`;suppression 緩速加計 slowBonus(小成 +0.06)。
- **#29** 滿貫(貫鋒陣圓滿):命中處理(inkblade.html 約 3250 行,`if(C){C.anyHit...}` 之後)以
  per-劍令 per-敵 命中槽位集合偵測;湊齊全 N 把命中同一敵 → 額外傷 `0.5×基礎單劍傷×N`,彈「滿貫」。
  gate:`TF.fullPierce && C.formation==='inline' && C.slots>1`。

三項均 `node --check` 通過。**這些改動都在 `inkblade.html`,尚未確認是否已 push。**

---

## 二、待辦(嚴格照此順序,使用者指定)

### 1) 定鋒 ✅ 已完成(刀A #31 + 刀B #32)——串珠陣(inline)專屬劍行
> 已落地:beadSlow 移速、anchorField 劍樁+墨域+回補穿透、anchorLink 墨鏈(切傷+穿鏈+22%+渲染)、
> anchorDetonate 引爆(到期+手動)。syncStat 已帶 beadSlow/anchorDur/anchorDmgMul。
> **下一個要做:2) 轉世閣前置**。以下定鋒原始規格保留備查。
**設計來源**:`docs/momentum-formation-and-anchor.md`;config 已建 `momentum_anchor`(id)。
**config 已就緒的旗標/機制**(在 OP_SCHEMA 允許清單內,已驗證):
- flags:`anchorField`(tier0 墨域)、`anchorLink`(tier1 墨鏈)、`anchorDetonate`(tier2 引爆)、`beadSlow`(effects)。
- mechanics:`anchorDuration`(+0.25/rank)、`anchorDamageMult`(+0.08/rank)。
- 取捨:串珠鏈內飛劍移速 ×0.92(beadSlow);插地後不再移動、脫離隊列。

**主檔 hook 點(已探勘)**:
- 飛劍耐久耗盡消散在 `inkblade.html` **約 3350 行**:
  `s.pierceLeft-=durCost(...); if(s.pierceLeft<=0){ s.dead=true; swordDissolve(s); break; }`
  → 定鋒核心:當 `s.cmd.formation==='inline'` 且 `stat.tierFlags.anchorField` 為真時,**不消散**,改在 `(s.x,s.y)` 生成「劍樁」進 `G.anchors`。
- beadSlow(串珠移速×0.92)套用點:找 inline 飛劍移動/速度處(`spawnCmdSword` 約 1841、飛劍 update 迴圈約 3160–3200 的位移),乘上 `stat.beadSlow?0.92:1`。需先 `syncStat` 帶出 `stat.beadSlow=!!f.beadSlow`(f=flags)——**syncStat 尚未帶 beadSlow,要補**。

**要做(建議分兩刀,各自驗證)**:
- 刀 A 核心:`G.anchors=[]` 初始化(在 G 物件旁);插樁生成 `{x,y,t:baseDur*(1+mechanics.anchorDuration),r,cmd}`;
  update 迴圈(放在飛劍迴圈後,約 3358 之後)每幀遞減 t、對範圍內敵週期斬割
  `dmg=stat.damage*(1+mechanics.anchorDamageMult)*係數`;draw 一個水墨劍樁;t<=0 移除。beadSlow 接線。
- 刀 B 階級:tier1 `anchorLink` 相鄰劍樁連墨鏈,敵跨線受切傷(參考既有 `G.cuts`/連線切傷寫法約 3410–3420 `L.hit`);
  tier2 `anchorDetonate` 劍樁 t 到期時引爆一次範圍傷(參考 explode 寫法約 3339–3345)。
- 圓滿等其餘 tier 差異依 `momentum-formation-and-anchor.md` 對齊。
- 完成後 `node --check` + CHANGELOG #30。

### 1.5) 劍陣改「開局四選一・鎖定一路」(設計已定案,待實作)
**設計來源**:`docs/formation-draft-redesign.md`(使用者定案 2026-08-11)。
- 現況 bug:`canOfferInsight` 未限制陣型數 → 可同時學多陣、池子髒、跨陣型污染。
- 定案:開局強制四選一、鎖定一路整局不換;只有該陣升級卡進正常池,其餘三陣永不出現;陣等級=該陣 rank。
- 排序:**架構 Stage 2b 收段落後**再做;適合和轉世閣/真意(都動卡池/draft)一起想。
- 紅利:根絕跨陣型污染整類 bug(引鋒/散鋒那類)。

### 2) 轉世閣前置(真意之前先把解鎖框架做好)
**設計來源**:`docs/truths-active-redesign.md`。真意改為「主動大招」,解鎖分兩段:
- 首次某劍陣滿 5 階 → 只是**在轉世閣解鎖該真意的選單項**(不是直接得到)。
- 再於轉世閣**付墨魂**才真正解鎖該真意。**解鎖幾個,當局才會列幾個**。
**前置要做(不動真意施放本體)**:
- REBIRTH/轉世閣資料層:為 4 真意各建「選單項可見(由滿5階觸發)」+「墨魂購買解鎖」節點與存檔欄位
  (permanentSave 內,類似既有 REBIRTH 節點;確認 OP_SCHEMA `unlock`/`truth` 路徑允許)。
- runtime:記錄「哪些劍陣曾滿5階」→ 對應真意選單項 visible;`墨魂` 消費解鎖 flag。
- 轉世閣 UI:顯示可解鎖/已解鎖真意(UI 若與另一台機器的卡片樣式無關可動;有疑慮先只做資料層)。
- `node --check` 兩檔 + CHANGELOG。

### 3) 真意 主動四式(最後,耦合最大)
> **卡片後續(真意做完後再做)**:卡片 UI 已完成(另一台機器)。真意主動四式落地後,需把卡片文字改成正確內容(對齊新的主動真意規格),且文字大小要可閱讀。
> 更新卡片文字時,一併檢查「為什麼有字被掉/被隱藏」(部分文字未顯示的成因)。

**設計來源**:`docs/truths-active-redesign.md`(完整規格)。四式:萬劍歸宗 / 一筆開天 / 歸藏無痕 / 環月歸墟。
- 施放:**按鈕**;劍意 200 / CD 30s / 持續 10s;受加成影響。
- 當局:劍陣滿 5 階時 **N 選 1**(N=已在轉世閣解鎖數);**當局選定不可切換**。
- config:把真意由「被動」改為「主動」結構;**移除舊三式**,新增「環月歸墟」。
- 主檔玩法層:按鈕 UI、劍意資源條、CD、四式各自的螢幕效果與傷害。
- 這步 config+主檔耦合,先 config 結構、驗證,再主檔施放層。

---

## 三、關鍵檔案與位置速查(inkblade.html)

- syncStat:約 **2238**(加狀態/機制映射到 legacy `stat.*` 之處;`stat.slowBonus` 在 2239)。
- 選卡 pick handler:約 **2569**(#27 recompute hook 在此)。
- `dmgTo(en,v)`:約 **2730**(#28 whitecut 易傷在此)。
- 通用狀態 tick / applyIntent:約 **2846–2905**;suppression 緩速計算約 **2864**。
- 飛劍主迴圈 / 命中處理:約 **3160–3357**;命中傷害組裝 3212–3251;滿貫在 **3250**;耐久耗盡消散 **3350**。
- `spawnCmdSword`:**1841**;`formationOffset`:陣型沿劍令路徑的 along/side 偏移。
- explode 範圍傷寫法:**3339–3345**;連線切傷 `L.hit`:**3410–3420**;`G.cuts`。

## 四、config(data/game-config.js)重點

- v2.1.0 IIFE → `window.INK_CONFIG`。INSIGHTS(技能)/REBIRTH(問道)/OP_SCHEMA(效果 DSL,路徑白名單)/runtime。
- runtime:`createRunState / applyInsight / rollInsights / canOfferInsight`(含 `formationLock` gate)/
  `getDynamicRarityWeight / recomputeForFormation`(history 重播)/ `getCombatSnapshot / noteKill`。
- validateConfig:說明 ≤22 字;效果行數上限;op path 不在白名單會丟錯 → 新增行為要先進 OP_SCHEMA。
- 類別:form/momentum/intent/cultivation/truth。稀有度權重 {awakening:60,clarity:28,penetration:10,truth:2}。
- 境界 TIER_KILLS=[300,500,1000](小成/大成/圓滿,靠斬妖數練上去,**不是** rank)。

## 五、規範

- 繁體中文回應;使用者偏好精簡直接。
- 只動本專案(D:\Inkblade),NNE 內非本專案檔案不要碰。
- 每個玩法層切片:讀相關碼 → 改 → 抽 script `node --check` → CHANGELOG 一條 → 需要時 present_files。
- 卡片樣式歸另一台機器;切機器前 push(SYNC.bat,github.com/index7777/Inkblade)。
