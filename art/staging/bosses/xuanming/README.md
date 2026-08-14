# 玄冥墨蛟新版素材 Staging

本目錄只保存候選素材；未經人工確認不得進入正式 runtime。

## 新版 BOSS 本體來源

| 動作 | 使用者提供來源 | 狀態 |
|---|---|---|
| P1 出場／凝形 | `zon1_boss_P1_出場1.png` ～ `zon1_boss_P1_出場4.png` | 已提供，待統一畫布與去浮水印檢查 |
| P1 技能姿勢 | `zon1_boss_P1_skill1.png`、`skill2.png`、`skill4.png` | 已提供，待動作映射 |
| 受擊 | `zone1_boss _受擊1.png` ～ `zone1_boss _受擊4.png` | 已提供，待統一畫布 |
| P2 / P3 專用本體幀 | 尚未完整 | 待生成／批准 |

## 攻擊物候選

| Runtime ID | 候選檔 | 狀態／用途 |
|---|---|---|
| `BOSS_XUANMING_HEAVY_CORE` | `projectiles/BOSS_XUANMING_HEAVY_CORE_sheet_candidate-v1.png` | 待批准；凝聚、飛行、一段破損、二段碎裂 |
| `BOSS_XUANMING_RING_WAVE` | `projectiles/BOSS_XUANMING_RING_WAVE_sheet_candidate-v1.png` | 待批准；壓縮、展開、破口環浪、消散 |

## 明確排除

- `鎮痕.png`、`鎮壓瞬間.png`：不是 BOSS 素材。
- 舊 `assets/boss/BOSS_XUANMING_*`：不得作為新版 BOSS 母版或新版攻擊物來源。
- Canvas 程序圓線、紅線、裂紋：不得代替正式 BOSS 動作或攻擊物素材。

## 接入前仍需

1. 人工批准兩組攻擊物候選。
2. 將母版 sheet 拆為等尺寸透明幀並驗證 alpha 邊緣。
3. 新版 P1 本體幀統一 canvas、頭部錨點、戰鬥 pivot 與血條錨點。
4. 補齊 P2／P3 專用動作與其攻擊物後，才可宣告三階段重製完成。
