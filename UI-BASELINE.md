# UI-BASELINE.md

# Inkblade UI Visual Baseline

本文件定義 Inkblade 已確認的 UI 視覺基準。

用途：

1. 防止修改過程中意外改變既有 UI。
2. 防止 Agent 根據截圖自行猜測「原本設計」。
3. 提供 Visual Regression Test 的判定依據。
4. 區分「已確認規格」與「尚未確認的推測」。

---

# 0. Source of Truth 規則

本文件只允許記錄「已確認」的設計規格。

規格來源優先順序：

1. 使用者明確確認的設計決定
2. 使用者指定的 Reference Screenshot
3. 已確認正確的歷史版本 / Git commit
4. 原始設計母版
5. 已確認正確的程式實作

不得僅根據：

- Agent 視覺判斷
- 一張沒有被指定為 Reference 的截圖
- 一般 UI 設計慣例
- 「這樣看起來比較合理」
- 「通常遊戲會這樣做」

建立新的 Baseline。

若無法找到證據：

標記為：

`UNCONFIRMED`

不得自行補完。

---

# 1. 核心視覺原則

Inkblade 的 UI、美術與 Gameplay 畫面具有既定視覺比例。

修復 Bug、Responsive 問題或 Mobile 問題時：

**不得以重新設計 UI 的方式解決 Regression。**

除非使用者明確要求 Redesign。

例如：

「文字太小」

不等於：

「可以改變卡片比例。」

「手機 HUD 擠」

不等於：

「可以重新設計 HUD。」

「四選一卡片文字放不下」

不等於：

「可以把方形卡片改成長方形。」

---

# 2. 卡片 Baseline

## 2.1 卡片形狀

CONFIRMED：

三選一與既有選擇卡片的設計基準為：

**方形 / 接近方形卡片。**

不得自行改為修長卡片。

不得因為文字可讀性問題擅自修改卡片 aspect ratio。

禁止自行聲稱：

- 「原本是修長卡片」
- 「應恢復成 190×280」
- 「母版是長卡」

除非找到新的明確 Source of Truth。

---

## 2.2 卡片內部視覺結構

卡片內包含：

- 分類章
- 階級籤
- 主字
- 名稱
- 功能 / 效果說明
- 紙張 / 水墨視覺

這些元素共同構成一個完整卡片母版。

修正 Responsive 問題時，不得任意讓其中單一元素脫離原有比例。

例如不得只因主字重疊就：

- 單獨把主字縮成另一套比例
- 單獨把分類章移到不同構圖
- 單獨把階級籤縮小
- 把卡片拉高

應先確認是否為整體 scale / container / typography regression。

---

# 3. 三選一 Baseline

CONFIRMED：

三選一是既有核心選擇畫面。

三張卡必須：

- 尺寸一致
- 比例一致
- 水平排列時保持一致視覺權重
- 文字清楚可讀
- 不互相重疊
- 不被 viewport 裁切

不得為了解決 Mobile 顯示問題讓三張卡各自使用不同縮放倍率。

三張卡應視為同一組 UI。

---

# 4. 四選一 / 真意 Baseline

四選一 / 真意與三選一可以有不同的「整組 layout scale」。

原因：

四張卡需要在相同 viewport 中容納更多卡片。

但：

**卡片本身的設計語言與內部比例不得因此被重新設計。**

也就是：

允許：

三選一整組 scale = A

四選一整組 scale = B

不代表允許：

三選一卡片 = 方卡

四選一卡片 = 長卡

除非使用者明確確認這是新的設計。

---

# 5. 卡片 Typography Baseline

目前所有「精確 px 數值」若尚未從可靠歷史版本確認：

標記為：

`UNCONFIRMED`

不得自行填入猜測數值。

需要確認的項目包括：

| 項目 | Baseline |
|---|---|
| 主字 font-size | UNCONFIRMED |
| 名稱 font-size | UNCONFIRMED |
| 說明 font-size | UNCONFIRMED |
| 分類 font-size | UNCONFIRMED |
| 階級 font-size | UNCONFIRMED |
| line-height | UNCONFIRMED |
| card padding | UNCONFIRMED |

找到最後一個正確版本後，再把數值寫入本表。

---

# 6. 卡片可讀性

CONFIRMED：

卡片文字必須在實際遊玩尺寸下可讀。

判定不能只看 CSS px。

必須以實際渲染畫面判斷。

特別檢查：

- 主字不能壓到分類章
- 主字不能壓到階級籤
- 名稱不能太小
- 功能說明不能太小
- 灰色文字不能因紙張紋理失去對比
- 長說明不能 overflow
- 卡片縮放後仍必須可讀

如果文字不可讀：

先找 Regression Root Cause。

不得第一時間修改卡片 aspect ratio。

---

# 7. HUD Baseline

HUD 是既有整體視覺系統。

目前已確認的 HUD 項目包含：

### 左側

- 神識
- 劍意
- 道行
- 劍訣

### 中央 / 上方

- 境界
- 時間

### 右側

- 御劍
- 靜觀
- 斬妖數

HUD 各元素的：

- 字體
- 字級
- 間距
- 相對位置
- 視覺權重

不得因 Responsive 修改而各自獨立重新縮放。

---

# 8. HUD Responsive 原則

CONFIRMED：

Mobile Responsive 不應該重新設計 HUD typography。

禁止為不同 HUD 文字分別加入任意：

- `font-size`
- `clamp()`
- `vw`
- `vh`
- `cqw`
- `cqh`

來讓每個文字自行 Responsive。

如果需要縮放：

優先保持 HUD 原始比例。

Safe Area 位移不等於 Typography Scale。

---

