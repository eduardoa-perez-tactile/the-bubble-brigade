# Concept playable verification

The final 60×24 stage, five tiers and responsive HUD pass the installed V8 and desktop rendering gates. Automated gameplay verification used only Game Engine input, authoritative game steps, replay playback, viewports and render probes.

| Gate | Final result | Evidence |
|---|---|---|
| V8 logic |301 pass | [Logic tests](logic-tests.json) |
| Protected original simulation |280/280 traces identical at every recorded step; zero allowances | [Trace proof](simulation-trace-proof.json) |
| Desktop T1 |60 pass, including 48 original pixel cases; no original golden updates | [Full render run](render-verification.json), [original cases](original-pixel-render.json) |
| Cooked concept flows |3 pass, 577 steps; phone-low residency | [Cooked render tests](cooked-render.json) |
| Concept recorded flows |3 pass, 38 screenshots, 577 steps; phone-low residency enforced | [Concept render tests](concept-render.json), [verified recordings](new-replays.json) |
| Structural replay budgets |Menus 14, rescue/boss 12, ascent/capture 11, original presentation 12; limit 14 unchanged | [Full render run](render-verification.json) |
| Cold live viewport |Original pixel 5 draws, cartoon classic 7, new concept 10; all pass | [Cold evidence](cold-viewport-evidence.json) |
| Original replay inventory |15 pass / 18 historical failures; all 33 statuses and first divergences match archived evidence | [Read-only audit](original-replay-inventory.json) |
| Previous overhaul evidence |77 files byte-identical, including earlier reports, images and checkpoint recordings | [SHA verification](previous-evidence-preservation.json) |
| Original repository evidence |1625 protected files unchanged against migration baseline | [Root preservation audit](preservation.json) |

The recorded concept route starts from the real floor spawn, walks to an ascent lane, and jumps through rows 23→18→13→8→3 without repositioning between jumps or acquiring upgrades. It then fires to capture an enemy, contact-pops it, and advances to the next wave. A separate recorded route covers actual Downed/Lives0, an empty slot and an OUT slot, contact rescue, boss/results and restart. Real crown jumping followed by the actual injury rule checks the extreme HELP state: the live Text2D, cream Sprite plaque and identity badge stay below the header at all four aspects, contain one HELP label, and do not overlap one another. Actual contact rescue removes that Text2D.

The logic suite additionally checks both ascent lanes in all four shelf arrangements, diagonal 120-pixel transfers, jumps across shelf gaps, a missed late jump followed by a safe floor landing and recovery, navigation access from every spawn, full 44-pixel footing, two actors per tier, crown enemy placement, all nine wave capacities, solo/default one-human-nine-bot/ten-human starts, pause and restart. The unchanged jump reaches 126 pixels and its isolated trajectory matches original physics frame for frame. These establish viable routes, not human comfort.

The immediate pre-concept baseline has 292 tests:291 remain identical and one recorded cartoon opt-in party start intentionally changes at step 5 because it constructs the approved new geometry and spawns. Nine tests are new. All 280 older protected traces remain strictly identical. Checkpoint system names in the raw diff shift when QA declarations are inserted; the trace proof documents this diagnostic limitation rather than treating the shifted label as causal attribution. Git HEAD and engine 0.1.0 metadata alone do not identify uncommitted source or a unique engine revision.

The active cartoon budget files now reference the three separately named concept checkpoint recordings. The previous two slice and three full-overhaul recordings remain unchanged as historical evidence. Their playback was not reverified against this concept milestone; no current pass/fail claim is made for them. The 33 original replay failures were not regenerated or concealed.

Final screenshots were compared on explicit `--gpu-tier desktop`. An initial additional mobile-tier alpha probe returned red 34 instead of 32 for its exact background-color assertion; the desktop check passes unchanged. Temporary mobile goldens were removed. [The diagnostic note](mobile-format-diagnostic.json) records the observed difference and the inferred format-quantization explanation without claiming a verified pre-change mobile baseline.

Nine host performance scenarios peak at 12 draws against 14. Simulation p95 is 1.69–2.52 ms and presentation p95 is 7.93–9.09 ms. Sampled host JavaScript heap 37.57–52.96 MiB exceeds generic 32 MiB guidance; this remains a low-end memory risk, not an all-mobile-budgets pass. See [measured review](review.md). Phone-low residency and host measurements do not establish physical-phone GPU timing, sustained thermals, physical-controller behavior or human group readability. Hermes is not installed, so cross-runtime parity is not established.

The verifier released the engine slot after these gates. The root agent reports the final engine check passed: typecheck, validation, cook, 600-frame cooked smoke and UI structural checks. Existing camera/reference warnings and stale pipeline 7946469ed20397e0 remain. All three explicit desktop cooked checkpoint tests pass with phone-low residency: 577 steps ([cooked report](cooked-render.json)).

Reproduce the final rendering gate with `gameengine test --js v8 --tier t1 --gpu-tier desktop`. New route tests declare `memory: 'phone-low'`. Cold checks are `node tools/harness/viewport-smoke.mjs`, `--cartoon`, and `--concept`, each in its own fresh host. Run commands inside `bubble-boobble/`; run Git at the repository root.
