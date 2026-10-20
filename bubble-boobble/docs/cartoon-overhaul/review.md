# Cartoon overhaul architecture and measured performance review

Reviewed 2026-10-20. Scope: `src/cartoon/{arena,plan,renderer,theme}.ts`, the cartoon branch of `src/arcade/presentation.ts`, the new cartoon scene, and the opt-in factory, dimension, spawn, recorded-request and companion-navigation dependencies. The architecture and mobile-performance reviewer instructions and preserved engine skills were applied. Scope/dependency inspection preceded the code review; this is a feature review, not an audit of the engine or all pre-existing game systems.

## Architecture

No remaining **must-fix layering or ownership finding** was identified in this scope after the navigation fix. Recorded UI intent selects the explicit cartoon request; simulation factories select the new arena without reading cameras, materials or other `sim:false` state. Existing original factories retain their defaults. The new arena clones authored level data, keeps level metadata/enemy families/counts, provides four shelf patterns, and owns its deterministic geometry. No persisted save shape or simulation-resource schema was added.

The presentation boundary owns native Sprite images, filters, tint, mask clipping and cosmetic animation observations. Sprite entities reuse the pool; the new arena has an explicit extra capacity allowance and overflow checks. The original MeshRenderer pixel path remains available. Cosmetic movement history uses the existing presentation resource rather than mutable module state. Partial sprites retain their source geometry and UVs; the shared stencil clips them. UI documents own the new menus/HUD. QA setup remains in stripped `*.cheats.ts` files. The apparent arena/type dependency back edge is type-only and erased at runtime.

**Resolved finding — `src/arcade/companion.ts`, `warmPartyNavigation`:** its courtyard-only guard omitted the new cartoon arena. Consequently bots synchronously constructed their navigation graph during first combat. The guard now admits `cartoon-courtyard` too, allowing the existing bounded four-node-per-profile warmup to run during preparation. The original courtyard condition and algorithm remain unchanged. The verifier added a focused normal-countdown regression that checks completed shared graphs before GO and reuse on first combat.

**Consider — `src/cartoon/plan.ts` and presentation:** visible plans still rebuild board/actor draw lists each presentation, and original scene planning supplies shared layout/text information. This scales with board cells and actors and allocates transient objects. The new board is 36×18 rather than the original party board's 44×30; measured steady CPU and GC did not establish a need for a broader cache/refactor in this change. Caching static masonry would be the first focused follow-up if phone profiling identifies this path.

## Normal countdown: controlled before/after

`tools/cartoon/navigation-warmup.mjs` runs the same seeded wave 1, ten-player/nine-bot cartoon game with the normal 180-step preparation. Both runs use the mobile-tier headless engine on this computer. Asset rendering is warmed before the timing window. These are single controlled observations, not a statistical phone benchmark.

| Observation | Before guard fix | After guard fix |
|---|---:|---:|
| Completed bot graphs with one preparation tick remaining | 0/9 | 9/9, shared 65-node graph |
| Maximum step during 179 preparation steps | 2.085ms | 7.865ms |
| Maximum of transition/first-combat two steps | 36.650ms | 3.574ms |

The fix distributes graph construction into preparation; it does not remove that work. Raw measurements and graph state are retained in `navigation-warmup-before.json` and `navigation-warmup-after.json`. The previous full stress report is retained as `performance-before-navigation-warmup.json`.

## Final actual engine measurements

`node tools/cartoon/overhaul-performance.mjs --all-tiers` ran nine independent owned headless sessions: mobile, desktop and compat, each with six players/one human, ten players/one human, and ten humans. Every session used the new geometry and a protected high-HP boss, 60 warmup steps, 600 measured steps, and ten explicit render probes. Each also rendered enemies, captured enemies, items, elements, rescue, captured boss and victory at 768×720,1680×720,640×960 and2520×1080. Own processes were stopped individually. Raw data: `performance.json`; actual pipeline observations: `observed-pipelines-*.json`.

| Tier | Players/humans | Step p95 ms | Presentation p95 ms | Sampled RSS MiB | Sampled JS heap MiB |
|---|---:|---:|---:|---:|---:|
| mobile | 6/1 | 1.748 | 7.828 | 261.59 | 34.25 |
| mobile | 10/1 | 1.940 | 8.519 | 265.84 | 37.01 |
| mobile | 10/10 | 2.086 | 9.284 | 287.75 | 40.27 |
| desktop | 6/1 | 1.675 | 7.640 | 263.41 | 31.69 |
| desktop | 10/1 | 1.968 | 8.754 | 267.53 | 30.68 |
| desktop | 10/10 | 2.133 | 9.172 | 290.06 | 30.97 |
| compat | 6/1 | 1.666 | 7.738 | 258.77 | 30.96 |
| compat | 10/1 | 1.931 | 7.660 | 267.14 | 40.25 |
| compat | 10/10 | 2.095 | 9.119 | 290.25 | 30.98 |

Every steady probe reported 10 draw calls; the content matrix peaked at 11, below the existing 14-draw structural limit. All final asset-status captures reported no pending assets. Steady GC maxima were 0.617–0.688ms, with zero pauses over 4ms; the default guidance is at most 8ms and zero pauses over 4ms. No pipelines were created during the measured capture. Observed pipeline keys were merged by exact serialized identity, retaining **every** historical entry; this final merge added 0 keys. `pipeline-merge.json` records retained counts.

The stress startup deliberately jumps straight to a boss and bypasses the normal countdown. Its maximum step now ranges 10.993–15.061ms. Those values include setup/first-use work and are not the normal-start improvement above; the separate normal countdown comparison establishes that improvement directly.

## Memory and device limits

Actual `assets.stats.class` confirms **mobile uses `phone`, compat uses `phone-low`**. A mobile GPU-tier run alone must not be described as a phone-low measurement. Phone-low courtyard/paper overrides reduce measured source texture residency from 30,386,944 to 21,688,048 bytes. The renderer's GPU texture allocation estimate falls from 138,412,036 to 107,757,236 bytes, a 30,654,800-byte reduction. The phone-low estimate is below, but near, the generic 120MB texture guidance; the phone tier is below its generic 150MB guidance. This verifies that the cheaper content resolves in the actual phone-low class. It does not establish physical GPU memory pressure or thermal behavior.

Sampled host RSS 258.77–290.25MiB is below generic low-end 350MiB guidance. Sampled `perf.stats.jsHeapMB` 30.68–40.27MiB is **near or above** the generic 32MiB low-end heap guidance in several cases. Separate `profile.memory.jsHeapUsed` snapshots were 38.80–54.37MiB; they are a different instant relative to GC and must not be substituted for a steady percentile or certified peak. No forced-GC experiment was used to make the report appear smaller. This is a remaining memory risk for physical low-end-device validation, not a claim that all mobile budgets pass.

These are host V8 CPU timings with explicit engine GPU rendering. They do not prove the phone-low target of two simulation steps plus presentation inside 33.3ms, sustained GPU timing, fill rate, overdraw, ten-minute thermals, OS memory behavior, physical controllers, or ten-human readability. Device profiling on the supported low-end phone remains necessary. Idle-screen frame skipping was not measured by these active stress/probe windows, so no idle-skipping success is claimed. Existing menu animation and frame invalidation deserve a focused idle observation before release.

Actual final wide/native/tall/ultrawide images and camera evidence are in `composition-captures.json` and the corresponding `*-combat.png` files. The original pixel regression and baseline-hash checks, final cartoon goldens and newly recorded full-flow replays are owned by the verification pass; consult its final report for their final status.
