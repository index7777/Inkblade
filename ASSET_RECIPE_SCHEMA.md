# ASSET_RECIPE_SCHEMA.md --- Generic Asset Recipe Contract

> Generic Asset Bootstrap\
> This document is project-agnostic. Adapt engine-specific paths, asset
> types, animation contracts, and import rules to the target
> repository.\
> Do not introduce project lore, character names, zone IDs, or
> product-specific assumptions into this shared template.

**Document:** `ASSET_RECIPE_SCHEMA.md`\
**Scope:** Generated / hand-authored visual asset recipes for Generic
Project\
**Primary Milestone:** Representative Vertical Slice --- First Playable
Vertical Slice\
**Primary Goal:** 讓 Codex 以結構化 `AssetRecipe` 驅動免費 /
本地資產生成 pipeline，而不是逐張圖片撰寫長篇 prompt，降低
token、提升風格一致性、可重現性與批次生產效率。

------------------------------------------------------------------------

# 1. Core Principle

資產生成正式流程：

``` text
Content / Gameplay Need
↓
AssetRecipe
↓
Prompt Template + Workflow
↓
Local Generation
↓
Candidate Review
↓
Dedup / Normalize
↓
Pixelorama / Aseprite cleanup
↓
runtime engine Import
↓
ASSET_MANIFEST
```

Codex 預設只負責：

``` text
Recipe
Metadata
Validation
Bindings
```

Codex 不預設負責：

``` text
逐張自然語言 prompt
逐 frame 描述
瀏覽全部 raw PNG
手動管理數百檔案
```

------------------------------------------------------------------------

# 2. Authoritative Rule

所有 AI / procedural generated gameplay assets 必須先有：

``` text
AssetRecipe
```

禁止：

``` text
先生成一堆 PNG
↓
再猜它們是什麼
```

正式流程必須是：

``` text
Recipe First
```

------------------------------------------------------------------------

# 3. Asset Recipe Root

建議目錄：

``` text
art/
├── recipes/
│   ├── characters/
│   ├── equipment/
│   ├── props/
│   ├── environment/
│   ├── tilesets/
│   ├── vfx/
│   ├── icons/
│   └── ui/
├── templates/
├── workflows/
├── source/
├── generated/
├── approved/
└── manifests/
```

Codex gameplay tasks 預設只讀：

``` text
art/recipes/
art/manifests/
```

不讀：

``` text
art/generated/
art/source/
```

除非 Task 明確涉及 asset pipeline。

------------------------------------------------------------------------

# 4. File Format

正式 machine-readable format：

``` text
JSON UTF-8
```

每個 recipe：

``` json
{
  "schemaVersion": 1,
  "assetRecipeId": "example_faction.character_blade_soldier_v1"
}
```

------------------------------------------------------------------------

# 5. Recipe ID Rule

Canonical：

``` text
namespace.asset_name.version
```

建議：

``` text
example_faction.character_blade_soldier_v1
example_faction.zhang_bao_v1
core.vfx_lightning_ground_v1
core.icon_material_common_v1
```

規則：

-   lowercase
-   ASCII
-   `_` allowed
-   `.` namespace separator
-   stable after production use
-   不把 random seed 放進 ID

------------------------------------------------------------------------

# 6. Asset Type Enum

Canonical：

``` text
character_sprite
character_portrait
weapon_sprite
armor_sprite
item_icon
environment_prop
building
tileset
ground_tile
vfx_sprite
ui_icon
ui_ornament
world_effect
```

禁止：

``` text
example_faction_asset
boss_image
misc
```

------------------------------------------------------------------------

# 7. Base AssetRecipe

最低 schema：

``` json
{
  "schemaVersion": 1,
  "assetRecipeId": "example_faction.character_blade_soldier_v1",
  "assetType": "character_sprite",
  "workflowId": "core.isometric_humanoid_sprite_v1",
  "promptTemplateId": "core.prompt_isometric_humanoid_v1",
  "outputProfileId": "core.output_character_128_v1",
  "variables": {},
  "generation": {},
  "postProcess": {},
  "review": {}
}
```

------------------------------------------------------------------------

# 8. Workflow ID

`workflowId` 指向：

``` text
ComfyUI workflow
procedural generator
sprite conversion pipeline
```

例如：

``` text
core.isometric_humanoid_sprite_v1
core.item_icon_v1
core.environment_prop_v1
core.tileset_prop_v1
core.vfx_lightning_v1
```

Recipe 不直接嵌整份 ComfyUI graph。

------------------------------------------------------------------------

# 9. Prompt Template ID

所有自然語言 prompt 應模板化。

例如：

``` text
core.prompt_isometric_humanoid_v1
```

Recipe 只傳 variables。

不要每個 asset 都重寫完整 style prompt。

------------------------------------------------------------------------

# 10. Prompt Template Example

模板：

