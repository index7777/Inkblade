任何 UI、HUD、卡片、Responsive、動畫、特效或 Gameplay 視覺修改，
完成前必須完整執行 `VISUAL-SMOKE-TEST.md`。

未完成其中必要測試與截圖自證，不得宣告修復完成。

# Inkblade repository scope

This repository is the existing browser-based Inkblade game, detected from `package.json`, `src/`, `data/`, and the HTML entry points. Authoritative product source roots are `src/` and `data/`; `inkblade.html` and `index.html` are authored runtime entry points. `game.js` is the confirmed esbuild bundle produced by `npm run build` and is not authoritative source.

## Repository exploration

- Use Graphify for architecture, dependency, path, and blast-radius discovery.
- Use Serena for named symbols, references, and targeted body retrieval from authoritative source roots.
- Use `rg` and structured JSON parsing for exact identifiers and metadata.
- Do not recursively dump the repository or treat generated bundles as source.
- Read only the minimum relevant source, test, schema, or documentation context.

## Verification

- Source and tests are authoritative; Graphify, Serena, and documentation are navigation aids.
- Build with `npm run build` and syntax-check the generated bundle with `npm run check`.
- The repository currently has no automated test suite; report that gap instead of treating syntax checks as tests.
- Do not modify product behavior during bootstrap or tooling work.
- After product source changes, run `graphify update .`.

## Asset capability

- Follow `ASSET_GENERATION_PIPELINE.md` using local/free generation only.
- Do not install large models or asset runtimes during bootstrap.
- Do not mass-generate before human POC approval and art-direction freeze.
- Keep specification readiness separate from runtime-tool readiness.

## Legacy unrelated rules

The remainder of this file was inherited from a different Three Kingdoms Online repository. It is retained for provenance but is not applicable to Inkblade and must not be used to infer this repository's architecture, technology stack, or implementation requirements.

# Three Kingdoms Online (legacy, not applicable here)

Three Kingdoms Online is a server-authoritative 2D online RPG set in an original Three Kingdoms world. Historical soldiers are PvE enemies; historical generals are elite enemies, bosses, and world bosses.

Do not copy proprietary source code, assets, maps, UI, dialogue, network protocols, or other copyrighted implementation details from existing games.

## Technology and boundaries

- Client: Godot 4 with C#; collects input and renders server results.
- Server: .NET/C# modular monolith; owns all authoritative gameplay state.
- Shared: C# class library containing protocol contracts and shared data types only.
- Persistence (later): PostgreSQL.
- Initial transport: JSON over WebSocket.

The server owns movement validation, NPC state, HP/MP, combat, damage, cooldowns, death, respawn, progression, loot, item ownership, inventory, equipment, and PvP results. Treat every client input as hostile. Never expose secrets to the client.

The client may send intentions, interpolate movement, render entities/UI, and play animation/audio. It must never determine authoritative positions, damage, death, rewards, loot, or inventory changes.

## Architecture rules

- Prefer the simplest modular monolith that meets the current task.
- Do not introduce microservices, Kubernetes, Kafka, distributed databases, Docker, or speculative caching without an explicit requirement.
- Keep all network messages in `shared/ThreeKingdoms.Shared/Messages` and document them in `docs/protocol.md`.
- Use strongly typed messages and a common envelope; do not scatter protocol magic strings.
- Keep gameplay content data-driven under `data/`; do not hard-code individual NPC or item definitions in systems.
- Initial entity hierarchy: `WorldEntity -> CharacterEntity -> PlayerEntity | NpcEntity`.
- Initial melee damage formula: `max(1, Attack - Defense)`.
- Do not expand task scope: movement does not imply combat; combat does not imply skills; NPCs do not imply quests.

## Validation and testing

Validate message type and payload, entity IDs, map membership, distance, movement, cooldowns, target state, and item ownership as applicable.

Server gameplay logic requires automated tests covering valid behavior, invalid requests, boundaries, and cheating attempts. Before completing a change:

1. Build affected projects.
2. Run relevant tests.
3. Fix build and test failures.
4. Summarize changed files and any verification limitation.

## Persistent economy safety

For inventory, currency, equipment, trade, enhancement, loot ownership, shops, and persistence: validate ownership server-side, prevent duplication, preserve atomicity, make retries idempotent where applicable, define transaction boundaries, and test failure/rollback paths. Non-stackable equipment requires a unique item instance ID. Rare drops, enhancement destruction, and large trades require structured audit logs. Never accept client-provided authoritative asset values or silently swallow persistence/transaction failures.

## Skill framework rules

