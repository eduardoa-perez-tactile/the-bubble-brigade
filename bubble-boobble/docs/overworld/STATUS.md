# Overworld implementation status

Status: production feature integrated; final render, screen-fit and performance verification in progress. The user resumed development with “continue then”. No additional art approval gate is imposed before finishing the feature. User playtest and explicit approval remain mandatory before merge.

Worktree: `/Users/eduardoleale/.codex/worktrees/walkable-overworld/the-bubble-brigade`
Branch: `codex/walkable-overworld`
Baseline: `76d82db`
Draft PR: https://github.com/eduardoa-perez-tactile/the-bubble-brigade/pull/10

## Implemented

Five free-roaming production maps follow the supplied Cuphead source geography: downtown, woodland, carnival, DLC island and Hell. Source-aligned polygon walking, scenery collision, contextual entrances, foreground occlusion and bounded engine camera following replace the rejected fantasy/grid direction. Selected source assets have provenance manifests and StudioMDHR credit under `tools/overworld/` and this folder. The rejected art is excluded from production.

All 25 existing rounds are physical destinations. Adventure runs one selected encounter, saves its result once, retries that encounter and returns to its entrance with a completion flag. Five district gates, guide reward, hidden coins, discoverable shortcuts, optional one-life trials, keepsakes, journal travel and per-profile version-2 save migration are integrated. Classic and Bubble Madness remain under Arcade Modes. Original profile records are preserved.

The Brigade’s existing dragon identity supplies side-facing animation and source-seeded up/down poses, with ten existing skin palettes and consistent foot anchors. District textures load/release through engine asset groups; phone-low overrides are authored. Presentation uses a bounded 48-slot pool and skips unchanged derived work.

## Verified

- Baseline before feature: 427/427 V8 T0.
- Current full V8 T0: **456/456 passing**, `.gameengine/overworld-final-t0.json`.
- Complete 25-encounter/five-map campaign: 3,158 recorded steps, including gates, optionality, one-time rewards, keepsakes, settings and correct returns. `.gameengine/overworld-campaign-t0.json`.
- All 55 POIs reachable; production doorway approach/leave/re-approach, normalized movement, coast/building collision, held Enter, compressed controller-A taps, profile isolation, delayed storage and interrupted resume are tested.
- Actual-button T1 journey passes: Start Game → Begin Adventure → inspect → play → result → return, 681 steps. Six new checkpoints reviewed. `.gameengine/overworld-production-t1.json`.
- Presentation optimization: 13/13 focused tests pass with identical engine hash traces before/after `skipUnchanged`; `.gameengine/overworld-optimized-hash.json`.
- `gameengine check` passes typecheck, validation with existing warnings, UI-document coverage, desktop cook and 600-frame cooked smoke. `.gameengine/overworld-final-check.json`.
- Five actual production map captures inspected: `.gameengine/overworld-production-map-{1..5}.png`. Three settled side/front facing captures inspected; up-facing capture needs its loading-exit cover to settle before final recapture.

## Remaining verification

Responsive panel/card checks, broader T1 regression classification, structural replay budget/pipeline recording and mobile-tier CPU/memory review remain in progress. The first production map frame measured 12 draw calls; no device performance claim is made.

Hermes host is not installed. The Web/WASM host is also unbuilt (`target/wasm32-unknown-emscripten/release/gameengine-host.js` missing), so cross-runtime parity is unverified. Native hardware controller/OS focus/browser persistence and physical phone GPU/thermal behavior require hands-on verification. All automated playtesting stays inside Game Engine; no standalone/browser/OS control.

## Delivery rules

Coordinate parallel agents and post a short summary with actual screenshots every 30 minutes. Active heartbeat: `bubble-brigade-overworld-progress`. Commit and push reviewable checkpoints frequently. Preserve archived migration evidence and the original checkout/editor. Never merge or enable auto-merge; the user must playtest and explicitly approve first.

Playtest instructions: `docs/overworld/PLAYTEST.md`. Original analysis/plan: `docs/cuphead-overworld-plan.md`.