``` text
2D isometric game sprite,
dark historical fantasy,
late Eastern Han dynasty visual language,
game-readable silhouette,
consistent scale and camera,
transparent background,
{faction_visual},
{gender},
{body_type},
{armor},
{weapon},
{headwear},
{pose},
{condition},
no text,
no watermark
```

Recipe 只填：

``` json
{
  "faction_visual": "example faction militia",
  "gender": "male",
  "body_type": "average",
  "armor": "light cloth armor",
  "weapon": "han dynasty dao",
  "headwear": "yellow head scarf",
  "pose": "combat idle",
  "condition": "battle worn"
}
```

------------------------------------------------------------------------

# 11. Global Style Profile

不要在每個 Recipe 重複 art direction。

建立：

``` text
StyleProfile
```

例如：

``` json
{
  "styleProfileId": "core.three_kingdoms_dark_isometric_v1",
  "camera": "isometric_3_4",
  "visualTone": "dark_historical_fantasy",
  "saturation": "low_medium",
  "contrast": "medium_high",
  "outline": "subtle",
  "lighting": "soft_directional",
  "silhouettePriority": "high"
}
```

Recipe reference：

``` json
{
  "styleProfileId": "core.three_kingdoms_dark_isometric_v1"
}
```

------------------------------------------------------------------------

# 12. Character Sprite Recipe

Canonical：

``` json
{
  "schemaVersion": 1,
  "assetRecipeId": "example_faction.character_blade_soldier_v1",
  "assetType": "character_sprite",
  "workflowId": "core.isometric_humanoid_sprite_v1",
  "promptTemplateId": "core.prompt_isometric_humanoid_v1",
  "styleProfileId": "core.three_kingdoms_dark_isometric_v1",
  "variables": {
    "faction": "example_faction",
    "gender": "male",
    "bodyType": "average",
    "weapon": "han_dao",
    "armor": "light_cloth",
    "headwear": "yellow_scarf",
    "role": "melee"
  },
  "animationContractId": "core.humanoid_melee_8dir_v1",
  "outputProfileId": "core.output_character_128_v1"
}
```

------------------------------------------------------------------------

# 13. Character Variable Canonical Fields

建議：

``` text
faction
gender
bodyType
ageBand
role
weapon
offhand
armor
headwear
hair
facialHair
palette
condition
rank
bossScale
```

不要自由新增：

``` text
coolness
epicness
awesome
```

這種不可 validation 的欄位。

------------------------------------------------------------------------

# 14. Faction Visual Profiles

例如：

``` text
example_faction
han_imperial
bandit
civilian
```

各 faction 可有：

``` json
{
  "factionVisualProfileId": "example_faction.visual_profile",
  "clothPalette": ["ochre", "dusty_yellow", "brown"],
  "metalCondition": "worn",
  "symbolLanguage": "yellow_scarf",
  "silhouetteNotes": "irregular militia equipment"
}
```

Recipe 只 reference faction。

------------------------------------------------------------------------

# 15. Animation Contract

Character 不逐 frame 描述。

使用：

``` text
AnimationContract
```

例如：

``` json
{
  "animationContractId": "core.humanoid_melee_8dir_v1",
  "directions": 8,
  "animations": [
    {
      "name": "idle",
      "frames": 4,
      "fps": 6,
      "loop": true
    },
    {
      "name": "walk",
      "frames": 8,
      "fps": 10,
      "loop": true
    },
    {
      "name": "attack",
      "frames": 6,
      "fps": 12,
      "loop": false
    },
    {
      "name": "hit",
      "frames": 3,
      "fps": 12,
      "loop": false
    },
    {
      "name": "death",
      "frames": 6,
      "fps": 10,
      "loop": false
    }
  ]
}
```

------------------------------------------------------------------------

# 16. Direction Enum

Canonical：

``` text
n
ne
e
se
s
sw
w
nw
```

若 Slice 初期決定 4-direction：

``` text
n
e
s
w
```

必須由 contract 控制，不讓每角色自己決定。

------------------------------------------------------------------------

# 17. Output Profile

例如：

``` json
{
  "outputProfileId": "core.output_character_128_v1",
  "frameWidth": 128,
  "frameHeight": 128,
  "background": "transparent",
  "pivot": {
    "x": 64,
    "y": 108
  },
  "padding": 8,
  "pixelSnap": true
}
```

------------------------------------------------------------------------

# 18. Master Character Reference

為提高角色動畫一致性：

Boss / important NPC 建議先建立：

``` text
MasterReference
```

Recipe：

``` json
{
  "referenceAssetId": "example_faction.zhang_bao_master_reference"
}
```

後續：

``` text
idle
walk
cast
hit
death
```

全部以 reference conditioning。

------------------------------------------------------------------------

# 19. Boss Character Recipe

Boss 可擴充：

``` json
{
  "variables": {
    "rank": "chapter_boss",
    "bossScale": 1.25,
    "silhouettePriority": "very_high",
    "weapon": "ritual_staff",
    "armor": "taiping_ritual_robe"
  }
}
```

Boss 不應只用普通兵 recipe 換名字。

