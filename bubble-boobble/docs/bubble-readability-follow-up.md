# Bubble readability and stronger jump contact — 22 October 2026

## What changed

The old main bubble was an empty transparent center surrounded by a narrow ink ring, so character tint barely appeared. Main gameplay bubbles now have a separate neutral translucent wash, tinted by the existing dragon palette. This wash is drawn behind the captive; the original rim remains in front. Shared capture/rescue/pop rings retain their original transparent centers.

The mature visual canvas increases from 96 to 110 (about 15%). Empty shots grow from 18% to full size over 16 ticks instead of 8, so small, middle and full stages remain visible beyond the initial release. No collision, projectile speed, firing cooldown or mouth position changed. Captives retain the fixed 84 canvas. Point-blank capture still completes the enclosing shell rather than shrinking the enemy into a release bead.

A dedicated warm, inked dust-puff master replaces the thin ring previously stretched into tiny dust wisps. Takeoff has 3 lobes lasting 18 ticks; landing has 5 lasting 22 ticks. Landing birth crown spans 75×30 game units, with stronger opacity, outward bloom and upward drift. Only the latest live contact event per player is shown, bounding ten simultaneous landings to 50 sprites. The puff is bottom-registered and projected from its supporting floor, then drawn in front of shoes for visibility. Reduced mode omits all dust.

Import provenance and rebuild commands are in `art/feedback/README.md`. The dust master is generated art, normalized by cropping alpha>2 bounds and proportional scaling; the color wash is reproducible procedural art. The existing rim is unchanged.

## Verification

- 348 V8 logic tests pass under phone-low memory class.
- 385-step recorded controls hash trace matches its pre-change baseline exactly (`2eb03350686a5b7d`).
- Native ten-player shooting shows the growth at ticks 1/3/5/8/12/16/24 and all ten colored surfaces; peak 14 draw calls.
- Dedicated 100-step native jump scenario observes actual takeoff and landing cues, asserts visible puff sizes and expiry, verifies reduced-mode removal, and captures final contact/bloom frames; peak 13 draw calls.
- The combined jump/shoot/capture/rescue/cluster scenario remains at 14 draw calls.
- A separate test checks dust bottom anchoring at all four screen aspects. Body/captive/rim order and stable captive size are covered.
- Engine check passes typecheck, validation, desktop cook and cooked smoke, retaining the existing camera/tile/pipeline-record warnings. Physical-phone thermal/GPU and Hermes measurements are not claimed.

Reviewed native images are the bubble appearance and bubble juice test goldens. Small changes can pass the engine's golden tolerance without replacing an old reference, so final takeoff/landing captures use explicit final snapshot names and were reviewed after the last geometry adjustment.

This work includes the earlier cartoon-feedback changes. Unrelated files and preserved migration evidence are untouched.

## Overlapping bubbles and the dragon silhouette

The screenshot follow-up exposed an overly broad foreground rule. Mature and captured bubble groups now draw behind the dragon; only a fresh, uncaptured, moving release (first six ticks) crosses the muzzle in front. Within each depth group, all color washes draw before every captive, followed by the rims and ownership marks. An overlapping bubble's wash can no longer tint a neighboring enemy drawing.

Two regressions first failed against the old ordering, then passed. The native overlap fixture recreates three trapped enemies and an empty bubble around the crown-platform dragon's head, with and without a fresh shot, across four viewport shapes. It checks actual sprite order and keeps the dragon's face readable. All 351 V8 logic tests pass; engine check passes. No bubble or enemy size, position, hitbox, movement or capture rule changed in this follow-up.

## Visible contact and bounce squash

Cartoon pop contact now uses mirrored, pose-aware head and torso circles against a mature bubble circle in fixed authored coordinates. This intentionally changes cartoon popping to match the visible artwork; capture boxes, chain reach, platform and damage collision, scoring and timers retain their existing rules. The preserved pixel arena keeps its original contact test. The existing descending held-Jump bounce takes priority, and a boosted dragon can separate upward without the larger painted contact immediately popping the bubble.

A successful airborne bounce creates a bounded presentation cue tied to the surviving bubble ID. Its shell compresses to 80% height, rebounds slightly, and settles over 18 ticks. The top anchor stays fixed relative to the floating shell; the captive and ownership mark translate with it, while captive size stays constant. Reduced effects removes the deformation. The cue is stored only in the existing presentation resource and pauses with gameplay.

Final verification: 361 V8 T0 tests pass under phone-low; all nine recorded concept-control hash traces match their pre-squash baseline. Native empty/occupied bounce sequences cover landscape and portrait at impact, rebound and recovery, peaking at 13 draw calls. Native overlap/contact and capture/flight scenarios also pass (peaks 10 and 14). Engine check passes typecheck, validation, desktop cook and cooked smoke. Hermes verification remains unavailable because its host binary is absent; the existing pipeline-record release warning remains unresolved.

