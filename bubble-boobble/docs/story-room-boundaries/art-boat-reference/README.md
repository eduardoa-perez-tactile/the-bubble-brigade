# Tugboat reference boundary art

This family follows the approved tugboat mockup, preserved as [approved-reference.png](approved-reference.png), at 1672 × 941. It uses a single continuous curved soap-film border on each side, original-scale brass emitters, and the original stone cap plus timber/brass foundation.

The coordinator's approximately 95/100 border visual-similarity review is distinct from RGB equality or whole-scene SSIM. The film must be decontaminated because the source image composites it over sky and sea.

## Geometry and runtime pieces

[import.json](import.json) is the source of truth for image sizes, crops, roles, alpha extents, destination coordinates, hashes and RGB repair proof.

- Floor/body anchors: x=325 and x=1345; walking floor y=777.
- Emitter centers: x=294 and x=1378, outside the playable floor.
- Prototype inner world width: 960.
- Uniform source scale: `layout.scale × 960 / 1020`.
- Continuous film frames: left [160,0,480,732), right [1192,0,1512,732), both 320 × 732.
- Original-scale emitter frames: [260,720,330,833) and [1344,720,1414,833), both 70 × 113.
- Full floor: [325,777,1345,843), with separate source end/center crops for wider rooms.

The film keeps the original curved double bright outline, continuous glow and iridescent highlights. It is not a stack of short straight strips. Cropping the final film at y=732 removes the previous thirteen transparent tail rows that caused a gap above the brass caps when portrait layouts stretched the film upward. The emitter overlaps the ending glow at its original crown.

## Decontamination and curve registration

The generated film is clean foreground RGBA. No opaque original sky, clouds, sea, buildings or ground are carried into it. The brass emitters use original reference RGB outside a clearly declared glass-color region; the glass uses decontaminated generated foreground RGB and registered alpha.

Small-emitter SIFT fits alone are insufficient to register the entire tall film: the extraction changed its canvas scale by about 5–6%. The film is therefore independently fitted to the **original bright double-outline center and spacing** at each source row:

1. Measure the two original white-cyan outline bands and their corresponding generated bands.
2. Reject occasional false peaks from bright rainbow glints.
3. Fit a robust quartic center curve and quadratic spacing curve.
4. Remap only the generated decontaminated RGBA onto the original smooth curve, anchored at the top and the original continuous beam endpoint.

[film-curves.json](film-curves.json) preserves raw measurements and fitted arrays. Original curve-fit P95 residuals are 0.522 source pixels on the left and 0.485 on the right. The smoothing removes the sideways kinks visible in the first raw row-by-row prototype.

Original center samples, before the small end-cap taper, are approximately:

| Original row | Left global center | Right global center |
|---:|---:|---:|
| 0 | 271.13 | 1399.51 |
| 200 | 240.52 | 1430.11 |
| 400 | 235.47 | 1435.54 |
| 600 | 258.31 | 1412.88 |

The measured separation stays approximately eighteen source pixels. The original continuous beam ends at row 731; the final frame includes that row. It then meets the separately registered emitter instead of carrying a blank alpha tail.

## Original RGB proof and transparency

Every opaque brass pixel outside the glass predicate remains exact original RGB. The declared glass predicate is `sourceG + sourceB > 2 × sourceR + 40`; its decontaminated colors are an intentional exception.

| Emitter | Solid pixels | Exact original solid RGB | Whole-emitter exact fraction | Changed RGB pixels | Exact outside declared glass region |
|---|---:|---:|---:|---:|---:|
| Left | 4,370 | 3,426 | 78.40% | 1,437 | 6,473 / 6,473 |
| Right | 4,126 | 3,243 | 78.60% | 1,506 | 6,404 / 6,404 |

Those whole-emitter percentages include the translucent glass; they are not mislabeled as brass fidelity. Original brass RGB exactness is 100%. Floor images are exact original crops. The film's RGBA is intentionally generated/decontaminated, with no claim of original RGB equality.

Approximately 38.3% / 50.9% of visible film pixels have alpha below 240. The source-aware outline fit retains bright continuous edges while surrounding haze and sheen remain transparent. [assembled-preview.png](assembled-preview.png) composites all borders and the floor over neutral gray for material and join QA.

## Generation provenance

Built-in `image_gen`, genuine transparency, with the exact 320 × 900 original-source crops as edit targets:

| Side | Original input | Generated source ID |
|---|---|---|
| Left | [160,0,480,900) | exec-a3b1e073-fa42-42bc-b1d4-40318785ec3f |
| Right | [1192,0,1512,900) | exec-84b8e493-6843-4ec2-b147-a596daac1d44 |

[registration.json](registration.json) records emitter fits: 10/9 inliers, local P95 residual 1.234/0.997 source pixels. Those measurements register emitter masks and glass only; they are not extrapolated to claim full-height film alignment.

## Reproduce

Use the shared commands in the [pump reference README](../art-pump-reference/README.md#reproduce). The committed curve/registration JSON is sufficient for deterministic import; independent measurements use OpenCV 5.0.0.93, NumPy 2.0.2 and Pillow 11.3.0. Source masters and QA previews remain outside runtime assets.

The active named atlas is `story-boundaries-bubble`, isolated from the other boundary families. The importer preserves existing sidecar atlas assignments. Eight runtime images occupy 607,916 PNG bytes and 2,360,656 uncompressed RGBA bytes before atlas padding.

### Exact extraction/decontamination prompt

Use case: background-extraction and transparent effect decontamination. This TIGHT ORIGINAL game mockup crop is the edit target. Keep EXACT INPUT CANVAS320x900, original object location, curve, scale, feature coordinates and proportions; if output resolution changes uniformly scale the ENTIRE SAME CANVAS, no recentering. Extract ONLY the ONE continuous curved soap-bubble boundary AND its original small brass/glass emitter post at bottom. Keep the exact two continuous parallel luminous aqua-white outlines and exact broad curved iridescent soap-film crescents/reflections, from the cropped top edge all the way into emitter. Preserve asymmetry, original curve and warm brass emitter design/scale. DECONTAMINATE THE FILM COLORS: remove underlying sky/clouds/sea/buildings, reconstruct clean translucent aqua/lavender/pale-pink foreground RGB+alpha so the same continuous soap film can overlay any background without carrying opaque scenery. This is not a new design: match the original outlines' curve, spacing, thickness, highlight positions and original emitter. Emitter opaque brass texture should remain faithful; round glass chamber translucent, not a dark solid blob. Remove all platforms, floor, actors, HUD/text, foreground rope/posts, buildings, clouds, ocean and ground. Retain no scenery inside faint alpha; only clean soap-film glow. Keep full glow margins uncut and retain all little original surface glints; no extra particles or new bubbles. No redesign, no laser/lightning strip, no straightening the curve, no full opaque cyan wall. Genuinely transparent surrounding background. Original canvas320x900.

Each call added its corresponding side and prohibited mirroring.
