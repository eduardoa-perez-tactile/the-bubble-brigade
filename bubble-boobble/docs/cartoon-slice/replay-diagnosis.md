# Replay baseline diagnosis — 20 October 2026

The stored replay failure predates the cartoon slice and migration. A fresh recording of the exact same input on the captured pre-slice source verifies successfully. The original recording is preserved. All 1,001 original replay/golden files checked against the frozen migration manifest still match their SHA-256 and byte lengths. The precise historical writer responsible for its first different hash cannot be identified from that recording because it has no per-system checkpoints.

## Read-only inventory

All 33 recordings registered in `tools/harness/run.mjs` were verified with their explicit scenes against a captured pre-edit production bundle. **15 pass; 18 fail. All 33 results, including every failed step and expected/actual hash pair, exactly match the archived pre-migration `docs/migration/evidence/artifacts/engine-update-replay-audit.json`.** That archived file was read, never updated. The full harness still stops at its first failure; this separate audit completes the inventory without weakening it.

The 18 failing recordings are:

| Replay filename (under `tests/replays/`) | First different step |
| --- | ---: |
| `party_boss_ten_dragons_fire_identifiable_lightning_bubbles.greplay` | 3 |
| `wave_fruit_real_final_pops_show_a_different_reward_each_wave.greplay` | 5 |
| `party_feedback_ready_go_and_last_kill_fit_every_window.greplay` | 3 |
| `courtyard_full_arena_and_ten_identities_fit_native_wide_tall_and_ultrawide_windows.greplay` | 3 |
| `ten_named_actions_reject_malformed_suffixes_and_pad_ten_stays_isolated.greplay` | 25 |
| `ten_dragons_firing_and_rescue_remain_bounded_on_phone_low.greplay` | 3 |
| `feedback_shooting_space_cannot_restart_a_defeated_boss_run.greplay` | 5 |
| `feedback_results_require_release_and_a_fresh_controller_confirmation_after_the_guard.greplay` | 5 |
| `feedback_jump_dust_grounded_shadows_nameplates_and_guarded_results_remain_readable.greplay` | 5 |
| `feel_six_player_capture_chain_rescue_boss_and_results_fit_every_aspect.greplay` | 10 |
| `party_boss_recorded_thunder_shot_capture_and_finishing_pop.greplay` | 0 |
| `party_last_standing_only_shows_defeat_when_the_final_bot_falls_through_recorded_engine_inputs.greplay` | 3 |
| `party_pacing_five_second_countdown_preparation_shooting_and_red_last_enemy.greplay` | 3 |
| `party_polish_readable_countdown_falling_enemies_and_rest_practice_shots.greplay` | 3 |
| `party_polish_six_real_pops_coalesce_while_classic_cues_retain_their_original_mix.greplay` | 3 |
| `party_randomized_powerup_has_a_small_green_benefit_alert_in_the_arena.greplay` | 3 |
| `party_recorded_wave_clear_rest_boss_and_results.greplay` | 0 |
| `party_six_actual_controllers_move_separate_humans_and_operate_menus.greplay` | 0 |

The other 15 registered recordings pass, including the campaign oracle route, movement, scoring, skin settings, companion-mode input and complete desktop presentation route. A matching failure only establishes that its observed prefix has not changed; it cannot establish behavior after the first different step.

The new audit command uses the installed headless host and an explicitly supplied bundle. It never bundles, records, rehashes, modifies goldens or updates archived evidence:

```sh
# From bubble-boobble/. Supply a bundle captured before source edits.
node tools/harness/cartoon-replay-audit.mjs --bundle .cache/cartoon-replay-audit/bundle.js
```

It prints headers, original file SHA-256, first divergence, scene, and comparison to archived results. Exit 1 honestly reports that at least one original recording fails. Do not interpret that as 33 passing replays.

## Focused experiment

The production and test bundles were copied into ignored `.cache/cartoon-replay-audit/` before renderer edits. The original ten-dragon T1 test was run directly through the engine host, recording **only to an ignored temporary directory**, with checkpoints every step. Its existing desktop screenshots at 768×720, 1680×720 and 640×960 all match their original goldens exactly. The same test on the mobile GPU tier also passes its original goldens and produces the same current simulation hash stream.

Both original and fresh headers specify 10 steps, seed 1, V8, fixed dt 1/60, and asset manifest `loose:2d06800538d394c2`. The header's `sceneId` is the test's human title, so explicit `scenes/arcade.scene.json` is necessary for verification. Engine/build version strings in this file are `0.1.0`; they do not identify an installed engine revision. Recorded bundle hashes differ (`74ed4ea8f4703fb9` original, `cb88126c48e848f8` fresh).

The full 396-byte encoded input section is **byte-identical** between old and fresh. This includes the reset cheat, controller input and view changes. No replacement inputs were manufactured.

| Step | Original hash | Fresh record and playback |
| --- | --- | --- |
| 0 | `bedc8986b646c996` | identical |
| 1 | `2f83c31cd525e0ca` | identical |
| 2 | `8deacc844815ebea` | identical |
| 3 | `cf74f27782821c93` | `977f78ddd9bd39f5` |
| 9 | `6d660a8a1e6db320` | `727d073da7361e0f` |

