# VISUAL-SMOKE-TEST.md

# Inkblade Visual & Gameplay Smoke Test

本文件是所有 UI、視覺、Responsive、HUD、卡片、動畫、
劍令、飛劍與 Gameplay 顯示修改的強制驗收流程。

這不是建議流程。

只要修改可能影響玩家實際看到的畫面，就必須執行本文件中
與修改範圍相關的測試。

---

# Definition of Done

任何可視修改必須符合：

**沒有實際啟動遊戲 = 沒有驗證。**

**沒有實際操作到受影響流程 = 沒有驗證。**

**沒有截圖自證 = 沒有完成。**

**只看 HTML / CSS / JS = 不算驗證。**

**Build 成功 = 不代表視覺正確。**

**Console 無錯誤 = 不代表視覺正確。**

**截圖存在 = 不代表測試通過，必須實際檢查截圖內容。**

如果截圖中仍存在明顯 Regression，
必須繼續修改與重新測試，不得宣告完成。

---

# 1. 測試前

開始修改前先確認：

- 本次修改影響哪些畫面
- 是否修改共用 CSS
- 是否修改 `.card`
- 是否修改 HUD
- 是否修改 viewport / scale
- 是否修改 responsive / media query
- 是否修改字級
- 是否修改遊戲流程
- 是否修改劍令 / 飛劍 / FX

若修改共用元件，必須測試所有使用該元件的畫面。

---

# 2. 基準畫面

不得根據印象猜測原設計。

如果要聲稱：

- 原本
- 之前
- 恢復
- 改回
- 母版
- 原始比例
- 原始尺寸
- 原始字級

必須先找到證據。

可接受證據：

1. Git 歷史版本
2. 使用者提供的基準截圖
3. 專案母版
4. 現有設計文件
5. 可確認的舊版程式碼

找不到證據時：

**不得自行猜測尺寸或比例。**

只能標記：

> 尚未找到原始規格，以下僅為假設。

沒有使用者確認，不得因假設改變 Design Intent。

---

# 3. 啟動遊戲

修改完成後：

1. Build / Reload
2. 實際啟動遊戲
3. 確認沒有 runtime error
4. 確認遊戲可以正常開始

不得停在首頁就宣告完成。

---

# 4. 三選一測試

實際進入三選一畫面。

必須截圖。

檢查：

- 三張卡是否完整顯示
- 卡片比例是否與基準一致
- 卡片沒有被擅自拉長或壓扁
- 三張卡尺寸一致
- 卡片間距正常
- 主字大小正常
- 主字沒有壓到分類章
- 主字沒有壓到階級籤
- 名稱可讀
- 說明文字可讀
- 說明文字對比足夠
- 分類章尺寸正常
- 階級籤尺寸正常
- 所有文字沒有裁切
- 沒有 overflow
- 沒有文字重疊
- 紙張紋理沒有導致文字無法閱讀

完成後：

實際選擇其中一張卡。

確認選擇可以正常進入下一階段。

---

# 5. 戰鬥 HUD 測試

進入正式戰鬥。

必須截圖。

檢查所有 HUD 是否存在。

至少確認：

- 神識
- 劍意
- 道行
- 境界
- 時間
- 御劍
- 靜觀
- 斬妖數
- 劍訣

檢查：

- HUD 沒有消失
- HUD 字級與基準一致
- HUD 沒有因手機版被個別放大
- HUD 沒有因 PC 版被個別縮小
- 字體比例一致
- 行距正常
- HUD 沒有重疊
- HUD 沒有被裁切
- HUD 與遊戲畫面位置正常

不得只確認 DOM 中存在 HUD。

必須確認實際渲染畫面可見。

---

# 6. 劍令測試

實際進入可以使用劍令的狀態。

實際劃一次劍令。

觀察完整流程：

1. 開始落筆
2. 完成筆畫
3. 劍令成立
4. 飛劍生成
5. 飛劍開始行動
6. FX 結束

必須截圖或以可確認方式檢查生成後狀態。

確認：

- 飛劍正常生成
- 飛劍位置正常
- 飛劍尺寸正常
- 飛劍方向正常
- 正式 FX 正常
- 落筆路徑正確消失
- Debug path 正確消失
- 導引線正確消失
- 人物與飛劍之間沒有不應存在的細線
- 不存在人物到落筆起點的殘留線
- 不存在 `G.streaks` 或其他不應保留的視覺殘留

如果本次修改涉及劍令，
不得只靠閱讀繪圖程式碼判定修復。

必須實際劃劍令驗證。

---

# 7. 戰鬥持續測試

劍生成後繼續遊戲。

不要生成成功就立即停止測試。

至少確認：

- 敵人正常生成
- 敵人正常接近
- 360° 敵人行為沒有因 UI 修改受影響
- 飛劍正常攻擊
- 擊殺正常
- HUD 數值正常更新
- 特效正常清除
- 沒有逐漸累積的視覺殘留
- 沒有異常線條
- 沒有 HUD 突然消失

---

# 8. 四選一 / 真意測試

如果本次修改涉及：

- `.card`
- 卡片 typography
- card container
- card scaling
- responsive card layout
- 選擇流程
- 真意

則必須進入四選一 / 真意。

