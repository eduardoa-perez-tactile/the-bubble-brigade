# Drawing brief for the dragon walk

**Status: proposal for pose and timing approval only. No production drawing or playback change has been made.**

Produce a clear eight-drawing walk for our current dragon. The goal is two legible alternating steps, convincing contact, and a soft tail follow-through. The dragon stays cheerful, short-legged and round-headed in our existing drawing style. Cuphead’s contact/roll/swing construction is the motion reference; its model and running performance are not the design reference.

## Locked model and technical setup

- Use our current `assets/cartoon/frames/dragon/green/idle-0.png` as the model sheet and the current `run-0…7` as the style/performance baseline. Preserve head and muzzle dimensions, eye spacing, cheeks, belly, hands, shoe volume, tail length, frill point count, tiny wings, line weight, palette and shading. Maintain the current ten identities when adapting the approved master, including the blue character’s existing second crest/oval accent registered to the skull. Do not reinterpret that accent as a new costume.
- Draw facing right throughout. Draw the opposite leg exchange rather than horizontally mirroring a whole key to manufacture it. Runtime mirroring handles the left-facing result.
- Use a fixed **128×128 transparent logical canvas**. Keep root/ground reference **`[64,120]`**. Register the skull center, hip joint, each ankle, the sole’s support point, tail base and wing roots on a separate construction overlay. Mark near/far legs unambiguously there; do not add colored construction marks to final art.
- Keep head/torso volume and bone lengths constant. Express weight by changing joint angles and small relative offsets. Stay within the current union of walk pose envelopes. Do not enlarge the sprite, lengthen the stride by stretching legs, squash the whole image, or change the 141.312-pixel courtyard player envelope.
- Preserve authored canvas positions through export. One shared reduction scale is acceptable for larger drawing masters; separate per-drawing bounding-box centering or height fitting is not. A frame’s lowest opaque pixel is not automatically its correct contact pivot.

## Eight drawings and suggested exposure trial

The **first pose review uses the current `[4,4,4,4,4,4,4,4]` / 32-tick control** to isolate drawing quality from timing. For the next motion trial, the suggested exposure schedule is **`[2,3,2,3,2,3,2,3]` / 20 ticks at 60 ticks/second**. That schedule is our proposed starting point for the measured courtyard stride below, not a Cuphead frame rate and not an approved production retime. It gives weight-acceptance poses slightly more exposure without dwelling on every crossing pose equally.

“Near” and “far” identify the legs in the construction overlay, not a new visual marking on the character. Positive Y is downward.

| Key | Trial start / hold | Required construction and readable silhouette | In-between and follow-through instruction |
|---|---|---|---|
| W0 | tick 0 / 2 ticks | Near foot reaches contact ahead of hip; far foot finishes its rear toe-off. Upright familiar face; pelvis at neutral height. | Heel-to-sole contact should be readable. Tail tip is still completing W7’s motion; do not restart its curve. |
| W1 | tick 2 / 3 ticks | Near sole supports weight. Knees yield; pelvis approximately 2 source pixels lower, head supported rather than resized. Far heel releases. | This is a weight-acceptance key, not a duplicate W0. Hands and tiny wing lag the body slightly. |
| W2 | tick 5 / 2 ticks | Near support is beneath the hip. Far knee/foot passes with clear toe clearance. Pelvis returns toward neutral. | Show the rear foot travelling through an arc, not a straight horizontal smear. Keep near/far limb overlap understandable. |
| W3 | tick 7 / 3 ticks | Near heel rises into push-off. Far foot swings forward. Pelvis rises about 1–2 source pixels within the existing envelope. | Tail follows the pelvis with roughly one key of lag; head counter-motion keeps the face readable. Avoid an extra pause in the raised foot. |
| W4 | tick 10 / 2 ticks | Far foot takes the forward contact; near foot completes toe-off. It is the **opposite leg exchange**, not another drawing of W0’s same step. | Match W0’s model, height and energy while exchanging the limbs and hand swing. |
| W5 | tick 12 / 3 ticks | Far sole supports the small weight acceptance; near heel releases. | Match W1’s weight while letting the tail and hands continue their cyclic phase. |
| W6 | tick 15 / 2 ticks | Far support passes under hip; near knee/foot swings through. | Match W2’s clearance and body volume. Neither hand nor foot should disappear into the belly outline. |
| W7 | tick 17 / 3 ticks | Far heel rises; near foot reaches forward toward the next W0 contact. | Match W3’s push-off. Tail, head and wing must lead smoothly into W0 at tick 20, including the direction of their motion. |