Fresh verification passes all 10 steps. Step 3 is the first `PartyReset` cheat after the test's initial `step(3)`. Its new hash exactly equals the independently preserved migration baseline's playback hash. This rules out a current test-versus-playback discrepancy for this focused scenario; simply generating a new file would hide the historical incompatibility rather than diagnose it.

Evidence produced locally (ignored): `fresh-test.json`, `fresh-verify.json`, `mobile-test.json`, temporary checkpoint recordings and `inventory.json`, all under `.cache/cartoon-replay-audit/`.

Reproduction using the captured bundles (substitute the host returned by `gameengine doctor --json`):

```sh
"$V8_HOST" --mode headless --project . \
  --bundle .cache/cartoon-replay-audit/test-bundle.js \
  --test --js v8 --test-tiers t1 --tier desktop \
  --filter 'party boss ten dragons fire identifiable lightning bubbles' \
  --record-tests .cache/cartoon-replay-audit/recordings \
  --record-checkpoint-every 1
"$V8_HOST" --mode headless --project . \
  --bundle .cache/cartoon-replay-audit/bundle.js --js v8 \
  --scene scenes/arcade.scene.json \
  --verify .cache/cartoon-replay-audit/recordings/party_boss_ten_dragons_fire_identifiable_lightning_bubbles.greplay
```

## Visual allocation participates in the hash

`schema/game.schema.ts` declares `ArcadeVisual` as `sim: true`. `ArcadePool` runs in Update, computes capacity from `sceneDraws`, and spawns `ArcadeVisual`, `LocalTransform` and derived `WorldTransform`. Those components are hashed even though the entities serve rendering. At the stored failure's preceding world snapshot there are already 30 visual entities (one text slot and 29 pixel slots). At party reset the pool expands using the party draw plan and reserves 36 text slots plus 512 pixel slots.

A controlled experiment changed **only an ignored copy of the captured bundle**, increasing the party pixel reserve from 512 to 513. Verifying the fresh checkpoint replay then diverged at step 3: expected `977f78ddd9bd39f5`, actual `53480e20be6f3f59`. The checkpoint's differing parts were exactly **`ArcadeVisual`, `LocalTransform`, `WorldTransform`**. No authoritative session document was listed as different. Thus a purely visual pool-capacity change demonstrably changes whole-world replay hashes without changing the game document in this scenario.

This establishes a real structural coupling relevant to the new renderer. It does **not** prove that a particular historical pool-size change produced `cf74f27782821c93`; the original replay has no checkpoints, and tested alternate reserves did not reproduce that hash. The playback-only system breakdown cannot identify which recorded system differed. Historical source bundle inspection places the original recording in source commit `e08a0f33ef8924d515e8bb33533afb4de4672998`, which also changed presentation/state plumbing, but that commit alone cannot identify the precise recording-time state.

Do not attribute this failure solely to an engine upgrade: the archived audit also records the same divergence on its old host, and all current inventory outcomes reproduce that archive exactly.

## Valid regression gates for the slice

1. Keep original recordings, goldens, fixtures, provenance manifests, budgets, and migration evidence unchanged. The 15 currently passing originals remain direct replay gates. Audit the 18 known failures separately and report their status; they do not prove the rest of those routes.
2. Use the **pre-edit engine hash traces** in `.gameengine/cartoon-baseline/` with `gameengine test --js v8 --hash-trace-baseline .gameengine/cartoon-baseline`. Original simulation tests and exact Go comparisons must still pass. A changed authoritative document/resource/RNG/input is a regression regardless of visual intent.
3. For party/capture/rescue/boss routes absent from the old valid replay set, create new **separately named** pre-edit engine checkpoint traces or temporary recordings and compare identical input after editing. Keep the source and baseline checksums. Do not replace an old recording with a newly passing stream and call that historical parity.
4. Preserve the original visual pool allocation when practical. If a necessary presentation allocation changes whole-world hashes, inspect checkpoints, establish that the differing parts are the known visual entities, and separately compare authoritative session and input traces at every step. A blanket allowance for all transforms or all documents is not proof: those types can contain gameplay/camera state as well. Without this analysis, report the whole-world parity check as failed.
5. Keep visual regressions independent: retained pixel goldens must still pass; cartoon captures/probes and new tests judge the intended new artwork. No original golden regeneration is justified by the replay diagnosis. Run cooked smoke and structural/performance probes separately.

Hermes and device performance remain outside this V8 diagnosis. No physical controller, standalone build, browser automation or OS-input test was used.

## Captured identities

| Artifact | SHA-256 |
| --- | --- |
| Captured production bundle | `06f55e8b4066a61bc1a4988c9027d351376c2fad6ed2954894cb68c5725ac406` |
| Captured test bundle | `4f77d4d9fdb6c8e7489e3fad73b2d771389f53fd7dfb5028b99f885870993048` |
| Original failing replay | `cfb41f3f119345b3b0d83720e1cfd1cfafbd2d578a058200b035d263b00f12e3` |
| Fresh temporary checkpoint replay | `ac844371147352c4f518d80f1e504573a9c8346e5c586ea0bffd0f885fef79a8` |
