# Enemy feedback pass — 29 October 2026

This pass uses the approved cartoon artwork and adds code-driven motion and
combat feedback. Historical migration evidence, reference fixtures, source art,
and golden/replay baselines are unchanged.

## Resulting behavior

- Regular cartoon shooters commit to a direction and announce their attack for
  22 ticks (367 ms) before release. Shots travel at 3.8 units/tick instead of 6.
  Capture interrupts a queued attack; the existing cooldown counts through the
  warning and recovery. Projectile collision remains 16×20.
- Boulder artwork is 52×52; laser artwork is 28×48. Dark backings, short wakes,
  muzzle charge/puffs, and harmless 12-tick wall impacts make threats readable.
  These threats draw above actors and bubble shells. Reduced effects retain
  large outlined shots and the essential charge warning.
- Popped enemies expand over four ticks from the captive envelope to their
  original largest painted dimension, preserving each dead drawing's aspect.
  Both release drawings retain their original colours (the initial blue tint
  was removed after playtest feedback). Rotation is computed in code from
  the existing 50-tick flight, about the painted center, in the launch direction.
  Reduced effects show full-size enemies immediately without rotation.
- The last unresolved enemy keeps its original colours and uses the existing
  angry speed without an extra multiplier. An outlined red cartoon anger mark
  remains above its head; two brief steam puffs and a 26-tick squash/stretch
  announce new rage. Reduced effects keep the static anger mark alone.
  Pending Party reinforcements and future Adventure acts prevent early rage.
  Captives keep their bubble presentation and escape angry.
- Ground families use distance-driven wheel cadence, feet-pivot lean, spring
  stretch, landing settling, charge compression, and recoil. Angry enemies keep
  their travel cycle. Flyers keep their wing art with modest directional banking.
  This is a code-driven motion pass; no new frame artwork was generated.
- The final Party enemy finishes its defeat flight during rest. Immediate wave
  rewards keep their existing timing; flight expiration cannot award them again.

The legacy/reference attack path keeps immediate shots at 6 units/tick. Existing
pixel Party rage behavior is retained. No new multiplayer features are added.

## Local verification

From the engine project directory:

```sh
gameengine test --tier t0 --js v8 --filter '*enem*' --memory-class phone-low --json
node tools/cartoon/capture-enemy-juice.mjs
```

- 54 selected T0 cases pass, including actual campaign/Party updates, queued
  shots, capture cancellation, real impact expiry, size/center registration,
  rotation culling, reinforcement guards, and final-pop reward lifetime.
- 27 engine captures reviewed: 360×880 and 1680×720, charge/release/flight,
  defeat ages 0/4/16/49, rage, and final Party pop; plus a 768×720 roster sample.
  Local PNGs and machine-readable state/stats remain in ignored `.cache/enemy-juice`.
- Release V8 host, mobile rendering tier, phone-low content. The unchanged
  768×720 roster costs 14 draw calls before and after. Final captures peak at
  16 draws (the wide final-pop scene); render validation errors are empty.
  These are desktop structural measurements, not phone GPU/thermal benchmarks.
- Broad TypeScript checking reports two existing errors in
  `tests/overworld-weather.test.ts:90,92`; the same diagnostics reproduce on
  unchanged `main`. No changed-file TypeScript diagnostics were reported.
- Cross-review identified the disappearing final Party defeat; the retained
  rest-phase flight and reward regression test address it.

Follow-up colour/indicator verification: four focused size-transition T0 cases
pass after removing the defeat blue tint; 14 focused `enemy juice` T0 cases pass
after replacing the red body tint with the anger mark. Reviewed onset, squash,
stretch, settled rage and all-family captures at both 360×880 and 1680×720
(10 frames, peak 15 mobile-tier draws, no render validation errors). Marker
logic covers all six families, HUD bounds, reduced effects and lifecycle cleanup.
These captures remain in ignored `.cache/rage-indicator`.

Per PROJECT.md's prototype mode, full suites, Hermes parity, golden/replay
sweeps, pipeline recordings, cooks, cooked smoke, and physical phone profiling
are deferred and are not claimed passing.
