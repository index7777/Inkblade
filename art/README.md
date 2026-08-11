# Local/free asset workspace

This directory implements the repository-local metadata side of `ASSET_GENERATION_PIPELINE.md`.

- `recipes/`: reproducible asset intent.
- `workflows/comfyui/`: versioned local workflow definitions.
- `models/profiles/`: model identity and license gates; do not commit checkpoints.
- `queues/`: generation queues.
- `source/`: editable source used for cleanup.
- `approved/`: human-approved assets only.
- `manifests/`: runtime-facing stable asset metadata.
- `generated/`, `review/`, `cache/`: local, ignored working output.

No paid or hosted fallback is permitted. Generation remains blocked until local tools and a commercially usable model profile are verified.
