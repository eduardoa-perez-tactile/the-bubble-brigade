# Concept reconstruction

This pass implements the measured composition from the original concept at `docs/art-reskin-investigation/concept-ten-player-arena.png`. Baseline implementation: `2ba8d1e563222ea02ed0cf0bb61fbe49d6342989`. It changes the opted-in cartoon arena and presentation; the original pixel game and its evidence remain protected.

## Implementation

- The five tier tops follow the measured reference. Authored collision shelves use the nearest tile-grid endpoints; painted cap ends follow the reference silhouette. The floor moves to row 22, preserving the original jump, movement, firing and capture rules.
- A monotone presentation projection maps collision feet onto the reference's uneven vertical spacing. Actor images retain uniform proportions. A pure current-state fit keeps crown jumps visible and returns to the canonical framing without stored presentation state.
- The former tiled wall strips are removed from the cartoon renderer. Cream ledge caps, darker undersides and local supports use a new generated stone kit. The bottom cap meets a full carved HUD foundation.
- The live HUD uses new parchment and carved dragon relief assets, the original portrait pixels in new cropped derivatives, foreground identity diamonds, native live text and the four fruit icons. The narrow roster retains its adaptive two-row layout.
- Existing character drawings, frames and animation definitions are unchanged. Their presentation scale is adjusted; the scene's live content and controls remain testable through the engine.

## Art provenance

The built-in image generation tool created the environment/UI/stone sheets from the original reference. All selected runtime assets are saved under `assets/cartoon/reconstruction/`; generated source images, rejected alternatives and prompts are saved in `sources/` and `prompts/`. Exact extraction boxes and pixel hashes are in `ui-asset-provenance.json` and `platform-kit-extraction.json`. The deterministic extraction scripts package generated alpha pixels; they do not redraw the protected character artwork.

The environment edit is a reconstruction, not an exact background extraction: generated background arches, foliage and waterfall details still differ from the original. Preserved character drawings also differ from the concept's illustrated poses and silhouettes. Diagnostic differences must not be described as a 100% pixel match.

## Verification

`qa-plan.md` and `reference-layout.json` define the measurement and gameplay contract. Comparison captures come from the actual native Game Engine viewport. Only the reference is normalized to the comparison size; actual gameplay pixels are never stretched to hide layout drift. A jump capture is kept separately because adaptive zoom intentionally changes the shelf positions during crown jumps.

Final results and remaining platform limitations are recorded in the verification report alongside the captures. Prior evidence and recordings are retained under their original paths. `migration-preservation.json` confirms all 1,625 original protected migration files remain byte-identical.

## Final texture packaging

All new UI and platform textures share one named `cartoon-reconstruction` atlas at their original default resolutions. The background stays standalone, with documented importer limits of 1024px on `phone` and 768px on `phone-low`. No protected old image or metadata file is changed. Per-device atlas override experiments were rejected and removed; their superseded measurements are retained for diagnosis, not claimed as the final configuration.

Fresh canonical mobile hosts verify the actual asset classes: `phone` uses 123,206,500 GPU texture bytes; `phone-low` uses 105,250,524 bytes (about 100.4 MiB). These are fresh reference-fixture measurements. The separate phone-low/compat stress snapshot uses 123,600,268 bytes (about 117.87 MiB), an increase of 14,794,456 bytes over the previous milestone's comparable 108,805,812-byte stress snapshot. Later content-catalogue rows did not sample GPU allocation, so a full-catalogue maximum is not established. These are host allocations, not physical-phone GPU timing or thermal certification.

The narrow footer batches frames across both rows, then portraits, badges and live labels. Its native reference capture uses 12 draw calls after the original 15-call failure was fixed. Floating score rewards now use the same nonlinear projection as their world source; an actual 800-point reward moved from the erroneous logical Y 914.22 to the correct Y 497.8 without changing the simulation.


## Final verification and images

- 308 V8 logic tests pass; all 280 protected original per-step traces remain identical with zero allowances. Two explicitly opted-in arena-creation traces differ from the immediate baseline and are classified individually.
- 62 desktop render cases pass, including all 48 original pixel cases. Five newly named recordings verify 739 steps; active structural budgets remain capped at 14 draws.
- All 52 measured canonical cap/header/footer anchors pass the 4-pixel hand-painted-edge tolerance. Three cold live-viewport probes pass. The protected evidence, recordings, original pixel goldens and character sources remain byte-identical.
- The final engine check passes TypeScript, validation, desktop cook and 600 cooked smoke frames. Five cooked V8 checkpoint cases pass 739 steps and 52 screenshot checks with the phone-low memory class.

See [verification](verification.md), [machine-readable totals](verification.json), [performance and limitations](review.md), and [engine check](engine-check.json). The existing stale pipeline record still prevents release packaging; no release build is claimed. Host stress heap also exceeds low-end starting guidance, and physical-phone timing/thermals remain unverified.

The [side-by-side comparison](reference-comparison/side-by-side.png) places the normalized original concept on the left and native engine pixels on the right. [Canonical engine frame](canonical-reference.png) uses documented fixed reference poses; [active gameplay](wide-combat.png) uses recorded engine inputs. [Overlay](reference-comparison/overlay-50.png), [difference](reference-comparison/absolute-difference.png) and matching region crops remain available for inspection.
