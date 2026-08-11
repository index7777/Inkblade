# CODEX_PROJECT_BOOTSTRAP.md

## Universal Codex Project Bootstrap

**Purpose:**  
為任何既有或全新軟體專案建立一致、低 Token、可審計、可擴充的 Codex 開發環境。

本文件不假設：

- Programming language
- Framework
- Database
- Frontend technology
- Backend technology
- Game engine
- Deployment platform
- Repository architecture

Codex 必須先偵測 Repository，再決定如何導入工具。

---

# 1. Bootstrap Goals

Bootstrap 完成後，專案應具備：

```text
Codex
├── Project Instructions
│   └── AGENTS.md
│
├── Semantic Code Navigation
│   └── Serena
│
├── Architecture / Dependency Discovery
│   └── Graphify
│
├── Exact Search
│   ├── rg
│   ├── jq
│   └── project-native tools
│
├── Verification
│   ├── Build
│   ├── Unit Tests
│   ├── Integration Tests
│   └── Validation
│
└── Optional Asset Production
    ├── AssetRecipe
    ├── Local Generation
    ├── Dedup
    ├── Cleanup
    ├── Manifest
    └── Runtime Import
```

核心原則：

> Graph-first for architecture.  
> Symbol-first for code.  
> Exact-search for identifiers.  
> Tests for truth.

---

# 2. Bootstrap Modes

Codex 必須先判斷：

```text
EXISTING_PROJECT
```

或：

```text
GREENFIELD_PROJECT
```

判斷依據：

```text
source files
project files
build configuration
tests
git history
existing documentation
```

如果 Repository 已經存在實際產品程式碼：

```text
EXISTING_PROJECT
```

如果 Repository 幾乎為空：

```text
GREENFIELD_PROJECT
```

---

# 3. Global Safety Rule

Bootstrap 階段不得修改產品功能。

禁止：

```text
feature implementation
gameplay changes
business logic changes
architecture rewrite
database redesign
UI redesign
content rewrite
balance changes
```

Bootstrap 只能修改：

```text
tooling
tool configuration
documentation
ignore rules
development scripts
optional asset tooling
```

---

# 4. Existing Project Golden Rule

既有專案：

> Detect before changing.

不得因本文件建議某個目錄或 class 名稱，就強迫既有 Repository 改成該形式。

優先：

```text
adapt tooling to repository
```

而不是：

```text
adapt repository to tooling
```

---

# 5. Greenfield Golden Rule

全新專案：

> Establish conventions before repository growth.

在大量功能程式碼產生前先建立：

```text
AGENTS.md
build
tests
Serena
Graphify
ignore rules
documentation structure
```

---

# 6. Phase 0 — Read Project Instructions

第一個動作：

```text
Read AGENTS.md
```

如果不存在：

```text
create minimal AGENTS.md
```

如果已存在：

```text
preserve existing valid rules
```

禁止直接覆蓋。

---

# 7. Phase 1 — Repository Detection

先偵測：

```text
languages
frameworks
package managers
build systems
test frameworks
database technology
client/server structure
deployment configuration
content/data directories
asset directories
generated directories
cache directories
vendor directories
```

---

# 8. Detection Strategy

優先讀：

```text
project manifests
solution files
package manifests
build files
README
directory names
CI configuration
```

例如：

```text
*.sln
*.csproj
package.json
pyproject.toml
Cargo.toml
go.mod
pom.xml
build.gradle
CMakeLists.txt
project.godot
Dockerfile
docker-compose.yml
```

---

# 9. Repository Exploration Rule

禁止：

```text
cat every file
recursive source dump
recursive docs dump
read every markdown file
read every generated file
```

先建立：

```text
Repository Shape
```

再深入必要 subsystem。

---

# 10. Generated / Vendor Detection

至少辨識：

```text
bin
obj
dist
build
coverage
node_modules
vendor
.cache
tmp
generated
art/generated
```

依專案實際結構調整。

---

# 11. Phase 2 — Serena Installation

檢查：

```text
Serena installed?
```

如果沒有：

依目前官方 Serena 支援的安裝方式安裝。

不要假設本文件中的歷史 CLI 永遠正確。

---

# 12. Serena Initialization

初始化目前 Repository。

選擇與實際語言相符的 semantic backend。

例如可能包括：

```text
C#
Python
TypeScript
JavaScript
Java
Go
Rust
C/C++
GDScript
```

實際支援狀態以目前 Serena 版本為準。

---

# 13. Serena Ignore Rules

排除：

```text
build output
generated code when unnecessary
vendor
dependency cache
large binary assets
generated images
temporary files
```

不要排除真正需要 semantic navigation 的 source。

---

# 14. Serena Smoke Test

選擇一個實際核心 symbol。

執行：

```text
Find Symbol
↓
Find References
↓
Read Symbol Body
```

