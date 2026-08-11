# ASSET_MANIFEST.md --- Generic Runtime Asset Manifest

> Generic Asset Bootstrap\
> This document is project-agnostic. Adapt engine-specific paths, asset
> types, animation contracts, and import rules to the target
> repository.\
> Do not introduce project lore, character names, zone IDs, or
> product-specific assumptions into this shared template.

**Document:** `ASSET_MANIFEST.md`\
**Machine Schema:** `asset_manifest.schema.json`\
**Scope:** Runtime visual/audio asset bindings used by gameplay/content
definitions\
**Primary Goal:**
將「資產如何生成」與「遊戲目前正式使用哪一份資產」完全分離，讓 Gameplay
Content 只 reference 穩定 `VisualId` / `AssetId`，而不直接依賴 raw
PNG、sprite sheet、ComfyUI output 或 source file path。

------------------------------------------------------------------------

# 1. Core Principle

正式資產鏈：

``` text
AssetRecipe
↓
Generated Candidates
↓
Review / Cleanup
↓
Approved Asset
↓
ASSET_MANIFEST
↓
Stable VisualId / AssetId
↓
Gameplay Content
```

Gameplay Content 不應知道：

``` text
ComfyUI seed
candidate filename
Pixelorama working file
raw PNG
source model
generation workflow detail
```

Gameplay 只需要：

``` text
visualId
audioId
runtimeResource
```

------------------------------------------------------------------------

# 2. Manifest vs Recipe

## AssetRecipe

描述：

> **怎麼產生資產**

包含：

``` text
workflow
prompt template
style profile
seed
variant
post-process
generation provenance
```

## AssetManifest

描述：

> **遊戲目前採用哪一個已批准 runtime asset**

包含：

``` text
assetId
visualId / audioId
sourceRecipeId
runtimeResource
status
animation contract
version
provenance summary
```

兩者不可混用。

------------------------------------------------------------------------

# 3. Canonical Files

建議：

``` text
art/
├── manifests/
│   ├── asset_manifest.json
│   └── asset_manifest.schema.json
├── recipes/
├── workflows/
├── generated/
├── approved/
└── source/
```

本文件：

``` text
docs/production/ASSET_MANIFEST.md
```

------------------------------------------------------------------------

# 4. Manifest Root

`asset_manifest.json`：

``` json
{
  "schemaVersion": 1,
  "manifestVersion": "0.1.0",
  "assets": []
}
```

------------------------------------------------------------------------

# 5. Asset Identity

每個正式資產要有：

``` text
assetId
```

Canonical：

``` text
namespace.asset_name
```

例如：

``` text
example_faction.visual_blade_soldier
example_faction.visual_cheng_yuanzhi
example_faction.icon_example_faction_cloth
core.vfx_lightning_ground
core.ui_icon_market
```

------------------------------------------------------------------------

# 6. Stable ID Rule

一旦 `assetId` / `visualId` 進入 gameplay content：

不可因美術更新直接 rename。

正確：

``` text
example_faction.visual_blade_soldier
```

runtime resource 從：

``` text
blade_soldier_v1.tres
```

換成：

``` text
blade_soldier_v2.tres
```

Gameplay NPC definition 不改。

------------------------------------------------------------------------

# 7. Manifest Entry

Canonical：

``` json
{
  "assetId": "example_faction.visual_blade_soldier",
  "assetType": "character_sprite",
  "sourceRecipeId": "example_faction.character_blade_soldier_v1",
  "runtimeResource": "runtime://art/approved/characters/example_faction/blade_soldier.tres",
  "status": "approved_prototype",
  "version": 1,
  "animationContractId": "core.humanoid_melee_8dir_v1",
  "outputProfileId": "core.output_character_128_v1",
  "tags": [
    "example_faction",
    "humanoid",
    "melee"
  ]
}
```

------------------------------------------------------------------------

# 8. AssetType Enum

