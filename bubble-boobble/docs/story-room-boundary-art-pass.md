# Complete story-room border silhouettes

The approved lighthouse, pump-station and tugboat concepts provide the reference
for this refinement. Full alpha profiles replace cropped rectangular masonry,
repeated machinery modules and oversized bubble emitters. All 25 story rooms
retain their authored collision limits, platforms, enemies and progression.

The latest user instruction authorizes a PR and merge after the reference
comparison and approximately 95/100 visual review are complete. The score is a
border-only design assessment of silhouette, proportions, materials, lighting
and joins, not whole-scene pixel similarity. Timber and vegetation have no
separate approved mockup and receive a quality review without an invented
similarity percentage. See [the independent review](story-room-boundaries/quality-review.md)
for the rubric, evidence, results and limitations.

## Rendering and composition

- Lighthouse columns preserve the original shoulders, angled returns, cornices
  and complete feet. Registered generated alpha isolates the original RGB.
  Visible neighboring stone reconstructs the foot hidden by a foreground crate.
- Pump columns preserve the original pipe bundles, flanges, valves and broad
  plinths. Original foreground pixels are retained outside documented source
  occlusions; registered generated foreground repairs those hidden regions.
- Tugboat barriers use continuous curved double outlines and decontaminated
  transparent soap film, with original brass emitter details. The emitters keep
  their reference proportions. A faint straight cue explains the existing
  rectangular movement limit.
- Each side registers independently to its physical collision face. Art uses
  one source pixel density based on the reference room, so wider foundry and
  springs rooms cannot inflate columns or emitters. Original left/right light
  remains distinct.
- Reference floor caps replace only the existing floor row's presentation.
  Unchanged end pieces meet the bases, while wider rooms bridge the center.
  The pump concept's body/floor spacing inconsistency requires separately
  translated end pieces; the review explicitly accounts for this adaptation.
- Landscape framing reserves complete exterior silhouettes. Portrait retains
  a larger playable area with the blocking faces and inner architecture visible.
  The full jump crown and airborne-enemy headroom remain reserved.
- Existing painted foreground planes are registered per background rather than
  applying one ground ratio to every room. Timber and vegetation retain their
  themed shafts, broad bases, collars and foundations. These two non-reference
  kits intentionally broaden source aspect: shafts/bases by 33% and collars
  by 17%; uniform source pixel density applies to the three reference families.

Each episode preloads its painting and active border kit through the existing
card/transition lifecycle. The shared courtyard group excludes border assets,
and five named family atlases keep unrelated border families off its pages.
Released episode groups may remain cached until memory pressure; this is not a
claim that all inactive art is immediately evicted.

## Sources and reproduction

Active provenance is in [v2 timber/vegetation](story-room-boundaries/art-v2/README.md),
[v4 original lighthouse source/floor](story-room-boundaries/art-v4/README.md),
[v5 complete lighthouse masks](story-room-boundaries/art-v5/README.md),
[pump reference](story-room-boundaries/art-pump-reference/README.md) and
[boat reference](story-room-boundaries/art-boat-reference/README.md).
Import manifests record crop rectangles, transforms, alpha coverage, pixel
provenance and output hashes. Importers live in `tools/art/`. Rejected runtime
experiments stay outside the asset tree and are not included in this change.
Archived migration evidence remains untouched.

## Verification

Use the focused V8 story-boundary selection and affected Game Engine captures
under the prototype policy in `PROJECT.md`. The render case covers all five
materials at narrow, native and ultrawide sizes, including native full-width
foundry and springs variants. Inspect actual captures before approving only
this case's intentional new goldens. Record actual resident asset bytes and
draw calls; source-image estimates are not runtime measurements.

Final results are recorded in the independent review. Physical-phone timings,
thermals, cooked content, Hermes parity and full-suite coverage are deferred
under the prototype policy. Existing unrelated repository type errors must be
reported separately from the selected checks.