------------------------------------------------------------------------

# 20. Character Variant Recipe

大量普通 NPC 不用每隻一套完全新 prompt。

例如：

``` json
{
  "variantGroupId": "example_faction.blade_soldier_variants",
  "variantIndex": 2,
  "allowedVariation": [
    "face",
    "cloth_pattern",
    "armor_wear",
    "body_type"
  ],
  "lockedTraits": [
    "weapon",
    "headwear",
    "faction_palette",
    "camera",
    "scale"
  ]
}
```

------------------------------------------------------------------------

# 21. Variant Count

普通兵建議：

``` text
2～4 visual variants
```

Boss：

``` text
1 canonical identity
```

避免生成：

``` text
40 個幾乎一樣的Common Enemy
```

------------------------------------------------------------------------

# 22. Generation Settings

Canonical：

``` json
{
  "generation": {
    "candidateCount": 4,
    "seedMode": "fixed_base_plus_variant",
    "baseSeed": 184001,
    "steps": 24,
    "guidance": 5.5
  }
}
```

注意：

模型相關參數可隨 workflow 調整，不應全 project hardcode。

------------------------------------------------------------------------

# 23. Seed Strategy

正式 asset 要可重現。

SeedMode：

``` text
fixed
fixed_base_plus_variant
random_for_exploration
```

`random_for_exploration`：

只能用於 candidate discovery。

Approved asset 必須保存 final seed。

------------------------------------------------------------------------

# 24. Negative Prompt Template

負面條件共用：

``` text
watermark
text
logo
extra limbs
duplicate weapon
cropped body
incorrect camera
modern clothing
neon sci-fi
mobile gacha UI
```

不要每 Recipe 重複。

------------------------------------------------------------------------

# 25. Weapon Sprite Recipe

``` json
{
  "schemaVersion": 1,
  "assetRecipeId": "example_faction.weapon_deng_mao_blade_v1",
  "assetType": "weapon_sprite",
  "workflowId": "core.weapon_sprite_v1",
  "styleProfileId": "core.three_kingdoms_dark_isometric_v1",
  "variables": {
    "weaponCategory": "blade",
    "historicalStyle": "eastern_han",
    "material": "iron",
    "condition": "battle_worn",
    "rarityVisual": "rare"
  },
  "outputProfileId": "core.output_weapon_world_v1"
}
```

------------------------------------------------------------------------

# 26. Item Icon Recipe

``` json
{
  "assetRecipeId": "example_faction.icon_example_faction_cloth_v1",
  "assetType": "item_icon",
  "workflowId": "core.item_icon_v1",
  "variables": {
    "itemCategory": "material",
    "subject": "example_faction_cloth",
    "rarity": "common"
  },
  "outputProfileId": "core.output_icon_64_v1"
}
```

------------------------------------------------------------------------

# 27. Icon Output Profile

``` json
{
  "outputProfileId": "core.output_icon_64_v1",
  "width": 64,
  "height": 64,
  "background": "transparent",
  "padding": 6,
  "centerSubject": true
}
```

------------------------------------------------------------------------

# 28. Environment Prop Recipe

``` json
{
  "assetRecipeId": "example_faction.prop_wooden_barricade_v1",
  "assetType": "environment_prop",
  "workflowId": "core.isometric_prop_v1",
  "variables": {
    "category": "military",
    "subject": "wooden_barricade",
    "faction": "example_faction",
    "condition": "worn"
  },
  "outputProfileId": "core.output_prop_128_v1"
}
```

------------------------------------------------------------------------

# 29. Prop Categories

Canonical：

``` text
village
farm
road
military
battlefield
cave
ritual
market
storage
```

------------------------------------------------------------------------

# 30. Building Recipe

``` json
{
  "assetRecipeId": "example_faction.building_rural_house_a_v1",
  "assetType": "building",
  "workflowId": "core.isometric_building_v1",
  "variables": {
    "buildingType": "rural_house",
    "regionStyle": "north_china_eastern_han",
    "condition": "normal",
    "roofType": "tile",
    "wallType": "wood_plaster"
  }
}
```

------------------------------------------------------------------------

# 31. Building State Variants

可從同 recipe family 產：

``` text
normal
damaged
burned
occupied
abandoned
```

例如 Zone C：

``` text
occupied / burned
```

不用重新發明 building style。

------------------------------------------------------------------------

# 32. Tileset Recipe

``` json
{
  "assetRecipeId": "example_faction.tileset_farmland_v1",
  "assetType": "tileset",
  "workflowId": "core.tileset_isometric_v1",
  "variables": {
    "biome": "north_china_farmland",
    "season": "dry",
    "warState": "early_unrest",
    "groundMaterials": [
      "dirt",
      "grass",
      "dry_soil"
    ]
  }
}
```

------------------------------------------------------------------------

# 33. Tile Contract

``` json
{
  "tileContractId": "core.isometric_tile_64_v1",
  "tileWidth": 64,
  "tileHeight": 32,
  "collisionProfile": "isometric_ground",
  "seamlessRequired": true
}
```