必須確認：

```text
symbol lookup works
references work
body retrieval works
```

成功：

```text
SERENA_READY
```

---

# 15. Serena Usage Policy

日常 Codex 工作：

```text
Known class/function
→ Serena

Find callers/references
→ Serena

Inspect implementation
→ Serena

Targeted refactor
→ Serena
```

不要因為 Serena 存在就讀整個 Repository。

---

# 16. Phase 3 — Graphify Installation

檢查：

```text
Graphify installed?
```

如果沒有：

依目前官方 Graphify 支援方式安裝。

如果支援 project-scoped Codex integration：

優先 project-scoped。

---

# 17. Graphify Ignore Rules

排除：

```text
build
cache
vendor
generated assets
binary assets
temporary output
```

但保留：

```text
source
tests
schema
migrations
supported structured files
```

---

# 18. Build Repository Graph

建立第一份 graph。

記錄：

```text
nodes
edges
communities
unsupported files
warnings
```

Unsupported file 不自動視為 blocker。

---

# 19. Graphify Smoke Test

選一個核心 module/service。

測試：

```text
dependency query
affected query
blast radius
```

確認 Graphify 可以協助回答：

> 修改這個 subsystem，可能影響哪些地方？

成功：

```text
GRAPHIFY_READY
```

---

# 20. Graphify Usage Policy

使用：

```text
cross-subsystem changes
architecture discovery
large refactor
dependency investigation
blast-radius analysis
repository audit
```

小型 local change 不必每次跑 Graphify。

---

# 21. Serena vs Graphify

標準分工：

```text
Graphify
=
architecture / dependency / blast radius

Serena
=
symbol / references / implementation

rg
=
exact identifier / string

jq
=
JSON / structured content

tests
=
truth
```

---

# 22. Source of Truth

永遠：

```text
Source Code
+
Tests
+
Persistent Schema
```

高於：

```text
Graph inference
Documentation assumption
Codex assumption
```

---

# 23. Phase 4 — Token Efficiency Rules

將以下原則加入或合併進 `AGENTS.md`。

---

# 24. Architecture Discovery

未知 subsystem：

```text
Graphify
→ Serena
→ focused source
```

不要：

```text
recursive read
```

---

# 25. Symbol Discovery

已知：

```text
ClassName
MethodName
InterfaceName
```

直接 Serena。

不要先 grep 整個 repository。

---

# 26. Exact Identifier Search

已知：

```text
ContentId
ConfigKey
ProtocolName
ErrorCode
JSON field
```

使用：

```text
rg
jq
```

---

# 27. Minimal Context Rule

Codex 只讀完成當前工作需要的：

```text
symbols
files
tests
schemas
docs
```

---

# 28. Documentation Rule

不要預設：

```text
read all *.md
```

文件應有入口與 dependency。

---

# 29. Test Strategy

預設：

```text
focused test
↓
subsystem tests
↓
integration tests
↓
full suite when justified
```

---

# 30. Compact Output

Build/Test/Tooling 預設使用 compact output。

完整 log：

```text
write to file
```

Codex context 只保留：

```text
summary
failure
relevant stack
```

---

# 31. Phase 5 — Build Verification

偵測專案正式 build command。

執行：

```text
Build
```

記錄：

```text
success/failure
warnings
errors
```

不要為了讓 Bootstrap PASS 而忽略 compiler error。

---

# 32. Test Verification

偵測：

```text
unit tests
integration tests
end-to-end tests
content validation
schema validation
```

至少執行安全可執行的 tests。

---

# 33. Existing Project Audit

如果是：

```text
EXISTING_PROJECT
```

Bootstrap 後建立 compact：

```text
SUBSYSTEM_MAP.md
```

---

# 34. SUBSYSTEM_MAP Structure

每個 subsystem：

```text
Purpose
Core Symbols
Persistent State
Dependencies
Critical Invariants
Key Tests
```

保持 compact。

---

# 35. Audit Does Not Mean Refactor

Repository Audit 期間：

```text
observe
map
verify
report
```

不要：

```text
rewrite
clean up everything
fix unrelated bugs
modernize architecture
```

---

# 36. Optional Phase — Asset Pipeline Detection

如果專案：

```text
does not require generated visual assets
```

則：

```text
ASSET_PIPELINE = NOT_APPLICABLE
```

跳過以下 Asset phases。

---

# 37. Asset Pipeline Trigger

如果專案涉及：

```text
game art
sprites
icons
textures
concept art
environment assets
visual prototypes
```

則可以導入 Local Asset Pipeline。

---

# 38. Asset Pipeline Goal

預設：

```text
FREE / LOCAL FIRST
```

核心：

```text
AssetRecipe
↓
Generation Queue
↓
Local Generation
↓
Candidates
↓
Dedup
↓
Cleanup
↓
Runtime Import
↓
AssetManifest
```

