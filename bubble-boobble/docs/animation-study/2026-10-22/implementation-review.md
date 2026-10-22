# Dragon animation integration review

Scope: approved first pass on dragon playback transitions and walking drawings. Enemy revisions, new landing/hurt drawings and gameplay changes are outside this pass. This is a review checklist, not a report that these checks have passed.

## Observed production constraints

- `src/arcade/player.ts:updatePlayer` increments `WalkFrame` for held direction before collision resolution, including blocked and airborne input. `VX` is not the displacement signal. Derive gait from observed grounded X travel; do not change those authoritative counters.
- `src/arcade/physics.ts:jumpSegments` contains multiple zero-displacement holds and a later upward segment. A zero `VY` must not select falling. The table's first positive displacement starts at substep index 33; `JumpStep` is advanced while consuming substeps, so tests must inspect the real stepped path rather than treating its post-step value as an unconsumed index.
- `MaterialGlobals.v0/v1` already drive presentation. The existing motion observer uses `v2..v7`, exactly 24 floats, for ten players. Any replacement must preserve those other globals and retain per-player state in presentation resources rather than module variables or the authoritative game document.
- The current release drawing has a registered `[100,80]` muzzle on a 128×128 logical canvas. Root/feet registration is `[64,120]`. The courtyard dragon size is 141.312 game pixels. Keep these registrations and the collision body unchanged.
- Existing structural render budgets cap draw calls at 14. An extra lower-body or upper-body sprite for shooting must remain in the existing cartoon atlas and be measured with all ten players shooting at once.

## Required regression matrix

| Area | Exercise | Assert |
|---|---|---|
| Apex | Real normal and shoes jumps through the full arc | Rising pose persists through zero-displacement holds; falling begins only after actual downward motion; landing tick and all simulation hashes are unchanged. |
| Gait | Both directions, normal and shoes, 90 game pixels of grounded travel | Same completed cycle distance; shoes shorten time rather than stretch the body. |
| Collision | Press into both arena walls and a blocking interior wall | Gait phase does not advance from input alone. |
| Clock stability | Sample twice at one game tick, pause/resume, rewind/restart, player-count change | Repeated sampling is idempotent; frozen simulation does not animate; stale previous positions do not turn respawns/teleports into strides. |
| Ten players | Different travel amounts and directions in all ten slots | No slot sharing, cross-player phase contamination, or metadata packing overlap. |
| First shot | Fire on the first walking or airborne input step, both directions | Projectile count, spawn and cooldown match baseline; release upper drawing and registered muzzle appear immediately. |
| Combined motion | All six shot stages over all eight walking phases and both airborne poses | Legs retain their locomotion phase; no duplicated limbs, transparent waist gaps or planted airborne feet; the 12-tick shot recovery ends without resetting gait. |
| Priority | Fire then die/down; fire at takeoff, landing and immediate re-jump | Hurt/down dominate; no stale shooting overlay survives an authoritative state change. |
| Model | All ten identities, especially blue crest; inspect last→first | Head, shoes, muzzle and crest retain model dimensions; support marks/hip/tail follow authored chart; no per-frame bounding-box recentering. |
| Rendering | Ten simultaneous moving/air shots; four supported aspect extremes; phone-low | Full actors and HUD fit; peak draw calls ≤14; atlas/page and memory growth are reported. |

## Implementation cautions

Observing X only once per presentation frame measures net travel. A reversal between samples can cancel distance; distinguish this limitation from exact cumulative path length. Do not silently introduce an authoritative distance counter to compensate.

A cropped shooting upper body and locomotion lower body need a shared fixed source seam and the same full-canvas horizontal transform, including mirroring. Test the actual assembled production plan, not only an older single-sprite helper: that helper can keep passing while the new layered path draws a gap or shifts the muzzle.

Global gait state can be reset on inactive play, backward ticks, player-count changes and implausible X jumps. Replacing a session with another at an identical tick/count cannot be identified from those values alone; inspect the actual restart/session flow and document any remaining limitation. Hot reload of a packed state format also needs a validity/version discriminator.

Use engine `worldTest`/`renderTest`, recorded input and hash traces only. Root agent owns all engine commands so concurrent native host builds cannot conflict. A passing desktop/headless render budget does not establish phone GPU time or thermals.

## Runtime diff review

Reviewed the candidate motion observer, `dragonDraws` helper and five focused tests without running engine commands. No blocking flaw found in float32-safe phase/flag encoding, ten-slot packing, version invalidation or retained vertical-direction routing. The candidate preserves the 144-game-pixel stride corresponding to the existing 32-tick control; the study's approximately 90-pixel contact trial is not silently enabled.

One integration issue must be avoided when enabling cropped shooting layers: the existing courtyard projection recomputes Y from each sprite's full-canvas foot ratio. Cropped upper/lower rectangles cannot each use that formula. Project the common full-body feet once and preserve each rectangle's logical offset: `py(feet) + (draw.y - feet) * layout.scale`. Add an assembled `cartoonDrawPlan` regression, since helper-only adjacency tests do not exercise that branch.

Remaining candidate limits: resets identify inactive/backward-tick/player-count changes, not same-tick/same-count session replacement; plausible short-distance respawns or slot replacements can inherit phase. Death/down suppress drawing priorities and future walking but do not explicitly clear retained phase. These are cosmetic state observations, not authoritative game changes. Inspect actual session replacement flows before treating them as user-visible defects.

## Final integration inspection

The shared-feet projection issue is resolved in the production `cartoonDrawPlan` loop, with an assembled four-aspect regression. Moving/air shooting now uses three registered upper-body stages (four ticks each) and continuous ground/air lower-body poses; stationary shooting retains its six original pictures. Death/down priority bypasses those layers.

Inspected the exported contact sheet and registration record. The fixed-grid export and contact improvements are visible, but the recorded support X marks do not form a uniform stance progression and the opposite leg exchange remains subtle. Preserve that limitation in the handoff: this pass does not establish continuous foot planting. The 144-pixel control stride remains explicit.

Static asset inspection found all 210 expected dragon walk/cropped-shot entries across ten identities in both animation metadata and atlas membership. Sampled cropped frames declare the correct 128×96 or 128×32 canvas dimensions, source origins and the shared cartoon atlas, with linear filtering and trimming. No new material or authoritative state path is introduced.

Root reports the native 76-step integration scenario passing, including ten simultaneous moving shots, airborne shooting, apex holds and four aspects, at peak 14 draw calls. This reviewer did not independently execute engine tests. Final source inspection found no further blocking integration issue.
