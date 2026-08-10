# 墨劍訣 · 旗標型里程碑 — 具體化建議(提案)

> 針對 config 裡「只有旗標、無數值/機制」的小成/大成/圓滿,逐一提出具體數值與行為。
> 皆為**提案可調**,尚未寫入 config。分類名:劍陣/劍行/劍痕/劍稟(原修持)/真意。

## 劍陣 FORM
### 散鋒式
- 小成 scatterEcho:命中後向兩側各分 1 道殘鋒(短劍令,長=劍寬×2),傷=主劍 40%,不再分裂。
- 大成 scatterEchoIntent:殘鋒也能觸發劍痕,但施加層數減半。
- 圓滿 scatterQuad:殘鋒 2→4 道(四面),每道傷降至 30%。
### 齊鋒式
- 小成 volleyTighten:並列間距 −40%;撲空的劍自動微調朝最近敵(±15°)。
- 大成 volleyStrike:同幀 ≥2 劍命中同一敵 → 末劍追加 +50% 傷。
- 圓滿 volleyHeavy:每累積 4 次齊斬 → 下次自動一記重斬(200% 傷、範圍×1.5)。
### 貫鋒式
- 小成 pierceRamp:同令每貫穿 1 敵,後續傷 +5%(單令上限 +50%)。
- 大成 pierceBreak:劍令中最後命中之敵破甲(受傷 +20%,2 秒)。
- 圓滿 pierceRecoil:劍令走完回刺首名命中之敵一次(120% 傷)。
### 聚鋒式
- 圓滿 mergeHeavy:每完成 1 趟折返,該劍令傷 +30%(可疊)。

## 劍行 MOMENTUM
### 疾影
- 小成 afterimage:**純視覺**殘影(無傷)。
- 大成 afterimageHits:殘影造成主劍 25% 傷(每 0.1s 一道,同敵每 0.3s 上限 1 次)。
- 圓滿 afterimageSolid:殘影成獨立實體(25% 傷,可各自觸發劍痕)。
### 引鋒
- 小成 guideExtend:劍令末端追蹤延伸距離 +50%。
- 大成 guideRetarget:擊殺後 0.15s 內自動朝下一最近敵再延伸(最多連 3 次)。
- 圓滿 guideNeverMiss:場上有敵時末端必延伸到最近敵(不空走)。
### 歸鋒
- 小成 returnFaster:回程速度 +30%。
- 大成 returnSeek:回程末端朝最近敵偏轉(±20°/幀)。
- 圓滿 returnKeep:每次折返保留 30% 穿透耐久(returned 時 pierceLeft=ceil(pierce×0.3)+1)。
### 破墨
- 小成 inkDropOnSplash:每次潑墨留 3 顆墨滴,各造成 splash 傷 20%。
- 大成 inkDropExplode:墨滴 0.5s 後或被劍碰到 → 二次炸開(範圍=splash×0.6)。

## 劍痕 INTENT
### 蝕痕
- 小成 dotRefresh:再次命中刷新持續時間(不加層)。
- 大成 dotSpread:每 1s 向半徑 80px 內 1 個敵擴散 1 層。
- 圓滿 dotBurst:帶蝕痕之敵死亡 → 引爆剩餘 DoT 總量 100% 為範圍傷(半徑 60)。
### 鎮痕
- **小成(bug)**:描述「緩速幅度提高」≠ effect `statusDuration×1.25`。建議改 effect = 緩速 +0.06(貼描述)。
- 大成 rootOnSuppress:滿層額外定身 0.33s(1/3 息)。
- 圓滿 rootWhiteCut:定身結束炸一道留白斬(150% 傷、小範圍)。
### 斷痕(原斷意)
- 小成 whiteCutTwin:暴擊改留 2 道飛白(各 1 次微範圍判定)。
- 大成 whiteCutSlash:飛白斬傷 30%→70%(已寫,補明)。
- 圓滿 whiteCutLingers:飛白滯留 2 秒,經過之敵受一次飛白傷。
### 回元(建議移入 劍稟)
- 大成 healOnFullMana:劍意滿時,斬妖改回補神識(HP)= 每殺 +2 HP(待定 HP 尺度)。
- 圓滿 summonOnFullMana:劍意滿時每 3 秒自動召 1 把飛劍,沿玩家朝向短劍令(70px)出擊,傷=當前劍傷 100%。

## 劍稟 CULTIVATION(原修持)
### 養鋒
- 小成 longBlade:**純視覺**(劍變長)。
- 大成 dryBrushTrail:**純視覺**(拖尾轉飛白)。
- 圓滿 edgeMoment:每 5 秒進入「鋒芒」,下一擊必暴。
### 展鋒
- 圓滿 strokeLingers:劍痕命中後滯留 0.5s,對經過之敵每 0.25s 再造成 30% 傷。
### 納息
- 圓滿 freeCastAtFull:劍意滿時下一次御劍免費(每次滿觸發一次)。
### 開匣
- 圓滿 autoRefill:每 6 秒存 1 把「待用飛劍」(最多 3);下次收筆額外免費多派。與納息區隔:開匣存「劍」、納息省「劍意」。
### 凝神
- 大成 focusStacks:連續命中累積專注,每命中 +1 層(0.8s 未命中清空),每層 +2% 暴率,上限 10。
- 圓滿 focusStrike:專注滿 10 層 → 下道劍令「凝神一劍」:必暴 + 暴傷×1.5,施放後清空。

## 通則備註
- 標「純視覺」者無數值,建議 UI 明示以免誤解。
- 多數需玩法層(劍令)接線;此表提供接線時的目標數值。
