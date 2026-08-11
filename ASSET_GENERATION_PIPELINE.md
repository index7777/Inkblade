# ASSET_GENERATION_PIPELINE.md --- Generic Local/Free Asset Pipeline

> Generic Asset Bootstrap\
> This document is project-agnostic. Adapt engine-specific paths, asset
> types, animation contracts, and import rules to the target
> repository.\
> Do not introduce project lore, character names, zone IDs, or
> product-specific assumptions into this shared template.

**Document:** `ASSET_GENERATION_PIPELINE.md`\
**Scope:** Free/local visual asset generation for Generic Project\
**Primary Milestone:** Representative Vertical Slice Vertical Slice\
**Primary Tools:** ComfyUI + local image model + imagededup + Pixelorama
(or equivalent local editor) + runtime engine\
**Primary Goal:** 建立不依賴付費圖片 API 的資產生產流程，讓 Codex 只負責
structured recipe / queue / binding / validation，而由本地 pipeline
完成批次生成、去重、清理與 runtime engine 匯入。

------------------------------------------------------------------------

# 1. Core Principle

正式免費資產流程：

``` text
Gameplay / Content Need
↓
AssetRecipe
↓
Generation Queue
↓
ComfyUI Local Workflow
↓
Local Model
↓
Candidate Assets
↓
Dedup / Quality Filtering
↓
Pixelorama Cleanup / Sprite Normalization
↓
Approved Prototype Asset
↓
runtime engine Import
↓
validate-assets
↓
ASSET_MANIFEST
↓
Stable VisualId
```

Codex 的責任：

``` text
Recipe
Queue
Metadata
Validation
Bindings
Automation
```

Codex 不應：

``` text
逐張圖片寫長 prompt
逐 frame 手工描述
直接依賴 raw PNG path
預設呼叫付費 image API
```

------------------------------------------------------------------------

# 2. Default Cost Policy

本專案預設：

``` text
LOCAL / FREE GENERATION FIRST
```

Codex MUST NOT 預設使用：

``` text
paid image API
paid sprite generation API
hosted inference API
```

如果本地 generation pipeline 不可用：

``` text
ASSET_PIPELINE_BLOCKED
```

而不是偷偷 fallback 到付費 API。

------------------------------------------------------------------------

# 3. Required Documents

Codex 開始資產 production 前必須讀：

``` text
AGENTS.md
CODEX_TOKEN_EFFICIENCY.md
ASSET_RECIPE_SCHEMA.md
ASSET_MANIFEST.md
asset_manifest.schema.json
EXAMPLE_FACTION_VERTICAL_SLICE.md
```

------------------------------------------------------------------------

# 4. Tool Responsibilities

## ComfyUI

-   local image generation
-   workflow execution
-   batch generation
-   reference conditioning
-   seed reproducibility

## Local Image Model

-   actual image synthesis

Model 由 `ModelProfile` 管理，不寫死到每個 Recipe。

## imagededup

-   exact duplicate detection
-   near-duplicate grouping
-   candidate pruning

## Pixelorama

-   sprite cleanup
-   palette normalization
-   frame correction
-   transparent background cleanup
-   spritesheet assembly
-   animation cleanup

## runtime engine

-   runtime import
-   SpriteFrames
-   AtlasTexture
-   resource binding
-   in-game validation

------------------------------------------------------------------------

# 5. Canonical Directories

``` text
art/
├── recipes/
├── workflows/
│   └── comfyui/
├── models/
│   └── profiles/
├── queues/
├── generated/
├── review/
├── source/
├── approved/
├── manifests/
├── cache/
└── tools/
```

------------------------------------------------------------------------

# 6. Git Policy

建議 commit：

``` text
recipes
workflow definitions
model profiles
approved assets
manifests
validation scripts
```

預設不 commit：

``` text
generated candidates
cache
temporary exports
large raw batch artifacts
```

------------------------------------------------------------------------

# 7. Asset Generation Entry Point

任何新生成需求先建立：

``` text
AssetRecipe
```

不得先生成圖片再命名。

------------------------------------------------------------------------

# 8. Generation Queue

例如：

``` json
{
  "queueId": "example_faction.vertical_slice_poc_001",
  "recipes": [
    "core.player_prototype_v1",
    "example_faction.character_blade_soldier_v1",
    "example_faction.cheng_yuanzhi_v1"
  ],
  "priority": "high",
  "status": "pending"
}
```

Status：

``` text
pending
running
generated
review_required
completed
failed
```

------------------------------------------------------------------------

# 9. ComfyUI Installation Gate

安裝後至少驗證：

``` text
ComfyUI starts locally
workflow can be loaded
local API reachable
basic generation succeeds
```

正式流程不得把 GUI 當唯一 production interface。

------------------------------------------------------------------------

# 10. Workflow Registry

