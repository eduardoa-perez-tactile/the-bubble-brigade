# Harbor map preservation and animation review

The harbor slice improves the existing map in place. Its accepted geography, buildings, paths, coast contours, palette, camera framing, and existing destination positions remain fixed. Collision corrections align gameplay to the painting; they do not redesign the scenery.

Open [the offline review](review.html) for the exact accepted harbor painting with numbered work areas and optional current collision overlays. Dashed rectangles identify candidate study regions, not final edit masks or production changes. Proposed sprite studies are labelled separately when present.

## Approval sequence

1. Review the current map and work-area callouts.
2. Review a coastline study fitted to one existing shore, a lantern-only study on the existing lighthouse, two treatments confined to the current stall, and a non-dragon resident silhouette lineup.
3. Approve the treatment before producing the full harbor animation/NPC set.
4. Review the combined harbor in the Game Engine before extending the approach to the other districts.

The existing red-and-cream stall beside the lighthouse remains the shop location. A new building, altered map layout, enlarged storefront, decorative flags, or the rejected replacement-harbor illustration are outside this work.

## Preservation gate

`map-preservation.json` records the five accepted PNG hashes and their native dimensions, plus existing map transforms, spawn, layer registration, and destination coordinates. The original hidden-coin anchor is unchanged; its interaction radius is explicitly permitted to change from 26 to 68 source pixels so the coin remains reachable from paving beside a corrected palm bed. It deliberately excludes walkable/solid polygons and additional approach metadata so collision and interaction corrections remain possible. The manifest is a fixed review baseline; do not regenerate it to hide an unintended map change.

Run inside `bubble-boobble/`:

```sh
node tools/overworld/approval/verify-map-preservation.mjs
python3 tools/overworld/approval/prepare-study-previews.py
node tools/overworld/approval/build-review.mjs
# Optional standalone export (ignored, not committed):
node tools/overworld/approval/build-review.mjs --embed
```

The preview preparation command requires Pillow and only extracts source crops, splits generated study sheets, and encodes review GIFs. It never alters production artwork.

The default HTML reads current harbor collision polygons and references the accepted painting and study images through relative repository paths. Keep it in this package with the repository tree available; it has no network dependencies. Optional `--embed` writes a standalone copy to ignored `.gameengine/living-map-review.html` without changing the tracked review. The builder includes studies only when these package-local files exist:

- `previews/shore-study.png`
- `previews/lantern-study.png`
- `previews/shop-npc-study.png`

## Reference findings

The local Cuphead extraction separates map terrain, landmarks, foreground/top pieces, and residents. Isle I has four geography-specific waterline groups of three drawings and matching ripple groups of six drawings. These overlays follow the exact island contour; the relevant lesson is fixed registration and drawn contour changes, not rotated generic shoreline tiles. Shop sprites use integrated SHOP lettering, an entrance, and a compact recognizable silhouette. The extracted lighthouse is static; its files do not establish animation timing or an animated-lighthouse sequence.

See the existing [reference calibration record](../../../tools/overworld/REFERENCE-CALIBRATION.md) for library/source provenance. That historical record does not authorize importing copied Cuphead art into production. The library and migration archive remain unchanged.

## Verification and remaining decisions

Use Game Engine recorded input, headless sessions, render captures, responsive checks, and performance/memory reports. Do not substitute standalone/browser/OS playtests. Passing engineering checks does not grant artistic approval.

The working shop scope is one per five explorable maps. Prices, permanent unlocks versus consumables, equipment limits, retry/death behavior, and shops inside combat stages remain separate economy/flow decisions. No powerup model is implied by this approval package.

## Implemented first slice

Two existing southwest palm planting beds now block the player's feet. The Tidepool Coin keeps its existing anchor; its interaction radius changes from 26 to 68 source pixels so it can be reached from adjacent paving. Recorded movement verifies both obstacles and retreat onto the promenade. The remainder of the map still needs a boundary and entrance audit.

The presentation foundation supports fixed registered shoreline contact/ripple and lantern interior/front sequences, held drawings, reduced-motion rest frames, and explicit capacity validation. Existing ambience no longer silently disappears when a pool would overflow. No new production sequences or artwork are registered.

[Verification](verification.json): all 502 logic cases pass on each of V8 and Hermes, two relevant phone-low render cases pass without golden changes, and the new 255-step movement replay verifies on both runtimes. Engine check passes typecheck, validation with existing warnings, desktop cook, and 600-frame cooked smoke. All five painting hashes and map registrations pass the preservation gate. Initial/final worktree captures are pixel-identical at slim, landscape, and ultrawide sizes; this does not approve the separate generated studies.

Final local release-host measurement over 600 paused steps: step p95 0.104209 ms, presentation p95 0.415042 ms, JS heap 28.3112 MiB; slim rendering uses 7 draws and 0 particle instances. Sampled complete draw plans peak at 35 of 48 visual slots. The phone-low cooked asset report estimates a 38.20 MiB peak against the existing 48 MiB scenario budget; every declared gate passes. These are local measurements and asset estimates, not handset performance or future animation memory guarantees.

## Measured starting point

The release-host headless baseline covers 600 paused simulation steps: step p95 0.120416 ms, presentation p95 1.012042 ms, and JS heap 30.0604 MiB. The slim capture reports 7 draw calls and 0 particle instances. These are relative local diagnostics; they do not establish phone FPS, handset memory, thermal behavior, or worst-case draw count. Engine captures remain in ignored `.gameengine/` diagnostics.

## Study limitations

The generated coast and lantern sequences are motion/design studies, not production-ready pixel-registered overlays. Minor drawing-registration drift remains. The game painting is unchanged; the studies have not been imported into production. Original source crops appear beside each generated study for comparison. Motion previews start paused and use explicit play/pause controls; a change to reduced-motion preference stops playback.

The stall sheet offers lettering on the existing front beam (A) or counter panel (B). The living buoy, spool worker, and envelope courier are unapproved original character proposals. Its small dragon doodle is not the shipped player or an approved scale reference. Actual scale needs an engine capture with the real player.

The review also includes a design-size readability strip using the actual shipped green dragon sprite at 48 × 61 presentation units, beside CSS-cropped NPC proposals normalized to 61 high. It replaces the sheet’s invalid generated-player reference for silhouette comparison only. It is not physical-screen or in-engine scale approval. No bitmap was edited to make the strip.