# 9. Gameplay Character Baseline

CONFIRMED：

玩家角色固定於戰場中央。

角色不以自由移動作為核心 Gameplay。

不得為了解決：

- Mobile aspect ratio
- PC aspect ratio
- 360° 視野

擅自加入：

- WASD
- Joystick
- Character movement
- Camera-follow movement

除非使用者明確要求改變 Gameplay Design。

---

# 10. Combat Baseline

CONFIRMED：

戰鬥具有：

- 360° 敵人包圍
- 敵人可由四面八方接近
- 玩家角色位於中央
- 360° 攻擊 / 御劍
- 左右敵人的位置會影響玩家決策

核心 Gameplay 重點為：

**御劍 / Build / 戰場判斷**

而不是：

**角色走位 / 閃避操作**

因此 UI 或 Responsive 修改不得偷偷改變這項 Gameplay Identity。

---

# 11. Gameplay Visual Priority

玩家需要能夠判斷：

- 敵人方向
- 敵人距離
- 威脅方向
- 敵人數量 / 密度
- 飛劍位置
- 攻擊方向
- 戰場狀態

HUD 不應遮蔽主要戰鬥資訊。

卡片 Overlay 出現時可以覆蓋 Gameplay，
但關閉後 Gameplay / HUD 必須完整恢復。

---

# 12. 劍令 Baseline

劍令完成後：

允許存在：

- 飛劍本體
- 正式攻擊 FX
- 已確認的水墨 FX
- 已確認的劍氣 / 軌跡

不允許存在：

- Debug line
- 落筆輔助線殘留
- 人物與飛劍之間的永久細線
- 人物到落筆起點的連線
- 未經確認的 `G.streaks` 視覺連線

CONFIRMED：

使用者已要求取消「人物延伸至飛劍 / 落筆起點的細線」。

因此該線不得重新加入。

---

# 13. Mobile Baseline

主要 Mobile Layout：

**Portrait / 9:16**

目前主要驗證 viewport：

**390 × 844**

Mobile 不得因為螢幕較窄而：

- 任意改變卡片 aspect ratio
- 個別放大 HUD 文字
- 個別縮小卡片文字
- 改變角色視覺比例
- 擅自改變 Gameplay Design

---

# 14. Safe Area Baseline

Mobile 必須考慮：

- Dynamic Island
- Notch
- Home Indicator
- `safe-area-inset-top`
- `safe-area-inset-bottom`

背景與非關鍵視覺可以 Full Bleed。

重要 HUD 與互動 UI 必須避開 Safe Area。

Safe Area 只能影響安全位置。

不得因 Safe Area：

- 改變字體比例
- 改變卡片比例
- 改變 Gameplay scale
- 整體縮小所有內容

---

# 15. PC Baseline

PC 與 Mobile 可以使用不同 Presentation Layout。

但不得因螢幕比例不同而擅自改變核心 Gameplay Design。

目前 PC Landscape 的最終 Layout：

`UNCONFIRMED`

在使用者確認之前：

不得自行把遊戲永久改成：

- 16:9 Gameplay
- 方形 Gameplay
- Landscape-only Gameplay

目前仍屬設計討論階段。

---

# 16. 背景 / 水墨美術

CONFIRMED：

遊戲使用水墨山水視覺語言。

背景可以：

- Full Bleed
- 延伸
- 裁切非關鍵景觀

但不得：

- 非等比拉伸山水
- 因 Responsive 把人物拉寬 / 拉高
- 因不同 viewport 改變 Gameplay Entity 比例

---

# 17. Responsive 禁止事項

除非有明確設計要求，禁止：

1. 為修文字問題修改卡片 aspect ratio。
2. 為修 HUD 問題個別重新定義所有字級。
3. 用大量 mobile override 疊加修補。
4. 在不知道 container context 時使用 `cqw/cqh`。
5. 用 `100vw/100vh` 直接推導所有 Gameplay 尺寸。
6. 用 `background-size: 100% 100%` 拉伸美術。
7. 因為某一 viewport 看起來正常就假設其他 viewport 正常。
8. 用 Agent 自己的美感取代既有 Baseline。

---

# 18. Regression 判定

如果修改前後出現以下差異，而使用者沒有要求：

- 字變大
- 字變小
- 卡片變長
- 卡片變寬
- HUD 移位
- HUD 消失
- 主字比例改變
- 說明比例改變
- 分類章比例改變
- 階級籤比例改變
- 角色比例改變
- 飛劍比例改變
- 新增不明線條
- Gameplay 視野改變

一律先視為：

**REGRESSION**

不得先解釋成「Responsive Improvement」。

---

# 19. Unknown / Unconfirmed Rules

遇到本文件沒有定義的視覺規格：

不要猜。

流程：

1. 搜尋 Git history
2. 搜尋現有程式碼
3. 搜尋 Reference Screenshot
4. 搜尋母版 / Design 文件
5. 若仍找不到，標記 `UNCONFIRMED`
6. 向使用者確認

不得自行建立新的「原始規格」。

---

# 20. Baseline 修改規則

本文件不是 Agent 自己可以任意改寫的文件。

只有以下情況可以更新 Baseline：

1. 使用者明確確認新的設計
2. 找到可驗證的舊版 Source of Truth
3. 使用者指定新的 Reference Screenshot

Agent 如果認為 Baseline 應該改變：

只能提出建議。

不得因為自己修改了程式，
就反過來修改 Baseline 讓測試通過。

---

# 21. 最重要原則

**Code 必須符合 Baseline。**

不是：

**修改 Baseline 來符合 Code。**

當 Code 與本文件衝突時，
除非使用者明確改變設計：

以本文件為準。