- Use one server-authoritative `SkillEngine` and effect pipeline for players, NPCs, and bosses. Do not create per-archetype, per-actor-type, boss-specific, or individual-skill engines/classes.
- Skill behavior is data-driven under `data/skills/`; adding a normal skill must not require editing a skill-ID switch or adding a C# skill class.
- The client may submit a skill ID and targeting intent only. It cannot choose damage, healing, final targets, cooldowns, resource costs, status success, or cast completion.
- Reuse the existing combat damage, death, and event pipelines. VFX and presentation mappings never determine gameplay truth.
- AoE target selection is server-side and deterministic. Validate learned skills, actor state, map, relationship, range, cast time, cooldown, resource, target geometry, and immunity.
- Persist `ArchetypeId`, known skills, primary resource type, and current resource. Do not persist cooldowns, temporary effects, control statuses, current casts, or current targets.

## Guild, city, and siege rules

- Centralize guild authorization in one policy service; never trust client-supplied guild IDs, roles, permissions, siege participation, ownership, tax, treasury, or victory data.
- Historical city definitions are data-driven. Keep immutable city definitions separate from persistent runtime ownership, tax, and treasury state. Do not add city-specific services or combat code.
- Siege adds participant relationships, entry/spawn/respawn restrictions, and objective rules while reusing existing combat, skill, PvP, damage, death, and status systems.
- Registration fees, taxes, treasury changes, capture completion, siege results, and city ownership transfers require atomic, idempotent transactions and audit records. Prevent double charges, duplicate taxes/captures, replayed completion, negative balances, and multiple winners.
- Only the server controls schedules, gate HP/collision state, capture progress, winner selection, ownership changes, and tax collection. Nonparticipants cannot enter an active siege map.
- Persist guilds, membership/roles, wars, city state/ownership/tax/treasury, siege registrations, and siege audit records. Do not persist active battlefield positions, temporary gate HP, capture progress, or respawn countdowns.
- On server restart, cancel an active siege, retain the original city owner, and record `ServerRestart` as the cancellation reason.

## Guild economy and multi-city rules

- Keep Character Wallet, Guild Treasury, and City Treasury as distinct accounting domains. Keep Character Inventory, Guild Warehouse, and Siege Supply Inventory as distinct ownership domains; do not collapse either group into a generic balance or bag.
- Every treasury spend, deposit, warehouse transfer, supply purchase/use, and deployment consumption is atomic, concurrency-safe, idempotent where requests may retry, persistent where specified, and auditable with before/after state and a reference ID.
- Preserve unique `ItemInstanceId` and all equipment state across warehouse transfers. Concurrent withdrawals of the same item can succeed at most once.
- Siege weapons, towers, guards, and supplies are server authoritative. Clients cannot choose ownership, damage, targets, cooldowns, quantities, repair outcome, or deployment validity.
- Generic city domain code must look up `CityDefinition` by ID. Never branch on Xiangyang, Xuchang, or a city name; city differences belong in content data, maps, spawns, objectives, services, and presentation.
- Validate every city content package and all cross-references at startup and fail fast with diagnostics. Adding a third city must require no changes to guild, city, siege, combat, skill, tax, or teleport domain code.

## Warlord and legendary-loot rules

- Historical warlords remain data-configured `NpcEntity` instances and reuse NPC AI, SkillEngine, combat, spawn, death, contribution, and LootService. Never add a per-warlord entity, AI, service, or combat engine.
- Unique-world spawns require atomic reservation and persistent eligibility/death scheduling. A restart resets active encounters and contributions without duplicating living warlords.
- All spawn points/times, boss HP, contribution, loot rights, RNG, legendary drops, and announcements are server authoritative.
- Legendary equipment uses normal ItemInstance, equipment, enhancement, trade, warehouse, and persistence systems while retaining a unique instance ID, original drop provenance, and ownership-transfer audit.

## Player-market integrity rules

- One non-stackable ItemInstance has exactly one authoritative location: character inventory, equipment, guild warehouse, stall reservation, or ground item. Every ownership move uses a concurrency token and the central ownership registry.
- One client request/idempotency key commits at most one market transaction. Buyer debit equals seller proceeds plus the correct city tax; all item, currency, tax, listing, and immutable-ledger mutations commit or roll back together.
- The client identifies a stall/listing, requested quantity, and request ID only. The server resolves seller, item identity/stats, authoritative price, tax, proceeds, capacity, ownership, and transaction status.
- Completed ledger rows are immutable; corrections use compensating transactions. On restart, close online-only stalls, release reservations, resolve pending transactions from database commit state, and rebuild indexes/statistics from authoritative records.
- Integrity checks detect duplicate/orphan items, invalid reservations/listings, negative currency, ownership mismatch, and missing legendary provenance. Quarantine/block affected transactions and log critical findings; never silently delete items or automatically punish players.

