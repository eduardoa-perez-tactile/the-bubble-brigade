Starting the arcade scene in a cold live viewport could show the HUD over a black world. The dynamic geometry existed on the CPU but was not submitted; an offscreen screenshot initialized it and masked the failure in older render tests. The working `round1.scene` confirmed that the same camera and viewport correctly drew ordinary sprites.

The world now uses instances of one imported static quad, preserving the existing draw plan, integer texture loads, depth order and encoded-RGB source-over composition. Pixel instances have bounded pooled capacity; fixed steps use a cheap conservative count, while full composition runs only during presentation. No engine changes are required.

A new engine-only regression captures live readback viewport frames before any offscreen screenshot or diagnostic preload. The old path fails with zero world-tile/player pixels and 125 triangles; the replacement passes with the complete tile band, visible player, five draws and 1,065 triangles. Both verification lanes run this check on a fresh host.

The atlas image and its layout JSON also shared a cooked alias. Renaming only the layout metadata removes that collision; a generalized guard now rejects duplicate nonempty aliases across all cooked kinds. This collision was independently real, but removing it alone did not repair the black viewport.

Validation is local macOS arm64 / release V8 / Metal:

- A clean export of `d05b2d0` passed `verify-full` in 44.516 s: cold viewport, 94 T0, 14 desktop T1, four replays, 170-frame presentation route, typecheck/validate/cook/600-frame smoke and asset guard. Final `60ea195` only normalizes scene whitespace (parsed scene equality verified); formatting check and final packaging check also pass.
- All 94 T0 tests and focused desktop T1 checks pass. Four replay streams were refreshed and independently verified: starter/movement change only bundle-hash headers; arcade streams also reflect the new presentation entity pool. Go fixtures remain unchanged.
- All-tier live pipeline coverage passes: 506 steps and 170 sampled frames per tier, peak draws 11/9/9 against budget 14. Recorded programs include the new material hash.
- Steady engine viewport presentation p95: 6.706 ms for two-player round 25 and 8.873 ms for title; process memory 216.8/233.6 MiB. Full measurement scope is documented in `docs/desktop.md`.

Thirteen reviewed PNG baselines change with static UV interpolation: differences are nearest-texel ties and edge samples, quantified in `docs/rendering.md`. Native player artwork matches the prior baseline; the unchanged isolated prototype still passes all 128 exact RGB/source-over probes. No tolerance was loosened or UV bias added.

Testing uses game-engine APIs only. Actual OS-native/compositor surface verification is deferred under the user's explicit instruction and does not block this merge. Prior native control checks did not establish visible-world rendering. Hermes and hosted CI provisioning remain outside the available local validation.