實際 tile size 可依 runtime engine prototype 調整，但一旦 Vertical Slice
art direction freeze，需固定。

------------------------------------------------------------------------

# 34. Environment Set Recipe

不要逐個 prop 叫 Codex 寫 prompt。

可用：

``` json
{
  "assetRecipeId": "example_faction.environment_sanglin_village_set_v1",
  "assetType": "environment_prop",
  "workflowId": "core.environment_set_v1",
  "variables": {
    "setName": "han_rural_village",
    "subjects": [
      "wooden_fence",
      "well",
      "cart",
      "grain_sack",
      "wood_pile",
      "farm_tools"
    ]
  }
}
```

Pipeline 自動拆 batch。

------------------------------------------------------------------------

# 35. VFX Recipe

``` json
{
  "assetRecipeId": "core.vfx_lightning_ground_v1",
  "assetType": "vfx_sprite",
  "workflowId": "core.vfx_sprite_sequence_v1",
  "variables": {
    "effectType": "lightning",
    "shape": "ground_circle",
    "intensity": "medium",
    "element": "lightning"
  },
  "animationContractId": "core.vfx_nonloop_12f_v1"
}
```

------------------------------------------------------------------------

# 36. VFX Reuse Rule

張寶技能：

``` text
天雷
雷域
地公大雷祭
```

應優先 reference reusable：

``` text
lightning_target
lightning_ground
lightning_ground_large
```

不要每個 Skill 自動生成一套完全新 VFX。

------------------------------------------------------------------------

# 37. UI Icon / Ornament Recipe

``` json
{
  "assetRecipeId": "core.ui_icon_market_v1",
  "assetType": "ui_icon",
  "workflowId": "core.ui_icon_v1",
  "variables": {
    "meaning": "market",
    "motif": "coin_and_stall",
    "style": "han_dynasty"
  }
}
```

------------------------------------------------------------------------

# 38. UI Component Principle

AI 生成只提供：

``` text
ornament
icon
frame texture
background motif
```

實際 UI layout：

``` text
runtime engine Control Components
```

不要把 Inventory / Market / Guild UI 做成整張不可拆圖片。

------------------------------------------------------------------------

# 39. Background Removal

PostProcess：

``` json
{
  "postProcess": {
    "removeBackground": true,
    "trimTransparent": false
  }
}
```

Character / icon / prop 通常：

``` text
transparent
```

Tileset / building 可依需求。

------------------------------------------------------------------------

# 40. Resize / Normalize

``` json
{
  "postProcess": {
    "normalizeCanvas": true,
    "targetWidth": 128,
    "targetHeight": 128,
    "preserveAspect": true
  }
}
```

------------------------------------------------------------------------

# 41. Palette Normalize

若要老 MMO 一致感：

``` json
{
  "postProcess": {
    "paletteProfileId": "core.palette_world_v1"
  }
}
```

Palette 不要讓每個 AI generation 自己決定。

------------------------------------------------------------------------

# 42. Pixel Cleanup

Recipe 可標：

``` json
{
  "postProcess": {
    "pixelCleanupRequired": true
  }
}
```

表示需要 Pixelorama/Aseprite manual/semi-auto cleanup。

------------------------------------------------------------------------

# 43. Outline Policy

例如：

``` json
{
  "postProcess": {
    "outlineProfileId": "core.outline_subtle_character_v1"
  }
}
```

避免有些 NPC 黑粗邊、有些完全無 outline。

------------------------------------------------------------------------

# 44. Shadow Policy

World sprite 可分：

``` text
baked_shadow
runtime_shadow
none
```

建議角色：

``` text
runtime_shadow
```

避免方向動畫 shadow inconsistent。

------------------------------------------------------------------------

# 45. Review Status

Canonical：

``` text
draft
generated
candidate
needs_cleanup
approved_prototype
approved_final
rejected
deprecated
```

------------------------------------------------------------------------

# 46. Review Metadata

``` json
{
  "review": {
    "status": "candidate",
    "selectedVariant": 2,
    "notes": "silhouette clear; weapon angle needs cleanup"
  }
}
```

------------------------------------------------------------------------

# 47. Approval Rule

只有：

``` text
approved_prototype
approved_final
```

可以進：

``` text
ASSET_MANIFEST
```

並綁 gameplay `visualId`。

------------------------------------------------------------------------

# 48. Candidate Storage

Generated candidates：

``` text
art/generated/{assetRecipeId}/
```

例如：

``` text
candidate_01.png
candidate_02.png
candidate_03.png
candidate_04.png
metadata.json
```

Codex gameplay tasks 不讀此目錄。

------------------------------------------------------------------------

# 49. Dedup

Candidate batch 進：

``` text
perceptual hash
near duplicate detection
```

可以使用：

``` text
imagededup
```

規則：

-   exact duplicates auto reject
-   near duplicate group 人工選 1～2
-   不讓 20 張近似圖進 approved

