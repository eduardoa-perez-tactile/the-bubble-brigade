# Playable concept milestone review

Scope: the explicit cartoon arena factory/spawns, shared arena presentation fit, native art lowering, shared rescue callout anchor, and their input→simulation→presentation dependencies. Preserved camera, screen-fit, determinism, simulation-boundary, architecture and mobile-performance guidance informed the review. The actual camera remains the existing WorldView-driven flat2d engine camera; no camera driver or gameplay balance changed.

## Architecture and actual controls

No remaining must-fix ownership/layering finding was identified in this scope. Geometry is explicit opt-in simulation data, independent of cameras or UI. Four authored patterns retain level variation; original campaign data and original courtyard behavior retain their defaults. The source clone preserves enemy kinds/counts and rewards. Player spawns now distribute two actors per tier while keeping P 1 on the floor; cartoon-only enemy formation includes the crown. Visual plan lowering, thicker 32px caps, narrow 24px inner wall faces, HUD reserves and shared HELP group positioning are presentation-only. Mutable animation history remains in the existing presentation resource, not module state.

The final world is 60×24 tiles with five tiers at rows 3/8/13/18/23. Candidate and spread-spawn engine gates prove actual unupgraded ascent along both broad overlapping lanes, actual diagonal 120px transfers, gap crossing and missed-jump recovery across all four variants, full 44px support at each of ten starts, graph reachability, and safe six/ten-player enemy formations including crown enemies. Existing 126px jump physics and controls are retained. Reports: candidate-controls.json and spread-spawn-controls.json. The original 44×16 trial was rejected after an actual screenshot exposed its low crown/large top void; its comparison image remains clearly labeled.

## Actual framing and visual integration

Final images: wide-combat.png, native-combat.png, tall-combat.png, ultrawide-combat.png, wide-start.png, wide-boss.png, wide-help.png and wide-help-crown.png. At 1536×864, authored bounds place the crown at 271.24px and floor at 754.95px; the crown is 84.75px higher than the rejected trial. The full stage occupies 94.48% of viewport width. The highest ordinary jump badge has 10.08 physical pixels of header clearance; thicker floor art ends at the 64 logical-pixel footer. See composition-captures.json for explicitly labeled computed bounds beside actual camera/render snapshots.

Actual capture review found and fixed three integration problems before performance: blank roster numbers (rotated diamond center), legacy duplicate downed name text, and a downed badge overlapping HELP. The final shared callout anchor clamps the whole plaque/text/badge group below the header, including a real crown-apex jump followed by the recorded injury action. Actual floor/crown HELP images confirm centered text and a separate badge. Main combat captures report 8/11/11/8 draws; HELP/start/boss/crown HELP report 9/9/10/11. Compact native/tall characters are a consequence of whole-stage fit; real ten-human readability remains unproven.

## Final nine actual performance captures

Command: node tools/cartoon/overhaul-performance.mjs --all-tiers --out docs/concept-playable. Each own paused release-host session measures 60 warmup steps,600 steady steps and ten actual render probes with protected boss combat, then seven additional content states at four aspects. Cases: six players/one human, ten players/one human and ten humans, on mobile/desktop/compat. All own hosts were stopped individually. Older milestone reports were preserved.

| Tier | Players/humans | Step p 95 ms | Presentation p 95 ms | Sampled RSS MiB | Sampled JS heap MiB |
|---|---:|---:|---:|---:|---:|
| mobile | 6/1 | 1.827 | 8.058 | 288.20 | 45.50 |
| mobile | 10/1 | 2.518 | 8.382 | 330.38 | 52.96 |
| mobile | 10/10 | 2.063 | 8.874 | 307.22 | 49.51 |
| desktop | 6/1 | 1.790 | 8.135 | 287.17 | 45.56 |
| desktop | 10/1 | 2.472 | 9.086 | 324.75 | 52.68 |
| desktop | 10/10 | 2.219 | 8.874 | 304.09 | 37.57 |
| compat | 6/1 | 1.690 | 7.930 | 282.69 | 45.09 |
| compat | 10/1 | 2.522 | 8.983 | 326.42 | 52.92 |
| compat | 10/10 | 2.164 | 8.490 | 302.06 | 45.51 |

Every steady and content case peaked at 12 draws, below the existing 14-draw structural gate. All captured assets had pending 0. Steady GC maxima were 0.492–1.225 ms, with zero pauses over 4 ms (generic guidance:8 ms maximum, zero pauses over 4 ms). No pipeline was created during capture. Actual observed keys were merged by exact serialized identity, preserving all historical entries:0 additions. See performance.json, observed-pipelines-*.json and pipeline-merge.json.

Direct-to-boss QA startup maxima ranged 12.856–17.359 ms. This shortcut bypasses normal preparation; these numbers do not measure cold launch or normal countdown startup. The normal warm-graph behavior is covered by the dedicated preparation control gate; prior before/after startup evidence is preserved in the preceding milestone rather than overwritten.

## Remaining performance/device limitations

**Memory risk:** host sampled JS heap 37.57–52.96 MiB exceeds the generic 32 MiB low-end guidance; sampled RSS 282.69–330.38 MiB is below but near generic 350 MiB guidance. This is a higher observed footprint than the previous milestone; the report does not claim an exact allocation cause without a targeted profile. No forced GC was used to make results appear smaller. Navigation-state serialization and transient draw/state allocations are suitable focused follow-up targets if physical-device profiling confirms pressure. Do not describe this as all mobile budgets passing.

Actual assets.stats class is phone for mobile, desktop for desktop, and phone-low for compat. Phone-low source texture residency is 21,944,048 bytes versus 30,642,944 for phone; GPU texture estimate 108,805,812 versus 139,460,612 bytes. The cheaper backgrounds resolve correctly. The phone-low estimate remains near the generic 120MB texture guidance and is an engine allocation estimate, not physical GPU memory certification.

The 120-step title observation reports 8 actual title draws, but idleFrames.enabled:false in this paused headless host. Idle skipping/power behavior is therefore **not established**. Host CPU timing, native rendering and structural budgets do not prove sustained phone-low 33.3 ms frames, GPU fill rate, thermals, OS memory pressure, physical controllers or human-group readability. Physical low-end-device profiling remains necessary. Final original-pixel parity, all logic/render tests and replay status belong to the verifier's final pass.

## Cooked-check packaging limit

`engine-check.json` passes typecheck, validation, desktop cook, 600 cooked smoke frames and the UI-node budget (15 shown against 1,000). It retains the historical warning for material-program key `7946469ed20397e0`: no compiled material has that key, and a release build refuses the stale pipeline file. The exact historical entries were preserved rather than silently deleting evidence. Release packaging needs a separately reviewed pipeline refresh through the engine's recording workflow (fix: `testing` / `ship-mobile`). Existing reference-tile and WorldView camera warnings also remain. The playable editor/cooked checkpoint is verified; release packaging is not certified.