These are four construction stages per leg exchange, not an instruction to add eight more in-betweens. Treat W0/W4 contact and W2/W6 passing as the first four key approvals; then draw W1/W5 weight acceptance and W3/W7 push-off. Only add another drawing if a specific arc or crossing is still unreadable at game scale after exposure and pose order are checked.

## Contact chart and why pace must be tested against travel

The engine probe measured **4.5 game pixels/tick** in normal courtyard travel and **6.3 with shoes**. The existing player envelope gives a source-to-game scale of `141.312/128 = 1.104` before viewport magnification.

For the proposed 20-tick trial, a foot supports approximately one 10-tick half-cycle. Its support mark therefore needs to travel about `10 × 4.5 / 1.104 = 40.76` source pixels backward under the body. This is a construction target, not a measured property of the current drawings.

| Near-foot support sample | W0 / t0 | W1 / t2 | W2 / t5 | W3 / t7 | Toe-off handoff / t10 |
|---|---:|---:|---:|---:|---:|
| Suggested support X | 84 | 76 | 64 | 55.5 | 43.5 |
| Support Y | 120 | 120 | 120 | 120 | 120 at toe-off |

Choose the contact mark along the rolled sole, not automatically the shoe center. After release, the near foot returns through a lifted arc: approximately rear/low → under hip/raised → forward/lowering → next contact. The far leg uses the same support progression offset by half a cycle. Adjust reachable marks if the locked model demands it, and recalculate cadence rather than stretching the character.

At these **key boundaries**, `root X + 1.104 × (support X − 64)` stays nearly constant during stance. A held raster still drifts between keys as the root moves; this is not a promise of continuous perfect foot planting. If that drift is distracting, shorten the offending contact exposure or evaluate an explicitly drawn in-between. Do not hide it by making the entire sprite stutter backward.

A 32-tick two-step cycle at the same speed would demand about **65.22 source pixels of support travel per foot** under the same half-cycle assumption. That is why merely slowing playback can conflict with our short-legged model. Keep the current 32-tick version as the control; if it is preferred, revise the contact geometry/step structure within the original proportions rather than blindly stretching this 20-tick chart over 32 ticks.

For the **later playback proposal**, phase should advance from actual grounded distance. With this trial’s roughly 90-game-pixel stride, shoes would complete a cycle in approximately `90/6.3 = 14.29` ticks while keeping the same drawings. A fractional presentation phase can express that; do not round each key independently or change shoes speed. A blocked character’s phase should not keep marching from held input. This is a design recommendation only; no such playback logic was added.

## Loop and transition requirements

- Loop W7 → W0 without duplicating W0 as a ninth end hold. Both contact exchanges must have equivalent weight. Check tail-tip position and tangent across the wrap, not just body centering.
- Enter walking from the closest credible support pose. On stopping, settle toward idle from a planted foot; do not force a stationary player to complete a simulated step. Direction input and movement remain immediate; any torso turn is cosmetic and interruptible.
- Preserve the leg phase while a shot overlays it. The existing projectile appears on the input step; walking art must not introduce a prefire delay or move the registered release muzzle. Air shooting keeps an air leg pose rather than the planted walking contact.
- A jump interrupts the gait on the existing launch tick. During zero-velocity apex holds, the air presentation must not flicker between rising and falling. On real contact, a small landing yield can transition to the nearest supported walk/idle pose without delaying re-jump or fire.
- Do not use a locomotion image to move a collision body, alter speed, change camera framing, delay a transition or drive a simulation timer.

## Review package and acceptance

The later artist handoff should contain the eight unlabelled RGBA masters, a labelled contact/construction sheet, per-key root/sole/hip/skull/tail markers, and two **explicitly synthetic** exposure previews (32-tick control and 20-tick trial). No new production drawings are part of this study.

Approve silhouette and model before polish. At the chosen keys, contacts should cancel root travel to within roughly one source pixel under the chosen chart. Review visible hold drift separately. Face/head/shoe volumes should overlay consistently; anatomical lengths must not grow between poses. Check complete cycles, `last → first`, both directions, normal/shoes speeds, wall pressure, starts/stops, moving shots, air shots and landing through Game Engine inspection. Keep the current viewport, memory and draw-call budgets and verify identical simulation/replay behavior before any future handoff.

Useful study references: [full locomotion comparison](02-run-comparison.png), [shoot/turn comparison](06-shoot-and-transitions.png), [Daisy takeoff and contact/recovery](05-landing-study.png). Exact original reference exposure timings and pivots are unknown.
