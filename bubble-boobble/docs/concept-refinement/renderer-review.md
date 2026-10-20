# Renderer, framing and measured performance review

The approved reference was compared directly with the previous actual wide capture before editing. This pass changes presentation and explicitly opted-in arena data; character PNGs, animations, atlas metadata, controls and physics were not edited. The final source/dependency scope is recorded in renderer-scope.json. Preserved camera, screen-fit, determinism, simulation-boundary, architecture and mobile-performance instructions informed the review.

## Final design and actual comparison

The world is 72×24 tiles, retaining five collision tiers at rows 3/8/13/18/23 and the unchanged 126 px jump. The four curated variants use 2/4/5/3 upper shelf sections, with broad complete ascent lanes 10 and 50. Larger lower gaps have real upper detours. Two actors spawn per tier, including the far-right third-tier position atcol 64. Original campaign metadata/enemy kinds/counts and original pixel geometry retain their defaults.

Safe visual fit uses world x 18..1710, allowing opaque scaled shoot/run poses to overhang the physical wall boundary without cropping. Outer solid backing can fall outside the must-see rectangle; physics still owns its unchanged boundary rule. Existing visible wall faces continue upward through decorative headroom, enclosing the stage with the frozen wall texture. No camera driver changed: the existing WorldView-driven flat2d engine camera owns the canvas.

Hero/enemy draw envelopes scale 1.6× to 102.4/89.6 world pixels; the boss scales 1.5× to 168. Their feet remain anchored to the original collision body. dragonDraw's default 64 px API remains unchanged for protected tests; opted-in arena planning supplies the enlarged size explicitly. Actual hero alpha spans source y 12..120, so its visible standing height is 86.4 world pixels. At the fixed crown jump apex its visible top reaches−140.4 world pixels; the 152 px headroom allowance protects this without clamping or moving a body. Muzzle tests check that the real first-frame bubble covers the scaled mouth; shootBubble physics is unchanged, and the shooting pose does not shrink.

The final 1536×864 authored framing calculation places the first shelf atx 36.49 px, versus≈114 px in the previous actual scene and≈20 px in the normalized reference. The safe footprint occupies 98.75% of the viewport width. Crown/floor collision tops are 283.71/714.01 px. The crown remains lower than the reference's≈27%height target: fitting the full 126 px jump plus enlarged opaque art is the explicit playability constraint. Do not describe the geometry as an exact trace of a still concept showing mid-jump actors. Hero apparent height grows by≈1.42× relative to the preceding fit because the 1.6× art envelope is combined with the wider world; visible hero height is≈77.45 px at this capture size. Parent review approved the actual result.

World identities are genuine code-native colored diamonds using two existing-white sprite quads, with centered white outlined 1–10 Text2D labels. The rotated side is outerAABB/√2, so the shared outer diamond bounds stay exact. All ordinary/pixel quads reset their quaternion. Marker/plaque quads are appended together after actors to retain batching. Number labels share body/diamond blink visibility, including grace and Downed behavior. The existing 36-text party reserve covers ten numbers plus ten HELP labels; overflow is guarded.

The HELP plaque, its text and side diamond use one clamped anchor. The anchor includes half of any badge-height excess above the 24 world-pixel plaque, so native/tall scale does not move its top into the header. Real jump→injury captures confirm the group remains visible; the body itself is never clamped. Legacy identity text remains hidden only on the modern path.

## Rejected art-layout trial

[wide-combat-caps40-span96.png](wide-combat-caps40-span96.png) retains the requested 40px-depth/96px-repeat trial. It was rejected: 96px stretches each single cream top block to roughly twice the reference proportion, and 40px depth plus the 86.4px hero silhouette can overlap by 6.4 world pixels under a 120px tier. The final 32px depth/48px repeat keeps 1.6px mathematical clearance and the original 8px lower-art allowance. No bitmap was redrawn or resampled.

## Actual engine evidence

Final combat images cover wide 1536×864, native 768×720, tall 640×960 and ultrawide 2520×1080. Their actual draw counts are 10/12/12/10. Floor HELP/start/boss/crown-apex HELP report 12/10/11/14. The last case reaches the existing 14-draw cap; there is no spare draw margin in that scene. composition-captures.json stores actual camera/render snapshots and explicitly labels calculated framing bounds. The rejected trial and short-wall comparison remain separately named. Previous milestone documentation/replay evidence was preserved.

