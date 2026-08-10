# 墨劍訣 · 升階與境界(由 config 生成)

> 由 data/game-config.js 直接匯出。RANK 1~上限=數值;滿階後靠「該技能局內擊殺數」推進境界。pending=行為待玩法層接線。

境界門檻(每技能各自累計,滿階起算):小成 300 / 大成 500 / 圓滿 1000

## 劍陣

### 散鋒陣 (form_scatter) · 明悟 · 上限5
- 每階:+1 swordCount、設formation=fan
- 取捨:此式不折返;分散後不易集中斬擊。
- **小成(殺300)**:命中後向兩側分出殘鋒。 → 旗標:scatterEcho _(pending)_
- **大成(殺500)**:殘鋒亦能觸發墨痕。 → 旗標:scatterEchoIntent _(pending)_
- **圓滿(殺1000)**:墨濺四方:殘鋒改為向四面分出。 → 旗標:scatterQuad _(pending)_

### 齊鋒陣 (form_together) · 明悟 · 上限5
- 每階:+1 swordCount、設formation=parallel
- 取捨:此式不折返;橫向覆蓋佳,轉向遲緩。
- **小成(殺300)**:飛劍間距收窄,自動集火。 → 旗標:volleyTighten _(pending)_
- **大成(殺500)**:同時命中時,末劍造成齊斬。 → 旗標:volleyStrike _(pending)_
- **圓滿(殺1000)**:每四次齊斬自行引出一記重斬。 → 旗標:volleyHeavy _(pending)_

### 貫鋒陣 (form_chain) · 明悟 · 上限5
- 每階:+1 swordCount、設formation=inline
- 取捨:此式不折返;覆蓋範圍最窄。
- **小成(殺300)**:一線貫穿:每斬一名墨獸,傷害提高半成。 → 旗標:pierceRamp _(pending)_
- **大成(殺500)**:劍令末位墨獸受到破甲。 → 旗標:pierceBreak _(pending)_
- **圓滿(殺1000)**:滿貫:全劍命中同一墨獸,額外造成該令總傷五成。 → 旗標:fullPierce _(pending)_

### 聚鋒陣 (form_merge) · 明悟 · 上限5
- 每階:+1 swordCount、設formation=merge
- 取捨:威力集中於一點;此式可折返。
- **小成(殺300)**:合鋒益粗,命中範圍增加。 → +5 hitPadding
- **大成(殺500)**:眾鋒再聚,同令再合一劍。 → +1 swordCount
- **圓滿(殺1000)**:合鋒愈沉:每折返一趟傷害提高三成。 → 旗標:mergeHeavy _(pending)_

## 劍行

### 疾影 (momentum_swift) · 初悟 · 上限5 · 綁散鋒陣
- 每階:+3.6 swordSpeed
- **小成(殺300)**:飛劍身後留下殘影。 → 旗標:afterimage _(pending)_
- **大成(殺500)**:殘影造成兩成半傷害。 → 旗標:afterimageHits _(pending)_
- **圓滿(殺1000)**:殘影可獨立命中墨獸。 → 旗標:afterimageSolid _(pending)_

### 引鋒 (momentum_guide) · 徹悟 · 上限5 · 綁齊鋒陣
- 每階:+0.055 homingStrength、×0.88 damage、設homingCanCrit=false
- 取捨:每次領悟令直擊傷害降低 12%,引鋒本身不能暴擊。
- **小成(殺300)**:劍令末端的延伸更長。 → 旗標:guideExtend _(pending)_
- **大成(殺500)**:擊殺後立即再向下一目標延伸。 → 旗標:guideRetarget _(pending)_
- **圓滿(殺1000)**:劍令絕不空走,必尋得墨獸。 → 旗標:guideNeverMiss _(pending)_

### 歸鋒 (momentum_return) · 徹悟 · 上限5 · 綁聚鋒陣
- 每階:設returnEnabled=true、+1 returnHits
- **小成(殺300)**:回程速度提高三成。 → 旗標:returnFaster _(pending)_
- **大成(殺500)**:回程末端自行探向最近墨獸。 → 旗標:returnSeek _(pending)_
- **圓滿(殺1000)**:歸而不竭:每次折返保留三成耐久。 → 旗標:returnKeep _(pending)_

### 定鋒 (momentum_anchor) · 徹悟 · 上限5 · 綁貫鋒陣
- 每階:+0.25 anchorDuration、+0.08 anchorDamageMult、旗標:beadSlow
- 取捨:串珠鏈內飛劍移速 ×0.92;插地後不再移動、脫離隊列。
- **小成(殺300)**:定鋒墨域:劍樁生成減速墨氣領域,經過的串珠回補穿透。 → 旗標:anchorField _(pending)_
- **大成(殺500)**:鋒引相連:鄰近劍樁生成墨鏈,鏈上敵受切傷,穿鏈本擊 +22%。 → 旗標:anchorLink _(pending)_
- **圓滿(殺1000)**:鋒殼盡碎:劍樁壽終引爆,觸發墨痕全套;可被手繪劍跡主動引爆。 → 旗標:anchorDetonate _(pending)_

## 劍痕

### 墨痕 (momentum_break) · 徹悟 · 上限5
- 每階:+38 splashRadius、×1.12 splashDamage
- 取捨:潑墨只在命中時出現,不改變飛劍本體。
- **小成(殺300)**:潑墨範圍內留下墨滴。 → 旗標:inkDropOnSplash _(pending)_
- **大成(殺500)**:墨滴可再次炸開。 → 旗標:inkDropExplode _(pending)_
- **圓滿(殺1000)**:潑墨可連鎖引動。 → +1 splashChain

