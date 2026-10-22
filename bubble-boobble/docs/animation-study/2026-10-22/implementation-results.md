# Dragon motion implementation — 22 October 2026

First implementation pass following the animation study. Three coordinated agents handled drawing/export, presentation playback, and independent integration review. Production character identity, world size, movement physics, jump trajectory, firing interval, shot duration, bubble origin and collision rules remain unchanged. No reference artwork was imported.

## Implemented

- Eight revised walking drawings for all ten dragon colors: clearer passing poses, more consistent sole height, fixed-grid export and head-registered blue crest accent. Keep the existing 32-tick normal-speed cycle; do not enable the study's unproven faster stride trial.
- Presentation gait advances from observed grounded displacement (144 game pixels per cycle), stops against walls, follows speed pickups and retains phase through direction changes. It does not change authoritative WalkFrame or physics.
- Moving shots use three upper-body stages over the original twelve ticks, plus eight compatible crouch-walking lower poses. Air shots use the appropriate airborne lower pose. Stationary shooting keeps its existing six full-body pictures.
- All cropped layers project from the same feet anchor, including mirroring and every tested viewport. Release art and muzzle registration remain exact. Moving-shot recovery changes only the face in its upper-body artwork.
- Vertical direction persists through zero-velocity apex holds, preventing brief fall/rise flicker. Ground contact resets it.

## Evidence

All commands ran inside `bubble-boobble/`, using the Game Engine workflow and phone-low memory class. No standalone launch or desktop/browser input was used.

| Check | Result |
|---|---|
| Complete V8 T0 suite | 330 passed, 0 failed |
| Recorded solo / nine bots / ten humans / pause / restart scenario | 385 steps; hash trace identical to pre-change baseline, `2eb03350686a5b7d` |
| New native ten-player moving-shot / airborne / apex / recovery scenario | 76 steps, passed; peak 14 draw calls; 14 reviewed captures |
| Existing expanded dragon walk / shot recovery render scenario | Passed; eight intentional walk goldens updated and reviewed |
| Existing colored-shot / knock / walking viewport scenario | Passed; eight intentional goldens updated and reviewed |
| Existing crown jump / mouth alignment viewport scenario | 337 steps, passed; twelve intentional goldens updated and reviewed; subsequent run passed without rewriting |
| Engine check | Typecheck, validation, views, desktop cook, cooked smoke, UI nodes passed |
| V8 + Hermes request | Could not run: installed engine lacks the Hermes host binary; V8 results above are verified |

The new logic tests cover all ten motion slots, float32 state packing, wall contact, speed pickups, retained jump direction, death/down priorities, cropped part alignment, release muzzle position, mirroring and four viewport aspects. Actual native sprites are inspected in the new render test; these checks do not rely solely on a single-sprite helper.

The engine check retains pre-existing tile transparency and camera configuration warnings, plus an obsolete pipeline program record (`7946469ed20397e0`). The latter is a release packaging limitation requiring pipeline recording before a release build. No new material was added here. The entire historical T1 suite was not claimed green; unrelated legacy golden failures were not blanket regenerated.

## Visual review and limits

Approved source and comparison sheets are in `art/dragon-animation/`: `contact-review-2026-10-22.png`, `shoot-locomotion-composite-2026-10-22.png`, and `face-recovery-composite-2026-10-22.png`. Export registration evidence is in `registration-2026-10-22.json`; the exporter consumes only the accepted dated sources. Native reference captures live under `tests/goldens/dragon_continuity_native_ten_moving_shots_air_legs_apex_holds_and_recovery_fit_all_aspects/`.

Foot contact and passing silhouettes improved, but support-foot horizontal spacing is still nonuniform and near/far leg identity remains subtle. This pass does not claim perfectly planted feet. The 144-pixel gait is the conservative existing pacing control, rather than a newly proven contact distance. Presentation observes net displacement between frames, so hidden direction reversals between skipped presentations can undercount travel. These are cosmetic limits.

Existing enemy improvements and study material remain in the working tree. This phase does not introduce further enemy production changes. The next art pass should refine foot spacing and leg overlap before increasing frame counts or accelerating playback, then apply the same contact and wing-arc review to enemies. Changes are local; no commit or push was made for this phase.
