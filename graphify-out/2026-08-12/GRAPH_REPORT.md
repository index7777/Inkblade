# Graph Report - Inkblade  (2026-08-12)

## Corpus Check
- 103 files · ~11,103,128 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3084 nodes · 5120 edges · 145 communities (131 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6804b50f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ASSET_RECIPE_SCHEMA.md
- 墨劍訣 · 變更記錄(Ink Engine 整合)
- CODEX_PROJECT_BOOTSTRAP.md
- ASSET_MANIFEST.md
- ASSET_GENERATION_PIPELINE.md
- main.js
- Repository subsystem map
- data/game-config.js
- 墨劍訣 · Inkblade
- sound-system.js
- 墨劍訣 · 劍令(SwordCommand)規格
- 墨劍訣 · 場景素材提詞
- art/README.md
- render.js
- combat.js
- 劍稟
- cfg_v46.js
- enemy.js
- 墨劍訣 · 戰鬥 v2 設計(站樁畫劍 × 彈幕抵銷 × 精英/BOSS × 60 波關卡)
- 劍稟 CULTIVATION(原修持)
- asset_manifest.schema.json
- viewport.js
- 三、分階段遷移(每階段可跑・可回滾・可驗收)
- 墨劍訣 · 第一章 資產庫(敵人)
- CODEX_TOKEN_EFFICIENCY.md
- 《墨劍訣》音效來源與授權
- Scene assets
- 四、分期路線(每期都可獨立驗收、可玩)
- pivot
- 墨劍訣 HUD 設計與落地規劃
- Three Kingdoms Online (legacy, not applicable here)
- enum
- 墨劍訣 · Ink Engine — 技術方向與開發計畫
- ui.js
- Capability Registry
- properties
- $defs
- 墨劍訣 · HANDOFF（交接說明）
- cfg_v47.js
- cfg_v48.js
- properties
- package.json
- assetType
- v88/data/game-config.js
- properties
- 墨劍訣 · 類別純化(劍陣不夾帶他類)分析與重設計
- 交接文件 HANDOFF(給下一段對話無縫接手)
- 墨劍訣 · Ink Engine v1 規格審查
- 墨劍訣 · 能力分類與階級(由 config 生成)
- 墨劍訣 · 真意改為主動大招(重設計規格)
- 墨劍訣 · Inkblade
- required
- sourceFiles
- 第一章 Boss 母版：玄冥墨蛟
- 墨劍訣 · 開場畫卷展開(Opening Scroll)規劃
- 墨劍訣 · 待確認設計筆記
- cfg_v22.js
- 墨劍訣 · Inkblade — 背景音樂提詞
- enum
- 劍陣改為「開局四選一・鎖定一路」設計規格
- 墨劍訣 · 劍行綁定劍陣 + 機制定義 + 定鋒(新)
- 墨劍訣 · 技能文案規範
- cfg_v32.js
- 44. Example Faction Vertical Slice Manifest Minimum
- enum
- [2026-08-09] #83 全卡稽核:25 項問題一次修完
- 架構遷移 · 進度與續作(SEAMLESS HANDOFF)
- enum
- 墨劍訣 · 美術規範(Art Spec)
- 第一關 Boss：玄冥墨蛟（畫卷大型 Boss 重構）
- 開發說明 DEV(建置流程)
- 墨劍訣 · 劍行/劍痕/劍稟 類別純化審查
- 4. Tool Responsibilities
- cfg_v33.js
- 86. Slice Asset Priority
- cfg_v34.js
- [2026-08-08] #34 劍意成本改為「劍大劍多就貴」、新增小劍流派、修好劍式不疊加、震動強度可調
- [2026-08-08] #59 折返改「邊緣折返」;劍令改預付制(死劍不補);取消飛行壽命
- 墨劍訣 · 抽卡權重與卡片呈現(設計方向)
- 墨劍訣 · 洗點(洗墨重置)規劃
- [2026-08-08] #37 靜觀新增三項:畫質 / 幀數 / 劍訣註解;順帶修好 120Hz 兩倍速
- [2026-08-08] #46 平衡:神識/劍意隨道行成長、xp 曲線降斜率、maxRank 全壓到 5
- [2026-08-08] #49 續飛加回、自動御劍射程修正、首頁 logo 換 V2
- [2026-08-08] #53 折返改為「穿過去再掉頭」;連珠修好重疊並加大轉向距離
- [2026-08-09] #72 音效改走 WebAudio(每次出劍/受擊都會卡的真正共通點)
- #88 折返收窄到單式/聚鋒;分裂整個移除;齊鋒撲空自行追跡
- [2026-08-07] #27 主角 26 幀重製 + 隕落動畫、墨劍 14 幀、開場疊合/停頓修正
- [2026-08-07] #29 女修士改為程序化演出(拆劍/風動/墨痕旋渦)、HUD 依參考稿重做、鎖右鍵
- [2026-08-08] #45 鎮痕與蝕痕的視覺語言重做;商城返回鈕修正
- [2026-08-08] #47 悟道階數加權;**更正 #46 的錯誤推演**
- [2026-08-08] #68 修好近身傷害空區(連珠最明顯)+ 拔掉死欄位 swordLife
- [2026-08-09] #75 耐久取消上限;新增護甲(降低耐久消耗),道行成長改為劍意/劍傷/護甲
- [2026-08-09] #79 九張技能配合耐久/分裂制重做;劍寬新增護甲與速度的第二層意義
- [2026-08-09] #81 卡片與階級表都改寫實際效果;**查出 22 個空的階級層**
- [2026-08-09] #82 把 #81 查出的空階級層全部接線(21 個旗標)
- 2. Manifest vs Recipe
- packageId
- version
- cfg_v36.js
- [2026-08-07] #25 開場過場 v2(鏡頭推近畫軸 → 上下拉開 → 邊緣淡出)+ 生成點/射程修正
- [2026-08-08] #35 小成/大成/圓滿框架上線;御劍啟用改為環繞墨線
- [2026-08-08] #41 15 層 pending 全部實作;效果註解的版面驗證(卡片不再被裁字)
- [2026-08-08] #48 修好飛白千峰的殘鋒 crash;實跑推演出真實存活深度
- [2026-08-08] #70 HUD 左右兩組切齊同一條下緣;斬殺不再留墨漬
- [2026-08-09] #71 手機卡幀:低血量時劍環每幀重新上色(15.6 倍代價)
- [2026-08-09] #74 劍改為耐久制;穿透改成分裂數;折返不再補耐久
- [2026-08-09] #76 分裂劍的可讀性:按威力縮小 + 同幀傷害合併
- [2026-08-09] #84 移除滑過去的音效;效果文字把「幾成傷」改成看得懂的基準
- cfg_v37.js
- vercel.json
- outputProfileId
- cfg_v38.js
- review
- cfg_v39.js
- cfg_v40.js
- sourceRecipeId
- CODEX_PROJECT_BOOTSTRAP.md
- [2026-08-09] #80 納息文案講清楚它會加耐久;**更正 #79 的平衡表**
- [2026-08-09] #86 散鋒改為「每把劍各走一份旋轉過的劍令」;長劍令加側向上限
- cfg_v41.js
- cfg_v42.js
- cfg_v43.js
- cfg_v44.js
- cfg_v45.js
- cfg_v11.js
- cfg_v15.js
- cfg_v19.js
- cfg_v20.js
- snd_v8.js
- snd_v9.js
- v88/data/sound-system.js
- cfg_v10.js
- cfg_v8.js
- snd_v6.js
- snd_v7.js
- snd_v5.js
- properties
- runtime
- VISUAL-SMOKE-TEST.md
- UI-BASELINE.md
- 全卡片功能與相容／互斥矩陣
- replacementAssetId
- runtimeResource

## God Nodes (most connected - your core abstractions)
1. `墨劍訣 · 變更記錄(Ink Engine 整合)` - 112 edges
2. `update()` - 28 edges
3. `play()` - 21 edges
4. `play()` - 21 edges
5. `play()` - 21 edges
6. `play()` - 21 edges
7. `play()` - 20 edges
8. `play()` - 20 edges
9. `play()` - 20 edges
10. `updateHUD()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `start()` --indirect_call--> `computePlayTop()`  [INFERRED]
  src/main.js → src/viewport.js
- `move()` --calls--> `leadInLen()`  [EXTRACTED]
  src/main.js → src/combat.js
- `draw()` --calls--> `leadInLen()`  [EXTRACTED]
  src/render.js → src/combat.js
- `drawStrokeCost()` --calls--> `cmdLife()`  [EXTRACTED]
  src/render.js → src/combat.js
- `update()` --calls--> `nearestEnemy()`  [EXTRACTED]
  src/main.js → src/combat.js

## Import Cycles
- None detected.

## Communities (145 total, 14 thin omitted)

### Community 0 - "ASSET_RECIPE_SCHEMA.md"
Cohesion: 0.02
Nodes (116): 100. Batch Review Metadata, 101. Asset Manifest Summary, 102. Schema Machine Implementation, 103. Generation Queue, 104. Queue Idempotency, 105. Generated Output Metadata, 106. Failure Handling, 107. No Auto-Approve (+108 more)

### Community 1 - "墨劍訣 · 變更記錄(Ink Engine 整合)"
Cohesion: 0.02
Nodes (83): [2026-08-07] #10 墨靈素材入庫 + 去背工作流修正, [2026-08-07] #11 墨靈動畫層:隨機變體 + 慢速晨變, [2026-08-07] #12 墨刃兵素材入庫(9 張)+ 人形隨機變體, [2026-08-07] #13 記錄開場畫卷展開規劃(未實作), [2026-08-07] #14 首頁背景:書案圖, [2026-08-07] #15 從書案圖切出開場捲桿素材, [2026-08-07] #16 開場畫卷過場 + 墨刃兵攻擊/消散幀入庫, [2026-08-07] #17 LOGO 去背拆出(去紅印章) (+75 more)

### Community 2 - "CODEX_PROJECT_BOOTSTRAP.md"
Cohesion: 0.03
Nodes (75): 10. Generated / Vendor Detection, 11. Phase 2 — Serena Installation, 12. Serena Initialization, 13. Serena Ignore Rules, 14. Serena Smoke Test, 15. Serena Usage Policy, 16. Phase 3 — Graphify Installation, 17. Graphify Ignore Rules (+67 more)

### Community 3 - "ASSET_MANIFEST.md"
Cohesion: 0.03
Nodes (64): 10. Runtime Resource, 11. VisualId Mapping, 12. AudioId Mapping, 13. Source Recipe, 14. SourceType Enum, 15. Version, 16. Content Compatibility, 17. Animation Contract Binding (+56 more)

### Community 4 - "ASSET_GENERATION_PIPELINE.md"
Cohesion: 0.03
Nodes (60): 10. Workflow Registry, 11. Model Profile, 12. Prompt Construction, 13. Candidate Count, 14. Seed Policy, 15. POC First Rule, 16. POC Purpose, 17. POC Animation Minimum (+52 more)

### Community 5 - "main.js"
Cohesion: 0.04
Nodes (83): resetBootClock(), beginXuanmingWave(), spawnEnemy(), spawnNetherSpider(), spawnXuanmingBoss(), updateBossShots(), waveDifficulty(), waveEnemyKind() (+75 more)

### Community 6 - "Repository subsystem map"
Cohesion: 0.20
Nodes (9): Assets and content, Audit gaps, Enemy and boss, Gameplay source, Geometry, Repository subsystem map, Runtime shell, Tooling (+1 more)

### Community 7 - "data/game-config.js"
Cohesion: 0.08
Nodes (40): applyInsight(), applyInsightEffects(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), chooseActiveTruth(), chooseStartingFormation(), clampAllStats() (+32 more)

### Community 8 - "墨劍訣 · Inkblade"
Cohesion: 0.05
Nodes (43): 一、核心理念, 七、玩法, 三、角色:畫中修士, 三大原則, 不得更改, 世界規則, 九、特效語言(FX Language), 二、世界觀 (+35 more)

### Community 9 - "sound-system.js"
Cohesion: 0.11
Nodes (38): applyVolume(), bandOf(), boom(), cast(), chooseVoice(), crit(), ensureCtx(), ensureMenu() (+30 more)

### Community 10 - "墨劍訣 · 劍令(SwordCommand)規格"
Cohesion: 0.05
Nodes (39): 0. 一句話, 10. 尚未完工, 1. 資料模型, 2. 一次收筆 = 一道劍令, 3. 陣型:繞著移動中的中心, 4. 接力(核心), 5. 抵達終點 / 歸鋒, 6. 劍意:收筆才計價,不足則截短 (+31 more)

### Community 11 - "墨劍訣 · 場景素材提詞"
Cohesion: 0.05
Nodes (36): `assets/scenes/dunhuang-bg.png`, `assets/scenes/dunhuang-motes.png`, `assets/scenes/dunhuang-near.png`, `assets/scenes/huangquan-bg.png`, `assets/scenes/huangquan-motes.png`, `assets/scenes/huangquan-near.png`, `assets/scenes/jiangnan-bg.png`, `assets/scenes/jiangnan-motes.png` (+28 more)

### Community 13 - "render.js"
Cohesion: 0.10
Nodes (44): supHash(), warmSwordTint(), bakeHero(), bakeHeroF(), buildCracks(), buildPaper(), configureRender(), draw() (+36 more)

### Community 14 - "combat.js"
Cohesion: 0.09
Nodes (39): bladeLength(), buildStrokePasses(), canReturn(), cmdLife(), configureCombat(), detonateAnchor(), durCost(), extendCommand() (+31 more)

### Community 15 - "劍稟"
Cohesion: 0.06
Nodes (31): 一筆開天 (truth_single_stroke) · 真意 · 上限1, 凝神 (cultivate_focus) · 明悟 · 上限5, 劍痕, 劍稟, 劍行, 劍陣, 回元 (intent_restore) · 初悟 · 上限5, 墨劍訣 · 升階與境界(由 config 生成) (+23 more)

### Community 16 - "cfg_v46.js"
Cohesion: 0.09
Nodes (35): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+27 more)

### Community 17 - "enemy.js"
Cohesion: 0.15
Nodes (23): BOSS_PLAYER_Y_RATIO, bossDissolveMist(), bossMoveToSide(), bossOrbitRadius(), bossPhase(), bossSafeSide(), bossVisualLift(), completeXuanmingWave() (+15 more)

### Community 18 - "墨劍訣 · 戰鬥 v2 設計(站樁畫劍 × 彈幕抵銷 × 精英/BOSS × 60 波關卡)"
Cohesion: 0.08
Nodes (23): 0. 核心矛盾與解法, 1.1 三種手勢(單手觸屏友好), 1.2 彈幕抵銷規則(平衡閾值), 1.3 美術配套(水墨語言統一), 1. 基礎躲招:手繪飛劍抵銷彈幕, 2. 進階反制:畫劍製造「留白安全區」, 3. 被動生存(構築補償,與洗點深度綁定), 4.1 通用規則 (+15 more)

### Community 19 - "劍稟 CULTIVATION(原修持)"
Cohesion: 0.08
Nodes (23): 凝神, 劍痕 INTENT, 劍稟 CULTIVATION(原修持), 劍行 MOMENTUM, 劍陣 FORM, 回元(建議移入 劍稟), 墨劍訣 · 旗標型里程碑 — 具體化建議(提案), 展鋒 (+15 more)

### Community 20 - "asset_manifest.schema.json"
Cohesion: 0.18
Nodes (10): additionalProperties, description, $id, required, $schema, title, type, assets (+2 more)

### Community 21 - "viewport.js"
Cohesion: 0.07
Nodes (29): bindBootEvents(), bindClick(), configureBoot(), gameLoop(), hooks, perfBuf, startBoot(), watchPerf() (+21 more)

### Community 22 - "三、分階段遷移(每階段可跑・可回滾・可驗收)"
Cohesion: 0.10
Nodes (20): 1.1 檔案與載入, 1.2 已經做得好的部分(可當種子), 1.3 會擋住「8 畫卷 + 多角色」的結構性問題, 1.4 好消息:模組邊界其實已經畫好了, 2.1 兩條主軸, 2.2 目標分層, 2.3 build 決策, Stage 0 — 安全網:抽離內聯 script(Level 1) (+12 more)

### Community 23 - "墨劍訣 · 第一章 資產庫(敵人)"
Cohesion: 0.10
Nodes (20): BOSS_MOSHOU_attack_01.png — 攻擊(attack), BOSS_MOSHOU_death_01.png — 死亡(death), BOSS_MOSHOU_hurt_01.png — 受擊(hurt), BOSS_MOSHOU_idle_01.png — 待機(idle), BOSS_MOSHOU_leap_01.png — 撲擊/移動(leap)〔使用者原提詞〕, ENE_BLADE_attack_01.png — 揮斬(attack), ENE_BLADE_death_01.png — 死亡(death), ENE_BLADE_hurt_01.png — 受擊(hurt) (+12 more)

### Community 25 - "《墨劍訣》音效來源與授權"
Cohesion: 0.33
Nodes (5): 100 CC0 SFX, 20 Sword Sound Effects, Swishes Sound Pack, 《墨劍訣》音效來源與授權, 後製

### Community 27 - "四、分期路線(每期都可獨立驗收、可玩)"
Cohesion: 0.11
Nodes (18): M1 · 彈幕地基(最關鍵,其他都疊在上面), M2 · 關卡導演 + 敵人資料層, M3 · 精英(構築測試), M4 · 留白安全區, M5 · BOSS, M6 · 難度梯度與平衡, 一、現況盤點:哪些已經到位、哪些是零, 三、資料結構規劃(進 `data/game-config.js`) (+10 more)

### Community 28 - "pivot"
Cohesion: 0.18
Nodes (11): additionalProperties, properties, required, type, pivot, x, y, type (+3 more)

### Community 29 - "墨劍訣 HUD 設計與落地規劃"
Cohesion: 0.11
Nodes (17): 10. 實作策略, 11.1 手機安全邊界與斬妖數互動（2026-08-10）, 11. 驗收清單, 1. 設計目標, 2. 配色, 3. 字體, 4.1 狀態條, 4.2 圓形墨鈕 (+9 more)

### Community 30 - "Three Kingdoms Online (legacy, not applicable here)"
Cohesion: 0.09
Nodes (21): Architecture rules, Asset capability, Character-progression rules, Death-risk and economy-observability rules, graphify, Guild, city, and siege rules, Guild economy and multi-city rules, Historical chapter content rules (+13 more)

### Community 31 - "enum"
Cohesion: 0.12
Nodes (16): enum, armor_sprite, audio, building, character_portrait, character_sprite, environment_prop, ground_tile (+8 more)

### Community 32 - "墨劍訣 · Ink Engine — 技術方向與開發計畫"
Cohesion: 0.12
Nodes (15): 1. 核心決策(推翻舊方案), 2. 三個關鍵洞察, 3. 生產分工, 4.1 五種 Primitive(所有特效的基本粒子), 4.2 資料驅動:技能 = 配方表, 4.3 技術落地要點, 4. Ink Engine 架構, 5. 風險與注意(決定成敗,但不影響方向) (+7 more)

### Community 33 - "ui.js"
Cohesion: 0.07
Nodes (53): applyBattleMode(), bindHeroChoices(), bindPauseTabs(), bindSettingGroup(), bindSettingsSegments(), bindVolumeSettings(), CARD_CATEGORY_NAME, CARD_RANK_CN (+45 more)

### Community 35 - "properties"
Cohesion: 0.13
Nodes (15): $ref, properties, $ref, $ref, animationContractId, assetId, license, provenance (+7 more)

### Community 36 - "$defs"
Cohesion: 0.22
Nodes (9): pattern, type, type, $defs, assetId, assetType, runtimeResource, pattern (+1 more)

### Community 37 - "墨劍訣 · HANDOFF（交接說明）"
Cohesion: 0.14
Nodes (13): 0. 三十秒版本, 1. 檔案結構, 2.1 劍令（SwordCommand）, 2.2 劍訣階級（小成／大成／圓滿）, 2.3 劍匣存量（開匣·圓滿）, 2.4 戰況遙測（DPS）, 2.5 HUD（#69 / #70）, 2. 核心系統現況 (+5 more)

### Community 38 - "cfg_v47.js"
Cohesion: 0.09
Nodes (35): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+27 more)

### Community 39 - "cfg_v48.js"
Cohesion: 0.09
Nodes (35): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+27 more)

### Community 40 - "properties"
Cohesion: 0.15
Nodes (13): type, type, type, license, additionalProperties, properties, type, attributionRequired (+5 more)

### Community 41 - "package.json"
Cohesion: 0.13
Nodes (14): esbuild, description, devDependencies, esbuild, name, private, scripts, build (+6 more)

### Community 43 - "v88/data/game-config.js"
Cohesion: 0.09
Nodes (35): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+27 more)

### Community 44 - "properties"
Cohesion: 0.13
Nodes (15): provenance, format, type, type, $ref, generatedAt, humanEdited, modelProfileId (+7 more)

### Community 45 - "墨劍訣 · 類別純化(劍陣不夾帶他類)分析與重設計"
Cohesion: 0.17
Nodes (11): 劍陣純化重設計(只用排列), 墨劍訣 · 類別純化(劍陣不夾帶他類)分析與重設計, 散鋒(扇), 界線, 聚鋒(聚), 貫鋒(貫), 越界與衝突(現況), 連帶處理 (+3 more)

### Community 46 - "交接文件 HANDOFF(給下一段對話無縫接手)"
Cohesion: 0.10
Nodes (19): 1.5) 劍陣改「開局四選一・鎖定一路」(設計已定案,待實作), 1) 定鋒 ✅ 已完成(刀A #31 + 刀B #32)——串珠陣(inline)專屬劍行, 2) 轉世閣前置(真意之前先把解鎖框架做好), 3) 真意 主動四式(最後,耦合最大), Archived handoff (2026-08-10, obsolete), Completed module boundaries, Current objective, Important ownership decisions (+11 more)

### Community 47 - "墨劍訣 · Ink Engine v1 規格審查"
Cohesion: 0.17
Nodes (11): 1. 最大盲點:缺「離屏烘焙」策略, 2. multiply 混色跨層是誤解, 3. 溢位裁減策略未定義, 4. SwordTrail 釋放未寫明, 一句話總評, 其他提醒, 墨劍訣 · Ink Engine v1 規格審查, 寫得好的地方(保留) (+3 more)

### Community 48 - "墨劍訣 · 能力分類與階級(由 config 生成)"
Cohesion: 0.17
Nodes (11): 兩軸, 劍痕, 劍稟, 劍行, 劍行綁劍陣(專屬,抽卡依當前劍陣 gating), 劍陣, 問道(局外·永久), 墨劍訣 · 能力分類與階級(由 config 生成) (+3 more)

### Community 49 - "墨劍訣 · 真意改為主動大招(重設計規格)"
Cohesion: 0.17
Nodes (11): 一筆開天, 共通, 取得方式(定案), 四式, 墨劍訣 · 真意改為主動大招(重設計規格), 實作耦合說明(重要), 施放與加成(定案), 歸藏無痕(持續 10 秒) (+3 more)

### Community 50 - "墨劍訣 · Inkblade"
Cohesion: 0.17
Nodes (11): 墨劍訣 · Inkblade, 專案內容, 成長系統, 掛機與商業化(示範), 操作, 效能, 核心玩法, 目前狀態與後續 (+3 more)

### Community 51 - "required"
Cohesion: 0.18
Nodes (11): additionalProperties, allOf, required, type, assetEntry, assetId, assetType, runtimeResource (+3 more)

### Community 52 - "sourceFiles"
Cohesion: 0.18
Nodes (11): minLength, pattern, type, sourceFiles, tags, items, type, uniqueItems (+3 more)

### Community 53 - "第一章 Boss 母版：玄冥墨蛟"
Cohesion: 0.18
Nodes (10): 1. 正式視覺資產, 2. 戰鬥硬規則（依現有文件）, 3. 基本循環, 4. 三階段攻擊模式, 5. 動作資產清單, 6. 驗收條件, P1：四象試鋒（100–70%）, P2：八荒盤殺（70–40%） (+2 more)

### Community 54 - "墨劍訣 · 開場畫卷展開(Opening Scroll)規劃"
Cohesion: 0.18
Nodes (10): 1. 桌面出現, 2. 畫卷開始展開, 3. 遊戲世界浮現, 4. 進入遊戲, 動畫重點, 墨劍訣 · 開場畫卷展開(Opening Scroll)規劃, 待辦(實作時), 技術結構 (+2 more)

### Community 55 - "墨劍訣 · 待確認設計筆記"
Cohesion: 0.18
Nodes (10): A. 狀態型技能的「一到五階」總量未定義, B. 斷意命名不符類別(痕), C. 修為類逐階/境界審查(2026-08-08 續), D. 命名與 bug(2026-08-08), E. 劍行結構大改(2026-08-08,先不動工;詳見 momentum-formation-and-anchor.md), F. 定案(2026-08-08), G. 定案(2026-08-08 續), H. 真意改主動大招(2026-08-08;詳見 truths-active-redesign.md) (+2 more)

### Community 56 - "cfg_v22.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 57 - "墨劍訣 · Inkblade — 背景音樂提詞"
Cohesion: 0.20
Nodes (9): Boss / 大妖, 主選單 / 標題, 墨劍訣 · Inkblade — 背景音樂提詞, 悟劍訣 / 升級選卡(短 stinger), 戰鬥 / 一般波次, 調校小技巧, 轉世閣 / 商城, 隕落 / 轉世 (+1 more)

### Community 58 - "enum"
Cohesion: 0.13
Nodes (15): format, type, enum, type, review, type, approvedAt, approvedBy (+7 more)

### Community 59 - "劍陣改為「開局四選一・鎖定一路」設計規格"
Cohesion: 0.22
Nodes (8): config(`data/game-config.js`), 一、問題(現況 bug), 三、實作草案(config + 主檔), 主檔(`inkblade.html` / 遷移後為 `src/`), 二、設計(定案:commit 模型), 五、排序, 劍陣改為「開局四選一・鎖定一路」設計規格, 四、待決細節(實作前再敲定)

### Community 60 - "墨劍訣 · 劍行綁定劍陣 + 機制定義 + 定鋒(新)"
Cohesion: 0.22
Nodes (8): 0. 結構變更:劍行=劍陣專屬招, 1. 疾影(散鋒專用), 2. 引鋒(齊鋒專用), 3. 歸鋒(聚鋒專用), 4. 齊鋒 齊斬/重斬 表現, 5. 貫鋒陣圓滿:滿貫(取代回刺;引痕作廢), 6. 定鋒(貫鋒/串珠專用 · 新劍行), 墨劍訣 · 劍行綁定劍陣 + 機制定義 + 定鋒(新)

### Community 61 - "墨劍訣 · 技能文案規範"
Cohesion: 0.22
Nodes (8): 一、用語定案(不再變動), 三、其他文案欄位, 二、悟道卡片說明的長度上限, 二之二、「效果」模式的版面上限, 墨劍訣 · 技能文案規範, 現況, 縮短的優先順序, 超標的處理順序

### Community 62 - "cfg_v32.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 63 - "44. Example Faction Vertical Slice Manifest Minimum"
Cohesion: 0.25
Nodes (8): 44. Example Faction Vertical Slice Manifest Minimum, Boss, Civilian, Environment, Example Faction, Icons, Player, VFX

### Community 64 - "enum"
Cohesion: 0.25
Nodes (8): sourceType, enum, type, generated, hand_authored, hybrid, licensed_external, procedural

### Community 65 - "[2026-08-09] #83 全卡稽核:25 項問題一次修完"
Cohesion: 0.25
Nodes (8): [2026-08-09] #83 全卡稽核:25 項問題一次修完, A. 22 個階級層「有效果但卡面空白」, B. 飛白本來是純裝飾, C. 斷意·小成與本體重複, D. 墨痕濃度是死欄位, E. 劍速沒寫換算的傷害, F. 析鋒在沒有折返前是廢卡, G. 齊鋒與散鋒的陣型幾乎一樣

### Community 66 - "架構遷移 · 進度與續作(SEAMLESS HANDOFF)"
Cohesion: 0.25
Nodes (7): 一、目前進度, 三、抽模組的標準流程(每次一小塊), 二、開發/建置流程(詳見 DEV.md), 五、遷移之後排隊的設計/功能(見 HANDOFF), 六、注意, 四、下一步:共享「可變」狀態(最需小心), 架構遷移 · 進度與續作(SEAMLESS HANDOFF)

### Community 67 - "enum"
Cohesion: 0.29
Nodes (7): status, enum, type, approved_final, approved_prototype, deprecated, disabled

### Community 68 - "墨劍訣 · 美術規範(Art Spec)"
Cohesion: 0.29
Nodes (6): FX 視覺語言(對應 config `INK_CONFIG.fx`,全由 Canvas/Ink Engine 繪製,不生 FX 圖), 墨劍訣 · 美術規範(Art Spec), 產圖一致性要求, 硬性禁止(維持水墨純度), 第一章敵人陣容, 總則

### Community 69 - "第一關 Boss：玄冥墨蛟（畫卷大型 Boss 重構）"
Cohesion: 0.29
Nodes (6): 可破壞部位, 安全與可讀性, 對玩家劍技的反制, 演出原則, 特效策略, 第一關 Boss：玄冥墨蛟（畫卷大型 Boss 重構）

### Community 70 - "開發說明 DEV(建置流程)"
Cohesion: 0.29
Nodes (6): 兩機協作(重要), 兩種跑法, 指令, 檔案角色, 遷移現況, 開發說明 DEV(建置流程)

### Community 71 - "墨劍訣 · 劍行/劍痕/劍稟 類別純化審查"
Cohesion: 0.29
Nodes (6): 劍痕 INTENT, 劍稟 CULTIVATION, 劍行 MOMENTUM, 墨劍訣 · 劍行/劍痕/劍稟 類別純化審查, 待你裁決, 跨類重複值正規化

### Community 72 - "4. Tool Responsibilities"
Cohesion: 0.33
Nodes (6): 4. Tool Responsibilities, ComfyUI, imagededup, Local Image Model, Pixelorama, runtime engine

### Community 73 - "cfg_v33.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 74 - "86. Slice Asset Priority"
Cohesion: 0.33
Nodes (6): 86. Slice Asset Priority, Boss, Civilian, Environment, NPC, Player

### Community 75 - "cfg_v34.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 76 - "[2026-08-08] #34 劍意成本改為「劍大劍多就貴」、新增小劍流派、修好劍式不疊加、震動強度可調"
Cohesion: 0.33
Nodes (6): [2026-08-08] #34 劍意成本改為「劍大劍多就貴」、新增小劍流派、修好劍式不疊加、震動強度可調, A. 劍意成本模型重做(取捨,不再是純加值), B. 小劍流派, C. 修好:重複領悟同一劍式,劍數不會累加, D. maxRank 低於 5 的補到 5, E. 震動強度可在靜觀調整

### Community 77 - "[2026-08-08] #59 折返改「邊緣折返」;劍令改預付制(死劍不補);取消飛行壽命"
Cohesion: 0.33
Nodes (6): [2026-08-08] #59 折返改「邊緣折返」;劍令改預付制(死劍不補);取消飛行壽命, A. 折返:命中不折返,飛到戰場邊緣才掉頭, B. 連帶修好三個會被打壞的效果, C. 預付制:死劍不接力, D. 取消飛行壽命, E. 劍意帳改成「一劍地板價」領頭

### Community 78 - "墨劍訣 · 抽卡權重與卡片呈現(設計方向)"
Cohesion: 0.33
Nodes (5): 1. 卡片用「類型」呈現,不用顏色分階, 2. 抽卡權重:由「投入」決定,幫玩家滾到滿階, 3. 真意:低機率大獎、真的強, 墨劍訣 · 抽卡權重與卡片呈現(設計方向), 待辦(實作時)

### Community 79 - "墨劍訣 · 洗點(洗墨重置)規劃"
Cohesion: 0.33
Nodes (5): 墨劍訣 · 洗點(洗墨重置)規劃, 已在 config runtime 提供的底層(data/game-config.js), 已知限制:undoInsight(單條撤銷), 平衡規則(遊戲層,待接主檔 UI), 待主檔實作(遊戲/UI 層,非 config)

### Community 80 - "[2026-08-08] #37 靜觀新增三項:畫質 / 幀數 / 劍訣註解;順帶修好 120Hz 兩倍速"
Cohesion: 0.40
Nodes (5): [2026-08-08] #37 靜觀新增三項:畫質 / 幀數 / 劍訣註解;順帶修好 120Hz 兩倍速, A. 畫質(低 / 中 / 高,預設高), B. 幀數(30 / 60 / 120 / 不限,預設 60), C. 劍訣註解(文字 / 效果,預設文字), D. 修正:`QUALITY` 的 TDZ 崩潰

### Community 81 - "[2026-08-08] #46 平衡:神識/劍意隨道行成長、xp 曲線降斜率、maxRank 全壓到 5"
Cohesion: 0.40
Nodes (5): [2026-08-08] #46 平衡:神識/劍意隨道行成長、xp 曲線降斜率、maxRank 全壓到 5, 修正, 效果, 未解決(需另行決策), 診斷(推演過程)

### Community 82 - "[2026-08-08] #49 續飛加回、自動御劍射程修正、首頁 logo 換 V2"
Cohesion: 0.40
Nodes (5): [2026-08-08] #49 續飛加回、自動御劍射程修正、首頁 logo 換 V2, A. 劍令加回「續飛」(修訂 #40 的設計), B. 自動御劍改為貫穿目標, C. 重新推演(真引擎、每組 8 局), D. 首頁 logo 換 V2

### Community 83 - "[2026-08-08] #53 折返改為「穿過去再掉頭」;連珠修好重疊並加大轉向距離"
Cohesion: 0.40
Nodes (5): [2026-08-08] #53 折返改為「穿過去再掉頭」;連珠修好重疊並加大轉向距離, A. 折返:命中後續行一段「轉向距離」才掉頭, B. 連珠(貫鋒式)車廂重疊 —— 所有劍寬下都會疊, C. 折返的轉向距離納入陣型長度, D. 記錄待做:陣型「聚」

### Community 84 - "[2026-08-09] #72 音效改走 WebAudio(每次出劍/受擊都會卡的真正共通點)"
Cohesion: 0.40
Nodes (5): [2026-08-09] #72 音效改走 WebAudio(每次出劍/受擊都會卡的真正共通點), 使用者可自行驗證的十秒測試, 修正:音效預先解碼成 AudioBuffer, 先把畫面成本排除, 剩下唯一同時發生在「出劍」與「受擊」的東西:音效

### Community 85 - "#88 折返收窄到單式/聚鋒;分裂整個移除;齊鋒撲空自行追跡"
Cohesion: 0.40
Nodes (5): #88 折返收窄到單式/聚鋒;分裂整個移除;齊鋒撲空自行追跡, 分裂, 怎麼推回去(還原依據), 折返, 齊鋒

### Community 86 - "[2026-08-07] #27 主角 26 幀重製 + 隕落動畫、墨劍 14 幀、開場疊合/停頓修正"
Cohesion: 0.50
Nodes (4): [2026-08-07] #27 主角 26 幀重製 + 隕落動畫、墨劍 14 幀、開場疊合/停頓修正, A. 開場過場修正(驗收回報:鏡頭動兩次像卡一下、拉開前畫軸明顯重疊沒疊好), B. 主角 sprite 重製為 26 幀(含隕落), C. 墨劍 sprite 14 幀(待機 8 / 攻擊 6)

### Community 87 - "[2026-08-07] #29 女修士改為程序化演出(拆劍/風動/墨痕旋渦)、HUD 依參考稿重做、鎖右鍵"
Cohesion: 0.50
Nodes (4): [2026-08-07] #29 女修士改為程序化演出(拆劍/風動/墨痕旋渦)、HUD 依參考稿重做、鎖右鍵, A. 女修士:7 幀 idle → 1 張身體 + 1 把配劍 + 全程序化, B. HUD 依使用者參考稿重做, C. 鎖右鍵

### Community 88 - "[2026-08-08] #45 鎮痕與蝕痕的視覺語言重做;商城返回鈕修正"
Cohesion: 0.50
Nodes (4): [2026-08-08] #45 鎮痕與蝕痕的視覺語言重做;商城返回鈕修正, A. 鎮痕 → 沉墨壓痕(禁止完整圓環 / 發光 / 旋轉), B. 蝕痕 → 蝕墨裂痕(禁止圓環 / 虛線 / 規則旋轉), C. 商城返回鈕看不見

### Community 89 - "[2026-08-08] #47 悟道階數加權;**更正 #46 的錯誤推演**"
Cohesion: 0.50
Nodes (4): [2026-08-08] #47 悟道階數加權;**更正 #46 的錯誤推演**, 仍然加入階數加權(但目的不同), 教訓(記錄下來免得再犯), 更正:#46 說「tier 幾乎觸發不到」是**錯的**

### Community 90 - "[2026-08-08] #68 修好近身傷害空區(連珠最明顯)+ 拔掉死欄位 swordLife"
Cohesion: 0.50
Nodes (4): [2026-08-08] #68 修好近身傷害空區(連珠最明顯)+ 拔掉死欄位 swordLife, A. 近身空區:三個原因疊在一起, B. 命中判定改成掃掠(線段對圓), C. 拔掉死欄位 `stats.swordLife`(滯空)

### Community 91 - "[2026-08-09] #75 耐久取消上限;新增護甲(降低耐久消耗),道行成長改為劍意/劍傷/護甲"
Cohesion: 0.50
Nodes (4): [2026-08-09] #75 耐久取消上限;新增護甲(降低耐久消耗),道行成長改為劍意/劍傷/護甲, A. 耐久取消上限, B. 新增護甲 `stats.swordArmor`, C. 道行成長

### Community 92 - "[2026-08-09] #79 九張技能配合耐久/分裂制重做;劍寬新增護甲與速度的第二層意義"
Cohesion: 0.50
Nodes (4): [2026-08-09] #79 九張技能配合耐久/分裂制重做;劍寬新增護甲與速度的第二層意義, A. 九項技能改動(使用者逐項指定), B. 劍寬的第二層意義(使用者指定), C. 平衡實測(道行 1,單劍總輸出,開局 = 1.00)

### Community 93 - "[2026-08-09] #81 卡片與階級表都改寫實際效果;**查出 22 個空的階級層**"
Cohesion: 0.50
Nodes (4): [2026-08-09] #81 卡片與階級表都改寫實際效果;**查出 22 個空的階級層**, A. 旗標型效果現在也會顯示, B. 靜觀「劍訣精進」列出三層的實際效果, C. 順帶查出的大洞:**21 個旗標沒接線,22 個階級層是空的**

### Community 94 - "[2026-08-09] #82 把 #81 查出的空階級層全部接線(21 個旗標)"
Cohesion: 0.50
Nodes (4): [2026-08-09] #82 把 #81 查出的空階級層全部接線(21 個旗標), 實測(關掉暴擊變因,固定三隻靶), 接線清單, 過程中修掉自己的一個 bug

### Community 95 - "2. Manifest vs Recipe"
Cohesion: 0.67
Nodes (3): 2. Manifest vs Recipe, AssetManifest, AssetRecipe

### Community 96 - "packageId"
Cohesion: 0.67
Nodes (3): pattern, type, packageId

### Community 97 - "version"
Cohesion: 0.67
Nodes (3): version, minimum, type

### Community 98 - "cfg_v36.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 99 - "[2026-08-07] #25 開場過場 v2(鏡頭推近畫軸 → 上下拉開 → 邊緣淡出)+ 生成點/射程修正"
Cohesion: 0.67
Nodes (3): [2026-08-07] #25 開場過場 v2(鏡頭推近畫軸 → 上下拉開 → 邊緣淡出)+ 生成點/射程修正, A. 開場過場重做(依驗收 4 點), B. 墨獸生成點與射程(驗收回報:怪生在畫面外、自動禦劍朝畫面外出劍)

### Community 100 - "[2026-08-08] #35 小成/大成/圓滿框架上線;御劍啟用改為環繞墨線"
Cohesion: 0.67
Nodes (3): [2026-08-08] #35 小成/大成/圓滿框架上線;御劍啟用改為環繞墨線, A. 階級系統(RANK 滿階後的第二/三/四層機制), B. 御劍啟用態:黃色 → 環繞墨線

### Community 101 - "[2026-08-08] #41 15 層 pending 全部實作;效果註解的版面驗證(卡片不再被裁字)"
Cohesion: 0.67
Nodes (3): [2026-08-08] #41 15 層 pending 全部實作;效果註解的版面驗證(卡片不再被裁字), A. 拆掉全部 `pending:'劍令'`(15 層 → 0), B. 效果註解不再被裁字

### Community 102 - "[2026-08-08] #48 修好飛白千峰的殘鋒 crash;實跑推演出真實存活深度"
Cohesion: 0.67
Nodes (3): [2026-08-08] #48 修好飛白千峰的殘鋒 crash;實跑推演出真實存活深度, A. Crash:飛白千峰的殘鋒手寫劍令物件,漏欄位, B. 實跑推演(直接驅動真實遊戲程式碼,非紙上模型)

### Community 103 - "[2026-08-08] #70 HUD 左右兩組切齊同一條下緣;斬殺不再留墨漬"
Cohesion: 0.67
Nodes (3): [2026-08-08] #70 HUD 左右兩組切齊同一條下緣;斬殺不再留墨漬, A. 斬殺不再在宣紙上留墨漬, B. 左右兩組 HUD 切齊下緣

### Community 104 - "[2026-08-09] #71 手機卡幀:低血量時劍環每幀重新上色(15.6 倍代價)"
Cohesion: 0.67
Nodes (3): [2026-08-09] #71 手機卡幀:低血量時劍環每幀重新上色(15.6 倍代價), 修正, 真正的原因:`tintFrame()` 沒有快取

### Community 105 - "[2026-08-09] #74 劍改為耐久制;穿透改成分裂數;折返不再補耐久"
Cohesion: 0.67
Nodes (3): [2026-08-09] #74 劍改為耐久制;穿透改成分裂數;折返不再補耐久, 實測, 新規則

### Community 106 - "[2026-08-09] #76 分裂劍的可讀性:按威力縮小 + 同幀傷害合併"
Cohesion: 0.67
Nodes (3): [2026-08-09] #76 分裂劍的可讀性:按威力縮小 + 同幀傷害合併, A. 按威力縮小, B. 同幀同目標的傷害合併成一個數字

### Community 107 - "[2026-08-09] #84 移除滑過去的音效;效果文字把「幾成傷」改成看得懂的基準"
Cohesion: 0.67
Nodes (3): [2026-08-09] #84 移除滑過去的音效;效果文字把「幾成傷」改成看得懂的基準, A. 滑鼠滑過按鈕不再有聲音, B. 「三成傷」看不懂 —— 全部改成標明基準

### Community 108 - "cfg_v37.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 111 - "cfg_v38.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 113 - "cfg_v39.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 114 - "cfg_v40.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 119 - "cfg_v41.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 122 - "cfg_v42.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 123 - "cfg_v43.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 124 - "cfg_v44.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 125 - "cfg_v45.js"
Cohesion: 0.09
Nodes (33): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+25 more)

### Community 126 - "cfg_v11.js"
Cohesion: 0.10
Nodes (29): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+21 more)

### Community 127 - "cfg_v15.js"
Cohesion: 0.10
Nodes (29): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+21 more)

### Community 128 - "cfg_v19.js"
Cohesion: 0.10
Nodes (29): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+21 more)

### Community 129 - "cfg_v20.js"
Cohesion: 0.10
Nodes (29): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+21 more)

### Community 130 - "snd_v8.js"
Cohesion: 0.11
Nodes (38): applyVolume(), bandOf(), boom(), cast(), chooseVoice(), crit(), ensureCtx(), ensureMenu() (+30 more)

### Community 131 - "snd_v9.js"
Cohesion: 0.11
Nodes (38): applyVolume(), bandOf(), boom(), cast(), chooseVoice(), crit(), ensureCtx(), ensureMenu() (+30 more)

### Community 132 - "v88/data/sound-system.js"
Cohesion: 0.11
Nodes (38): applyVolume(), bandOf(), boom(), cast(), chooseVoice(), crit(), ensureCtx(), ensureMenu() (+30 more)

### Community 133 - "cfg_v10.js"
Cohesion: 0.11
Nodes (28): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+20 more)

### Community 134 - "cfg_v8.js"
Cohesion: 0.11
Nodes (26): applyInsight(), applyOperation(), canOfferInsight(), canPurchaseRebirth(), clampAllStats(), clearAllStatus(), clone(), createPermanentState() (+18 more)

### Community 135 - "snd_v6.js"
Cohesion: 0.12
Nodes (35): applyVolume(), bandOf(), boom(), cast(), chooseVoice(), crit(), ensureMenu(), ensureMusic() (+27 more)

### Community 136 - "snd_v7.js"
Cohesion: 0.12
Nodes (35): applyVolume(), bandOf(), boom(), cast(), chooseVoice(), crit(), ensureMenu(), ensureMusic() (+27 more)

### Community 137 - "snd_v5.js"
Cohesion: 0.12
Nodes (35): applyVolume(), bandOf(), boom(), cast(), chooseVoice(), crit(), ensureMenu(), ensureMusic() (+27 more)

### Community 138 - "properties"
Cohesion: 0.18
Nodes (11): items, type, $ref, pattern, type, properties, assets, manifestVersion (+3 more)

### Community 139 - "runtime"
Cohesion: 0.29
Nodes (7): runtime, scale, additionalProperties, properties, type, exclusiveMinimum, type

### Community 140 - "VISUAL-SMOKE-TEST.md"
Cohesion: 0.06
Nodes (31): 10. 手機 9:16 強制測試, 11. Safe Area, 12. PC Regression Test, 13. 共用 CSS 特別規則, 14. 截圖自證要求, 15. 截圖必須自行審查, 16. 最終回報格式, 17. 不可跳過原則 (+23 more)

### Community 141 - "UI-BASELINE.md"
Cohesion: 0.07
Nodes (28): 0. Source of Truth 規則, 10. Combat Baseline, 11. Gameplay Visual Priority, 12. 劍令 Baseline, 13. Mobile Baseline, 14. Safe Area Baseline, 15. PC Baseline, 16. 背景 / 水墨美術 (+20 more)

### Community 142 - "全卡片功能與相容／互斥矩陣"
Cohesion: 0.20
Nodes (9): 全卡片功能與相容／互斥矩陣, 劍型（擇一鎖路）, 劍痕（擇一鎖路）, 劍稟（不限路線）, 劍行, 劍陣（開局四選一）, 尚待決定的 A／B 關係, 已實裝硬規則 (+1 more)

## Knowledge Gaps
- **1129 isolated node(s):** `$schema`, `$id`, `title`, `type`, `additionalProperties` (+1124 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `墨劍訣 · 變更記錄(Ink Engine 整合)` connect `墨劍訣 · 變更記錄(Ink Engine 整合)` to `[2026-08-09] #83 全卡稽核:25 項問題一次修完`, `[2026-08-08] #34 劍意成本改為「劍大劍多就貴」、新增小劍流派、修好劍式不疊加、震動強度可調`, `[2026-08-08] #59 折返改「邊緣折返」;劍令改預付制(死劍不補);取消飛行壽命`, `[2026-08-08] #37 靜觀新增三項:畫質 / 幀數 / 劍訣註解;順帶修好 120Hz 兩倍速`, `[2026-08-08] #46 平衡:神識/劍意隨道行成長、xp 曲線降斜率、maxRank 全壓到 5`, `[2026-08-08] #49 續飛加回、自動御劍射程修正、首頁 logo 換 V2`, `[2026-08-08] #53 折返改為「穿過去再掉頭」;連珠修好重疊並加大轉向距離`, `[2026-08-09] #72 音效改走 WebAudio(每次出劍/受擊都會卡的真正共通點)`, `#88 折返收窄到單式/聚鋒;分裂整個移除;齊鋒撲空自行追跡`, `[2026-08-07] #27 主角 26 幀重製 + 隕落動畫、墨劍 14 幀、開場疊合/停頓修正`, `[2026-08-07] #29 女修士改為程序化演出(拆劍/風動/墨痕旋渦)、HUD 依參考稿重做、鎖右鍵`, `[2026-08-08] #45 鎮痕與蝕痕的視覺語言重做;商城返回鈕修正`, `[2026-08-08] #47 悟道階數加權;**更正 #46 的錯誤推演**`, `[2026-08-08] #68 修好近身傷害空區(連珠最明顯)+ 拔掉死欄位 swordLife`, `[2026-08-09] #75 耐久取消上限;新增護甲(降低耐久消耗),道行成長改為劍意/劍傷/護甲`, `[2026-08-09] #79 九張技能配合耐久/分裂制重做;劍寬新增護甲與速度的第二層意義`, `[2026-08-09] #81 卡片與階級表都改寫實際效果;**查出 22 個空的階級層**`, `[2026-08-09] #82 把 #81 查出的空階級層全部接線(21 個旗標)`, `[2026-08-07] #25 開場過場 v2(鏡頭推近畫軸 → 上下拉開 → 邊緣淡出)+ 生成點/射程修正`, `[2026-08-08] #35 小成/大成/圓滿框架上線;御劍啟用改為環繞墨線`, `[2026-08-08] #41 15 層 pending 全部實作;效果註解的版面驗證(卡片不再被裁字)`, `[2026-08-08] #48 修好飛白千峰的殘鋒 crash;實跑推演出真實存活深度`, `[2026-08-08] #70 HUD 左右兩組切齊同一條下緣;斬殺不再留墨漬`, `[2026-08-09] #71 手機卡幀:低血量時劍環每幀重新上色(15.6 倍代價)`, `[2026-08-09] #74 劍改為耐久制;穿透改成分裂數;折返不再補耐久`, `[2026-08-09] #76 分裂劍的可讀性:按威力縮小 + 同幀傷害合併`, `[2026-08-09] #84 移除滑過去的音效;效果文字把「幾成傷」改成看得懂的基準`, `[2026-08-09] #80 納息文案講清楚它會加耐久;**更正 #79 的平衡表**`, `[2026-08-09] #86 散鋒改為「每把劍各走一份旋轉過的劍令」;長劍令加側向上限`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `$defs` connect `$defs` to `enum`, `enum`, `properties`, `runtime`, `properties`, `required`, `asset_manifest.schema.json`, `enum`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Why does `properties` connect `properties` to `packageId`, `version`, `assetType`, `outputProfileId`, `replacementAssetId`, `review`, `runtimeResource`, `sourceRecipeId`, `sourceFiles`, `required`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `$schema`, `$id`, `title` to the rest of the system?**
  _1129 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ASSET_RECIPE_SCHEMA.md` be split into smaller, more focused modules?**
  _Cohesion score 0.017094017094017096 - nodes in this community are weakly interconnected._
- **Should `墨劍訣 · 變更記錄(Ink Engine 整合)` be split into smaller, more focused modules?**
  _Cohesion score 0.023809523809523808 - nodes in this community are weakly interconnected._
- **Should `CODEX_PROJECT_BOOTSTRAP.md` be split into smaller, more focused modules?**
  _Cohesion score 0.02631578947368421 - nodes in this community are weakly interconnected._