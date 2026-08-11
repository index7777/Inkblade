# Low-token repository workflow

Use the smallest tool that answers the question:

1. Architecture, dependencies, or blast radius: `graphify query`, then `graphify explain` or `graphify path`.
2. Known function or symbol: Serena symbol lookup, references, then body retrieval.
3. Exact IDs, paths, strings, or JSON fields: `rg` and structured JSON parsing.
4. Read only the relevant source, test, schema, or documentation neighborhood.
5. Treat source and verification commands as authoritative; tooling graphs and prose are navigation aids.
6. Run focused checks first. For this repository use `npm run build` and then `npm run check`.
7. Keep command output compact; retain only status, failures, and relevant diagnostics.

Confirmed generated bundles, caches, dependency folders, and raw generation candidates are excluded from semantic and architecture discovery. Authored asset roots are not excluded merely because they contain binaries.