------------------------------------------------------------------------

# 50. Master / Approved Asset

Approved：

``` text
art/approved/
```

只保留 engine-ready source / runtime resources。

------------------------------------------------------------------------

# 51. runtime engine Import Binding

Recipe 最終需輸出：

``` json
{
  "runtime": {
    "visualId": "example_faction.visual_blade_soldier",
    "godotResourcePath": "runtime://art/approved/characters/example_faction/blade_soldier.tres"
  }
}
```

------------------------------------------------------------------------

# 52. ASSET_MANIFEST Integration

`AssetRecipe` 描述：

``` text
如何產生
```

`AssetManifest` 描述：

``` text
目前正式使用什麼
```

兩者分離。

------------------------------------------------------------------------

# 53. Manifest Example

``` json
{
  "assetId": "example_faction.visual_blade_soldier",
  "sourceRecipeId": "example_faction.character_blade_soldier_v1",
  "runtimeResource": "runtime://art/approved/characters/example_faction/blade_soldier.tres",
  "status": "approved_prototype",
  "animationContractId": "core.humanoid_melee_8dir_v1"
}
```

------------------------------------------------------------------------

# 54. Content Binding

NPC：

``` json
{
  "visualId": "example_faction.visual_blade_soldier"
}
```

Gameplay Content 不直接 reference PNG path。

------------------------------------------------------------------------

# 55. Recipe vs Visual ID

重要：

``` text
AssetRecipeId
≠
VisualId
```

Recipe 可升版：

``` text
example_faction.character_blade_soldier_v2
```

但 VisualId 可保持：

``` text
example_faction.visual_blade_soldier
```

讓 gameplay 不需要改。

------------------------------------------------------------------------

# 56. Recipe Version Upgrade

Art 更新：

``` text
v1
↓
v2
```

ASSET_MANIFEST 改指向 v2。

NPC Content 不改。

------------------------------------------------------------------------

# 57. Batch Recipe

批量普通兵可：

``` json
{
  "batchRecipeId": "example_faction.batch_recruit_v1",
  "baseRecipeId": "core.humanoid_melee_base_v1",
  "entries": [
    {
      "assetRecipeId": "example_faction.character_blade_soldier_v1",
      "weapon": "han_dao"
    },
    {
      "assetRecipeId": "example_faction.character_spear_soldier_v1",
      "weapon": "spear"
    }
  ]
}
```

------------------------------------------------------------------------

# 58. Codex Token Rule

Codex 在大量資產 production：

不要輸出：

``` text
100 個完整 prompt
```

只輸出：

``` text
100 個 compact recipe entries
```

------------------------------------------------------------------------

# 59. Generated Prompt Rule

真正 prompt：

由：

``` text
promptTemplate
+
styleProfile
+
factionProfile
+
recipe variables
```

在 pipeline runtime 組合。

不要把完整 generated prompt commit 到每個 recipe，除非 debug artifact。

------------------------------------------------------------------------

# 60. Prompt Cache

可以產生：

``` text
art/cache/prompts/
```

只作 debug。

Codex gameplay context 不讀。

------------------------------------------------------------------------

# 61. ComfyUI Workflow Storage

建議：

``` text
art/workflows/comfyui/
```

例如：

``` text
isometric_humanoid_v1.json
item_icon_v1.json
environment_prop_v1.json
vfx_sprite_v1.json
```

Recipe 使用 workflowId mapping。

------------------------------------------------------------------------

# 62. Workflow Registry

``` json
{
  "workflowId": "core.isometric_humanoid_sprite_v1",
  "engine": "comfyui",
  "workflowPath": "art/workflows/comfyui/isometric_humanoid_v1.json"
}
```

------------------------------------------------------------------------

# 63. Local Generation Rule

優先：

``` text
local generation
```

若使用外部 API：

必須由 workflow registry 註明：

``` text
engine
provider
costMode
```

Production 應避免 asset recipe 綁特定商業 API。

------------------------------------------------------------------------

# 64. Free Pipeline Default

目前建議：

``` text
ComfyUI local
+
local compatible image model
+
Pixelorama
+
runtime engine
```

Aseprite 可 optional。

------------------------------------------------------------------------

# 65. Model Independence

Recipe 不寫死：

``` text
specific model filename
```

除非 reproducibility metadata。

由 Workflow Profile 決定模型。

這樣未來換模型不用改 300 個 Recipe。

------------------------------------------------------------------------

# 66. Generation Provenance

Approved asset 必須記：

``` json
{
  "generationProvenance": {
    "workflowId": "core.isometric_humanoid_sprite_v1",
    "workflowVersion": 1,
    "modelProfileId": "local.image_model_profile_01",
    "seed": 184001,
    "generatedAt": "2026-08-11T00:00:00Z"
  }
}
```

------------------------------------------------------------------------

# 67. License Metadata

對使用外部 model / LoRA / source：

必須能追：

``` json
{
  "licenseMetadata": {
    "sourceType": "generated",
    "modelLicenseId": "..."
  }
}
```

