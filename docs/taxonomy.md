# 墨劍訣 · 能力分類與階級(由 config 生成)

> 本檔由 data/game-config.js 直接匯出,非人工編寫。

## 兩軸
- 局內·悟道:當局暫時,隨隕落清空。五類:劍陣/劍行/劍痕/劍稟/真意。
- 局外·問道:永久,轉世閣購買。三支:築基/心法/傳承。

## 稀有度階(抽卡權重,隱藏)
`初悟 < 明悟 < 徹悟 < 真意`

## 劍行綁劍陣(專屬,抽卡依當前劍陣 gating)
- 散鋒陣 → 疾影
- 齊鋒陣 → 引鋒
- 聚鋒陣 → 歸鋒
- 貫鋒陣 → 定鋒

## 劍陣

| 能力 | id | 稀有 | 上限 | 綁陣 | 每階效果 |
|---|---|---|---|---|---|
| 散鋒陣 | form_scatter | 明悟 | 5 | — | +1 swordCount、設formation=fan |
| 齊鋒陣 | form_together | 明悟 | 5 | — | +1 swordCount、設formation=parallel |
| 貫鋒陣 | form_chain | 明悟 | 5 | — | +1 swordCount、設formation=inline |
| 聚鋒陣 | form_merge | 明悟 | 5 | — | +1 swordCount、設formation=merge |

## 劍行

| 能力 | id | 稀有 | 上限 | 綁陣 | 每階效果 |
|---|---|---|---|---|---|
| 疾影 | momentum_swift | 初悟 | 5 | 散鋒陣 | +3.6 swordSpeed |
| 引鋒 | momentum_guide | 徹悟 | 5 | 齊鋒陣 | +0.055 homingStrength、×0.88 damage、設homingCanCrit=false |
| 歸鋒 | momentum_return | 徹悟 | 5 | 聚鋒陣 | 設returnEnabled=true、+1 returnHits |
| 定鋒 | momentum_anchor | 徹悟 | 5 | 貫鋒陣 | +0.25 anchorDuration、+0.08 anchorDamageMult、旗標:beadSlow |

## 劍痕

| 能力 | id | 稀有 | 上限 | 綁陣 | 每階效果 |
|---|---|---|---|---|---|
| 墨痕 | momentum_break | 徹悟 | 5 | — | +38 splashRadius、×1.12 splashDamage |
| 蝕痕 | intent_erosion | 明悟 | 5 | — | 附狀態:erosion |
| 鎮痕 | intent_suppress | 明悟 | 5 | — | 附狀態:suppression |
| 斷痕 | intent_sever | 明悟 | 5 | — | 附狀態:whitecut |

## 劍稟

| 能力 | id | 稀有 | 上限 | 綁陣 | 每階效果 |
|---|---|---|---|---|---|
| 回元 | intent_restore | 初悟 | 5 | — | +0.78 manaOnKill |
| 養鋒 | cultivate_edge | 初悟 | 5 | — | +18 damage |
| 展鋒 | cultivate_breadth | 初悟 | 5 | — | +5.6 swordWidth |
| 納息 | cultivate_breath | 初悟 | 5 | — | +38 manaMax、+0.16 manaRegen、max |
| 開匣 | cultivate_sheath | 明悟 | 5 | — | +1 swordCount |
| 斂鋒 | cultivate_temper | 初悟 | 5 | — | -1.6 swordWidth、×0.92 costMultiplier |
| 凝神 | cultivate_focus | 明悟 | 5 | — | +0.2 critMultiplier、+0.04 critChance |

## 真意

| 能力 | id | 稀有 | 上限 | 綁陣 | 每階效果 |
|---|---|---|---|---|---|
| 萬劍歸宗 | truth_ten_thousand | 真意 | 1 | — | +4 swordCount、×0.82 damage |
| 一筆開天 | truth_single_stroke | 真意 | 1 | — | 設swordCount=1、×2.35 damage、×1.45 swordWidth |
| 歸藏無痕 | truth_return_hidden | 真意 | 1 | — | 設returnEnabled=true、+1 returnHits、旗標:returnLeavesDryBrush、旗標:returnHaste |
| 墨海無涯 | truth_ink_sea | 真意 | 1 | — | +72 splashRadius、×1.65 splashDamage、旗標:splashOnKill、×0.9 damage |
| 細雨如織 | truth_fine_rain | 真意 | 1 | — | ×0.55 swordWidth、×0.45 costMultiplier、+2 swordCount、×0.72 damage |
| 飛白千峰 | truth_dry_peaks | 真意 | 1 | — | +0.18 critChance、旗標:whiteCutOnCrit、解鎖:criticalEcho:1 |

## 問道(局外·永久)
- **築基**:靈府初成、識海初開、劍骨凝成、行氣如劍、周天養息、劍匣初開
- **心法**:明心一斬、歸念、破墨心訣、聽墨
- **傳承**:傳承·引鋒、傳承·萬劍歸宗、傳承·一筆開天、傳承·歸藏無痕、傳承·墨海無涯、傳承·細雨如織、傳承·飛白千峰

## 關係
- 劍陣:單一生效(換陣停用舊陣加成,回陣恢復)。真意:一局一種,互斥。
- 劍行:綁對應劍陣,未學該陣不入池。
- 傳承(問道)解鎖 → 對應真意/能力才入池。
