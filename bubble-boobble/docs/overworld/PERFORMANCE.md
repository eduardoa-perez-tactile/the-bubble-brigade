# Overworld performance review

## Current map style-pass asset validation

Measured 26 October 2026 after integrating all five selected map repaints. This pass changes artwork only; source geometry, simulation and UI remain unchanged. Comparative art review and user approval are separate from the checks below.

| Declared phone-low residency | Before | After | Project gate |
|---|---:|---:|---:|
| Map-phase peak | 37.18 MiB | 37.18 MiB | 48 MiB |
| Courtyard | 35.21 MiB | 35.21 MiB | 40 MiB |
| Shared sprites | 1.81 MiB | 1.81 MiB | 2 MiB |
| Each district | 0.168 MiB | 0.168 MiB | 2 MiB |

The peak is unchanged at 38,990,364 bytes. The fresh Android report includes `courtyard-gameplay,overworld-shared` in `--always` and passes every gate without budget changes. Repainting retained image dimensions and cooked residency; this does not measure total application RAM.

`gameengine check` passes typecheck, validation with existing warnings, pipeline validation, UI documents, desktop cook and 600-frame cooked smoke. The prior orphan-pipeline warning is absent in this check. Four focused T1 cases, four cooked campaign cases and the existing 681-step replay also pass. No full T0 rerun was needed for the asset-only change. Current map hashes, check details, warning text and exact before/after bytes are tracked in `evidence/style-pass-engine-check.json`.

No fresh CPU, runtime RSS, GC, transition-soak or physical-phone measurement was taken. Previous transition samples exceeded 32 MiB JS guidance; bounded retained heap and device GPU/thermal/loading targets remain unverified. The check now locates a Hermes host, but this pass did not run cross-runtime parity. Successful tests and memory gates do not establish style compliance or user art approval.

## Previous original-art validation

The results below describe the previous image bytes. The current style-pass cook and check are reported above; this older section remains historical. These metrics never certify visual style compliance.

Measured 23 October 2026 after replacing all copied map/flag assets with five original district plates, the original completion pennant and 240 original oblique dragon frames. The fresh Android phone-low cook includes both `courtyard-gameplay` and `overworld-shared` pinned for the map phase.

| Declared resident content | MiB | Project gate |
|---|---:|---:|
| Map-phase peak | 37.18 | 48 MiB |
| courtyard-gameplay | 35.21 | 40 MiB |
| overworld-district-1 | 0.17 | 2 MiB |
| overworld-district-2 | 0.17 | 2 MiB |
| overworld-district-3 | 0.17 | 2 MiB |
| overworld-district-4 | 0.17 | 2 MiB |
| overworld-district-5 | 0.17 | 2 MiB |
| overworld-shared | 1.81 | 2 MiB |

All memory gates pass without relaxing budgets or reducing the new dragon frames. Shared content uses 1.81 MiB of its 2 MiB gate. The command was `gameengine memory report --device phone-low --always courtyard-gameplay,overworld-shared --cook --json`. Terrain retains mobile ASTC6x6, phone-low 1024 and desktop uncompressed compatibility imports. Both original image bytes and generated provenance remain intact.

`gameengine check` passes typecheck, validation with existing warnings, UI-document coverage, desktop cook and 600-frame cooked smoke. The installed built-in Standard-material metadata warning (`7946469ed20397e0`) remains; successful check does not establish release packaging eligibility. The existing diagnosis is recorded in `RENDER-REVIEW.md`.

Current original-art verification also passes 452/452 V8 T0, four scoped T1 cases, four cooked campaign cases and the 681-step replay without divergence. These results validate the replacement integration, not physical-phone performance. Compact current evidence, exact bytes/gates and check details are tracked in `docs/overworld/evidence/original-art-validation-perf.json`; raw reports are `.gameengine/overworld-original-{phone-low-memory,check,full-t0,adventure-t1,screen-fit-t1,cooked-campaign,replay}.json`.

Declared asset-group residency is not total RAM. No new original-art CPU/GC/RSS or transition soak was run. The earlier source-art soak below exceeded 32 MiB JS guidance after combat; bounded retained heap remains unverified. Physical phone GPU time, thermals, RSS, cold loading and Hermes/web parity remain unverified. No phone-performance guarantee follows from desktop or cooked-residency results.

## Historical copied-art prototype measurements

The remainder describes superseded source-art assets and captures. Its 36.50 MiB peak and CPU/heap figures must not be presented as measurements of the current original artwork.

**Historical prototype evidence:** these measurements predate the current original-art/map/dragon replacement and must not be used as the final performance verdict for the replacement assets. Repeat cooked memory and render checks after integration.

