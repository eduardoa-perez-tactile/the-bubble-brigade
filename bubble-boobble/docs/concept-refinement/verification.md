# Concept refinement verification

Verification uses Game Engine recorded input, authoritative steps, native sprites, Text2D, UI layout and engine viewports. Character PNG artwork is retained; presentation scale and the explicitly opted-in arena change.

The immediate baseline at `71e9d527c783940c2365a2344847f53871c91d38` passes all 301 V8 logic tests and records a checkpoint at every step ([baseline](baseline.json)). The protected byte inventory covers 382 files: previous concept-playable evidence and its three recordings, plus 313 golden files belonging to 48 original pixel cases ([inventory](preserved-evidence-sha256.json)).

Focused controls pass: 9 concept cases and 4 new refinement cases. They prove the exact 2/4/5/3 shelf rhythm, full 44-pixel footing and connected navigation for all ten spread spawns across four arrangements, actual unupgraded ascent through both lanes, a real upper detour across the wide lower gap, diagonal transfer, missed-jump recovery and unchanged 126-pixel jump trajectory. The enlarged-body tests retain collision feet and the default 64-pixel drawing API, check the first real shot against the enlarged source mouth, and require number/diamond/body visibility parity at actual blink boundaries. See [controls](focused-controls.json) and [enlarged actors](enlarged-actor-controls.json).

The focused phone-low desktop T1 passes 155 steps and six screenshots across the fold cover 904×2316, notched iPhone 1179×2556 and tablet 1620×2160, using their actual DPR and safe insets. It drives both edge players with recorded controls and jumps a crown player before applying the real injury rule. Assertions query native Sprite alpha bounds, rotated diamond AABBs, ten centered Text2D numbers, actual HELP, enlarged boss and live HUD rectangles, then project them through the engine camera. All stay inside the safe area between header and footer; each rendered frame stays within 14 draws. Hidden and visible native blink frames agree. [Device report](device-fit.json), [reviewed contact sheet](device-fit-contact.png).

These establish viable routes and fit, not comfortable human group play. Tall phones retain substantial decorative vertical space, and the ten-player labels and actors remain small. Physical phone GPU timing, sustained thermals, controller hardware and human readability are not established by host assertions.

The final integration gates pass:

| Gate | Result | Evidence |
|---|---|---|
| V8 logic |305/305 pass, including four new tests |[Logic run](logic-tests.json) |
| Original simulation |280/280 traces strictly identical at every recorded step, zero allowances |[Trace proof](simulation-trace-proof.json) |
| Desktop T1 |61/61 pass, including the 48 protected original pixel cases |[Strict render run](render-verification.json), [original cases](original-pixel-render.json) |
| New refinement recordings |Four verified streams, 713 steps and 44 screenshots, explicit cartoon scene/desktop with phone-low test residency |[Recording verification](new-replays.json), [test run](recording-test-run.json) |
| Structural replay budgets |Menus 14; rescue/ascent/device 12; existing presentation 12; limit 14 retained |[Strict render run](render-verification.json) |
| Cold live viewport |Original pixel 5 draws; cartoon classic 10; refinement party 12; all pass |[Cold evidence](cold-viewport-evidence.json) |
| Prior checkpoint evidence and pixel goldens |382/382 files byte-identical |[Byte proof](previous-evidence-preservation.json) |
| Original migration evidence |1625 protected files unchanged |[Root preservation](original-preservation.json) |
| Existing cartoon artwork |532 existing assets unchanged |[Art preservation](art-preservation.json) |

The immediate 301-test baseline has 299 identical traces and two intentional divergences: the recorded opted-in cartoon starts first differ at steps 5 and 8 as they construct the approved 72×24 geometry and spread spawns. Four logic cases are new. No hash allowances were used. The raw directory diff also lists the new test filenames; these expected additions do not relax the protected 280 comparison.

Only cartoon presentation goldens were refreshed, on explicit desktop. All 85 refreshed/new cartoon shots were visually reviewed through the contact sheets in this directory, alongside the renderer’s full-size captures. The original 48 pixel cases were then run strictly, and their 313 golden files across tiers remained byte-identical.

The active cartoon budget references point to four separately named refinement recordings. The prior three concept, three full-overhaul and two slice streams are retained unchanged. They were not playback-verified against the refinement build; no current pass/fail claim is made for them. The original 33 replay inventory was not rerun in this phase; its archived 15 pass/18 historical failure classification remains preserved in the previous concept-playable evidence.

Nine performance scenarios hold 12 steady draws, with the separately reviewed extreme crown HELP composition reaching 14 exactly. Simulation p95 is 1.74–2.03 ms and presentation p95 is 8.13–9.41 ms. Post-content sampled host JavaScript heap is 51.33–83.69 MiB and resident memory 292.77–343.97 MiB; the JavaScript sample exceeds generic 32 MiB guidance and remains a low-end memory risk. Host memory includes tool/runtime/render-target overhead. [Measured review](renderer-review.md), [raw performance](performance.json).

The final [engine check](engine-check.json) passes typecheck, validation, desktop cook, 600 cooked smoke frames and the UI-node budget (15 shown against 1,000). All four checkpoint cases also pass on cooked content with explicit desktop GPU tier and phone-low residency: 713 steps total ([cooked results](cooked-render.json)). The historical material-program key `7946469ed20397e0` remains stale; the check warns that release packaging refuses it. Existing reference-tile and WorldView camera warnings are unchanged. Hermes is not installed; cross-runtime parity is not established.

Reproduce with `gameengine test --js v8 --hash-trace .gameengine/concept-refinement-final --checkpoint-every 1`, then `gameengine test --js v8 --tier t1 --gpu-tier desktop`. The new flow tests declare phone-low residency. With the coordinated engine slot, `node tools/harness/refinement-recordings.mjs .gameengine/test-bundle.js` records into an ignored temporary directory, creates only refinement-prefixed streams and switches budgets only after all four verify. Run engine commands inside `bubble-boobble/`; run Git at the repository root.