與 `ASSET_RECIPE_SCHEMA.md` 對齊：

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
audio
music
```

------------------------------------------------------------------------

# 9. Status Enum

Canonical：

``` text
approved_prototype
approved_final
deprecated
disabled
```

只有：

``` text
approved_prototype
approved_final
```

可被 runtime registry 正常使用。

------------------------------------------------------------------------

# 10. Runtime Resource

runtime engine runtime assets：

``` text
runtime://...
```

例如：

``` text
runtime://art/approved/characters/example_faction/cheng_yuanzhi.tres
runtime://art/approved/icons/example_faction_cloth.png
runtime://audio/boss/cheng_yuanzhi_spawn.ogg
```

Gameplay data 只 reference asset ID，不 reference path。

------------------------------------------------------------------------

# 11. VisualId Mapping

對視覺資產：

``` text
assetId == visualId
```

可直接統一。

例如：

``` json
{
  "visualId": "example_faction.visual_cheng_yuanzhi"
}
```

Manifest 查：

``` text
visualId
↓
runtimeResource
```

------------------------------------------------------------------------

# 12. AudioId Mapping

音效同理：

``` text
core.audio_item_pickup
example_faction.audio_cheng_yuanzhi_spawn
```

------------------------------------------------------------------------

# 13. Source Recipe

AI / procedural generated asset 必須有：

``` text
sourceRecipeId
```

手工資產可：

``` text
sourceRecipeId omitted
```

但要填：

``` text
sourceType = hand_authored
```

------------------------------------------------------------------------

# 14. SourceType Enum

``` text
generated
hand_authored
licensed_external
procedural
hybrid
```

------------------------------------------------------------------------

# 15. Version

Manifest entry：

``` json
{
  "version": 2
}
```

表示 asset binding revision。

不是 schemaVersion。

例如：

``` text
VisualId 不變
runtimeResource 改版
version 1 → 2
```

------------------------------------------------------------------------

# 16. Content Compatibility

若資產改版影響 animation contract：

必須：

``` text
update animationContractId
```

並跑 validator。

不能只換 sprite sheet，卻讓 runtime engine animation name 消失。

------------------------------------------------------------------------

# 17. Animation Contract Binding

Character 必須：

``` text
animationContractId
```

例如：

``` text
core.humanoid_melee_8dir_v1
```

Validator 檢查：

``` text
required animation names
directions
frame dimensions
```

------------------------------------------------------------------------

# 18. Output Profile Binding

可保存：

``` text
outputProfileId
```

例如：

``` text
core.output_character_128_v1
core.output_icon_64_v1
```

------------------------------------------------------------------------

# 19. Runtime Metadata

可附：

``` json
{
  "runtime": {
    "pivot": {
      "x": 64,
      "y": 108
    },
    "scale": 1.0
  }
}
```

但 gameplay critical 碰撞仍不應只存在美術資產裡。

------------------------------------------------------------------------

# 20. Character Asset Entry

``` json
{
  "assetId": "example_faction.visual_cheng_yuanzhi",
  "assetType": "character_sprite",
  "sourceType": "generated",
  "sourceRecipeId": "example_faction.cheng_yuanzhi_v1",
  "runtimeResource": "runtime://art/approved/characters/example_faction/cheng_yuanzhi.tres",
  "status": "approved_prototype",
  "version": 1,
  "animationContractId": "core.humanoid_boss_melee_8dir_v1",
  "outputProfileId": "core.output_character_boss_160_v1",
  "tags": [
    "example_faction",
    "historical_boss"
  ]
}
```

------------------------------------------------------------------------

# 21. Icon Entry

``` json
{
  "assetId": "example_faction.icon_example_faction_cloth",
  "assetType": "item_icon",
  "sourceType": "generated",
  "sourceRecipeId": "example_faction.icon_example_faction_cloth_v1",
  "runtimeResource": "runtime://art/approved/icons/example_faction_cloth.png",
  "status": "approved_prototype",
  "version": 1,
  "outputProfileId": "core.output_icon_64_v1"
}
```

------------------------------------------------------------------------

# 22. Prop Entry

``` json
{
  "assetId": "example_faction.prop_wooden_barricade",
  "assetType": "environment_prop",
  "sourceType": "generated",
  "sourceRecipeId": "example_faction.prop_wooden_barricade_v1",
  "runtimeResource": "runtime://art/approved/props/example_faction/wooden_barricade.tres",
  "status": "approved_prototype",
  "version": 1
}
```

------------------------------------------------------------------------

# 23. VFX Entry

``` json
{
  "assetId": "core.vfx_lightning_ground",
  "assetType": "vfx_sprite",
  "sourceType": "generated",
  "sourceRecipeId": "core.vfx_lightning_ground_v1",
  "runtimeResource": "runtime://art/approved/vfx/lightning_ground.tres",
  "status": "approved_prototype",
  "version": 1,
  "animationContractId": "core.vfx_nonloop_12f_v1"
}
```

------------------------------------------------------------------------

# 24. Audio Entry

``` json
{
  "assetId": "example_faction.audio_cheng_yuanzhi_spawn",
  "assetType": "audio",
  "sourceType": "hand_authored",
  "runtimeResource": "runtime://audio/boss/cheng_yuanzhi_spawn.ogg",
  "status": "approved_prototype",
  "version": 1
}
```

------------------------------------------------------------------------

# 25. Provenance

Generated / licensed asset 應有：

``` json
{
  "provenance": {
    "workflowId": "core.isometric_humanoid_boss_v1",
    "modelProfileId": "local.image_model_profile_01",
    "seed": 184602,
    "generatedAt": "2026-08-11T00:00:00Z",
    "humanEdited": true
  }
}
```

------------------------------------------------------------------------

# 26. License Metadata

至少可記：

``` json
{
  "license": {
    "sourceLicenseId": "local-generated",
    "commercialUseAllowed": true,
    "attributionRequired": false
  }
}
```

------------------------------------------------------------------------

# 27. Source Asset Tracking

可附：

``` json
{
  "sourceFiles": [
    "art/source/example_faction/cheng_yuanzhi.pixelorama"
  ]
}
```

Codex gameplay task 不需要讀 sourceFiles。

------------------------------------------------------------------------

# 28. Approved Asset Rule

`approved_prototype`：

``` text
可以進 Vertical Slice
```

`approved_final`：

``` text
可以進正式公開版本
```

------------------------------------------------------------------------

# 29. Deprecated Asset

舊 runtime resource：

``` text
status = deprecated
```

如果仍有舊 content reference：

應提供 replacement：

``` json
{
  "replacementAssetId": "example_faction.visual_blade_soldier"
}
```

------------------------------------------------------------------------

# 30. Disabled Asset

``` text
disabled
```

表示 validator 可讀，但 runtime 不應載入。

------------------------------------------------------------------------

# 31. Missing Asset Fallback

可定義一個：

``` text
core.visual_missing_asset
```

僅用於 Development / Prototype 防 crash。

Production validation：

不允許正式 gameplay content 留 Missing Asset。

------------------------------------------------------------------------

# 32. Manifest Registry

runtime engine / Client 應建：

``` text
AssetManifestRegistry
```

用途：

``` text
assetId
→ runtimeResource
```

Gameplay systems 不自己讀 JSON。

------------------------------------------------------------------------

# 33. Registry Immutability

Runtime manifest 載入後視為 immutable。

Hot reload：

``` text
not required v1
```

------------------------------------------------------------------------

# 34. Client-Only Ownership

Visual/audio Manifest：

通常由 Client 使用。

Server gameplay authority 不依賴：

``` text
sprite
audio
animation file
```

Server 可知道 visualId 作 presentation message，但不靠它算 combat。

------------------------------------------------------------------------

# 35. Content Binding

NPC：

``` json
{
  "visualId": "example_faction.visual_blade_soldier"
}
```

Item：

``` json
{
  "iconId": "example_faction.icon_example_faction_cloth"
}
```

Skill：

``` json
{
  "vfxId": "core.vfx_lightning_ground"
}
```

------------------------------------------------------------------------

# 36. No Raw Path in Gameplay Content

禁止：

``` json
{
  "visualPath": "runtime://art/xxx.png"
}
```

Gameplay content 只能：

``` json
{
  "visualId": "..."
}
```

------------------------------------------------------------------------

# 37. Asset Search Rule for Codex

Gameplay Task：

``` text
search assetId
↓
read manifest entry
↓
bind visualId
```

不要：

``` text
browse art/approved
browse generated PNGs
```

------------------------------------------------------------------------

# 38. Manifest Compactness

日常 Codex context 最重要欄位：

``` text
assetId
assetType
runtimeResource
status
version
animationContractId
sourceRecipeId
```

Provenance/License 只有 asset task 需要完整讀。

------------------------------------------------------------------------

# 39. Validation CLI

建議：

``` text
validate-assets
```

至少檢查：

-   JSON Schema
-   duplicate assetId
-   runtimeResource exists
-   allowed status
-   sourceRecipe exists if generated
-   animation contract exists
-   output profile exists
-   replacement exists
-   no production content references disabled asset
-   no final content references missing placeholder

------------------------------------------------------------------------

# 40. Manifest Cross-Validation

需跟：

``` text
CONTENT_SCHEMA
ASSET_RECIPE_SCHEMA
```

交叉驗證。

例如：

``` text
NpcDefinition.visualId
→ AssetManifest assetId exists
→ character_sprite
```

------------------------------------------------------------------------

# 41. Type Compatibility

如果 NPC：

``` text
visualId
```

指到：

``` text
item_icon
```

Validator fail。

Item.iconId：

只能：

``` text
item_icon / ui_icon
```

Skill.vfxId：

只能：

``` text
vfx_sprite / world_effect
```

------------------------------------------------------------------------

# 42. Animation Validation

Character asset：

必須符合 animation contract。

至少檢查：

``` text
idle
walk
attack
hit
death
```

若 Caster：

``` text
cast
```

------------------------------------------------------------------------

# 43. Boss Visual Gate

Historical Boss：

``` text
Elite Character
Boss Character
張梁
張寶
```

不得綁普通兵同一 VisualId。

可以共享 animation contract，但不能共享 canonical boss visual。

------------------------------------------------------------------------

# 44. Example Faction Vertical Slice Manifest Minimum

Vertical Slice 至少需要：

## Player

-   [ ] player prototype visual

## Example Faction

-   [ ] recruit
-   [ ] blade soldier
-   [ ] archer
-   [ ] heavy / strongman
-   [ ] believer
-   [ ] caster
-   [ ] guardian elite

## Boss

-   [ ] Elite Character
-   [ ] Boss Character

## Civilian

-   [ ] villager
-   [ ] merchant
-   [ ] blacksmith

## Environment

-   [ ] village house
-   [ ] farmland props
-   [ ] example faction banner
-   [ ] market stall
-   [ ] cave props
-   [ ] altar

## Icons

-   [ ] potion
-   [ ] silver
-   [ ] example faction token
-   [ ] taiping paper
-   [ ] Elite Character weapon
-   [ ] Boss Character weapon

## VFX

-   [ ] melee hit
-   [ ] arrow
-   [ ] caster projectile
-   [ ] stun
-   [ ] boss telegraph

------------------------------------------------------------------------

# 45. Asset Count Summary

Validator 應輸出：

``` text
Total assets
Approved prototype
Approved final
Deprecated
Disabled
By asset type
Missing runtime resources
Missing recipes
Missing animation contracts
```

------------------------------------------------------------------------

# 46. Production Asset Freeze

Vertical Slice 確認 camera / scale / animation contract 後：

標：

``` text
ASSET_MANIFEST_V1_FROZEN
```

Freeze 後：

``` text
VisualId 不任意 rename
Animation contract 不隨意破壞
```

------------------------------------------------------------------------

# 47. Manifest Version

Root：

``` json
{
  "manifestVersion": "0.1.0"
}
```

規則：

``` text
patch
= asset binding/content fix

