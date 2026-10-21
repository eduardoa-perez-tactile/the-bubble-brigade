# Reconstruction verification

The final Game Engine gates pass: **308 logic tests, 62 desktop render tests, all 280 protected simulation traces and all 48 original pixel cases**. Five newly named reconstruction replays verify with zero divergences. No original golden, prior recording, character PNG or archived report was regenerated.

| Gate | Result | Evidence |
| --- | --- | --- |
| Pre-change baseline | 305 V8 tests, checkpoint every step, at `2ba8d1e563222ea02ed0cf0bb61fbe49d6342989` | [Baseline](baseline.json) |
| Final V8 logic | 308/308 pass, including three new projection tests | [Logic run](logic-tests.json) |
| Original simulation | 280/280 traces identical at every recorded step, zero allowances | [Trace proof](simulation-trace-proof.json), [raw diff](original-trace-diff.json) |
| Desktop T1 | 62/62 pass, including all 48 protected original pixel cases | [Strict suite](render-verification.json), [original cases](original-pixel-render.json) |
| New reconstruction streams | Five verified streams, 739 steps, 52 screenshots; explicit cartoon scene/desktop and phone-low test residency | [Replay verification](new-replays.json), [recording run](recording-test-run.json) |
| Structural replay budgets | Menus 14; ascent/rescue/device 13; reference 12; preserved presentation 12; limit remains 14 | [Strict suite](render-verification.json) |
| Cold live viewport | Pixel 5 draws; cartoon classic 7; cartoon party 14; all pass before any offscreen render | [Cold probes](cold-viewport-evidence.json) |
| Canonical measured geometry | 52/52 cap and UI anchor checks within hand-painted ±4-pixel tolerance | [Comparison](reference-comparison/comparison.json), [side by side](reference-comparison/side-by-side.png) |
| Prior evidence and artwork | 960 evidence files, 45 old recordings, 313 original goldens, 510 character/animation files and all 532 previous cartoon assets unchanged | [Byte audit](preservation-final.json), [baseline inventory](preservation-baseline.json) |
| Migration baseline | 1,625 protected original files unchanged | [Parent audit](migration-preservation.json) |

The immediate 305-test baseline has 303 identical traces and exactly two individually classified differences. `cartoon controls recorded opt in reaches party requests without changing original start actions` first differs at step 5 when its explicit cartoon party start constructs the approved 72×23 arena, floor row 22 and measured shelves. `concept controls recorded solo default nine bots ten humans pause and restart preserve mode and geometry` first differs at step 8 when its explicit cartoon classic start constructs that arena. Both differ in `arcade.session` and the resulting presentation pool transforms. Neither difference is accepted through a hash allowance. All 280 protected original routes remain strictly identical. [Full classification](simulation-trace-proof.json).

Controls exercise actual unupgraded 126-pixel jumps through both ascent lanes, an upper detour, diagonal transfer, missed-jump recovery, full-body spawn support, graph access, solo/default nine bots/ten humans, firing, capture/pop, rescue, wave progression, boss victory and restart. The first rise is 96 world units and the remaining rises are 120. First-shot checks contain the enlarged source mouth in both directions. Body, diamond and number visibility agree at actual blink boundaries. [Controls](focused-controls.json), [enlarged actors](focused-art-controls.json), [modes](focused-mode-controls.json).

The three new pure projection cases prove continuity, strict monotonicity, dense inverse round trips, collision-feet anchoring, uniform artwork scale, repeated-input determinism and adaptive zoom returning to the canonical frame. Cosmetic blink does not alter framing. [Projection tests](focused-projection.json).

Actual phone-low device tests query native actor alpha, rotated diamond AABBs, centered Text2D numbers, HELP and live HUD rectangles on a fold cover (904×2316), notched phone (1179×2556) and tablet (1620×2160), with recorded DPR and safe insets. They include a real crown jump followed by actual injury at the apex. This exposed a safe-canvas displacement bug, which is fixed through shared native HUD bounds. The final gate passes without loosening bounds. [Final device test](final-device-fit.json).

The controlled reference test passes canonical, native, tall and ultrawide aspects. Its authored poses and positions are **not one continuous input history**; separate recorded gameplay and active captures establish playability. A real `addScore(..., 800, 320, 420)` particle is checked against native Text2D position, size and HUD bounds at every aspect. This caught the legacy linear text transform: the actual label moved from logical Y 914.22 below the footer to the shared projected Y 497.8. The earlier native 15-draw failure was corrected by grouping UI paint passes; the unchanged 14-draw assertion now passes. [Reference/reward gate](focused-reference-fit.json), [active gameplay captures](composition-captures.json).

All 93 current cartoon, concept, refinement and reconstruction desktop screenshots were reviewed in the five [contact sheets](golden-review-inventory.json). Only the intended cartoon presentation goldens were refreshed. The original 48 pixel cases then passed strictly and their 313 golden files remained byte-identical.

The active cartoon budgets now point to the five reconstruction-prefixed recordings. All 45 previous streams, including the two early slice recordings, remain unchanged. They were not playback-verified against this reconstruction build; no current pass/fail claim is made for them. The archived original replay inventory and its historical classification remain intact.

The comparison preserves the actual engine's native 1536×864 pixels and normalizes only the 1672×941 reference. [Overlay](reference-comparison/overlay-50.png) and [absolute difference](reference-comparison/absolute-difference.png) are diagnostics, not a complete visual-identity score. Painted cap ends use measured fractional anchors while collision remains on the existing 24-unit grid; the largest interior edge discrepancy is about 11.33 physical pixels. Outer tips decorate solid side backing and add no walkable area. [Collision/art residuals](collision-art-edge-contract.json).

The retained green pose has approximately 98.13×98.13 visible physical pixels versus a reference estimate of 104.73×84.47. Uniform scaling preserves its shape, so matching both dimensions is impossible without redrawing or stretching it. Background architecture and waterfalls also differ. The result makes no claim of perfect pixel reconstruction. [Alpha measurements](canonical-alpha-audit.json), [measured review](review.md).

Nine host performance cases stay at 13 steady draws and 14 during content probes. Simulation p95 is 1.705–2.350 ms; presentation p95 is 9.424–10.927 ms. Fresh phone-low canonical GPU textures use 100.37 MiB; the separate phone-low stress snapshot uses 117.87 MiB. Those are different content/GC contexts, and the full-catalogue GPU maximum is unestablished. Sampled steady host heap is 43.89–54.08 MiB, above the generic 32 MiB starting guidance. Physical phone GPU time, sustained thermals, real controllers, group readability and Hermes parity remain unverified. [Performance and memory review](review.md).

The final engine check and cooked desktop/phone-low checkpoint results are recorded below. Run engine commands inside `bubble-boobble/` and keep engine operations serialized. [Reproduction plan](final-gate-plan.md).


## Parent final engine and cooked gates

`gameengine check` passes binary freshness, TypeScript, validation, UI document ownership, desktop cook, the 600-frame cooked smoke and the UI node budget. The preserved reference-art/camera warnings remain. Pipeline key `7946469ed20397e0` remains stale: this existing warning still blocks a release build, and no historical pipeline entries were deleted. See [engine-check.json](engine-check.json).

The final cooked V8 checkpoint run passes 5/5 cases across 739 steps and 52 screenshot checks, using desktop GPU goldens and the phone-low memory class. No golden tolerances were changed. See [cooked-checkpoints.json](cooked-checkpoints.json). Hermes was not installed and was not built for this pass.