## Long-fall handoff and readable warning stages

The 61-substep jump table ended its descent at 6 units per substep, then deleted `JumpStep` and returned to the 3-unit ledge-fall rule. This halved velocity in a deep fall (normal tick 51→52, shoes 32→33). Cartoon jumps now retain a saturated terminal phase until landing; ascent, apex, initial descent, 126-unit rise, and the preserved pixel/reference motion remain unchanged. Plain ledge falls and authored projection knots are unchanged. The fix removes the abrupt handoff, rather than replacing the existing arcade cadence with a new gravity model.

The supplied original-game state chart guides warning readability: owner-colored normal rims, amber captive warning after capture tick 1000, red after 1200, and amber empty-bubble expiry after Classic age 450. The body wash and badge keep owner identity. All captive stages keep the same folded artwork and size; copied angry running poses are no longer substituted during warning. Empty expiry pulses without disappearing. Reduced effects keeps the warning colors steady. This pass does not add new captive drawings or change capture/escape/lifetime rules.

Verification: 368 V8 logic tests pass under phone-low. Native normal/shoes descent crosses the handoff, continues to the actual landing plane and clears jump state (peak 13 draws); native state rows cover landscape/portrait (peak 9). All six enemy families and exact warning thresholds are covered. Engine check passes with existing camera/tile/pipeline warnings; Hermes remains unavailable because its host is absent. These intentional cartoon deep-fall changes do not claim match-wide replay equivalence.

## Forward fire and reward readability

Forward movement with held fire now protects the shooter's ordinary empty bubbles from its own enlarged head/body pop contact. Protection ends when forward fire stops or reverses; it never applies to captives, teammates' bubbles, ambient/elemental bubbles, chain propagation or jump bouncing. Shot velocity, range, firing interval and lifetime stay unchanged. Both directions, shoes and blue candy are covered; a 394-step native keyboard-input test checks four normal/shoes routes without accidental pops or score.

All 25 foods and 13 powers now use an 80-unit cartoon pickup canvas instead of 32, uniformly preserving source proportions, original footprint center and bottom anchor. Collection boxes and rewards stay unchanged. Pop bursts span 88–132 units with 96–140-unit rings, larger droplets and at most 18 simultaneous pop groups; their envelopes remain centered through the courtyard projection. Floating reward text is centered, bright and outlined, with screen-space readable sizing and HUD-safe clamping.

Verification: 374 V8 T0 tests pass under phone-low. Native reward galleries cover five landscape/portrait/tablet shapes including safe-area insets (peak 14 draws); forward-fire routes peak at 9. Engine check passes typecheck, validation, desktop cook and cooked smoke. The existing pipeline-record warning remains; Hermes testing remains unavailable because its host is absent.

## White bubble contours from the mockup

The mockup comparison exposed a tinting problem: applying player color to the entire old rim also colored its pale reflections. A new code-authored transparent `bubble-shine` layer provides a bright white outer contour and stronger rounded glints, without tinting. It sits above the existing colored meniscus while preserving the translucent owner wash, badge and amber/red status edge. Its geometry follows the exact existing shell growth and bounce squash; it adds no gameplay state or contact changes and does not affect shared effect-ring artwork.

Verification: 376 V8 T0 tests pass under phone-low. Native landscape/portrait galleries cover all ten owner colors plus captive warning states (peak 13 draws). The combined ten-player jump/shot/capture/rescue/reduced scenario passes at peak 14. Engine check passes; Hermes remains unavailable. Rebuild provenance is in `art/feedback/README.md`.

## Capture contact and score contrast

Cartoon capture formerly used the original 40×40 bubble and 38×38 enemy rectangles despite enlarged artwork. Capture now tests the growing visible shell against per-frame convex hulls baked from each enemy's shipped alpha silhouette, including mirrored frames, Mighta's attack pose and Banebou's spring motion. Geometry uses fixed authored coordinates and sim age, independent of viewport or presentation state. A short tile traversal blocks capture through solid shelves and walls. Only forward-flight bubbles capture; floating, elemental and preparation rules and the original pixel collision path are preserved. Rebuild metadata with `python3 tools/cartoon/build-capture-profiles.py` (also part of `build-assets.py`).

Black score fills came from legacy banner-area recoloring and RGB dimming during pause/results. Cartoon rewards bypass that recoloring and fade fill/outline alpha together while preserving bright ink.

Verification: 381 V8 T0 tests pass under phone-low. Capture covers all six families, every walk frame and both directions, newborn growth, transparent corners, solid scenery and capture eligibility. Reviewed native landscape/portrait edge-contact renders trap all six families (peak 9 draws); play/pause/result score contrast passes (peak 13). Engine check passes with existing tile/camera/pipeline warnings. Hermes verification is unavailable because the installed engine has no Hermes host; real phone GPU/thermal performance was not measured.