建立：

``` text
core.isometric_humanoid_sprite_v1
core.isometric_humanoid_boss_v1
core.item_icon_v1
core.environment_prop_v1
core.tileset_isometric_v1
core.vfx_sprite_sequence_v1
```

重大 workflow semantics 改變時建立新版本，不偷偷覆寫舊版本。

------------------------------------------------------------------------

# 11. Model Profile

Recipe 不直接綁 checkpoint filename。

建立：

``` text
ModelProfile
```

最低要記：

``` text
modelProfileId
engine
model family
license
commercial-use status
source
```

若 license 不清楚：

``` text
MODEL_LICENSE_BLOCKED
```

------------------------------------------------------------------------

# 12. Prompt Construction

Prompt 由：

``` text
PromptTemplate
+
StyleProfile
+
FactionProfile
+
RecipeVariables
```

組合。

Codex 不逐資產 commit 完整長 prompt。

------------------------------------------------------------------------

# 13. Candidate Count

普通資產：

``` text
3～4 candidates
```

Boss / important NPC：

``` text
4～8 candidates
```

避免一次生成大量近似候選。

------------------------------------------------------------------------

# 14. Seed Policy

探索可使用 random seed。

一旦 candidate 被批准，必須保存：

``` text
seed
workflowId
workflowVersion
modelProfileId
```

------------------------------------------------------------------------

# 15. POC First Rule

在完整 Vertical Slice 資產生產前，只做：

``` text
1. Player Prototype
2. Example Faction Blade Soldier
3. Boss Character
```

這三個必須完整跑：

``` text
Recipe
→ Generate
→ Dedup
→ Review
→ Cleanup
→ runtime engine
→ Manifest
```

------------------------------------------------------------------------

# 16. POC Purpose

Player： - 確認角色比例、camera、readability

Example Faction Blade Soldier： - 確認普通敵人的 faction visual language

Boss Character： - 確認 Boss scale、silhouette、identity

------------------------------------------------------------------------

# 17. POC Animation Minimum

至少：

``` text
idle
walk
attack
hit
death
```

Caster 才需要：

``` text
cast
```

方向由 `AnimationContract` 決定。

------------------------------------------------------------------------

# 18. Art Direction Gate

POC 進 runtime engine 後人工確認：

``` text
camera
sprite scale
tile scale
palette
outline
lighting
animation timing
boss scale
```

全部通過後才標：

``` text
ART_DIRECTION_FROZEN_V1
```

------------------------------------------------------------------------

# 19. No Mass Production Before Freeze

Freeze 前禁止大量生成：

``` text
30 NPC
100 props
200 icons
all production zones full asset set
```

------------------------------------------------------------------------

# 20. Candidate Output

每個 Recipe：

``` text
art/generated/{assetRecipeId}/
```

包含：

``` text
candidate_01.png
candidate_02.png
candidate_03.png
metadata.json
```

Gameplay Task 不讀此資料夾。

------------------------------------------------------------------------

# 21. Candidate Metadata

至少：

``` text
recipeId
candidateId
seed
workflowId
workflowVersion
modelProfileId
dimensions
createdAt
```

------------------------------------------------------------------------

# 22. Automatic Candidate Checks

生成後先檢查：

``` text
file exists
correct dimensions
not blank
not corrupt
alpha/transparency
subject not badly cropped
```

------------------------------------------------------------------------

# 23. Dedup Pipeline

候選進：

``` text
imagededup
```

Exact duplicate： - 自動去除重複副本

Near duplicate： - group - 人工選最佳 candidate

------------------------------------------------------------------------

# 24. Candidate Review

Human / asset QA 檢查：

``` text
silhouette
weapon
armor
faction identity
camera
scale
anatomy
background
consistency
```

Historical Boss 一律人工選，不可 auto-final。

------------------------------------------------------------------------

# 25. Pixelorama Cleanup

選定後進 Pixelorama：

``` text
background cleanup
edge cleanup
palette normalization
frame alignment
sprite-sheet assembly
animation correction
```

建議保存可編輯 source 到：

``` text
art/source/
```

------------------------------------------------------------------------

# 26. Animation Consistency Gate

各方向 / frames 必須保持：

``` text
same weapon
same armor
same scarf/headwear
same body proportion
same palette
```

不一致：

``` text
NEEDS_CLEANUP / REJECT
```

------------------------------------------------------------------------

# 27. Sprite Sheet Assembly

由固定 `AnimationContract` 控制：

``` text
directions
frame count
fps
animation names
hit/effect frames
```

不要每角色自訂 sheet layout。

------------------------------------------------------------------------

# 28. runtime engine Import

Approved source 放：

``` text
art/approved/
```

轉成：

``` text
SpriteFrames
AtlasTexture
Texture2D
AudioStream
```

依 asset type 決定。