The verifier's focused gates passed 9 concept controls,4 refinement controls and a six-shot actual device T 1 before performance. Coverage includes both real unupgraded ascent lanes, diagonal/gap transfers, the upper detour, missed-jump recovery, full 44 px spawn support, the unchanged jump trace, opaque actor/crown/wall bounds, native rotated diamond AABBs, number centers, HELP bounds and actual hidden/visible Invincible parity. Final full-suite/replay outcomes belong to the verifier's final report.

## One final nine-scenario performance pass

Command: node tools/cartoon/overhaul-performance.mjs --all-tiers --out docs/concept-refinement. Each independent owned release-host session uses 60 warmup steps,600 measured steps and ten explicit render probes. Cases: six players/one human, ten players/one human and ten humans across mobile/desktop/compat. Protected boss combat is followed by seven content states at four aspects. All own processes were stopped individually and the engine slot released to verification.

| Tier | Players/humans | Step p 95 ms | Presentation p 95 ms | Sampled RSS MiB | Sampled JS heap MiB |
|---|---:|---:|---:|---:|---:|
| mobile | 6/1 | 1.761 | 8.430 | 290.80 | 46.96 |
| mobile | 10/1 | 2.035 | 8.547 | 336.28 | 38.81 |
| mobile | 10/10 | 2.005 | 8.525 | 308.78 | 45.42 |
| desktop | 6/1 | 1.809 | 8.130 | 287.11 | 39.93 |
| desktop | 10/1 | 2.020 | 8.605 | 335.84 | 38.66 |
| desktop | 10/10 | 2.017 | 8.667 | 306.80 | 44.49 |
| compat | 6/1 | 1.743 | 8.252 | 290.27 | 48.14 |
| compat | 10/1 | 2.019 | 9.408 | 333.56 | 47.02 |
| compat | 10/10 | 2.022 | 8.917 | 307.38 | 40.06 |

All nine steady and content matrices peak at 12 draws, within 14. Assets pending 0. Steady GC maxima 0.523–1.066 ms, zero pauses over 4 ms. No pipeline was created during capture. Actual observed pipeline keys were merged by exact serialized identity, retaining every historical entry;0 additions. Direct-to-boss QA startup step maxima 15.645–17.407 ms bypass preparation and are not normal countdown or cold-launch timings.

## Remaining risks and limits

Host sampled JS heap 38.66–48.14 MiB exceeds generic 32 MiB low-end guidance; sampled RSS 287.11–336.28 MiB is below but near generic 350 MiB guidance. GC phase affects sampled heap, so these values are not evidence of an allocation improvement over the previous pass. No forced GC was used. A focused allocation/device profile remains the appropriate follow-up; draw-plan/state rebuilding and navigation document serialization are candidates rather than proven causes.

These are the steady-capture samples. The separate post-content `memory.categories` snapshots reach 51.33–83.69 MiB JavaScript heap and 292.77–343.97 MiB resident memory after the multi-aspect render sweep. They include host/runtime/render-target overhead and remain a material memory risk; the smaller steady samples must not be presented as a peak-memory bound. The engine structural and asset-residency gates passing does not establish that low-end phone memory budgets pass.

Actual assets.stats confirms mobile uses phone and compat uses phone-low. Phone-low source texture residency 21,944,048 B and GPU texture estimate 108,805,812 B remain unchanged from the preceding milestone; phone values are 30,642,944 B and 139,460,612 B. The cheaper background overrides still resolve. The phone-low GPU estimate is below but near generic 120 MB texture guidance; this is not physical GPU memory certification.

Title observation reports idleFrames.enabled:false in this paused headless host. Therefore idle skipping/power behavior remains unproven. Host V 8 timing and native render probes do not certify sustained phone-low 33.3 ms frames, GPU fill rate, thermals, OS memory pressure, physical controllers or ten-human readability. Narrow full-board fitting necessarily makes actors smaller than the wide comparison. Physical low-end-device profiling and human group play remain required before release.