---

# 39. Asset Tool Stack

預設可採：

```text
ComfyUI
local image model
imagededup
Pixelorama
runtime engine importer
```

實際工具可以依專案替換。

---

# 40. Paid API Policy

預設：

```text
NO AUTOMATIC PAID FALLBACK
```

Local generation 不可用：

```text
ASSET_PIPELINE_BLOCKED
```

除非使用者明確批准其他方案。

---

# 41. Asset Directories

通用建議：

```text
art/
├── recipes/
├── workflows/
├── models/
├── queues/
├── generated/
├── review/
├── source/
├── approved/
├── manifests/
└── cache/
```

既有專案不要強制搬成此結構。

---

# 42. AssetRecipe

每個生成資產先有：

```text
AssetRecipe
```

不要：

```text
generate first
name later
```

---

# 43. Asset Manifest

Runtime 不直接依賴 raw generated file。

應：

```text
Stable VisualId
→ Manifest
→ Runtime Resource
```

---

# 44. Local Generation

本地生成 engine 應支援：

```text
workflow version
model profile
seed
candidate count
output metadata
```

---

# 45. Model License Gate

每個正式使用的：

```text
model
LoRA
embedding
reference asset
external texture
```

必須確認：

```text
license
commercial use
restrictions
attribution
```

不明：

```text
LICENSE_BLOCKED
```

---

# 46. Asset POC Rule

不要一開始生成全部資產。

先選：

```text
1～3 representative assets
```

例如：

```text
main character
common object/enemy
high-value hero/boss
```

---

# 47. POC Purpose

用來鎖定：

```text
style
camera
scale
dimensions
palette
animation
output format
runtime import
```

---

# 48. Art Direction Freeze

POC 必須進實際 runtime 看。

通過人工 review 後：

```text
ART_DIRECTION_FROZEN_V1
```

Freeze 前禁止 mass generation。

---

# 49. Candidate Policy

一般：

```text
3～4 candidates
```

重要 asset：

```text
4～8 candidates
```

不要無限制生成。

---

# 50. Dedup

使用 duplicate / near-duplicate detection。

Exact duplicate：

```text
remove
```

Near duplicate：

```text
group for review
```

---

# 51. Cleanup

AI candidate 不直接視為 final。

依專案需求：

```text
Pixelorama
GIMP
Krita
Blender
other local tools
```

做人工 cleanup。

---

# 52. Asset Provenance

Approved asset 至少記：

```text
recipe
workflow
workflow version
model profile
seed
license
humanEdited
```

---

# 53. Asset CI Rule

CI 不重新跑 generation。

CI 只：

```text
validate recipes
validate manifests
validate runtime resources
validate schema
```

---

# 54. Asset Token Rule

Codex 平常只讀：

```text
Recipe
Manifest
Validation Summary
Queue Summary
```

不要：

```text
recursively inspect all generated candidates
read huge image metadata collections
dump workflow graphs into context
```

---

# 55. Phase 6 — Project Tooling Gate

Bootstrap 最終 Gate：

```text
PROJECT_TOOLING_READY
```

---

# 56. Required Gate Conditions

至少：

```text
AGENTS_READY
SERENA_READY
GRAPHIFY_READY
BUILD_VERIFIED
TESTS_VERIFIED
IGNORE_RULES_READY
```

如果 Asset Pipeline applicable：

```text
ASSET_PIPELINE_READY
```

或明確：

```text
ASSET_PIPELINE_BLOCKED
```

---

# 57. Existing Project Completion

既有專案完成後：

```text
Tooling Ready
↓
Repository Audit
↓
Subsystem Map
↓
Gap Analysis
↓
Implementation
```

不要直接從：

```text
Tooling Ready
```

跳：

```text
Large Refactor
```

---

# 58. Greenfield Completion

全新專案完成後：

```text
Tooling Ready
↓
Architecture Skeleton
↓
First Vertical Slice / Milestone
↓
Focused Implementation
```

---

# 59. Recommended AGENTS.md Tooling Rules

如果專案沒有相同規則，可加入：

```text
## Repository Exploration

- Use Graphify for architecture, dependency, and blast-radius discovery.
- Use Serena for symbol lookup, references, and targeted source inspection.
- Use exact search tools for known identifiers and structured data.
- Do not recursively dump the repository.
- Do not read every documentation file by default.
- Read the minimum source necessary for the current task.

## Verification

- Source and tests are authoritative.
- Run focused tests first.
- Run broader tests when the change radius justifies it.
- Keep build/test output compact.
- Never claim completion from code existence alone.

## Tooling

- Do not modify product behavior during tooling setup.
- Do not silently replace project architecture to fit tooling.
- Preserve existing repository conventions where valid.
```

---

# 60. Bootstrap Execution Command