## Death-risk and economy-observability rules

- Select a data-driven death policy from server-owned killer, victim alignment/aggression, zone, guild-war, and siege state. Clients cannot choose the policy, drop roll, dropped item, durability loss, bounty, or repair price.
- Normal PvE and normal PvP deaths do not drop equipment. Red-player drops preserve the exact ItemInstance ID, enhancement, durability, and provenance while atomically moving it from its previous location to a GroundItemEntity.
- Durability zero marks equipped gear broken and disables its stat bonus; it does not destroy the item. Repair cost and durability changes are server authoritative, atomic with Silver, and recorded as economy events.
- `Destroyed` is a terminal item location. Enhancement/admin destruction and quarantine resolution require immutable lifecycle audit; death drops and zero durability are location/state changes, not destruction.
- Distinguish faucets, sinks, and transfers. Player-to-player payments are transfers; repair, taxes, registration, supplies, teleport, and configured service fees are sinks; NPC/system grants are faucets. Telemetry cannot mutate gameplay state.
- Preserve conservation invariants: a death drop removes one active location and creates one ground location for the same instance; repair debit equals its recorded sink; market debit equals proceeds plus tax; destroyed items never return to an active location.

## World-content scaling rules

- Regions, zones, roads, caves, monster families, elite tables, regional loot, travel links, and dynamic events are content definitions referencing generic world systems. Never add region-, zone-, dungeon-, or event-name switches/services.
- The server owns zone membership, level metadata, spawn eligibility/counts, elite rolls, event lifecycle/rewards, travel validation, and all loot. Clients only render discovered content and submit movement/interaction intent.
- Region content must validate all maps, boundaries, spawn points, families, loot tables, roads, travel links, dungeons, bosses, and events at startup. A temporary second/third region must load without changing domain code.
- Open-world caves are ordinary persistent map areas, not private instances. Spawn budgets and event concurrency are bounded and load-tested with deterministic simulation.

## Character-progression rules

- Skill rank, weapon proficiency, allocated attributes, build presets, requirements, resistance, PvP modifiers, boss profiles, and endgame progression are server-authoritative, bounded, data-driven modifiers on shared combat systems.
- Never trust client-provided rank, proficiency XP, attribute totals, preset contents, requirement success, resistance result, PvP coefficient, or boss immunity. Validate every mutation and recalculate effective stats server-side.
- Keep base progression, equipment, enhancement, temporary effects, proficiency, and allocated attributes as distinct sources in the effective-stat pipeline. Do not permanently mutate base stats when applying a build.
- PvP and boss balance use contextual data profiles around the same DamageCalculator, SkillEngine, status, cooldown, and resource systems; do not fork separate combat engines.
- Persist long-term ranks/proficiency/allocations/presets/endgame progress. Do not persist derived effective stats, temporary combat effects, cooldowns, targets, or active casts.

## Historical chapter content rules

- Players are original self-created characters, never historical figures, and are not permanently assigned to an NPC historical faction. Keep `HistoricalAffiliation` separate from player guild, hostility, reputation, and PvP state.
- Chapter content is data under `data/content/chapters/<chapter_id>/` and must reuse generic faction, region, zone, settlement, NPC, spawn, event, boss, combat, skill, contribution, loot, and economy systems.
- Do not create chapter-, faction-, event-, or historical-boss-specific engines/services. Named encounter identity comes from data, shared effect handlers, map content, and presentation.
- Villages, towns, military camps, and Major Castles are distinct settlement classifications. Do not make every town siegeable; the Yellow Turban v1 chapter has zero Major Castles and `SiegeEnabled = false`.
- Every open-world zone requires monster/loot identity and a repeatable return reason. Historical content may guide exploration but must not require a mandatory main-quest chain to enter ordinary regions.
- Boss/event announcements may reveal theme and region but not exact coordinates when policy forbids it. All event triggers, completion, settlement state, NPC warfare, contribution, and rewards remain server authoritative.

## MVP boundary

Sprint 0 ends when two Godot clients can join one server, see each other, and observe authoritative movement on one test map (TASK-001 through TASK-006). Sprint 1 begins with NPC spawning and the basic combat loop. Guilds, sieges, persistence, trading, shops, enhancement, and territory control are later phases.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
