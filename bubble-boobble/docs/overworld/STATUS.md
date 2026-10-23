# Overworld implementation status

Status: ART DIRECTION CORRECTION. On 23 October 2026 the user rejected the first map screenshot: the art must follow the analyzed Cuphead map and be a free-roaming scenic world.

Worktree: `/Users/eduardoleale/.codex/worktrees/walkable-overworld/the-bubble-brigade`
Branch: `codex/walkable-overworld`
Baseline: `76d82db` from this repository's main.

The original checkout/editor remains untouched. Only work owned by this feature is committed here.

## Current work

- Coordinator: desktop flow, encounter runner, integration, engine verification, checkpoint commits/pushes and PR.
- Progression agent: 25 encounters across five districts, per-profile Adventure save migration and one-time rewards.
- Map simulation agent: deterministic movement, proximity, collision and bounded following camera.
- Presentation agent: illustrated map, new UI documents, contextual prompts and encounter/dialogue views.

Baseline Game Engine V8 T0: **427/427 passing** on the unchanged baseline. Focused progression initial pass: 4/4 V8. Hermes host is not installed.

The first generated fantasy-map art and rectangular path composition are rejected. Do not polish or expand that direction. Existing simulation/progression work is preserved, but feature expansion is held while a reference-faithful engine sample is prepared.

The corrected direction uses the supplied video's downtown composition: curved promenade, oblique cartoon building façades, palm planting beds, stairs and coast. Continuous free movement is bounded by actual geography. Entrances are door thresholds within the scenery; no grid paths, evenly spaced level nodes or permanent per-building signboards. Source-reference calibration uses the local Inkwell Isle III `world3_mainland_03` layer and matching landmark/top pieces, with exact provenance.

All three agents were interrupted when the user stopped work; presentation and navigation agents then received narrow correction tasks. Scheduled progress updates were paused during the stop, then reactivated with the corrected art direction. The user has not approved corrected art yet.

## Corrected source-reference sample

- Actual Cuphead Mainland03 and Honeycomb Herald source layers replace the generated fantasy art in the explicit calibration mode. Foreground Top03 is aligned at source offset `(309,39)` using three matching source-image regions.
- The original game's green dragon is a temporary character proxy; no new generated fantasy dragon is used.
- Independent traced ground polygons permit continuous roaming around the curved promenade, eastern street, stairs and beach. Buildings, planting beds, seawalls and beach fixtures provide collision.
- Recorded `overworld.reference` QA input enters this isolated sample; it does not represent completed production Adventure integration. Legacy WIP and its encounter registry are retained for recovery, not accepted artwork.
- **5/5 V8 reference tests pass**, including recorded approach/leave/re-approach at the real doorway, continued walking after confirm, and off-axis movement, plus a 184-step continuous promenade–stairs–beach traversal with collision assertions each step. Hermes is unavailable; no cross-runtime parity claim.
- Latest actual engine sample: `/Users/eduardoleale/.codex/worktrees/walkable-overworld/the-bubble-brigade/bubble-boobble/.gameengine/overworld-source-reference-v2.png` (1280×720).
- Earlier focused Adventure integration: 10/10 V8 tests passed before this source-reference mode. Current `gameengine check` passes: typecheck, validation (existing camera/tile warnings), UI-document coverage, desktop cook and 600-frame cooked smoke. Full feature regression/render coverage remains pending.

Rejected first render (do not reuse as current status screenshot): `/Users/eduardoleale/.codex/worktrees/walkable-overworld/the-bubble-brigade/bubble-boobble/.gameengine/overworld-first-landscape.png` (1280×720, first map render; HUD positioning still being polished).

Draft PR: https://github.com/eduardoa-perez-tactile/the-bubble-brigade/pull/10
Pushed checkpoints: `2630527` plan/playtest gate, `d9a30f1` progression/save migration.

## Delivery rules

Post a very short summary with actual Game Engine screenshots to this chat every 30 minutes. Automation: `bubble-brigade-overworld-progress`.
Commit and push reviewable checkpoints frequently; preserve archived migration evidence.
Create a draft PR and keep it updated. **Never merge or enable auto-merge. User must playtest and explicitly approve first.**
Testing stays within Game Engine tests, headless sessions, replays and view/render captures. No standalone/browser/OS playtests.

## Evidence

Plan: `docs/cuphead-overworld-plan.md`. Screenshot paths and test results will be recorded as they become available. No completed-feature or performance claims yet.

Corrected input-driven captures: `.gameengine/overworld-source-reference-door.png` and `.gameengine/overworld-source-reference-stairs.png`, absolute paths under the worktree project above. Source reference mode is a visual/free-roaming calibration, not the finished campaign map.
