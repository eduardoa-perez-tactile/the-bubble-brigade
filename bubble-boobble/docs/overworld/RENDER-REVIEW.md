# Overworld render regression review

The exact pre-feature commit `76d82db` was exported to `/tmp/brigade-overworld-baseline-76d82db` and tested independently using the same installed Game Engine. Its full T1 suite reported **99 tests: 82 passed, 17 failed**. The inherited Cuphead structural budget also reports 15 draws against a limit of 14. Those failures and their goldens were preserved.

## Reviewed visual differences

Adding authoritative overworld documents moves the existing scene camera from entity `70:1` to `72:1`. A temporary identical recorded-input T1 probe demonstrated different native camera shake sampling, with identical simulation time, presentation frame, trauma, camera settings and WorldView:

| Fixture | Time step / render frame | Trauma | Baseline offset (x, y) | Feature offset (x, y) |
| --- | --- | --- | --- | --- |
| Party clear | 7 / 8 | 0.11999998 | 0.134552, -0.09588623 | 0.022705078, 0.037231445 |
| Rewards wide | 11 / 12 | 0.06999998 | 0.07080078, -0.046966553 | 0.036346436, 0.03933716 |

At the initial rewards checkpoint, trauma and offset were zero in both builds. WorldView remained center `[384,360]`, ortho size `360`, fit `Contain`, design aspect `1.0666667`. Shake parameters remained decay `3`, max offset `[8,6,0]`, max angle `0`, frequency `22`. The diagnostic tests were removed after comparison; Persisted JSON evidence is in [`evidence/baseline-camera-probe-t1.json`](evidence/baseline-camera-probe-t1.json) and [`evidence/feature-camera-probe-t1.json`](evidence/feature-camera-probe-t1.json).

The original cartoon, reference and pixel-renderer source artwork has no Git diff against `76d82db`. Small camera projection changes alter sampled sprite rows and background pixels; they do not represent changed gameplay or replacement artwork. The victory checkpoint follows a fresh victory shake and exhibits the same subpixel background shift.

Only these seven legacy test families were authorized for selective golden refresh, with unchanged tolerances:

- `cartoon overhaul complete enemy item elemental boss rescue and victory flows render in the new arena` — victory shake.
- `cartoon rewards native gallery keeps all food powers and outlined scores readable across screen shapes` — wide gallery shake, independently measured above.
- `feel six player capture chain rescue boss and results fit every aspect` — capture shake.
- `party boss moving art bottle warning and capture stay readable` — capture shake.
- `party pacing five second countdown preparation shooting and red last enemy` — clear shake, independently measured above.
- `wave fruit real final pops show a different reward each wave` — clear/pop shake.
- `madness release menu and mode cards fit and launch both modes` — intentional START → Adventure → Arcade Modes route adds presentation frames. The first changed card differs only in preview animation shading (maximum channel delta 11; no pixels differ by more than 20).

Each family was run with its exact test name using `gameengine test --tier t1 --filter '<exact name>' --update-goldens --json`. Updated PNGs were reviewed individually. No inherited-failure family, golden tolerance, or structural budget was changed.

## Verification

The final unfiltered command is `gameengine test --tier t1 --json > .gameengine/overworld-final-reviewed-t1.json`. Results are recorded below after the selective refresh. Cooked rendering is tracked separately: the baseline cooked title probe passes, so the feature cooked GPU diagnostic cannot be classified as an inherited baseline failure from this comparison.

The selective refresh changed **17 PNGs**. Side-by-side review preserved the same actors, scores, rewards, overlays, safe-area framing and menu selection states:

- `party_boss_moving_art_bottle_warning_and_capture_stay_readable`: `giant_bubble`.
- `cartoon_rewards_native_gallery_keeps_all_food_powers_and_outlined_scores_readable_across_screen_shapes`: `rewards_1179`, `rewards_1620`, `rewards_1680`, `rewards_904`.
- `wave_fruit_real_final_pops_show_a_different_reward_each_wave`: `wave_1_fruit`, `wave_2_fruit`, `wave_3_fruit`, `wave_5_fruit`, `wave_6_fruit`, `wave_7_fruit`, `wave_8_fruit`.
- `madness_release_menu_and_mode_cards_fit_and_launch_both_modes`: `classic_card`, `madness_card`.
- `feel_six_player_capture_chain_rescue_boss_and_results_fit_every_aspect`: `boss_capture`.
- `cartoon_overhaul_complete_enemy_item_elemental_boss_rescue_and_victory_flows_render_in_the_new_arena`: `complete_victory`.
- `party_pacing_five_second_countdown_preparation_shooting_and_red_last_enemy`: `five_second_break`.

Review sheets: `/tmp/brigade-golden-review-1.png` through `-5.png`. Selective run reports: `/tmp/brigade-selective-goldens-1.json` through `-7.json`.

## Installed engine pipeline validator warning

The installed CLI warns that recorded program `7946469ed20397e0` has no compiled material. The release host actually embeds a valid compiled built-in material `{name: "Standard", model: "pbr", hash: "7946469ed20397e0", sourceHash: "9e64948b570f5ddc"}`. See [`evidence/pipeline-builtin-proof.json`](evidence/pipeline-builtin-proof.json).

`knownProgramHashes` only scans engine `crates/gameengine-render/src/materials/*.gen.json` and project `assets/**/*.material.gen.json`; that built-in directory is absent from the installed app package. The project owns two different generated material hashes (`06def836e9fb6209`, `07dc748779860e78`). The warning is therefore an installed-engine metadata/validator false positive, rather than a stale recorded Standard program. Existing valid Forward/Shadow records were preserved; the engine package was not patched. No unnecessary re-record or threshold change was made.

## Final result

`gameengine test --tier t1 --json > .gameengine/overworld-final-reviewed-t1.json` finished with **103 tests: 86 passed, 17 failed**. The final failing test-name set exactly equals the baseline failing set: **zero additional failures**. The inherited Cuphead UI structural budget remains 15 draws against 14; every other structural budget, including the overworld replay, passes. The command exits 1 because the inherited failures remain.

The persisted [`render-review-summary.json`](render-review-summary.json) contains baseline/final failure names and error values, structural results, exact commands and the 17 reviewed PNG paths. All seven selective refresh commands exited 0. No inherited-failure goldens, tolerances, gameplay code or structural budgets were changed by this review.