minor
= add new assets

major
= incompatible manifest semantics
```

------------------------------------------------------------------------

# 48. Runtime Cache

Client 可建立：

``` text
assetId → loaded Resource
```

避免每次查檔。

------------------------------------------------------------------------

# 49. Lazy Loading

Large world assets 可：

``` text
lazy load by zone / content package
```

Manifest 本身仍可一次載 compact metadata。

------------------------------------------------------------------------

# 50. Package Tag

可加：

``` json
{
  "packageId": "example_faction"
}
```

方便：

``` text
preload assets for Zone A/Zone B/Zone C
```

------------------------------------------------------------------------

# 51. Zone Asset Bundle

可由 tooling 從 content reference 自動建立：

``` text
Dungeon Zone
↓
NPC visualIds
Boss visualId
VFX
Props
Icons
↓
bundle/preload list
```

不要手工維護第二套 list。

------------------------------------------------------------------------

# 52. Asset Dependency Graph

可從：

``` text
Content
→ VisualId
→ Manifest
→ runtimeResource
```

產出依賴圖。

這也適合 Graphify / tooling。

------------------------------------------------------------------------

# 53. Manifest Does Not Store Gameplay Balance

禁止在 Manifest 存：

``` text
HP
damage
drop rate
boss level
```

AssetManifest 只管理 presentation/runtime asset。

------------------------------------------------------------------------

# 54. Manifest Does Not Store Prompts

完整 prompts：

屬於：

``` text
Recipe / generation cache
```

不放 AssetManifest。

------------------------------------------------------------------------

# 55. Manifest Does Not Store Candidate Lists

候選圖：

``` text
generated metadata
```

不放正式 Manifest。

Manifest 只指向 selected approved asset。

------------------------------------------------------------------------

# 56. Manual Review Metadata

可附：

``` json
{
  "review": {
    "approvedBy": "human",
    "approvedAt": "2026-08-11T00:00:00Z",
    "notes": "Prototype approved for Vertical Slice."
  }
}
```

------------------------------------------------------------------------

# 57. Historical Boss Review Rule

Boss 必須人工核准：

``` text
approvedBy != auto
```

------------------------------------------------------------------------

# 58. Build Failure Rule

若正式 Content reference：

``` text
assetId missing
runtimeResource missing
wrong type
disabled
```

Vertical Slice build/validation fail。

------------------------------------------------------------------------

# 59. Prototype Missing Asset Rule

Development 可以：

``` text
warning + missing placeholder
```

但：

``` text
PLAYTESTED milestone
```

不允許核心角色/怪/Boss 使用 missing placeholder。

------------------------------------------------------------------------

# 60. Asset Manifest Example

``` json
{
  "schemaVersion": 1,
  "manifestVersion": "0.1.0",
  "assets": [
    {
      "assetId": "example_faction.visual_blade_soldier",
      "assetType": "character_sprite",
      "sourceType": "generated",
      "sourceRecipeId": "example_faction.character_blade_soldier_v1",
      "runtimeResource": "runtime://art/approved/characters/example_faction/blade_soldier.tres",
      "status": "approved_prototype",
      "version": 1,
      "animationContractId": "core.humanoid_melee_8dir_v1",
      "outputProfileId": "core.output_character_128_v1",
      "packageId": "example_faction",
      "tags": [
        "example_faction",
        "humanoid",
        "melee"
      ]
    }
  ]
}
```

------------------------------------------------------------------------

# 61. Codex Workflow --- Bind NPC Visual

``` text
NpcDefinition needs visual
↓
Search AssetManifest
↓
Existing compatible visual?
├─ YES → bind visualId
└─ NO
   ↓