Measured 2026-10-23. Scope: `src/overworld`, desktop documents/controller/state/model/save, Arcade encounter integration, schema and district asset groups. The runtime sample used the release V8 host on an Apple M2 Max, Metal, mobile render tier, paused headless mode with UI layout. CPU timings are comparative desktop measurements, not phone performance guarantees.

| Measurement | Observed | Budget / interpretation |
|---|---:|---|
| Final cooked phone-low map peak, courtyard and shared pinned | 36.50 MiB | 48 MiB project peak limit; all memory gates pass |
| Shared overworld group | 0.47 MiB | 2 MiB project group limit |
| Pinned courtyard group | 35.21 MiB | 40 MiB project group limit |
| District groups 1 / 2 / 3 / 4 / 5 | 0.75 / 0.26 / 0.21 / 0.82 / 0.49 MiB | 2 MiB per district |
| Stationary, 600 sim steps: step p95 | 0.121 ms | Desktop reference; phone-low guidance is approximately 8 ms per sim step |
| Walking, 125 sim steps: step p95 | 0.177 ms | Desktop reference |
| Walking, 60 separately sampled steps with render probes: step p95 | 0.431 ms | Includes different sampling overhead; do not treat as a regression against the batched capture |
| OverworldSystem, separately sampled walking: p95 | 0.113 ms | Desktop reference |
| Sixty mobile-tier render probes: peak draw calls | 12 | 50 in `tests/budgets/overworld.json` |
| New pipelines in those render probes | 0 | None expected during steady play |
| GC pauses over 4 ms / maximum pause | 0 / 1.281 ms | Zero over 4 ms; maximum 8 ms guidance |
| Walking JS heap used | 27.4 MiB | 32 MiB low-end guidance; approximately 86% occupied |
| Runtime RSS capture peak | 288.1 MiB | 350 MiB low-end guidance; desktop process only |

## Interpretation

The final Android phone-low asset-group report and measured draw calls pass their project gates. The expanded transition soak below leaves the JS heap envelope unverified after all source areas and combat have warmed.

The controller keeps `courtyard-gameplay` pinned throughout the cartoon session. The explicit `overworld-shared` group is now preloaded with the first map, stays pinned across district travel, and is released when leaving maps for combat or the menu. Returning from combat loads the shared group and current district again. Shared content has its own 2 MiB gate. District travel releases the previous district before loading the next behind a loading cover; release makes content eligible for eviction rather than guaranteeing immediate deallocation.

The final report used `gameengine memory report --device phone-low --always courtyard-gameplay,overworld-shared --cook --json`. Its peak is 38,273,388 bytes (36.50 MiB), including courtyard, shared and the largest district (district 4). All 48/40/2 MiB project gates pass. Omitting either pinned group understates that phase's estimate.

Terrain imports retain `compression = "astc6x6"` for mobile cooking, with a phone-low `max_size = 1024` override. Their `[settings.platform.desktop] compression = "none"` override preserves the desktop art comparison without changing mobile ASTC cooking or original PNG bytes. Desktop loose/cooked texture totals must not be substituted for the Android phone-low estimate.

The cooked phone-low report estimates declared asset-group residency. It is not total application RAM and does not include every ungrouped UI/audio allocation or renderer cache. Runtime RSS was sampled separately. Original map PNG bytes are preserved; phone-low texture reduction is configured through import metadata.

The initial walking sample's JS heap headroom was followed by the five-cycle soak below. Neither a single capture nor these endpoint readings establish bounded retained heap. Further attribution needs comparable post-collection baselines or a longer allocation profile.

## Measurement caveats

- `stepTimeMs` reports individual simulation steps. In a capture driven by one `step 600` RPC, per-system `systemTimeMs` can represent the whole RPC batch: the initial roughly 11 ms OverworldSystem value is **not** 11 ms per step. The separate one-step capture avoids that ambiguity.
- Paused headless `frameTimeMs` mixes protocol-driven work and idle host frames. Do not use its frame percentiles or hitch-frame counts as a gameplay frame-rate verdict.
- Headless rendering occurs when requested. The performance capture's `drawCallsMax: 0` is not a scene draw count; the explicit render probes measured the 12-draw peak.
- `idleFrames.enabled` was false, so GPU frame skipping was not established. Stationary simulation work was measured, but battery savings were not.
- No physical phone was used. Sustained GPU time, thermals, device RSS limits, cold-load duration, and the full 2.5-second low-end loading target remain unverified. Hermes and the web host were unavailable in this environment.


## Repeated transition soak

A fresh isolated release V8/mobile-tier headless session completed five cycles of normal journal travel `1 → 2 → 3 → 4 → 5 → 1`, followed by entering, pausing and confirming leave from the first encounter. A recorded QA journal fixture unlocked travel; the Warp cheat only positioned the avatar at the physical entrance and the identical final spawn. Cycle 1 warmed caches. No project source, test or golden changed during this run.

