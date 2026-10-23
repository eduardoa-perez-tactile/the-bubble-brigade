# Overworld implementation status

Status: **implemented and verified ready for user playtest**. No additional art approval gate was imposed. User playtest and explicit approval remain mandatory before merge. PR #10 stays draft; auto-merge is disabled.

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
- Current full V8 T0: **456/456 passing**, `.gameengine/overworld-handoff-t0.json` (final rerun, 13,758 steps).
- Complete 25-encounter/five-map campaign: 3,158 recorded steps, including gates, optionality, one-time rewards, keepsakes, settings and correct returns. `.gameengine/overworld-campaign-t0.json`.
- All 55 POIs reachable; production doorway approach/leave/re-approach, normalized movement, coast/building collision, held Enter, compressed controller-A taps, profile isolation, delayed storage and interrupted resume are tested.
- Actual-button T1 journey passes: Start Game → Begin Adventure → inspect → play → result → return, 681 steps. Six new checkpoints reviewed. `.gameengine/overworld-production-t1.json`.
- Presentation optimization: 13/13 focused tests pass with identical engine hash traces before/after `skipUnchanged`; `.gameengine/overworld-optimized-hash.json`.
- `gameengine check` passes typecheck, validation with existing warnings, UI-document coverage, desktop cook and 600-frame cooked smoke. Latest: `.gameengine/overworld-terrain-fix-check.json`.
- Cooked actual-button journey passes all 681 steps with the final dragon art. Two cooked screen-fit cases pass 280 + 111 steps, checking slim portrait through ultrawide screens, safe-area panels, readable labels and an avatar at least 40 pixels tall. `.gameengine/overworld-cooked-render-fixed-final.json`, `.gameengine/overworld-cooked-source-fit.json`.
- All 16 terrain imports use a desktop-only uncompressed compatibility override after the compressed standalone texture path failed in the cooked host. Mobile ASTC remains configured; original source PNG bytes are unchanged.
- Adventure structural replay uses 16 draws against its 50-draw gate. Pipeline coverage was recorded across desktop, mobile and compat tiers. Replay verification passes 681 steps without divergence.
- Five actual production map captures inspected: `.gameengine/overworld-production-map-{1..5}.png`. All four settled directional captures inspected: `.gameengine/overworld-facing-{up,down,left,right}.png`.

## Regression review and limitations

Final broad T1: **103 tests, 86 passed, 17 failed**. The failure names exactly match the exported pre-feature baseline (99 tests, 82 passed, 17 failed), with zero additional failures. The same inherited Cuphead UI structural budget fails (15 draws against 14); all other structural budgets, including Adventure, pass. Seven additional legacy render families were isolated to native camera shake sampling after entity registration changed, plus the Arcade menu preview animation phase after its new routing. Seventeen images were individually reviewed and selectively refreshed; tolerances and inherited goldens remain unchanged. See `RENDER-REVIEW.md` and `render-review-summary.json`.

Pipeline recording covers all three tiers. The installed validator reports an unknown hash that is proven to be the current Standard material embedded in its own host: installed generated builtin metadata is missing. This package validation warning remains documented with exact hash evidence; no legitimate pipeline records were removed.

Final cooked campaign: **4/4 passing**, including the complete campaign and 681-step actual-button journey. Final replay verification: **681 steps, zero divergence**. Portable reports are tracked under `evidence/final-test-summary.json` and `evidence/final-check.json`.

Final Android phone-low declared asset peak is **36.50 MiB against 48 MiB**, with courtyard and shared sprites included. All asset-group gates pass. Fresh normal district travel/combat/return passes, with 9-13 draws, zero pending assets and zero render validation errors. The five-cycle soak retained constant entity and asset counts, but several JS heap samples exceeded low-end guidance; bounded retained heap and physical-phone performance remain unverified. Exact runtime group refcounts were not exposed by the aggregate telemetry. See `PERFORMANCE.md` and `evidence/performance-summary.json`.

Hermes host is not installed. The Web/WASM host is also unbuilt (`target/wasm32-unknown-emscripten/release/gameengine-host.js` missing), so cross-runtime parity is unverified. Native hardware controller/OS focus/browser persistence and physical phone GPU/thermal behavior require hands-on verification. All automated playtesting stays inside Game Engine; no standalone/browser/OS control.

## Delivery rules

Parallel agent implementation and review are complete. Thirty-minute heartbeat `bubble-brigade-overworld-progress` is paused at this playtest handoff. All reviewable checkpoints are committed and pushed. Preserve archived migration evidence and the original checkout/editor. Never merge or enable auto-merge; the user must playtest and explicitly approve first.

Playtest instructions: `docs/overworld/PLAYTEST.md`. Original analysis/plan: `docs/cuphead-overworld-plan.md`.