When instructed to bootstrap this repository:

```text
Read AGENTS.md.
Read CODEX_PROJECT_BOOTSTRAP.md.

Determine EXISTING_PROJECT or GREENFIELD_PROJECT.

Execute the applicable bootstrap phases in order.

Do not modify product behavior.

Use current supported Serena and Graphify installation/configuration methods rather than blindly trusting historical CLI examples.

Preserve existing project conventions.

If visual asset generation is applicable, initialize the local/free asset pipeline but do not mass-generate assets before POC approval.

Stop when PROJECT_TOOLING_READY can be evaluated.
```

---

# 61. Final Codex Report

完成後只回報：

```text
PROJECT MODE:
EXISTING_PROJECT / GREENFIELD_PROJECT

STACK:
Languages:
Frameworks:
Build:
Tests:
Database:
Runtime:

SERENA:
Installed:
Version:
Backend:
Indexed:
Smoke Test:

GRAPHIFY:
Installed:
Version:
Nodes:
Edges:
Communities:
Smoke Test:

BUILD:
Status:

TESTS:
Status:
Passed:
Failed:
Skipped:

ASSET PIPELINE:
Applicable:
Local Generation:
POC Status:
License Status:

FILES ADDED/MODIFIED:

BLOCKERS:

PROJECT_TOOLING_READY:
YES / NO
```

---

# 62. Failure Policy

任何工具安裝失敗：

不要：

```text
fake success
skip silently
change product code
```

必須：

```text
report blocker
preserve repository state
```

---

# 63. Security Rule

Bootstrap 過程不得：

```text
commit secrets
print credentials
copy production credentials
connect to production database without explicit authorization
disable security checks
weaken TLS/authentication
```

---

# 64. Database Rule

如果 integration tests 需要 DB：

優先：

```text
dedicated test database
containerized database
ephemeral database
```

禁止預設使用 production database。

---

# 65. Dependency Installation Rule

新增 development dependency 前確認：

```text
why needed
scope
license
maintenance
project compatibility
```

不要因為工具方便就污染 production runtime dependency。

---

# 66. Project-Scoped Preference

可以 project-scoped 的：

```text
configuration
hooks
skills
ignore files
tool metadata
```

優先 project-scoped。

真正適合 user-level 的工具才放：

```text
user-level
```

---

# 67. Upgrade Policy

Serena、Graphify、ComfyUI 或其他工具升級：

```text
upgrade
↓
smoke test
↓
continue
```

不要假設新版與舊版 CLI / output 完全相同。

---

# 68. Tool Failure Isolation

如果：

```text
Graphify fails
```

不要因此讓 Serena 不可用。

如果：

```text
Asset Pipeline fails
```

不要因此阻止不需要 Asset Pipeline 的 backend development。

各 Gate 狀態獨立回報。

---

# 69. Tooling Is Not Truth

工具目的：

```text
reduce search cost
reduce context
improve navigation
identify risk
```

不是取代：

```text
compiler
tests
database constraints
runtime verification
human review
```

---

# 70. Universal Development Loop

Bootstrap 後，每張 Codex Task 建議：

```text
Task
↓
Read AGENTS
↓
Read Task Spec
↓
Graphify if cross-subsystem
↓
Serena exact symbols/references
↓
Read minimal source/tests
↓
Plan
↓
Implement
↓
Focused Tests
↓
Broader Tests if required
↓
Diff Review
↓
Definition of Done
```

---

# 71. Small Task Optimization

如果是明確小修改：

```text
Known symbol
↓
Serena
↓
Edit
↓
Focused test
```

不要機械式跑 Graphify。

---

# 72. Large Task Optimization

跨：

```text
database
security
transactions
multiple services
shared protocol
public API
core domain model
```

應：

```text
Graphify
↓
Serena
↓
Implementation
↓
Integration Tests
```

---

# 73. Documentation Optimization

大型專案應逐步建立：

```text
AGENTS.md
SUBSYSTEM_MAP.md
architecture docs
task specs
schema docs
```

Codex 不應靠重新掃 Repository 才重新理解專案。

---

# 74. Bootstrap Portability

本文件可以直接複製到：

```text
existing repository
new repository
game project
web project
backend service
desktop application
CLI project
data service
```

Asset Pipeline 僅在 applicable 時啟用。

---

# 75. Final Principle

這套 Bootstrap 的目的不是讓 Codex使用更多工具。

而是讓：

```text
Codex
```

從：

```text
search everything
read everything
guess architecture
change code
hope tests pass
```

轉成：

```text
understand repository shape
↓
find dependency neighborhood
↓
find exact symbols
↓
read minimum necessary context
↓
make focused change
↓
prove it with tests
```

最終標準：

> **Tools reduce discovery cost.  
> Source defines implementation.  
> Tests prove behavior.  
> Human review decides product quality.**