避免後面不知道資產來源。

------------------------------------------------------------------------

# 68. Source Reference Asset

若 image-to-image / reference：

``` json
{
  "referenceInputs": [
    {
      "assetId": "example_faction.zhang_bao_master_reference",
      "role": "identity_reference"
    }
  ]
}
```

------------------------------------------------------------------------

# 69. No Web Asset Dependency

Recipe 不應依賴：

``` text
temporary web URL
```

正式 reference 需 local archived source / approved asset。

------------------------------------------------------------------------

# 70. Human Review Required

以下一定需要人工 review：

``` text
Player character
Historical Boss
Major NPC
Town landmark
UI identity asset
```

普通 props 可批次較自動。

------------------------------------------------------------------------

# 71. Boss Review Gate

Boss 要檢查：

-   silhouette
-   weapon readability
-   faction identity
-   scale
-   animation readability
-   no ordinary-mob confusion

若與普通兵太像：

``` text
ASSET_BLOCKED
```

------------------------------------------------------------------------

# 72. Animation Consistency Gate

同角色不同方向：

必須保持：

``` text
weapon
armor
headwear
body proportion
palette
```

如果方向切換像換角色：

Reject。

------------------------------------------------------------------------

# 73. Attack Timing Metadata

Animation contract 可加入：

``` json
{
  "name": "attack",
  "frames": 6,
  "hitFrame": 4
}
```

Client presentation 依 server skill timing 對齊。

------------------------------------------------------------------------

# 74. Cast Timing

Caster：

``` json
{
  "name": "cast",
  "frames": 8,
  "effectFrame": 6
}
```

------------------------------------------------------------------------

# 75. Death Animation

Death：

``` text
non-loop
final frame stable
```

方便 corpse / despawn presentation。

------------------------------------------------------------------------

# 76. Sprite Sheet Layout

正式：

``` text
animation
→ directions
→ frames
```

layout 由 importer contract 固定。

不要每個角色手排不同格式。

------------------------------------------------------------------------

# 77. Sprite Sheet Metadata

``` json
{
  "sheetLayout": {
    "order": "animation_direction_frame",
    "frameWidth": 128,
    "frameHeight": 128
  }
}
```

------------------------------------------------------------------------

# 78. runtime engine Animation Names

Canonical：

``` text
idle_n
idle_ne
...
walk_n
attack_n
hit_n
death_n
cast_n
```

或 importer 自動生成。

但專案只保留一套 naming。

------------------------------------------------------------------------

# 79. Asset Validation CLI

建議：

``` text
validate-assets
```

檢查：

-   recipe schema
-   workflow exists
-   prompt template exists
-   output profile exists
-   approved runtime resource exists
-   visualId unique
-   animation contract complete
-   missing directions
-   wrong frame dimensions
-   missing manifest binding

------------------------------------------------------------------------

# 80. Recipe Validation

Global：

-   unique recipe ID
-   supported schemaVersion
-   valid assetType
-   valid workflow
-   valid template
-   valid style
-   valid output profile
-   candidateCount \> 0
-   valid seed mode

------------------------------------------------------------------------

# 81. Character Validation

-   animation contract exists
-   directions valid
-   required animations
-   weapon/faction values valid
-   output canvas matches contract
-   boss scale within safe range

------------------------------------------------------------------------

# 82. Environment Validation

-   tile contract exists
-   seamless flag for ground tiles
-   pivot valid
-   collision metadata if required
-   building dimensions known

------------------------------------------------------------------------

# 83. VFX Validation

-   frame count valid
-   loop policy
-   alpha
-   canvas size
-   no baked UI/text
-   gameplay telegraph shape matches semantic type

------------------------------------------------------------------------

# 84. Visual Gameplay Semantics

重要 telegraph 不可以只靠美觀。

例如：

``` text
張寶大雷祭
```

VFX recipe 需要：

``` json
{
  "telegraphSemantic": "danger_large_aoe"
}
```

Client 可套統一 readability rules。

------------------------------------------------------------------------

# 85. Color Accessibility

Critical VFX：

不要只靠顏色區分。

可加：

``` text
shape
animation
icon
```

這是 UI/VFX pipeline 的後續 gate。

------------------------------------------------------------------------

# 86. Slice Asset Priority

Vertical Slice 第一批只生成：

## Player

``` text
1 base player prototype
```

## NPC

``` text
Example Faction雜兵
Common Enemy
Example Faction弓手
Example Faction力士
太平道信徒
Example Faction術士
Example Faction護法
```

## Boss

``` text
Elite Character
Boss Character
```

## Civilian

``` text
村民
商人
鐵匠
```

## Environment

``` text
Village
Farmland
Occupied Village
Town
Cave
```

------------------------------------------------------------------------

# 87. Slice Prop Priority

至少：

``` text
wooden fence
well
cart
grain sack
market stall
example faction banner
road barricade
altar
torch
crate
```

------------------------------------------------------------------------

