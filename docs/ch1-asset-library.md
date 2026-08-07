# 墨劍訣 · 第一章 資產庫(敵人)

本章敵人:**墨靈**(漂浮雜兵)、**墨刃兵**(近戰雜兵)、**墨獸**(本章 Boss)。
下列每個動作都是「一張獨立圖 = 一個資產」,附檔名、完整提詞、用途與狀態。
設定參考圖(art direction,非最終素材):
- `assets/references/ch1-enemies-ref.png` — 墨靈 + 墨刃兵 設定表
- `assets/references/moshou-ref.png` — 墨獸 設定圖

> 生成規範:全部透明背景、單體去背、乾筆毛邊、留白、無文字浮水印、無烘焙地面陰影(陰影由引擎畫)。
> 去背注意:這些角色本體可去背;但邊緣的煙氣/潑墨是半透明軟邊,生成時已是透明 PNG,**不要再用 rembg 二次去背**(會咬掉煙氣)。
> 狀態:`needs_art`(待生成)→ 生成後人工挑圖 → `approved`。

---

## 共用風格前綴(每條提詞已內含,調風格時改這段)
```
Chinese ink-wash sumi-e game sprite, monochrome black ink, dry-brush feathered edges, splattered ink texture, generous negative space, high contrast, pure transparent background, isolated single subject, clean cut-out for a 2D game, no text, no watermark, no baked ground shadow
```

---

## 一、墨靈 Mo-Ling(漂浮雜兵)
用途:空中/漂浮型普通雜兵,成群出現、緩速逼近靈石。無腿、以墨氣飄行。建議每動作 3–5 幀。

### ENE_INKLING_float_01.png — 待機/漂浮(idle)
用途:待機與緩慢漂浮的循環主圖。
```
Chinese ink-wash sumi-e game sprite, monochrome black ink, dry-brush feathered edges, splattered ink texture, generous negative space, high contrast, pure transparent background, isolated single subject, clean cut-out for a 2D game, no text, no watermark, no baked ground shadow, a low-tier floating ink spirit (Mo Ling), amorphous body of swirling wispy ink tendrils, no legs, hovering in place, tendrils gently drifting, dim glowing crimson-red eyes, dissolving smoky edges, calm and menacing idle
```

### ENE_INKLING_move_01.png — 漂移/前進(move)
用途:朝目標飄行時的移動幀。
```
Chinese ink-wash sumi-e game sprite, monochrome black ink, dry-brush feathered edges, splattered ink texture, generous negative space, high contrast, pure transparent background, isolated single subject, clean cut-out for a 2D game, no text, no watermark, no baked ground shadow, a low-tier floating ink spirit (Mo Ling), amorphous swirling ink body, no legs, drifting forward, tendrils streaming backward with motion, leaning into the movement, dim glowing crimson-red eyes, dissolving smoky trailing edges
```

### ENE_INKLING_death_01.png — 潰散/死亡(death)
用途:被斬殺時的消散幀(可接引擎潑墨)。
```
Chinese ink-wash sumi-e game sprite, monochrome black ink, dry-brush feathered edges, splattered ink texture, generous negative space, high contrast, pure transparent background, isolated single subject, clean cut-out for a 2D game, no text, no watermark, no baked ground shadow, a low-tier floating ink spirit (Mo Ling) bursting apart, body dissipating into scattered ink droplets and splash, tendrils unraveling, crimson-red eyes fading out, ink splatter dispersal
```

---

## 二、墨刃兵 Mo-Ren-Bing(近戰雜兵)
用途:地面近戰普通兵,持簡易墨刀進逼。建議側/斜側視角一致。idle/walk 循環,attack/hurt/death 為觸發。

### ENE_BLADE_idle_01.png — 待機(idle)
```
Chinese ink-wash sumi-e game sprite, monochrome black ink, dry-brush feathered edges, splattered ink texture, generous negative space, high contrast, pure transparent background, isolated single subject, clean cut-out for a 2D game, no text, no watermark, no baked ground shadow, a low-tier humanoid ink blade soldier (Mo Ren Bing), pitch-black inky silhouette warrior in ragged inky robes, holding a simple curved ink dao at the side, ready guard stance, subtle sway, rough dry-brush edges
```

### ENE_BLADE_walk_01.png — 行走/進逼(walk)
```
Chinese ink-wash sumi-e game sprite, monochrome black ink, dry-brush feathered edges, splattered ink texture, generous negative space, high contrast, pure transparent background, isolated single subject, clean cut-out for a 2D game, no text, no watermark, no baked ground shadow, a low-tier humanoid ink blade soldier (Mo Ren Bing), black ink silhouette, mid-stride walking forward, curved ink dao held at side, ragged inky robes trailing, dry-brush edges
```

### ENE_BLADE_attack_01.png — 揮斬(attack)
用途:攻擊觸發幀,劍走大弧。
```
Chinese ink-wash sumi-e game sprite, monochrome black ink, dry-brush feathered edges, splattered ink texture, generous negative space, high contrast, pure transparent background, isolated single subject, clean cut-out for a 2D game, no text, no watermark, no baked ground shadow, a low-tier humanoid ink blade soldier (Mo Ren Bing), black ink silhouette, dynamic forward slashing attack, curved ink dao sweeping in a wide sumi-e ink arc trail, lunging stance, dry-brush motion streaks
```

### ENE_BLADE_hurt_01.png — 受擊(hurt)
```
Chinese ink-wash sumi-e game sprite, monochrome black ink, dry-brush feathered edges, splattered ink texture, generous negative space, high contrast, pure transparent background, isolated single subject, clean cut-out for a 2D game, no text, no watermark, no baked ground shadow, a low-tier humanoid ink blade soldier (Mo Ren Bing), black ink silhouette recoiling backward from a hit, ink splattering off the body, staggering pose, dry-brush edges
```

