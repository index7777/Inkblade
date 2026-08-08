# 墨劍訣 · 美術規範(Art Spec)

## 總則
- 畫種:中國水墨 sumi-e。黑墨為主體,乾筆毛邊(飛白)、潑墨、墨滴、大量留白。
- 顏色:整體單色墨黑。**紅色是唯一強調色,只用於「靈魂核 / 元素效果」**(如墨獸紅核、紅眼、業火),不得濫用作一般高光。
- 所有角色/怪物/Boss:**透明背景、單體去背、無烘焙地面陰影**(陰影與 FX 由引擎繪製)。
- 半透明的煙氣/潑墨屬有意的軟邊,生成後**不可再用 rembg 二次去背**。

## FX 視覺語言(對應 config `INK_CONFIG.fx`,全由 Canvas/Ink Engine 繪製,不生 FX 圖)
- `break_ink` 破墨 · `dry_brush` 飛白 · `ink_splash` 潑墨 · `ink_drop` 墨滴
- `negative_space` 留白 · `white_cut` 留白斷線 · `eroding_ink` 蝕痕 · `suppressed_ink` 鎮痕
所有技能/命中/狀態特效只能由以上墨語言組合表現。

## 硬性禁止(維持水墨純度)
發光粒子、霓虹、魔法陣/符文圓環、白色高光核心、火球爆炸、鏡頭光暈(lens flare)、科幻 HUD、彩虹色、煙火式均勻放射粒子——一律禁止。

## 第一章敵人陣容
| 名稱 | 定位 | 要點 |
|---|---|---|
| 墨靈 Mo-Ling | 漂浮雜兵 | 無腿、墨氣飄行、紅眼、消散邊緣 |
| 墨刃兵 Mo-Ren-Bing | 近戰雜兵 | 黑墨剪影武者、持簡易墨刀 |
| 墨獸 Mo-Shou | 本章 Boss | 胸口龜裂紅核=**弱點**,命中紅核加傷/破防;**每幀必留可見紅核與紅眼** |

設定參考圖:`assets/references/ch1-enemies-ref.png`(墨靈+墨刃兵)、`assets/references/xuanming-mojiao-master.png`(第一章正式 Boss 母版)。`assets/references/moshou-ref.png` 降為歷史參考；玄冥墨蛟的攻擊與動作規格以 `docs/ch1-boss-xuanming-master.md` 為準。
逐動作提詞、檔名、用途與資產清單見:`docs/ch1-asset-library.md`。

## 產圖一致性要求
- 同一角色各動作維持相同視角、比例、筆觸密度與墨色濃淡。
- Boss 各動作務必保留紅核/紅眼位置一致,供玩法辨識弱點。
- 命名依資產庫的資產ID(ENE_*/BOSS_*),不自行改名。
