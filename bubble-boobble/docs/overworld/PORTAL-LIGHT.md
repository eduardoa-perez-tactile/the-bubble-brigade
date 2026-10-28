# Warm light on existing district exits

Option A adds warm illumination to the destinations already painted on the five maps. Five distinct local landmark clears enable a fixed interior light and a separate ground reflection. The final Victory Beacon receives completion lighting without adding a sixth stage. Paintings, POIs, traversal, camera behavior, progression and controls are unchanged.

The light uses ten small source-registered masks, two per district, on the existing resident atlas. Additive blending preserves the underlying brushwork. Both quads draw behind the player. No particle system, shader, camera logic, schema or mutable animation state was added. Existing sprites retain their Alpha blend default.

The existing 240-step marker clock drives a two-second smooth swell followed by a two-second still hold. Opacity runs from 0.68 at rest to 0.94 at the peak; the authored mask supplies the local strength. Geometry never moves or scales. Reduced effects holds the rest intensity. The original generated concept is a direction reference, not replacement scenery.

## Source and reproduction

- `tools/overworld/portal-light/masks.json`: individually reviewed aperture and ground polygons/ellipses in original 1254px painting coordinates.
- `tools/overworld/build-portal-light.swift`: reproducible VFX-native light-mask generator; reads geometry, writes PNGs and metadata, never edits paintings.
- `tools/overworld/portal-light/manifest.json`: mask/output hashes and the five read-only painting hashes.
- `src/overworld/portal-light.ts`: source rectangles, local-clear gating and opacity sampling. Keep its rectangles equal to the mask canvases when authoring an adjustment.

Run engine/npm commands inside `bubble-boobble/`. Regenerate assets while this project's game sessions are stopped:

```sh
swift tools/overworld/build-portal-light.swift
npm run harness:quick -- 'portal warm light'
node tools/overworld/approval/verify-map-preservation.mjs
gameengine run --headless --paused --tier mobile --scene scenes/cartoon.scene.json --json
# Substitute the PID returned by run; never operate an unrelated editor/session.
node tools/overworld/capture-portal-light.mjs --session PID --loop-frames 24
node tools/overworld/capture-portal-light.mjs --session PID --positions-only
node tools/overworld/capture-portal-light.mjs --session PID --district 4 --sizes wide --near --out .gameengine/portal-light-near-approach
```

The debug-only fixture creates a separate QA profile through normal save actions. It preserves existing profiles and verifies the actual phase, local readiness and reduced-effects setting before each capture. The helper accepts only an explicit paused headless session for this project; it waits for loading and checks the actual avatar position after warping. Use an isolated headless session. The fixture is stripped from release and is never imported by game code.

## Reviewed actual renders — 28 October 2026

The coordinator and an independent visual reviewer inspected actual Game Engine captures. The first flat cream fill and a later cool treatment were rejected before the final warm additive calibration.

| Destination | Reviewed result |
|---|---|
| Garden Arch | Warm opening and landing spill; stone, scenery and player stay readable. |
| Fairground Arch | Correct right-hand travel arch illuminated. Left decorative arch, pots and plants remain intact. |
| Cloud Lift | Restrained boarding-gap light and wooden-deck reflection; ropes, cloud, ocean and player remain clear. |
| Amber Lift | Light stays inside the oval; original clouds and gold rim remain legible; steps catch warm light. |
| Victory Beacon | Existing flame and glass stay visible; restrained local platform light supports completion. |

The lift and beacon deliberately use quieter strengths than the arches. This implementation review does not replace the user's judgement of the final art.

The review contains 195 frames: all five districts at 1280×720, 360×880 and 1680×720, each with off/rest/peak/wrap/reduced states and 24 landscape loop samples per district. Another five frames show the Amber Lift at its actual interaction position in the wide viewport. The farther reveal position retains an existing camera crop of the mirror top; the entire mirror is visible at the near interaction position without a camera change. Player face, sill and step edges remain readable there.

Across all 15 district/viewport combinations, feature-local wrap and reduced-effects pixels exactly match rest (maximum channel difference zero). Whole screenshots can differ because unrelated coasts and crests animate. All 15 requested player approaches were independently corroborated within 0.000010 world units; the near Amber Lift capture also validates its actual gate position.

Runtime captures, manifests, profiles, performance logs and the native-encoded animation gallery remain in ignored `.gameengine/portal-light-*` diagnostics, following the Git workflow. They are presented in the chat for visual approval, not committed as runtime artifacts.

## Verification and limits

- Three focused V8 T0 tests pass: local distinct-clear gating, trials/repeats, read-only progress, final beacon, pulse continuity, reduced effects, fixed geometry, additive order, original painting presence and the existing 48-slot pool.
- All five original painting hashes and all five map registrations pass the preservation check. Frozen migration evidence and manifests were not changed.
- The 195-frame set uses 11–13 draw calls against the existing budget of 50, with zero particles, new pipelines or render validation errors. Every capture is uncovered by loading UI. The effect adds two quads and one observed draw call.
- Ten source PNGs total 886,752 bytes of RGBA texels (0.846 MiB) across all five districts, before max-size reduction, compression or atlas overhead. This is not a cooked-residency measurement.
- Local paused release-host diagnostics at the same near Amber Lift position and wide viewport, 240 steps each: light off has presentation p95 0.636 ms / step p95 0.157 ms; light on has presentation p95 0.494 ms / step p95 0.107 ms. Draw calls are 12 and 13 respectively. These short whole-project samples include different progress/UI states and normal run variance; they establish neither a speedup nor isolated VFX cost. Late-QA-session JS heap was 36.63 / 37.68 MiB and does not establish handset memory behavior.

Full suites, Hermes parity, cooks/cooked residency and smoke, golden/replay sweeps, pipeline recordings, oracle checks and handset GPU/thermal tests remain deferred under the current prototype policy. No expected output, test budget, source painting or camera was rewritten to make this pass.