### 蝕痕 (intent_erosion) · 明悟 · 上限5
- 每階:附狀態:erosion
- **小成(殺300)**:蝕痕可被重新刷新。 → 旗標:dotRefresh _(pending)_
- **大成(殺500)**:蝕痕向鄰近墨獸擴散。 → 旗標:dotSpread _(pending)_
- **圓滿(殺1000)**:墨獸潰散時爆出剩餘蝕傷。 → 旗標:dotBurst _(pending)_

### 鎮痕 (intent_suppress) · 明悟 · 上限5
- 每階:附狀態:suppression
- **小成(殺300)**:鎮痕緩速幅度提高(+0.06)。 → +0.06 slowBonus
- **大成(殺500)**:鎮痕額外定身三分之一息。 → 旗標:rootOnSuppress _(pending)_
- **圓滿(殺1000)**:定身結束時炸開一道留白斬。 → 旗標:rootWhiteCut _(pending)_

### 斷痕 (intent_sever) · 明悟 · 上限5
- 每階:附狀態:whitecut
- **小成(殺300)**:白痕更深,易傷提高。 → 旗標:whiteCutSlash _(pending)_
- **大成(殺500)**:白痕滯留更久不散。 → 旗標:whiteCutLingers _(pending)_
- **圓滿(殺1000)**:白痕向鄰近墨獸擴散。 → 旗標:whiteCutTwin _(pending)_

## 劍稟

### 回元 (intent_restore) · 初悟 · 上限5
- 每階:+0.78 manaOnKill
- **小成(殺300)**:斬妖回收更多劍意。 → +2 manaOnKill
- **大成(殺500)**:劍意滿盈後轉而回補神識。 → 旗標:healOnFullMana _(pending)_
- **圓滿(殺1000)**:劍意滿盈時自行召出一把飛劍。 → 旗標:summonOnFullMana _(pending)_

### 養鋒 (cultivate_edge) · 初悟 · 上限5
- 每階:+18 damage
- **小成(殺300)**:飛劍模型變長,鋒芒更顯。 → 旗標:longBlade _(pending)_
- **大成(殺500)**:劍氣拖尾轉為飛白乾筆。 → 旗標:dryBrushTrail _(pending)_
- **圓滿(殺1000)**:鋒芒內斂,劍傷再提一成。 → ×1.1 damage

### 展鋒 (cultivate_breadth) · 初悟 · 上限5
- 每階:+5.6 swordWidth
- **小成(殺300)**:劍痕再展,劍寬顯著增加。 → +6 swordWidth
- **大成(殺500)**:命中判定體積一併放大。 → +6 hitPadding
- **圓滿(殺1000)**:劍痕再展,命中判定體積再放大。 → +6 hitPadding

### 納息 (cultivate_breath) · 初悟 · 上限5
- 每階:+38 manaMax、+0.16 manaRegen、max
- **小成(殺300)**:周天更暢,劍意回復加快。 → +0.5 manaRegen
- **大成(殺500)**:每次御劍返還部分劍意。 → +0.2 manaRefund
- **圓滿(殺1000)**:劍意滿盈時,定息免費御劍一次。 → 旗標:freeCastAtFull _(pending)_

### 開匣 (cultivate_sheath) · 明悟 · 上限5
- 每階:+1 swordCount
- **小成(殺300)**:劍匣再開,同道劍令並行增一劍。 → +1 swordCount
- **大成(殺500)**:劍匣再擴,同道再並行增一劍。 → +1 swordCount
- **圓滿(殺1000)**:每隔數息,劍匣存下一把免費飛劍。 → 旗標:autoRefill _(pending)_

### 斂鋒 (cultivate_temper) · 初悟 · 上限5
- 每階:-1.6 swordWidth、×0.92 costMultiplier
- 取捨:劍痕變細,擦邊命中的機會下降。
- **小成(殺300)**:鋒再收細,劍意更省。 → -3 swordWidth、×0.9 costMultiplier
- **大成(殺500)**:運鋒更省,劍意成本再減一成。 → ×0.9 costMultiplier
- **圓滿(殺1000)**:運鋒如絲,劍意成本再減兩成。 → ×0.8 costMultiplier

### 凝神 (cultivate_focus) · 明悟 · 上限5
- 每階:+0.2 critMultiplier、+0.04 critChance
- **小成(殺300)**:心念更專,暴擊機率提高。 → +0.08 critChance
- **大成(殺500)**:連續命中累積專注層數。 → 旗標:focusStacks _(pending)_
- **圓滿(殺1000)**:專注滿層,下一道劍令為凝神一劍。 → 旗標:focusStrike _(pending)_

## 真意

### 萬劍歸宗 (truth_ten_thousand) · 真意 · 上限1
- 每階:+4 swordCount、×0.82 damage
- (真意:一次性,無境界)

### 一筆開天 (truth_single_stroke) · 真意 · 上限1
- 每階:設swordCount=1、×2.35 damage、×1.45 swordWidth
- (真意:一次性,無境界)

### 歸藏無痕 (truth_return_hidden) · 真意 · 上限1
- 每階:設returnEnabled=true、+1 returnHits、旗標:returnLeavesDryBrush、旗標:returnHaste
- (真意:一次性,無境界)

### 墨海無涯 (truth_ink_sea) · 真意 · 上限1
- 每階:+72 splashRadius、×1.65 splashDamage、旗標:splashOnKill、×0.9 damage
- (真意:一次性,無境界)

### 細雨如織 (truth_fine_rain) · 真意 · 上限1
- 每階:×0.55 swordWidth、×0.45 costMultiplier、+2 swordCount、×0.72 damage
- (真意:一次性,無境界)

### 飛白千峰 (truth_dry_peaks) · 真意 · 上限1
- 每階:+0.18 critChance、旗標:whiteCutOnCrit、解鎖:criticalEcho:1
- (真意:一次性,無境界)

