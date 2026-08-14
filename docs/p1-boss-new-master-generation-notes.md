# P1 Boss new-master generation notes

- Sole identity master: `zone1_boss _受擊1.png`
- Retained existing action candidates: `skill_01`, `skill_02`, `skill_03` only.
- All older manifest, idle, lunge, hurt, and red-eye assets are excluded from identity conditioning.
- Entrance review sheet: six beats from pale mist and white eyes to the complete S-shaped body.
- Heavy-core release review: the core must visibly separate from the mouth while the Boss remains anchored.
- Rush-ink release review: the projectile must be a separate mass; the Boss body may recoil but may not become the projectile.
- The approved sheets have been extracted and background-processed into the runtime sequences under `assets/boss/xuanming-p1/new-master/`.
- Runtime-integrated sequences: entrance 6 frames, core cast 4 frames, rush cast 5 frames, hurt 4 frames, plus the fixed white-eye master.
- Runtime placement measures each frame's actual alpha bounds. The Boss HUD is placed at least 12px above the visible ink, rather than above the PNG canvas boundary.
- Integration does not by itself mean every animation and slot has passed visual approval; use `docs/p1-boss-visual-verification-matrix.md` for the remaining evidence.
