# Readable, sequential introduction — 23 October 2026

This replaces the implemented timing in Visual Revision 2. The prior Classic adaptation compressed a three-second cue timeline into its native one-second preparation: its fully readable action hold lasted only five simulation ticks, about 83 ms. A 400 ms reveal obscured part of Ready as well. Those values were too fast. Survival's action hold was only 250 ms.

All values below are Brigade art-direction estimates informed by that feedback, **not verified Cuphead playback measurements**. Cuphead's fight-text images establish the lettering reference; they do not establish these timings.

## Two immutable images, never stacked

The HUD document now has a fixed Ready image and a fixed BUBBLE UP image. Independent, mutually exclusive visibility properties select one. It does not swap the texture of an image that is already visible. The displaced echo copies have been removed entirely. All cue pose and opacity-state transitions are explicitly instant: the timeline supplies the fade frames, and the document never starts an additional crossfade between words.

Original artwork remains at `assets/cartoon/ui/cues/ready.png` and `assets/cartoon/ui/cues/bubble-up.png`; the reference remains Cuphead's `Fight Start A - Ready` and `Fight Start B - Wallop!` collection cited in Visual Revision 2. No additional artwork or gameplay geometry changes are included here.

## Classic: readable Ready before its existing preparation

After the arena has been fully revealed, hold the simulation for a 90-tick presentation lead-in. The arena remains visible. Its native 60-tick preparation countdown has not started.

| Lead-in tick | Presentation | Input |
|---|---|---|
| 0–9 | Ready fades in over 150 ms | Gameplay unavailable; the scene is frozen |
| 9–72 | Ready holds cleanly for 1.05 seconds | Same |
| 72–84 | Ready fades out over 200 ms | Same |
| 84–90 | Completely clear arena for 100 ms | Same |

At tick 90, the presentation hold ends and Classic's existing 60-tick preparation starts. BUBBLE UP uses that full second. Simulation state, countdown length, enemy rules and gameplay start remain owned by the existing game loop. Subsequent automatic Classic rounds that do not have a launch transition use the native one-second action cue without inserting a new simulation hold.

## Survival: use its existing three seconds

Survival starts its existing 180-tick preparation only after the reveal ends. Its first Ready uses those actual ticks, with no normalization or added hold.

| Preparation tick | Presentation | Input |
|---|---|---|
| 0–9 | Ready fades in | Existing preparation rules: fresh practice fire is permitted; first-wave movement/jump are held |
| 9–102 | Ready holds cleanly for 1.55 seconds | Same |
| 102–114 | Ready fades out over 200 ms | Same |
| 114–120 | Completely clear arena for 100 ms | Same |
| 120–180 | BUBBLE UP sequence below | Same; combat control returns at the existing phase boundary |

## Shared action cue: one real second

Classic uses this at preparation ticks 0–60. Survival uses it at ticks 120–180.

| Action tick | Presentation |
|---|---|
| 0–6 | BUBBLE UP fades in over 100 ms |
| 6–42 | Clean, stationary word hold for 600 ms |
| 42–60 | Fade out over 300 ms |
| 60 | Both cue images are completely absent; the existing game state grants gameplay control |

No animation callback starts play. The image visibility follows recorded simulation and presentation-state ticks. Reduced effects retains the same readable holds and blank interval, with static images and fades; there are no displaced silhouettes or overshoot in either setting.

## Verification

The focused engine tests cover both timing sources, the 600 ms action hold in each mode, snapshot immutability, the six-frame blank interval, preservation of practice fire and first-wave input gates, and visibility exclusivity on consecutive rendered frames. Render goldens include Ready, the clear interval, action entrance, clean hold, clearing, and combat. The controller and engine integration tests separately establish that launch/retry covers and Classic's lead-in freeze simulation, rather than consuming either game's preparation countdown.