Gameplay 綁定 Stable VisualId，不直接綁 PNG path。

------------------------------------------------------------------------

# 29. runtime engine Import Automation

建議實作：

``` text
asset-import
```

根據：

``` text
AssetManifest
AnimationContract
OutputProfile
```

建立/更新 runtime engine runtime resources。

------------------------------------------------------------------------

# 30. Asset Validation

匯入後執行：

``` text
validate-assets
```

至少檢查：

``` text
manifest schema
recipe reference
runtime resource exists
animation contract exists
required animation names
dimensions
asset type compatibility
```

------------------------------------------------------------------------

# 31. Manifest Update Rule

只有：

``` text
approved_prototype
approved_final
```

才可進正式 `ASSET_MANIFEST`。

------------------------------------------------------------------------

# 32. VisualId Stability

資產 v2：

``` text
sourceRecipeId changes
runtimeResource changes
version increments
```

Gameplay `visualId` 不變。

------------------------------------------------------------------------

# 33. Vertical Slice Production Order

Art Direction Freeze 後：

``` text
Wave 1
Player + core Example Faction enemies

Wave 2
Elite Character + Boss Character

Wave 3
Civilian + merchants

Wave 4
Zone A/Zone B/Zone C environment

Wave 5
Hub Zone town

Wave 6
Dungeon Zone cave / ritual props

Wave 7
Icons / VFX
```

------------------------------------------------------------------------

# 34. Vertical Slice Character Minimum

``` text
player
example_faction_recruit
example_faction_blade
example_faction_archer
example_faction_strongman
taiping_believer
example_faction_caster
example_faction_guardian
deng_mao
cheng_yuanzhi
villager
merchant
blacksmith
```

------------------------------------------------------------------------

# 35. Environment Minimum

``` text
village_house
well
wood_fence
cart
grain_sack
field_crop_props
example_faction_banner
burned_village_prop
market_stall
town_facade
cave_props
altar
torch
crate
```

------------------------------------------------------------------------

# 36. Icon Minimum

``` text
potion
silver
basic_weapon
basic_armor
example_faction_cloth
taiping_paper
deng_mao_weapon
cheng_yuanzhi_weapon
```

------------------------------------------------------------------------

# 37. VFX Minimum

``` text
melee_hit
arrow
caster_projectile
heal
stun
event_indicator
boss_telegraph
```

------------------------------------------------------------------------

# 38. Reuse Before Generate

優先：

``` text
existing approved asset
↓
existing asset variant
↓
palette/equipment variant
↓
new Recipe
```

普通兵可共用 family visuals/variants。

Boss 必須保持 canonical unique visual。

------------------------------------------------------------------------

# 39. VFX Reuse

技能優先 reference reusable VFX IDs。

例如：

``` text
core.vfx_melee_hit
core.vfx_lightning_ground
```

不要每個技能重新生成。

------------------------------------------------------------------------

# 40. UI Asset Policy

AI 只生成：

``` text
icons
ornaments
frames
textures
```

Inventory / Market / Guild layout 由 runtime engine Control
組合，不生成成單一巨型 bitmap。

------------------------------------------------------------------------

# 41. Asset CLI

建議：

``` text
asset-generate recipe <assetRecipeId>
asset-generate queue <queueId>
asset-generate recipe <assetRecipeId> --dry-run
asset-dedup <path>
asset-import <assetId>
asset-manifest-check
```

------------------------------------------------------------------------

# 42. Dry Run

`--dry-run` 只輸出：

``` text
workflow
model profile
seed
candidate count
output path
```

不進行生成。

------------------------------------------------------------------------

# 43. Compact Output

Codex 預設只取得：

``` text
Generated: 4
Failed: 0
Dedup groups: 3
Review required: YES
```

完整 ComfyUI logs 寫檔，不全部進 context。

------------------------------------------------------------------------

# 44. Failure Handling

Generation fail：

回報：

``` text
recipeId
workflowId
error summary
```

自動 retry 最多：

``` text
1～2 次
```

禁止無限 generation loop。

------------------------------------------------------------------------

# 45. Generation Cache

Cache key 建議：

``` text
recipeId
workflowVersion
modelProfileId
seed
```

已有成功 output 時預設不重生。

要重生需：

``` text
--force
```

------------------------------------------------------------------------

# 46. Codex Asset Workflow

``` text
1. Search AssetManifest
2. Reuse if possible
3. Create/update AssetRecipe
4. Validate Recipe
5. Queue generation
6. Run local ComfyUI
7. Dedup
8. Human select
9. Pixelorama cleanup
10. runtime engine import
11. validate-assets
12. Update Manifest
13. Bind VisualId
```

------------------------------------------------------------------------

# 47. Human Decision Points

人工必須決定：

