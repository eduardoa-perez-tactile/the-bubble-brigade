# Walking and bubble follow-up

## Changes

- Walking: sixteen distinct drawings, two ticks per drawing, keeping the existing 32-tick cycle and 144-game-pixel stride. Normal walking now advances nine game pixels between drawing changes rather than eighteen. Eight new in-betweens fill the existing cycle; raised support feet in three candidates were corrected before export. All eighty prior key drawings across the ten colors remain pixel-exact at the even indices. The separate eight-pose crouched shooting legs keep their own phase mapping.
- Bubble release: an empty shot starts at an 18-pixel canvas and eases to its 96-pixel mature canvas over eight ticks. Growth stays centered on the existing bubble position and does not change hitboxes, trajectory, firing, or mouth registration. Ownership badges and elemental marks scale with the release growth while retaining their existing final sizes.
- Captives: a fixed 84-pixel canvas replaces the previous approximately 59-pixel canvas. Warning and escape keep that size. Mature bubbles use the same size with or without a captive. A point-blank capture immediately completes an immature shell around the captive; the enemy never shrinks to the release bead or grows along with it.
- Layering: captive, shell and bubble details form a foreground group after dragon artwork, so a new bubble remains visible over the muzzle. HUD/player markers remain above that group.

This is presentation work. Character design, world envelopes, simulation, movement speed and collision rules are unchanged. No reference artwork was substituted.

## Verification

Game Engine commands only, with phone-low memory coverage:

- 335 V8 logic tests passed. The new walking and bubble regressions first failed against the old presentation, then passed after the changes.
- The 385-step recorded controls scenario matches its pre-change hash trace exactly (`2eb03350686a5b7d`).
- New native staggered ten-player walking test: all sixteen poses observed, peak thirteen draw calls.
- Expanded native sixteen-pose walk and stationary shooting test: peak thirteen draw calls.
- Native moving shots / airborne legs / apex holds / recovery test: peak fourteen draw calls.
- Native release test verifies ten bubble sprites sort after the dragon sprites and captures growth at ticks 1, 3, 5, 8 and 12; peak fourteen draw calls.
- Capture and upper-shelf floating render checks pass across 1536×864, 768×720, 640×960 and 2520×1080. Updated captures reviewed.
- Engine check passes typecheck, validation, desktop cook and cooked smoke. The existing camera/tile warnings and obsolete pipeline record remain. Hermes verification remains unavailable because its host is not installed; these are V8 results.

The art preview is `art/dragon-animation/walk16-registered-preview-2026-10-22.gif`; the contact sheet is `walk16-registered-review-2026-10-22.png`. These are authoring previews, distinct from the native screenshots under the corresponding test golden directories.

More intermediate drawings reduce pose stepping, but exact continuous foot planting remains unproven because the existing key poses retain their support spacing. No claim is made that frame count alone fixes every motion issue. The final export includes the measured horizontal registration of the inserted drawings; its source master and exported sprites were reconciled and checked before commit.
