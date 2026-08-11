# Capability Registry

| Capability | Status | Verification | Notes |
|---|---|---|---|
| AGENTS project scope | READY | Repository-specific scope precedes retained legacy text | Browser JavaScript architecture detected from repository files |
| Serena semantic navigation | READY | Indexed authoritative JavaScript; symbol/reference/body smoke test passed | `game.js` excluded as confirmed esbuild output |
| Graphify architecture navigation | READY | query/explain/path smoke tests passed | Generated and cache roots excluded |
| Production build | READY | `npm run build` | `src/main.js` bundles to `game.js` |
| Automated tests | READY | `npm test` | Node built-in test runner against `src/` and `data/` |
| Browser/render integration tests | TESTABILITY_GAP | Not configured | DOM, Canvas, resize, audio, animation frame, and interaction flows require a browser harness |
| Asset pipeline specification | READY | Schema and empty manifest validate | Local/free policy retained |
| Asset pipeline runtime | ON_DEMAND | Not installed | ComfyUI, Pixelorama, dedup runtime, model, and license verification are deferred until an asset task |

## Canonical verification

```text
npm test
npm run build
npm run check
```
