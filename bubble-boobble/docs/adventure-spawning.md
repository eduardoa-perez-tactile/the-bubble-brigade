# Adventure enemy arrivals

Adventure previously generated one anchor per shelf and reused anchors with a modulo index. Episodes with more enemies than shelves spawned multiple enemies at identical coordinates. `spawnPosition` corrected tile intersections but did not reserve space around other enemies. Finale reinforcements appeared immediately at fixed anchors, without checking the player.

The current flow keeps the authored enemy roster and platform geometry:

- Spread preferred anchors along each shelf when several enemies share it.
- At each act boundary, allocate grounded enemies to supported surfaces first, then flyers to clear air. Reserve 136 × 116 world-pixel envelopes for the cartoon artwork and 148 × 140 around living players.
- Represent pending enemies with `EnemyState.Spawning` and a copied, deterministic `SpawnTicks` field. The existing remaining-enemy count includes them, so pending arrivals cannot end an act early.
- Draw the actual enemies descending from above the arena to their reserved destinations. Each descent lasts 48 simulation steps, with a four-step stagger between enemies. Story arrivals no longer draw warning diamonds or landing rings; Party telegraphs retain their existing behavior.
- Hold opening and finale arrivals in `State.Ready`. Player movement, firing, hazards, enemy AI and capture are suspended during this preparation. Pause and time freeze stop the arrival clock.
- After the final enemy lands, hold the formation for 12 steps. The opening then shows its existing 60-step BUBBLE UP cue over the settled cast; reinforcement waves omit that large cue. Activate the entire group together and begin combat when preparation ends. Destinations do not relocate during the entrance because the players are held still.
- Pending enemies cannot move, shoot, damage players, or be captured. Ordinary enemy movement still allows enemies to cross each other's paths after activation.

Implementation: `src/adventure/spawning.ts`; tests: `tests/adventure-spawning.test.ts`.

## Descent verification — 2026-10-27

- Full suite: 986 tests passed across V8 and Hermes with phone-low settings.
- Focused arrival checks: 11 passed, including render goldens without updating. All 25 opening formations and five reinforcements preserve safe destinations, suspend player actions and hazards, and activate together. Pause and freeze hold the entrance clock.
- Actual opening and reinforcement screenshots cover phone, tablet and desktop layouts. The opening action cue appears only after landing; reinforcement descents remain unobscured.
- The refreshed journey is `tests/replays/adventure_spawning_recorded_opening_and_finale_descents_fit_every_screen.greplay`.
- Offscreen replay peak draw calls were 13 on mobile, 11 on compatibility and 13 on desktop, against a budget of 50. Existing pipeline sets cover the flow with no uncached or newly created pipelines. These are host measurements, not physical-phone GPU or thermal measurements.
- `gameengine check` passes, including typecheck, pipeline validation, desktop cook and cooked smoke test. The open editor reports no errors.
