# Reconstruction architecture and measured performance review

The reconstruction passes the existing 14-draw structural limit in the nine host stress runs and their content probes. It is ready for visual inspection with explicit fidelity and device-performance limits below. This review is not a release or physical-phone performance certification.

## Scope and ownership

Reviewed `src/cartoon/{arena,projection,actor-layout,help-layout,labels,plan,renderer,hud-layout}.ts`, their integration in `src/arcade/{arena-layout,presentation}.ts`, the native UI paint passes, and the new reconstruction import metadata. `gameengine scope --dependents` identified the simulation factories, controls, schema consumers and render tests affected by these paths. The original pixel level data, controls, jump physics, character PNGs and animation definitions remain separate from the opted-in geometry and presentation.

The new arena is 72 columns by 23 rows, with tier rows 3/8/13/18/22. All cartoon waves now use this canonical reference geometry; the earlier four shelf variants were deliberately removed for this reconstruction. Enemy wave progression and the original pixel campaign remain unchanged. The unchanged jump rises 126 world units. The presentation maps collision feet through an invertible monotone projection, then subtracts a uniformly scaled image height. It does not stretch actors vertically or clamp their bodies.

The engine's flat 2D camera remains driven by `WorldView`. The adaptive stage fit is a pure function of current authoritative actor bounds, with no stored camera state, clock or simulation writes. It preserves canonical framing until an extreme jump needs room, then zooms uniformly around the floor and returns along the same trajectory. Safe HUD bounds, HELP plaques, diamonds and text use the same reference coordinates. The existing pool and native Sprite path remain in use.

**No remaining must-fix layering or state-ownership finding was identified in this scope.** Two integration defects were corrected: portrait safe-area HUD displacement was missing from world callout bounds, and floating reward text still used the old linear transform. An actual native `800` label moved from logical Y 914.22223, below the footer, to the correct projected Y 497.8; its size stayed unchanged. Before/after queries are in [reward-native-before.json](reward-native-before.json) and [reward-native-after.json](reward-native-after.json).

## Fidelity and geometry limits

Canonical shelf tops and painted endpoints follow the measured reference, independently checked against native Sprite bounds. Collision still uses 24-unit tiles. The maximum interior painted-edge/collision-edge discrepancy is 11.3302 physical pixels at 1536×864. Outer cream ends extend decoratively into the solid side backing; that overhang adds no walkable area. See [collision-art-edge-contract.json](collision-art-edge-contract.json).

The approved larger green pose has about 98.13×98.13 physical pixels of visible alpha. The reference pose is approximately 104.73 pixels wide and 84.47 high. Uniform scaling improves width/presence at the cost of a taller silhouette; the existing character artwork was not redrawn or stretched. The default `dragonDraw(..., size=64)` contract remains intact.

The selected clean plate is the closest of three built-in image-edit results. Its distant architecture and waterfall arrangement still differ from the master concept. It is not an exact reconstruction of every background pixel. All generated alternatives and the unused foreground-mask trial are retained in `sources/`. The mask is not loaded at runtime. No independently tiled wall strips were added.

## Host CPU, GC and draw measurements

[performance.json](performance.json) contains nine fresh V8 engine sessions: mobile, desktop and compat tiers, each with six players/five bots, ten players/nine bots, and ten human slots. Each scenario measures 600 steady steps after warmup, with ten actual render probes. These are native headless host measurements with UI layout enabled.

| Metric across nine steady windows | Observed |
| --- | --- |
| One simulation step, p95 | 1.705–2.350 ms |
| Presentation, p95 | 9.424–10.927 ms |
| Last sampled JS heap | 43.889–54.075 MiB |
| Reported process memory | 299.516–341.094 MiB |
| Maximum GC pause | 1.429 ms |
| GC pauses over 4 ms | 0 |
| Steady peak draws | 13 |
| Content-probe peak draws | 14 |

The direct QA boss-reset startup windows recorded maximum simulation-step times of 12.963–16.451 ms and maximum presentation samples of 1.696–3.993 ms. These windows do not represent normal countdown startup or a physical device launch. The separate title observation contains a 59.794 ms frame sample and one hitch; it must not be substituted for steady combat timing.

For the same three mobile workload shapes in the prior refinement report, presentation p95 increased by about 20.3%, 26.4% and 21.7%. Host CPU cost has increased even though structural draws pass. Before further optimization, profile the actual target device and the measured presentation/UI work rather than infer phone timing from this computer.

The sampled stress heap exceeds the skill's 32 MiB low-end starting guidance. A fresh canonical phone-low snapshot uses 29,884,112 bytes (28.50 MiB), which is a different GC/content context. Later stress snapshots range from about 34.71 to 63.46 MiB. These samples establish neither a leak nor sustained low-end heap compliance.

The title's `framesRendered` stayed at 58 across 120 stepped idle ticks. The headless `idleFrames` counter itself was disabled, so no presented/skipped-frame ratio or phone power-saving claim is established. See [idle-title.json](idle-title.json).

## Texture residency: compare matching contexts

GPU allocation, CPU/cooked texture residency and process memory are different measurements. The valid final packaging combines all **new** UI/platform sprites into the shared default `cartoon-reconstruction` atlas, retaining their full source resolution. The background stays standalone with supported phone-low 768px / phone 1024px import limits. Per-device atlas-size experiments were removed after validation; their reports are explicitly superseded trials. [renderer-validation.json](renderer-validation.json) reports success with no new reconstruction warnings.

| Context | Actual class | GPU texture bytes | MiB |
| --- | --- | ---: | ---: |
| Fresh canonical fixture, mobile tier | phone | 123,206,500 | 117.50 |
| Fresh canonical fixture, mobile tier | phone-low | 105,250,524 | 100.37 |
| Title warmup plus boss stress, mobile tier | phone | 139,983,716 | 133.50 |
| Title warmup plus boss stress, desktop tier | desktop | 155,189,252 | 148.00 |
| Title warmup plus boss stress, compat tier | phone-low | 123,600,268 | 117.87 |

The fresh fixture and stress snapshots must not be treated as interchangeable. Stress loads additional content and retains more GPU pages. The prior milestone's matching compat/phone-low stress snapshot was 108,805,812 bytes; the current stress snapshot is **14,794,456 bytes higher**. The fresh canonical saving does not establish a full-game saving.

The phone-low stress allocation is near the guide's 120 MB texture starting point. The catalogue loop records draws and loading status, but not GPU allocation after each item/effect state, so the **full-catalogue GPU maximum is unestablished**. No blanket memory-budget certification is made. The exact fresh-context comparison and earlier packing trials are preserved in [memory-classes.json](memory-classes.json) and its explicitly named before/trial reports.

## Final native captures and pipelines

Final active captures report 13/12/12/13 draws for wide/native/tall/ultrawide, 13 for HELP and countdown, and 14 for boss and crown-apex HELP. See [composition-captures.json](composition-captures.json). The narrow footer's frame, portrait and foreground passes were grouped across both rows to remove the earlier 15-draw failure without changing its anchors or bindings.

Every observed pipeline key was compared with `pipelines.json`. No additions were necessary; all 12 compat, 18 desktop and 12 mobile historical entries were preserved. The existing warmup warning about two historical 3D programs without a current matching material remains explicit; unknown historical material records were not deleted. All nine steady windows report zero pipeline creations. See [pipeline-preservation.json](pipeline-preservation.json).

The remaining validation boundary is physical hardware: GPU time, sustained frame rate, thermal behavior, peak full-content residency, real controllers and group readability require device/human testing. All sessions used for this review were stopped by their own PID. Final logic, replay and preservation results are tracked in this directory's README and QA reports.
