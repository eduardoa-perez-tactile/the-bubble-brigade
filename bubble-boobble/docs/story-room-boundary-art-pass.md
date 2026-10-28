# Story boundary art pass — October 28, 2026

**Status: unapproved preview. Do not merge this branch until the user explicitly
approves it.** The user rejected the visual quality of the first second-pass
captures and requested direct comparison against the original mockups.

The first implementation communicated the collision limits but lost the scale,
depth and architectural variety of the approved mockups. This follow-up restores
those qualities within the existing story-room presentation system.

## Direction

- Broaden architectural shafts from 96 to 192 world units. Add separate bases
  (256 units wide) and projecting collars (224 units wide), so the silhouette
  has shoulders and substantial feet rather than one uniform strip.
- Use warm molded masonry for the lighthouse, heavy valve housings for the pump
  station/foundry, braced timber for the post office/loft/fair, and rooted
  vegetation for the garden.
- Deepen the foundation from 48 to 80 units and add localized soft shadows.
- Give bubble barriers iridescent soap-film highlights, larger brass emitters
  and localized aqua light. Retain the exact vertical collision cue while
  allowing the decorative outer sheen to curve outward.
- Retain the original horizontal framing envelope. Nonessential exterior
  architecture may bleed beyond a narrow viewport; both blocking faces and a
  substantial inner band stay visible. Gameplay is not reduced to fit every
  exterior ornament. The deeper foundation receives a fixed vertical allowance.

## Boundaries and workflow

Keep all authored gameplay, platform positions, collision limits, enemy behavior,
HUD and progression. Opaque wall faces and decorative bases stay outside the
playable interval. Draw them behind actors. Keep effects static and readable in
reduced-motion mode. Do not touch archived migration evidence, old source masters
or the original art importer; preserve the new generation/import provenance
separately.

The coordinator uses the existing isolated checkout on
`codex/story-boundary-art-pass`. Separate subagents own new art, presentation code
and focused tests/review. Follow the repository branch/PR/squash-merge workflow.

## Verification

Follow the prototype policy in `PROJECT.md`: focused V8 geometry checks, plus
the existing 13-shot phone-low render case covering stone, pipe, bubble, timber
and vegetation at narrow, native and ultrawide sizes. Inspect the lighthouse
against its concept first, then the remaining styles. Approve only the selected
intentional visual changes after inspection. Measure native draw calls and
compute texture cost; do not claim physical-device timing or broader-suite
coverage.

## Feedback and corrected lighthouse preview

The initial second-pass captures did not match the concepts closely enough.
The independent fidelity review identified a smaller, higher playfield;
nonuniformly stretched materials; awkward joins between separately generated
bases and collars; visibly suspended foundations in some wide views; and
repeated bubble highlights resembling a scalloped rope. Technical geometry
checks passing was not evidence of visual acceptance.

The next preview is intentionally limited to Lantern Landing. It replaces the
stone assembly with a cohesive plain pillar/base cutout inspired by the approved
mockup, rendered at one uniform scale. The extraction model changed the original
pillar's proportions; that limitation is recorded in the v3 art provenance, not
presented as an exact pixel extraction. The main column is 1100 world units tall,
with width derived from its 187×960 aspect. Matching shaft pieces extend above
the column only on taller viewports.

Lighthouse presentation uses a 36-unit lower framing reserve and a 48-unit art
foundation. This recovers the larger, lower composition of the concept. The
playable floor and actors remain above the HUD; nonessential fascia and shadow
can extend behind its band. Other second-pass themes remain unapproved.

No second-pass visual baseline has been approved, and no second-pass commit,
push, PR or merge has been performed at this review point. The original merged
implementation remains available on main.

The lighthouse background now registers its painted ground plane with the room
foundation while retaining Cover at every aspect ratio. This removes the
suspended-room gap at narrow and ultrawide sizes. Portrait needs a more tightly
cropped background to keep both the ground registration and full coverage.

The two focused V8 geometry cases pass. The latest 13-shot render run completes
all asset and rendering assertions with a peak of 19 draw calls, then fails the
13 expected image comparisons against the first-pass baselines. These image
differences remain pending visual review; they are not counted as passing tests.
The native, narrow and ultrawide lighthouse captures were inspected. The native
floor height and interior width are closer to the approved composition, and the
ground-plane gap is removed. The approved upper cornice remains offscreen in the
new pillar placement, so this is still a corrective preview rather than an exact
match. No packed-residency or physical-device performance claim is made.

## Fourth preview: approved-source artwork

The user found the third preview closer but still insufficient. The regenerated
pillar was therefore replaced with deterministic slices of the original approved
mockup itself, rather than another image-model interpretation. The v4 importer
does not repaint, key, mask or resample: all exported pixels were verified against
their source rectangles. Separate left/right slices preserve the original light.
See [v4 source provenance](story-room-boundaries/art-v4/README.md).

Reference-space decoration uses measured design faces at x=387/1285 and walking
floor y=777, with one uniform pixel scale. Original upper cornices, lower bands,
stone blocks and the complete cap-and-corbels floor are registered from that
coordinate system. The old generic floor art is skipped only for this lighthouse
so it cannot cover the reference corbel detail. Gameplay and other platforms
are unchanged.

The painting contains perspective and foreground occlusion, so the opaque
rectangle crops are not complete isolated pillar silhouettes. Safe vertical
crop faces at380/1295 cause small outward translations relative to the design
faces. The crate-covered lower-left region was excluded. One matching junction
piece repeats 26 source pixels outward behind the original pieces to reconstruct
the missing stone strip, removing the visibly cut-in notch without nonuniform
stretching or new paint. This repair is an explicit approximation, not an exact
recovery of hidden original pixels.

The latest 13-shot capture completes its render/asset assertions at a peak of
19 draw calls; its comparisons still differ from the unmodified first-pass
baselines and remain unapproved. Native lighthouse capture for this review:
`.cache/story-boundary-review/lighthouse-v4-1280.png`. No commit, push, PR, visual
baseline approval or merge has been performed for this art pass. Other themes
remain unapproved.