### ENE_BLADE_death_01.png — 死亡(death)
```
Chinese ink-wash sumi-e game sprite, monochrome black ink, dry-brush feathered edges, splattered ink texture, generous negative space, high contrast, pure transparent background, isolated single subject, clean cut-out for a 2D game, no text, no watermark, a low-tier humanoid ink blade soldier (Mo Ren Bing) collapsing and dissolving into a spreading puddle of black ink on the ground, body coming apart into splatter
```

---

## 三、墨獸 Mo-Shou(本章 Boss)
用途:第一章關底 Boss。胸口「龜裂紅核」為**弱點**——命中紅核加傷/破防。**每一幀都必須保留可見的紅核與紅眼**,方便玩法辨識。建議每動作 4–6 幀。

### BOSS_MOSHOU_leap_01.png — 撲擊/移動(leap)〔使用者原提詞〕
```
A game sprite of an ancient Chinese ink wash style mythical ink beast (Mo Shou), full body, aggressive combat stance leaping forward, creature composed of swirling black ink wash strokes, feathered dry-brush edges, subtle glowing crimson red eyes, a glowing cracked red spiritual gemstone core embedded on its chest. Pure transparent background, isolated, high contrast, clean cut-out asset for 2D game development.
```

### BOSS_MOSHOU_idle_01.png — 待機(idle)
```
A game sprite of an ancient Chinese ink-wash style mythical ink beast (Mo Shou), full body, standing menacingly in a low breathing stance, creature composed of swirling black ink wash strokes, feathered dry-brush edges, ink smoke drifting around the body, subtle glowing crimson-red eyes, a glowing cracked red spiritual gemstone core pulsing on its chest. Pure transparent background, isolated, high contrast, clean cut-out asset for 2D game development, no baked ground shadow
```

### BOSS_MOSHOU_attack_01.png — 攻擊(attack)
```
A game sprite of an ancient Chinese ink-wash style mythical ink beast (Mo Shou), full body, lunging attack with open jaws and extended claws, creature composed of swirling black ink wash strokes, dry-brush motion streaks, glowing crimson-red eyes, a glowing cracked red spiritual gemstone core on its chest. Pure transparent background, isolated, high contrast, clean cut-out asset for 2D game development, no baked ground shadow
```

### BOSS_MOSHOU_hurt_01.png — 受擊(hurt)
```
A game sprite of an ancient Chinese ink-wash style mythical ink beast (Mo Shou), full body, recoiling from a hit, ink scattering off its body, the cracked red spiritual gemstone core on its chest flaring bright, glowing crimson-red eyes. Pure transparent background, isolated, high contrast, clean cut-out asset for 2D game development, no baked ground shadow
```

### BOSS_MOSHOU_death_01.png — 死亡(death)
```
A game sprite of an ancient Chinese ink-wash style mythical ink beast (Mo Shou) unraveling into dissipating black ink, body coming apart into splatter and smoke, the red spiritual gemstone core cracking and shattering, eyes going dark. Pure transparent background, isolated, high contrast, clean cut-out asset for 2D game development
```

---

## 資產清單(manifest)
| 資產ID | 類型 | 動作 | 用途 | 檔名 | 來源參考 | 狀態 |
|---|---|---|---|---|---|---|
| ENE_INKLING_float | 雜兵·漂浮 | idle | 待機/漂浮循環 | ENE_INKLING_float_01.png | ch1-enemies-ref | needs_art |
| ENE_INKLING_move | 雜兵·漂浮 | move | 逼近移動 | ENE_INKLING_move_01.png | ch1-enemies-ref | needs_art |
| ENE_INKLING_death | 雜兵·漂浮 | death | 潰散消失 | ENE_INKLING_death_01.png | ch1-enemies-ref | needs_art |
| ENE_BLADE_idle | 雜兵·近戰 | idle | 待機 | ENE_BLADE_idle_01.png | ch1-enemies-ref | needs_art |
| ENE_BLADE_walk | 雜兵·近戰 | walk | 進逼 | ENE_BLADE_walk_01.png | ch1-enemies-ref | needs_art |
| ENE_BLADE_attack | 雜兵·近戰 | attack | 揮斬觸發 | ENE_BLADE_attack_01.png | ch1-enemies-ref | needs_art |
| ENE_BLADE_hurt | 雜兵·近戰 | hurt | 受擊 | ENE_BLADE_hurt_01.png | ch1-enemies-ref | needs_art |
| ENE_BLADE_death | 雜兵·近戰 | death | 死亡 | ENE_BLADE_death_01.png | ch1-enemies-ref | needs_art |
| BOSS_MOSHOU_leap | Boss | leap/move | 撲擊/移動 | BOSS_MOSHOU_leap_01.png | moshou-ref | needs_art |
| BOSS_MOSHOU_idle | Boss | idle | 待機 | BOSS_MOSHOU_idle_01.png | moshou-ref | needs_art |
| BOSS_MOSHOU_attack | Boss | attack | 攻擊 | BOSS_MOSHOU_attack_01.png | moshou-ref | needs_art |
| BOSS_MOSHOU_hurt | Boss | hurt | 受擊 | BOSS_MOSHOU_hurt_01.png | moshou-ref | needs_art |
| BOSS_MOSHOU_death | Boss | death | 死亡 | BOSS_MOSHOU_death_01.png | moshou-ref | needs_art |

生成後建議路徑:雜兵 `assets/enemies/`、Boss `assets/boss/`;設定參考留在 `assets/references/`。