``` text
POC approval
Historical Boss candidate selection
Art Direction Freeze
final asset approval
```

自動化可以決定：

``` text
schema validity
dimensions
duplicate detection
resource existence
animation names
```

------------------------------------------------------------------------

# 48. No Paid Fallback

如果本地 pipeline unavailable：

``` text
STOP
ASSET_PIPELINE_BLOCKED
```

不可自動切換付費 API。

------------------------------------------------------------------------

# 49. Hardware Constraint

若 GPU 不足：

允許：

``` text
lower batch size
lower working resolution
lighter ModelProfile
static prototype first
```

不得因此更改 gameplay schema。

------------------------------------------------------------------------

# 50. Placeholder Rule

Pipeline 尚未 ready 時可使用：

``` text
simple hand-made / procedural placeholder
```

標記：

``` text
approved_prototype
```

Gameplay 綁 Stable VisualId，日後替換 Manifest 即可。

------------------------------------------------------------------------

# 51. CI Policy

CI 不重新執行 image generation。

CI 只做：

``` text
validate recipes
validate manifests
check runtime resources
validate animation contracts
```

生成 pipeline 與 build pipeline 分離。

------------------------------------------------------------------------

# 52. Provenance

每個 approved generated asset 必須記：

``` text
recipeId
workflowId
workflowVersion
modelProfileId
seed
humanEdited
license
```

------------------------------------------------------------------------

# 53. Commercial Use Gate

任何：

``` text
model
LoRA
reference asset
external texture
```

若商用權利不清楚：

``` text
LICENSE_BLOCKED
```

------------------------------------------------------------------------

# 54. Example Faction Generation Queues

第一批：

``` text
YT_ASSET_POC_001
- Player
- Blade Soldier
- Boss Character
```

第二批：

``` text
YT_ASSET_CORE_ENEMIES_001
- Recruit
- Archer
- Strongman
- Believer
- Caster
- Guardian
```

第三批：

``` text
YT_ASSET_BOSS_CIVILIAN_001
- Elite Character
- Villager
- Merchant
- Blacksmith
```

Environment：

``` text
YT_ENV_Zone A_Zone C_001
YT_ENV_Hub Zone_001
YT_ENV_Dungeon Zone_001
```

另有：

``` text
YT_ICON_SLICE_001
YT_VFX_SLICE_001
```

------------------------------------------------------------------------

# 55. Pipeline Definition of Done

第一階段必須：

``` text
ComfyUI local works
Recipe → Queue works
local model works
candidates generated
dedup works
Pixelorama cleanup usable
runtime engine import works
validate-assets works
Manifest update works
No paid API required
```

------------------------------------------------------------------------

# 56. POC Definition of Done

``` text
Player
Blade Soldier
Boss Character
```

全部：

``` text
approved_prototype
```

並能在 runtime engine preview / Vertical Slice scene 正常：

``` text
display
move
attack
play death animation
```

------------------------------------------------------------------------

# 57. Immediate Codex Execution Order

資產 tooling 可與 Production Integrity Gate 平行準備：

``` text
1. Verify ComfyUI local availability
2. Create WorkflowRegistry
3. Create ModelProfile
4. Implement GenerationQueue schema
5. Implement Recipe → ComfyUI adapter
6. Implement compact generation CLI
7. Install/configure imagededup
8. Install/configure Pixelorama
9. Create runtime engine asset preview/import path
10. Create 3 POC Recipes
11. Generate Player / Blade Soldier / Boss Character
12. Human review in runtime engine
13. Freeze Art Direction v1 only if approved
```

------------------------------------------------------------------------

# 58. Codex Reporting Format

完成 setup 後只回報：

``` text
ComfyUI status
Local generation status
Model profile
Workflow registry status
Generation CLI status
Dedup status
Pixelorama status
runtime engine import status
POC assets generated
POC review required
Blockers
ASSET_PIPELINE_READY: YES/NO
```

------------------------------------------------------------------------

# 59. Forbidden

禁止：

``` text
default paid API fallback
one long natural-language prompt per frame
gameplay directly references raw PNG paths
mass generation before Art Direction Freeze
commit uncontrolled raw candidate explosion
auto-approve historical bosses
unknown model/license provenance
Codex recursively inspecting all raw candidates during gameplay tasks
```

------------------------------------------------------------------------

# 60. Final Rule

> **Recipe defines intent. Workflow defines how. Local generation
> creates candidates. Human review approves identity. Manifest defines
> what the game uses.**

Codex 應把 token 花在：

``` text
What asset is needed?
What gameplay role does it serve?
What constraints must it satisfy?
```

而不是反覆重寫：

``` text
same camera
same art style
same dimensions
same animation structure
same output rules
```

這些固定事項全部交給：

``` text
StyleProfile
AnimationContract
OutputProfile
Workflow
AssetManifest
```