Create AssetRecipe
   ↓
Generate / review
   ↓
Add approved manifest entry
   ↓
bind visualId
```

------------------------------------------------------------------------

# 62. Codex Workflow --- Asset Upgrade

``` text
Existing VisualId
↓
New Recipe v2
↓
Generate
↓
Approve
↓
Manifest runtimeResource/version update
↓
Gameplay content unchanged
```

------------------------------------------------------------------------

# 63. ASSET_MANIFEST Definition of Done

必須能回答：

``` text
Can gameplay content reference a stable asset ID without knowing file paths?
YES

Can art be regenerated/upgraded without changing NPC gameplay data?
YES

Can generated assets retain recipe/provenance/license traceability?
YES

Can validators detect missing, disabled, or wrong-type assets before playtest?
YES

Can Codex find approved assets without browsing raw generated images?
YES
```

------------------------------------------------------------------------

# 64. Immediate Implementation

下一步：

``` text
1. Add asset_manifest.schema.json
2. Add asset_manifest.json
3. Implement AssetManifestRegistry
4. Implement validate-assets
5. Add cross-validation with CONTENT_SCHEMA
6. Create first Vertical Slice manifest entries
7. Bind first NPC VisualIds
```

------------------------------------------------------------------------

# 65. Final Rule

> **AssetRecipe answers "how do we create it?"**

> **AssetManifest answers "what does the game use right now?"**

Gameplay 永遠綁：

``` text
Stable Asset ID
```

而不是 raw generated files。