不得因為三選一正常就假設四選一正常。

必須截圖。

確認：

- 四張卡完整顯示
- 卡片比例正確
- 與設計母版一致
- 四張卡尺寸一致
- 主字可讀
- 名稱可讀
- 說明可讀
- 分類可讀
- 階級可讀
- 沒有文字重疊
- 沒有裁切
- 沒有 overflow

三選一與四選一如果原設計共用同一種卡片視覺比例，
不得擅自讓其中一種變成不同 aspect ratio。

---

# 9. 選擇後 Regression Test

完成四選一 / 真意選擇。

回到戰鬥。

再次截圖或檢查。

確認：

- HUD 仍然存在
- HUD 位置沒有改變
- HUD 字級沒有改變
- 角色仍然正常
- 敵人正常
- 飛劍正常
- 遊戲沒有因 overlay 關閉造成 layout regression
- 遊戲 scale 沒有改變
- viewport 沒有異常
- 選卡 UI 已完全消失

---

# 10. 手機 9:16 強制測試

任何修改涉及：

- Responsive
- HUD
- 卡片
- viewport
- scale
- font
- mobile
- safe area

都必須跑手機測試。

主要測試尺寸：

390 × 844

Portrait。

不得只使用 PC 畫面推測手機結果。

實際以 mobile viewport 渲染。

重新執行至少：

1. 三選一
2. 戰鬥 HUD
3. 劍令
4. 飛劍生成
5. 四選一 / 真意（若相關）
6. 選擇後返回戰鬥

每個相關關鍵狀態必須有實際畫面證據。

---

# 11. Safe Area

手機測試必須確認：

- 頂部重要 HUD 不被 Dynamic Island / notch 區域遮擋
- 底部互動內容不與 Home Indicator 衝突
- 背景可以 full bleed
- Gameplay 可以依設計 full bleed
- 重要 HUD / Interaction 必須位於 safe area

不得 hardcode 某一款 iPhone 的 Dynamic Island px 高度。

應使用平台提供的 safe-area 資訊。

Safe Area 不得改變：

- 卡片比例
- HUD 字體比例
- Gameplay scale

---

# 12. PC Regression Test

如果修改涉及共用 UI / scale / card / HUD，
手機測試完成後仍必須測 PC。

至少確認一個 PC Landscape viewport。

檢查：

- HUD
- 卡片
- 字級
- Gameplay
- 劍令
- 飛劍
- Overlay

不得因修手機版而破壞 PC。

---

# 13. 共用 CSS 特別規則

如果修改 `.card`：

強制測試：

- 三選一
- 四選一
- 真意

如果修改 HUD：

強制測試：

- 初始戰鬥
- 選卡前
- 選卡後
- 劍令後

如果修改：

- viewport
- transform
- scale
- container query
- cqw / cqh
- vw / vh
- clamp()
- media query

必須同時測試：

- Mobile Portrait
- PC Landscape

不得只測目前出問題的單一畫面。

---

# 14. 截圖自證要求

完成回報至少必須包含：

## Screenshot A
三選一。

證明：

- 卡片比例
- 字級
- 可讀性
- 無重疊

## Screenshot B
正式戰鬥。

證明：

- HUD
- Gameplay scale
- 角色
- 敵人

## Screenshot C
劍令完成後。

證明：

- 飛劍正常
- 無人物到飛劍的細線
- 無殘留 path / streak

## Screenshot D
四選一 / 真意。

如果本次修改涉及卡片系統則強制。

## Screenshot E
選擇後回到戰鬥。

如果本次修改涉及 overlay / card / HUD 則強制。

---

# 15. 截圖必須自行審查

截圖完成後必須逐張檢查。

不得：

> Screenshot captured → Test passed

必須：

> Screenshot captured
> → Inspect screenshot
> → Compare against expected result
> → Identify regression
> → Fix if necessary
> → Retest
> → Capture final evidence

如果肉眼即可看到：

- 字太小
- 字太大
- 比例錯誤
- HUD 消失
- 文字重疊
- 卡片變形
- 線條殘留
- 裁切

不得宣告 PASS。

---

# 16. 最終回報格式

完成時必須使用以下格式：

## Root Cause

說明實際找到的根因。

不得用未驗證推測冒充根因。

## Changes

列出實際修改。

## Test Environment

例如：

- Mobile: 390 × 844 Portrait
- PC: 1920 × 1080 Landscape

## Gameplay Test Path

例如：

Start
→ 三選一
→ Select
→ Battle
→ 劃劍令
→ Sword Spawn
→ Combat
→ 四選一
→ Select
→ Return to Battle

## Visual Evidence

列出每張截圖及其驗證內容。

## Regression Check

列出額外驗證項目。

## Result

只有全部必要項目通過後才能寫：

PASS

如果仍存在問題：

FAIL / NEEDS FIX

不得寫「基本正常」後直接交付。

---

# 17. 不可跳過原則

後續使用者提出新的 UI 修改要求，
不代表本測試流程失效。

新的聊天回合不代表本測試流程失效。

上下文變長不代表本測試流程失效。

修改看起來很小不代表可以跳過必要驗證。

除非使用者明確要求跳過測試，
否則所有相關項目必須執行。
