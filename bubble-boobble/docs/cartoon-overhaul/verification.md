# Final overhaul verification

The full cartoon route is covered by real engine input, deterministic setup cheats, rendered tests and explicit-scene replays. All engine sessions used headless hosts or engine viewports; no standalone app, browser/OS automation or synthesized desktop input was used.

| Gate | Final result | Evidence |
| --- | --- | --- |
| V8 logic | **292 pass** | [Logic tests](logic-tests.json) |
| Original simulation regression | **280/280 pre-edit traces identical**, every recorded step, zero allowances | [Trace classification](simulation-trace-proof.json) |
| Original pixel visuals | **48 pass**, no original golden updates | [Original render tests](original-pixel-render.json) |
| Complete render suite | **57 pass** across original pixel and cartoon/fallback cases | [Combined verification](render-verification.json) |
| New full-flow replays | **3 pass, 302 steps**, checkpoints every step | [Replay verification](new-replays.json) |
| Preserved original replays | **15 pass; 18 historical failures**, all 33 match the archived pre-migration audit | [Original replay inventory](original-replay-inventory.json) |
| Cold pixel viewport | **Pass**, 5 draws; original color/mesh assertions unchanged | [Cold evidence](cold-viewport-evidence.json) |
| Cold cartoon viewport | **Pass**, 7 draws; 195 native alpha/stencil sprites; painted stone and green actor visible | [Cold evidence](cold-viewport-evidence.json) |
| Cooked full-flow renders | **3 pass** with phone-low residency, desktop GPU tier, matching reviewed live goldens | [Cooked render tests](cooked-render-tests.json) |
| Engine check | **Pass**: typecheck, validation, desktop cook and 600-frame cooked smoke; historical pipeline warning retained | [Engine check](engine-check.json) |
| New geometry composition | All four aspect ratios pass, **9–10 draws** | [Composition capture metadata](composition-captures.json) |

The new menu route visits title, main menu, mode selection, party lobby, profiles, new profile, scores, settings, help, credits and editor; it also samples wide, tall and ultrawide layouts. Its peak remains within the existing 14-draw contract. The new arena route starts ten humans through the actual recorded desktop actions, proves immediate firing, movement and pause/resume, and checks whole-board framing at 768×720, 1680×720, 640×960 and 2520×1080.

The content route renders all six enemy families, captured/warning/escape states, all 25 fruits and 13 powerups, ordinary/elemental bubbles, fire/water/thunder/flame and projectiles, moving/captured boss, actual contact rescue and actual settled-boss victory/results. All three routes run under `phone-low` residency enforcement. Existing cartoon-only visual baselines were intentionally updated for the approved artwork; archived migration evidence and original pixel fixtures were retained.

The preparation regression confirms all nine AI navigation graphs finish during the normal countdown and remain shared/reused across GO. The live roster regression uses a real `hurtPlayer` transition, including the zero-life downed state, an empty slot in the middle, an out actor, a returning actor and human slot ten. That test caught and fixed a status precedence error which static samples had hidden.

## Representative actual engine captures

- [Wide combat](wide-combat.png), [native combat](native-combat.png), [tall combat](tall-combat.png), [ultrawide combat](ultrawide-combat.png).
- [Native ten-player start](ten-player-native.png).
- [Cold cartoon viewport](viewport-smoke-cartoon.png), [cold pixel fallback](viewport-smoke.png).

These final captures use the corrected per-object source silhouettes, including whole fruit bottoms and enemy antennae. The pickup/actor source segmentation and normalization provenance is recorded separately by the art pipeline.

## Reproduction

From `bubble-boobble/`:

```sh
gameengine test --js v8 --hash-trace .gameengine/cartoon-overhaul-final --checkpoint-every 1
gameengine test --js v8 --tier t1 --gpu-tier desktop
node tools/harness/viewport-smoke.mjs
node tools/harness/viewport-smoke.mjs --cartoon
node tools/cartoon/capture-overhaul.mjs
node tools/cartoon/overhaul-performance.mjs --all-tiers
```

`gameengine trace diff` between the pre-edit and final trace directories reports the twelve new tests as added; all 280 shared tests are identical. Do not use a blanket document/transform/RNG allowance. The ignored pre-edit trace directory must be retained locally or supplied from a separately preserved run to repeat that comparison.

The three new budget routes retain `drawCallsMax: 14`. Existing `cartoon.json` and `cartoon-rescue.json` now point to the new arena/content recordings; `cartoon-overhaul-menus.json` covers the new full menu route. The two previous slice recordings remain unchanged:

- `cartoon_slice_ten_firing_humans_keep_full_arena_and_hud_across_every_desktop_aspect.greplay`
- `cartoon_slice_captured_warning_escape_downed_and_actual_contact_rescue_remain_readable.greplay`

Their playback status was **not reverified against the full overhaul**; no current pass/fail claim is made for them. They remain historical slice evidence. The active `cartoon.json` and `cartoon-rescue.json` budget references now select the separately named, newly verified full-overhaul arena/content replays. Record only the separately named overhaul cases when intentionally updating those new streams.

Original replay verification still has its known 18 failures. Neither the new recordings nor the identical old traces erase those historical mismatches. The detailed prior diagnosis remains in [the slice replay investigation](../cartoon-slice/replay-diagnosis.md).

Phone-low engine residency and host CPU/structure measurements do not establish physical-phone GPU timing, sustained thermals, physical-controller reconnect behavior or human group readability. Hermes availability and cooked/release diagnostics are reported separately by the final project check. The new layout intentionally changes opted-in simulation geometry; the strict trace proof applies to equivalent original routes.
