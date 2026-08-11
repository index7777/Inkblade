# Repository subsystem map

## Runtime shell

- Purpose: browser entry points, layout, and loading order.
- Core files: `inkblade.html`, `index.html`, `data/game-config.js`, `data/sound-system.js`, `game.js`.
- State: browser DOM, Web Audio state, saved browser metadata.
- Dependencies: bundled game output and static assets.
- Invariant: `game.js` is generated from `src/main.js`; source changes require a rebuild.
- Verification: `npm run build`, `npm run check`, browser playtest.

## Gameplay source

- Purpose: input, combat, progression, rendering, UI, and the game loop.
- Core files: `src/main.js`, `src/core.js`, `src/constants.js`.
- State: shared run state `G`, derived stats, mutable UI and render caches.
- Dependencies: geometry, viewport, enemy module, configuration, sound system.
- Invariant: source modules bundle to one self-contained IIFE with no import/export residue.
- Verification: build, syntax check, browser playtest.

## Enemy and boss

- Purpose: enemy definitions/spawning and Xuanming boss behavior, projectiles, and lifecycle.
- Core files: `src/enemy.js`.
- State: enemies, boss shots, wave and boss lifecycle fields in `G`.
- Dependencies: core state, viewport dimensions, presentation/audio hooks from main.
- Invariant: presentation hooks do not independently create authoritative gameplay outcomes.
- Verification: build, syntax check, wave 30/59/60 and boss defeat playtests.

## Viewport and rendering support

- Purpose: 9:16 playfield sizing, DPR/quality control, safe top boundary.
- Core files: `src/viewport.js`, rendering sections still in `src/main.js`.
- State: canvas context, viewport dimensions, sprite/paper caches.
- Dependencies: DOM and shared state.
- Invariant: the complete playable area remains visible at supported window sizes.
- Verification: build and resize playtests.

## Geometry

- Purpose: pure path and collision helpers.
- Core files: `src/geom.js`.
- State: none.
- Dependencies: none.
- Invariant: deterministic pure calculations.
- Verification: syntax/build; no dedicated unit suite currently exists.

## Assets and content

- Purpose: runtime images/audio, configuration, source references, and local/free generation metadata.
- Core paths: `assets/`, `data/`, `concept-art/`, `art/`.
- State: approved files and manifest metadata.
- Dependencies: browser-supported static paths.
- Invariant: generated candidates are not runtime-approved until human review, license review, manifest entry, and runtime validation.
- Verification: manifest/schema validation plus browser asset loading.

## Tooling

- Purpose: build, semantic navigation, architecture graph, and local asset preparation.
- Core files: `package.json`, `.serena/project.yml`, `.graphifyignore`, `graphify-out/`, `CODEX_PROJECT_BOOTSTRAP.md`.
- State: generated bundle, Serena cache, Graphify graph.
- Dependencies: Node/npm, esbuild, Serena, Graphify; optional local art tools.
- Invariant: tooling setup must not alter product behavior.
- Verification: Serena smoke test, Graphify query/path/explain, build/check.

## Audit gaps

- `AGENTS.md` describes a different Godot/C# server project and conflicts with this repository's detected browser JavaScript architecture.
- No automated unit, integration, or browser test suite is configured.
- `src/main.js` remains a large mixed-responsibility module during Stage 2b migration.
- Runtime assets are mostly referenced by direct paths; the generic stable-ID manifest pipeline is not yet bound to runtime.