# 88. Slice VFX Priority

``` text
basic melee hit
arrow
caster projectile
heal
stun
event signal
boss attack telegraph
```

------------------------------------------------------------------------

# 89. Slice Icon Priority

``` text
potion
basic weapons
basic armor
example faction token
taiping paper
Elite Character weapon
Boss Character weapon
silver
```

------------------------------------------------------------------------

# 90. Production Batch Rules

在 Art Direction Freeze 前：

``` text
candidate batch small
```

例如：

``` text
3 characters
5 props
5 icons
```

先進遊戲看。

不要一開始：

``` text
300 NPC assets
```

------------------------------------------------------------------------

# 91. Art Direction Freeze Gate

只有 Vertical Slice 實際畫面確認：

``` text
camera
sprite scale
tile scale
outline
palette
animation timing
boss scale
```

才標：

``` text
ART_DIRECTION_FROZEN_V1
```

------------------------------------------------------------------------

# 92. Full Production After Freeze

Freeze 後才能大量：

``` text
Z7～Zone A6 NPC
Han army
Bandits
Boss pack
Environment sets
Icons
VFX
```

------------------------------------------------------------------------

# 93. Asset Recipe Status

Recipe 本身可有：

``` text
draft
ready_to_generate
generated
reviewed
approved
deprecated
```

這跟 asset review status 分開。

------------------------------------------------------------------------

# 94. Recipe Completion Criteria

Recipe `ready_to_generate` 必須：

-   valid workflow
-   valid style
-   complete variables
-   output profile
-   animation contract if applicable
-   no unresolved placeholder

------------------------------------------------------------------------

# 95. Codex Workflow --- New Character Asset

``` text
1. Check existing AssetManifest
2. Check if reusable visual exists
3. Select base recipe
4. Fill structured variables
5. Validate recipe
6. Queue generation
7. Do NOT inspect all candidates unless task requires
8. Human selects candidate
9. Normalize / cleanup
10. Update AssetManifest
```

------------------------------------------------------------------------

# 96. Codex Workflow --- New Prop

``` text
1. Search existing prop IDs
2. Reuse if possible
3. Add recipe entry
4. Batch generate
5. Dedup
6. Approve
7. Manifest
```

------------------------------------------------------------------------

# 97. Token Efficiency Rule

任何資產需求先問：

``` text
Can this be represented as:
existing asset
variant
recipe
batch recipe
```

如果可以：

不要寫新的長 prompt。

------------------------------------------------------------------------

# 98. Reuse Before Generate

優先順序：

``` text
existing approved asset
↓
palette / equipment variant
↓
recipe variant
↓
new base asset
```

------------------------------------------------------------------------

# 99. No Raw Asset Context Rule

除非 Task 是：

``` text
asset review
sprite cleanup
visual bug
```

Codex context 不應包含：

``` text
raw candidates
all frame images
all atlas pages
```

------------------------------------------------------------------------

# 100. Batch Review Metadata

可由工具輸出：

``` text
candidate id
perceptual hash
dimensions
alpha coverage
similarity group
```

讓 Codex / human 不需要看全部細節。

------------------------------------------------------------------------

# 101. Asset Manifest Summary

日常 Codex 只需：

``` text
assetId
type
runtimeResource
status
animationContract
sourceRecipe
```

------------------------------------------------------------------------

# 102. Schema Machine Implementation

Repository 最終應提供：

``` text
AssetRecipe model
Recipe loader
Recipe validator
Workflow registry
Prompt template registry
Output profile registry
Animation contract registry
Asset manifest validator
Generation queue builder
```

------------------------------------------------------------------------

# 103. Generation Queue

Recipe 可被轉成：

``` json
{
  "queueId": "example_faction.slice_batch_001",
  "recipes": [
    "example_faction.character_blade_soldier_v1",
    "example_faction.deng_mao_v1"
  ]
}
```

------------------------------------------------------------------------

# 104. Queue Idempotency

同 Recipe + Same Version + Same Seed：

不應無限重生成。

Generation cache key 可包含：

``` text
recipeId
workflowVersion
modelProfileId
seed
```

------------------------------------------------------------------------

# 105. Generated Output Metadata

每個 candidate 保存：

``` text
recipeId
variantIndex
seed
workflowId
modelProfileId
dimensions
createdAt
```

------------------------------------------------------------------------

# 106. Failure Handling

Generation fail：

``` text
record failure
retry bounded
do not silently substitute another asset
```

------------------------------------------------------------------------

# 107. No Auto-Approve

AI generation output：

``` text
never auto-approved_final
```

至少：

``` text
candidate
```

再 human / review pipeline。

------------------------------------------------------------------------

# 108. Prototype Auto-Approval Exception

低風險 placeholder：

可在 validator / rule 通過後：

``` text
approved_prototype
```

但 Historical Boss 不可。

------------------------------------------------------------------------

# 109. License / Provenance Gate

正式公開測試前：

所有 approved asset 必須有：

