# 墨劍訣 · 劍令(SwordCommand)規格

> 撰於實作完成後(CHANGELOG #40)。
> **本文件的用途有兩個**:說明現在是怎麼運作的;以及在不看 git 的情況下,能照著把系統改回舊版。
> 每一節都有「改之前」「改之後」「怎麼推回去」三段。

---

## 0. 一句話

**飛劍不再擁有路徑。路徑屬於劍令,飛劍只是替劍令跑腿的消耗品。**

舊版:一次收筆 → 產生 N 把劍,每把劍自己帶一條(被平移/旋轉過的)路徑,劍死路徑就沒了。
新版:一次收筆 → 產生**一道劍令**,劍令持有原始筆跡與執行進度;飛劍死了,劍令從斷點派新劍接手,直到整條走完。

---

## 1. 資料模型

### 改之前
飛劍是唯一的實體,路徑掛在飛劍身上:

```js
G.swords.push({
  x, y, path:p2, seg:1, onPath:true,      // p2 = 被 offsetPath/rotatePath 變形過的副本
  vx, vy, ang,
  life:stat.life+extraLife,               // 靠壽命倒數決定何時消失
  pierceLeft:stat.pierce, hitSet:new Set(),
  trail:[], age:0, seed, delay
});
```

### 改之後
新增 `G.commands[]`。飛劍降級為執行者,不再持有路徑。

```js
// 劍令
{
  id,                 // 流水號
  pts: [{x,y}...],    // 玩家原始筆跡(截短後)。不平滑、不修正、不最佳化
  len,                // 筆跡長度(px)
  seg,                // 執行進度:下一個要抵達的節點索引
  step,               // +1 順走 / -1 倒走(歸鋒)
  x, y, ang,          // 中心點目前位置與朝向
  formation, spacing, // 陣型與間距(收筆當下快照,之後不受 stat 變動影響)
  swords: [ ... ],    // 長度 = slots,每格是該槽位目前的飛劍或 null
  slots,              // 並行劍數(= 收筆當下的 stat.count)
  returnsLeft,        // 還能倒走幾次
  alive, age
}

// 飛劍
{ cmd, slot, x, y, ang, vx, vy, trail, age, seed, delay,
  pierceLeft, hitSet, returned, echo, dead, relay }
```

`vx/vy` 保留但語意改了:**不再是速度,而是本幀的位移量**,只為了讓既有的繪製程式(依速度決定劍身長度)不用改。

### 怎麼推回去
1. 刪掉 `G.commands` 的初始化(`G` 物件與 `start()` 兩處)。
2. 飛劍物件改回帶 `path/onPath/life`,移除 `cmd/slot/dead/relay`。
3. 繪製端不用動 —— 它只讀 `x,y,ang,trail,age,seed,vx,vy`,兩版都有。

---

## 2. 一次收筆 = 一道劍令

### 改之前
`launchSword(path)` 直接生 N 把劍,並把筆跡變形成 N 條:

```js
if(n===1) p2=path.slice();
else if(stat.formation==='parallel') p2=offsetPath(path,(i-mid)*(stat.size*2.2+10));
else if(stat.formation==='fan')      p2=rotatePath(path, (i/(n-1)-0.5)*spread*2);
else p2=path.slice();                                  // inline 靠 delay 拉開前後
```

### 改之後
`launchCommand(path)` 只生**一道**劍令。筆跡不動。

```js
const c={ id:++cmdSeq, pts:cut, len, seg:1, step:1,
          x:cut[0].x, y:cut[0].y, ang:<起始方向>,
          formation:stat.formation, spacing:stat.size*2.2+10,
          swords:new Array(n).fill(null), slots:n,
          returnsLeft: stat.ret ? Math.max(1, stat.returnHits||1) : 0,
          alive:true, age:0 };
```

`launchSword` 保留為 `launchCommand` 的別名,舊呼叫點不用改。

### 怎麼推回去
把 `launchCommand` 整個換回舊的 `launchSword`(含 `offsetPath`/`rotatePath` 分支與 `extraLife` 壽命計算),並把 `up()` 的呼叫改回 `launchSword(path)`。
`offsetPath` / `rotatePath` 兩個函式**沒有刪除**,仍在檔案裡,直接就能用。

---

## 3. 陣型:繞著移動中的中心

### 決策依據
使用者:「陣型要留,就是拿扇型陣的中心位置作為移動用的中心點」。

### 做法
筆跡定義**中心點**的軌跡。每把劍相對中心有一組偏移,再依中心當下的朝向旋轉到世界座標:

```js
function formationOffset(formation, i, n, spacing){
  const mid=(n-1)/2, t=(i-mid)/Math.max(1,mid);
  if(formation==='parallel') return {along:0,                        side:t*spacing};        // 齊鋒:一字排開
  if(formation==='inline')   return {along:-i*spacing*0.9,           side:0};                // 貫鋒:首尾相承
  return                            {along:-Math.abs(t)*spacing*0.55, side:t*spacing*1.15};  // 散鋒:扇面
}
// 世界座標
nx = c.x + cos(c.ang)*along - sin(c.ang)*side;
ny = c.y + sin(c.ang)*along + cos(c.ang)*side;
```

這同時滿足了規格的「保持玩家原始筆跡」—— 筆跡本身一個點都沒被動過。

### 怎麼推回去
刪掉 `formationOffset` 與執行迴圈裡的擺位段落,改回「每把劍各自沿 `s.path` 前進」。

---

## 4. 接力(核心)

### 決策依據
規格 Relay Rule:「Sword death does not mean Command death」。
使用者補充:接力次數無上限,「真的無限,跑完為止」。
成本上限由**長度制**承擔(見第 6 節)—— 劍意見底只畫得出短線,短線天生不需要幾把劍。

### 做法
- 飛劍穿透用盡 → `s.dead=true`,並把 `c.swords[slot]` 清成 `null`。
- 下一輪執行迴圈看到空槽,等 `gap` 影格後 `spawnCmdSword(c, slot, 0)` 補上,新劍**直接出現在中心點目前位置**。
- `gap` 預設 8 影格;開匣「大成」(`flags.newSwordDash`)把它降為 0。

進度存在**劍令**的 `seg`/`x`/`y` 上,與任何一把劍無關,所以劍全滅也不影響。

### 實測
於 `seg 9 / x 184` 把全部劍設為 dead → 劍令存活,續行到 `seg 23 / x 328`,新劍接手。

### 怎麼推回去
刪除空槽補劍那段;把飛劍死亡從 `s.dead=true` 改回 `s.life=0`,並恢復 `if(s.life<=0 || s.age>600) G.swords.splice(i,1)`。

---

## 5. 抵達終點 / 歸鋒

### 改之前
跑到筆跡盡頭 **不消失**,轉入「續飛」:沿最後方向直飛,期間追蹤(homing)生效,`stat.ret` 時撞畫面邊界反彈。

### 改之後(2026-08-08 修訂:續飛已加回)

> **修訂說明**:初版照規格做了「Reach End → Destroy」,但實測發現兩個問題:
> 1. 劍沒打到任何東西就憑空消失,不合理。
> 2. 自動御劍畫的是固定 90px 直線(舊版靠續飛橫穿畫面),射程塌成腳邊,
>    導致以它為基準的平衡推演整份失效(第 8 境 vs 人類第 54 境)。
>
> 現行行為:筆跡走完 → **轉為續飛**(沿最後方向直行)→ 飛出畫面才真的結束。
> 續飛期間仍是同一道劍令(陣型、接力、命中判定全部照舊),只是不再有節點可走。
> 追蹤(homing)**仍然不在續飛期間生效** —— 引鋒的三層已改由「劍令末端延伸」實作,
> 兩者同時存在會重複計算。

```js
function cmdReachedEnd(c){
  if(c.returnsLeft>0){                 // 歸鋒:倒走
    c.returnsLeft--; c.step=-c.step;
    c.seg = clamp(c.seg + c.step, 0, c.pts.length-1);
    for(const sw of c.swords) if(sw){ sw.hitSet.clear(); sw.returned=true; sw.pierceLeft=pierce+1; }
    if(stat.returnDry) whiteCut(c.x,c.y,c.ang);
  } else c.alive=false;                // 否則整道結束,掛在上面的劍一併消散
}
```

連帶結果:
- **續飛階段消失** → 追蹤(homing)在執行劍令期間不生效(依決策「有劍令就不追蹤」)。`stat.homing` 仍存在但目前無作用點。
- **折返不再是撞牆反彈**,而是原路倒走;`returnHits` = 倒走次數上限;沒有「必定折返」。

### 實測
t+1.32s `step` 由 1 翻為 −1、`returnsLeft` 1→0、`returned=true`,中心 x 由 516 遞減回 304。

### 怎麼推回去
刪除 `cmdReachedEnd`,恢復舊的 `s.onPath=false` 續飛分支(含 homing 與邊界反彈的 `bounce()`)。

---

## 6. 劍意:收筆才計價,不足則截短

### 決策依據
使用者選「**B 長度制**」:劍意只決定線能多長,畫得出來就保證跑完,接力不限次。

### 改之前
畫線時持續檢查,超過就**凍結筆跡**(畫不動):

```js
function allowedLen(){ return Math.max(0,(G.mana-stat.costBase)/stat.costPerPx); }
if(curLen+seg <= allowedLen()){ path.push(p); curLen+=seg; }
else { maxed=true; }
```

### 改之後
- `move()`:一律 `path.push(p)`,不凍結。`maxed = curLen > allowedLen()`。
- **繪製**:逐段累計長度,超出可負擔的部分改用金色 —— 玩家看得見「哪裡會斷」。
- `launchCommand()`:收筆時 `truncatePath(path, budget/perPx)` 截到付得起的長度,再一次扣款。

`perPx` 取 `getCombatSnapshot().mana.costPerPixelEffective`,**已含劍寬與劍數係數**(見 CHANGELOG #34):

```
每像素成本 = manaCostPerPixel × (劍寬/18)^0.8 × 劍數^0.6 × costMultiplier
```

### 刻意偏離規格之處
規格寫 `Cost = Command Length × Current Cost Multiplier`,沒有固定起手費。
**實作保留了 `manaCostBase`(預設 6)。** 理由:純長度計價時,連續甩出大量 1~2px 的極短劍令幾乎不用錢,卻每道都能命中一次 —— 起手費是防這個的下限。若要完全照規格,把 config 的 `manaCostBase` 設為 0 即可,不需要改程式。

### 實測
欲畫 800px、劍意 30(可負擔 185px)→ 劍令長度正好 185px,劍意扣為 0。

### 怎麼推回去
`move()` 恢復凍結判斷;`up()` 改回 `launchSword(path)`;`launchCommand` 的 `truncatePath` 段落改回「`G.mana < cost` 就整道作廢並提示劍意不足」;繪製恢復單一 `strokeStyle = maxed ? 金 : 墨`。

---

## 7. 劍匣上限廢除

### 決策依據
使用者:「拿掉劍匣上限」。

### 改之前
- `launchSword` 會 `G.swords.splice(0, ...)` 淘汰最舊的劍。
- `clampAllStats` 用 `swordCap` 壓 `swordCount`。
- 開匣 / 萬劍歸宗 / 劍匣初開都是加**席次**。

### 改之後
- 淘汰邏輯刪除。
- `clampAllStats` 改為 `swordCount ∈ [1, 24]` —— 24 只是防爆,不是設計限制。
- 三個節點改為加**並行劍數**:開匣 `+1/階`(5 階共 +5)、萬劍歸宗 `+4`、劍匣初開 `+1`。
- `stats.swordCap` 欄位**保留未刪**,目前無作用點(供還原用)。

代價由成本模型承擔:開匣滿階 6 劍 → 滿劍意可畫 247px(基準 723px);散鋒滿+開匣滿 11 劍 → 172px。

### 怎麼推回去
`clampAllStats` 改回 `Math.min(s.swordCount, s.swordCap)`;三個節點的 effects 改回 `stats.swordCap`;`launchCommand` 加回淘汰段落。

---

## 8. 沒有劍令的劍已消滅

規格:「Command 是《墨劍訣》唯一的戰鬥語言」。
舊版的殘鋒(飛白千峰 `criticalEcho`)是 `path:null` 的自由飛劍 —— 唯一的例外。

改為:殘鋒帶一段**自動生成的短直線劍令**(命中點朝隨機偏角、長 `70+劍寬*2`)。這樣接力、倒走、以及未來所有劍令修飾都能無痛套用在殘鋒上,規則零例外。

**怎麼推回去**:改回 `G.swords.push({ path:null, onPath:false, vx, vy, ... , echo:true })`。

---

## 9. 順手修掉的 bug

**穿透差一格**:舊碼 `pierceLeft:stat.pierce` 且命中後 `s.pierceLeft--; if(s.pierceLeft<=0) 死`。
pierce=0 → 命中 1 次死;pierce=1 → 也是命中 1 次死。**穿透的第一階完全沒有效果。**
改為 `pierceLeft = stat.pierce + 1`,命中後 `if(--s.pierceLeft<=0) 死`。

**怎麼推回去**:兩處改回原式(但這是 bug,不建議還原)。

---

## 10. 尚未完工

以下小成/大成/圓滿仍標記 `pending:'劍令'`,劍令的**地基已經有了**,但各自的行為還沒寫:

| 技能 | 待實作 |
|---|---|
| 散鋒式 | 命中分裂殘鋒 / 殘鋒觸發墨痕 / 殘鋒折返 |
| 齊鋒式 | 間距收窄 / 齊斬 / 重斬 |
| 貫鋒式 | 穿透累傷 / 末位破甲 / 劍令結束回刺 |
| 引鋒 | 劍令末端延伸 / 擊殺再延伸 / 絕不空走 |
| 歸鋒 | 回程 +30% 速 / 回程末端探敵 / 再倒走一次 |

其中歸鋒的三層現在只差數值接線(倒走機制已完成),是最容易先收的一組。
