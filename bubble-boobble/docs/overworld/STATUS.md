# Original Adventure overworld status

Status: **original artwork implemented and verified for user playtest**. PR #10 remains draft and unmerged. User playtest and explicit approval are required before merging.

Worktree: `/Users/eduardoleale/.codex/worktrees/walkable-overworld/the-bubble-brigade`
Project: `bubble-boobble/`
Branch: `codex/walkable-overworld`
Baseline: `76d82db`
PR: https://github.com/eduardoa-perez-tactile/the-bubble-brigade/pull/10

## Current artwork

Five original paintings replace the copied prototype: Bubblebrook Quay, Fernfall Gardens, Pinwheel Fair, Cloudtop Springs and Emberglass Works. The user accepted the first map layout and requested compliance with the Theatrical Cel Adventure guide. Its revision preserves the composition while simplifying texture and using broad painted shapes, restrained world colors and clear playfield contrast. Cuphead supplied visual and interaction research only; no Cuphead raster was passed to generation.

A new original dragon sheet provides eight angled directions, planted idle and alternating walk contacts. The 24 pose slots are normalized to one foot anchor and derive all ten existing skin palettes. Front/back second contacts mirror their symmetric first contact; six other direction pairs use separately drawn contacts. Guide and vendor use the same oblique character artwork. Idle holds still. See `tools/overworld/OBLIQUE-DRAGON.md`.

All 17 copied feature PNG identities are absent from the current assets tree, verified by `tools/overworld/audit-original-art.py`. The external reference library, baseline UI art and archived migration evidence remain untouched. Git history was not rewritten. Original prompts, generated source images and hashes are recorded in `tools/overworld/original-art-manifest.json` and `original-map-prompts.json`.

## Gameplay retained and aligned

All 25 rounds and 55 map interactions retain stable IDs and per-profile saves. Walkable polygons, full visible building obstacles, coastlines, stairs and bridges follow each new painting. A single painted plate supplies each district; roofs are obstacles rather than separately composited occlusion layers. Native bounded camera following uses Cover fit and view size260, verified to avoid hard landscape map edges.

Adventure supports selected encounter play, retry and entrance return, completion flags, district gates, one-time rewards, hidden coins, guide rewards, optional trials, keepsakes, shortcuts and journal travel. Existing save migration and profile isolation remain. Classic and Bubble Madness are available under Arcade Modes. District and shared sprites load through explicit asset groups; the presentation uses a bounded pool.

## Replacement verification

- Full V8 logic suite: **452/452 passed**. The previous copied-reference QA tests were removed and an eight-heading movement/idle test added; compare counts in that context.
- Original geometry and directional tests: **9/9 passed**. All55 interactions are reachable, all25 encounter return anchors are safe, and actual lighthouse approach/leave/re-approach works.
- Focused Adventure campaign, save, resume and flow tests: **16/16 passed**.
- Four focused render cases pass at the final camera framing: responsive map/card/guide, journal/shop, actual681-step menu-to-encounter-to-return journey and250-step encounter flow. Only intentional Adventure images were refreshed and reviewed.
- Actual native harbor capture: `.gameengine/overworld-original-map-1.png`. Original pose preview: `tools/overworld/source/oblique-normalized/preview.png`.
- Final cooked campaign: **4/4 passed**, including the complete 25-encounter campaign and 681-step button journey. Recorded replay: **681 steps, no divergence**.
- `gameengine check` passes typecheck, validation with existing warnings, UI-document coverage, desktop cook and 600-frame cooked smoke.
- Android phone-low declared asset peak: **37.18 MiB / 48 MiB**. Shared character atlas: **1.81 MiB / 2 MiB**. Every district group passes its 2 MiB gate; no budgets were raised and no character downscale was needed.
- Portable current evidence: `evidence/original-art-final-tests.json` and `evidence/original-art-validation-perf.json`.

Previous copied-art render and performance approvals are historical. `RENDER-REVIEW.md` records the prior baseline comparison (17 inherited T1 failures, including the inherited Cuphead structural15/14 draw failure); it is not a fresh full-suite render verdict for these original paintings. The installed pipeline validator's Standard-material metadata warning is separately proven in `evidence/pipeline-builtin-proof.json`.

Hermes and the Web/WASM host are unavailable, so cross-runtime parity is unverified. No physical phone was used. Prior transition samples exceeded low-end JS heap guidance; bounded retained heap, GPU/thermal behavior, hardware controllers, OS focus and browser storage durability require corresponding environments. See `PERFORMANCE.md`. Automated playtests use Game Engine only.

## Handoff rule

Commit and push checkpoints, keep PR draft, and never merge or enable auto-merge before the user's playtest and explicit approval. Thirty-minute screenshot updates are paused at this verified playtest handoff. Playtest instructions are in `PLAYTEST.md`.