``` text
source type
workflow provenance
model/license metadata
human-edited flag
```

------------------------------------------------------------------------

# 110. Forbidden Patterns

禁止：

``` text
one prompt file per PNG
one recipe per animation frame
hardcoded runtime engine PNG path inside NPC gameplay data
random undocumented seed
asset IDs based on filenames
AI-generated UI as one giant bitmap
Boss visual reused unchanged from normal mob
```

------------------------------------------------------------------------

# 111. Example Faction Example --- Blade Soldier

``` json
{
  "schemaVersion": 1,
  "assetRecipeId": "example_faction.character_blade_soldier_v1",
  "assetType": "character_sprite",
  "workflowId": "core.isometric_humanoid_sprite_v1",
  "promptTemplateId": "core.prompt_isometric_humanoid_v1",
  "styleProfileId": "core.three_kingdoms_dark_isometric_v1",
  "animationContractId": "core.humanoid_melee_8dir_v1",
  "outputProfileId": "core.output_character_128_v1",
  "variables": {
    "faction": "example_faction",
    "gender": "male",
    "bodyType": "average",
    "role": "melee",
    "weapon": "han_dao",
    "armor": "light_cloth",
    "headwear": "yellow_scarf",
    "condition": "battle_worn"
  },
  "generation": {
    "candidateCount": 4,
    "seedMode": "fixed_base_plus_variant",
    "baseSeed": 184101
  },
  "postProcess": {
    "removeBackground": true,
    "normalizeCanvas": true,
    "paletteProfileId": "core.palette_world_v1",
    "pixelCleanupRequired": true
  },
  "review": {
    "status": "draft"
  }
}
```

------------------------------------------------------------------------

# 112. Example Faction Example --- Boss Character

``` json
{
  "schemaVersion": 1,
  "assetRecipeId": "example_faction.cheng_yuanzhi_v1",
  "assetType": "character_sprite",
  "workflowId": "core.isometric_humanoid_boss_v1",
  "promptTemplateId": "core.prompt_isometric_historical_boss_v1",
  "styleProfileId": "core.three_kingdoms_dark_isometric_v1",
  "animationContractId": "core.humanoid_boss_melee_8dir_v1",
  "outputProfileId": "core.output_character_boss_160_v1",
  "variables": {
    "historicalCharacter": "cheng_yuanzhi",
    "faction": "example_faction",
    "rank": "historical_boss",
    "role": "melee_commander",
    "weapon": "heavy_blade",
    "armor": "example_faction_commander",
    "headwear": "yellow_scarf_commander",
    "bossScale": 1.15
  },
  "generation": {
    "candidateCount": 6,
    "seedMode": "fixed_base_plus_variant",
    "baseSeed": 184602
  },
  "review": {
    "status": "draft"
  }
}
```

------------------------------------------------------------------------

# 113. Vertical Slice Acceptance

`ASSET_RECIPE_SCHEMA` 成功的第一個實際驗證：

``` text
Player prototype
Example Faction blade soldier
Example Faction archer
Example Faction caster
Elite Character
Boss Character
Village prop set
Cave prop set
Basic icons
Basic VFX
```

全部從 Recipe → Approved Prototype → runtime engine Manifest。

------------------------------------------------------------------------

# 114. Definition of Done

本 schema 只有在以下答案全部為 YES 時成立：

``` text
Can Codex request 30 new NPC visuals using compact structured recipes
instead of writing 30 long prompts?

YES

Can one animation contract control directions, frames and naming
for an entire humanoid family?

YES

Can art direction be changed through a style/workflow profile
without rewriting every recipe?

YES

Can a gameplay NPC reference a stable VisualId rather than a raw PNG?

YES

Can generated assets be deduplicated, reviewed and reproduced
from stored workflow/seed metadata?

YES

Can the Vertical Slice generate its first real art set without
Codex recursively inspecting the raw generated asset folders?

YES
```

------------------------------------------------------------------------

# 115. Immediate Next Implementation

正式下一步：

``` text
1. Implement AssetRecipe typed schema
2. Implement recipe validator
3. Define StyleProfile v1
4. Define OutputProfiles
5. Define AnimationContracts
6. Define ComfyUI WorkflowRegistry
7. Create first 3 POC recipes:
   - Player
   - Example Faction Blade Soldier
   - Boss Character
8. Generate local candidates
9. Review inside runtime engine Vertical Slice
10. Freeze art direction only after in-game validation
```

------------------------------------------------------------------------

# 116. Final Rule

Generic Project 的資產生成原則：

> **Codex describes intent as structured data; the asset pipeline
> performs generation.**

不要讓 Token 被消耗在：

``` text
同一種畫風
同一個鏡頭
同一個尺寸
同一套動畫
```

一遍又一遍重寫。

真正要讓 Codex 決定的只有：

``` text
這個角色是誰？
屬於哪個陣營？
拿什麼武器？
穿什麼？
扮演什麼 gameplay role？
```

其他全部交給 Recipe、Template、Workflow 與 Manifest。