| Settled endpoint | RSS MiB | JS used MiB | JS allocated MiB |
|---|---:|---:|---:|
| Cycle 1, warm-up | 476.91 | 33.81 | 46.94 |
| Cycle 2 | 478.06 | 31.48 | 47.19 |
| Cycle 3 | 314.38 | 44.06 | 63.44 |
| Cycle 4 | 314.89 | 35.02 | 63.69 |
| Cycle 5 | 315.98 | 43.96 | 64.94 |

Every endpoint retained exactly 783 entities, 16 loaded assets with zero pending, 195.26 MiB in the runtime texture category, and 440.44 MiB in the GPU texture estimate. These loose desktop measurements warm the original PNGs and are **not** the cooked phone-low group estimate above. The final endpoint rendered 13 draws against the 50-draw gate.

JS used was nonmonotonic, but several samples exceeded the 32 MiB low-end guidance and allocated capacity rose. This does not prove a retained-object leak, and the run does not prove the low-end JS budget. No full collection was forced; normal pause maxima were below 0.862 ms, idle GC work reached 1.98 ms, and no recorded pause exceeded 4 ms. Longer allocation profiling and cooked/device measurements remain required before a phone-memory claim.

Evidence: `.gameengine/overworld-transition-soak/samples.json`, `summary.json`, `environment.json`, and `.gameengine/overworld-transition-soak-run.log`. The prepared runner is `.gameengine/overworld-transition-soak.mjs`. Its final cook/report and optional screenshot were skipped so the coordinator's concurrent final cook could finish safely. Only the runner's own session was stopped.

## Post-fix lifecycle check

After the shared preload and desktop terrain override, a fresh isolated release V8/mobile-tier session completed normal journal travel `1 → 2 → 1`, entered the first physical encounter, paused, confirmed leave and returned to the same district-1 spawn. The QA fixture unlocked travel and Warp positioned the avatar; normal recorded intents performed travel, play and leave. Only this session was stopped.

| Settled stage | RSS MiB | JS used MiB | JS allocated MiB | Loaded assets / pending | Draws |
|---|---:|---:|---:|---:|---:|
| initial-district-1 | 323.77 | 30.22 | 36.44 | 7 / 0 | 13 |
| district-2-before-combat | 320.88 | 31.07 | 36.69 | 8 / 0 | 9 |
| district-1-before-combat | 321.08 | 31.16 | 36.69 | 8 / 0 | 13 |
| combat-shared-released | 350.56 | 35.21 | 45.94 | 9 / 0 | 9 |
| returned-district-1 | 348.17 | 33.28 | 46.69 | 9 / 0 | 13 |

Every settled render had zero new pipelines and zero validation errors. Loading and the normal return path completed. Asset release permits caching, so loaded counts need not decrease. The documented `assets.status` RPC exposes aggregate loaded/pending counts, not group refcounts: these readings do **not** independently prove exact shared-group ownership. Controller inspection confirms first-map preload, retention across travel, balanced release on combat/menu and reload on return; exact runtime refcount assertions require a test using the public script-side `assets.stats()` API. The stage name `combat-shared-released` identifies the expected controller phase, not refcount telemetry.

The short check again exceeds 32 MiB JS guidance after combat. It validates flow and loading completion, not a retained-heap bound or phone performance. Evidence: `.gameengine/overworld-postfix-sanity/{stages,samples,summary,environment}.json`, runner `.gameengine/overworld-postfix-sanity.mjs` and `.gameengine/overworld-postfix-sanity-run.log`.

## Evidence and regression gates

A compact, tracked summary is saved in `docs/overworld/evidence/performance-summary.json`.

Local measurement artifacts (under the project, normally ignored by Git):

- `.gameengine/overworld-perf-scope.json`
- `.gameengine/overworld-phone-low-memory-final.json` (fresh Android cook, both pinned groups)
- `.gameengine/overworld-phone-low-memory.json` (historical, before explicit shared preload)
- `.gameengine/overworld-perf-idle.json`
- `.gameengine/overworld-perf-walk.json`
- `.gameengine/overworld-perf-sampled-walk.json`
- `.gameengine/overworld-perf-sampled-renders.jsonl`
- `.gameengine/overworld-perf-sampled-memory.json`
- `.gameengine/overworld-perf-sampled-markers.json`
- `.gameengine/overworld-perf-engine.json`

Project gates are `tests/budgets/overworld.json` (50 draws and the recorded Adventure flow) and `tests/budgets/memory.json` (48 MiB peak, 40 MiB courtyard, 2 MiB per district and 2 MiB shared). Run the map-phase memory report with both `courtyard-gameplay,overworld-shared` included in `--always`. The five-cycle soak records the previous preload arrangement; the post-fix check above covers the explicit shared-group change. A physical phone-low probe and further heap attribution remain necessary before device performance claims.
