# Complete lighthouse alpha profiles

The user reported that the opaque fourth-pass slices cut off the stone columns. This pass keeps full transparent profile frames, including projecting outer moldings and inner cornice returns.


## Original pixels, generated alpha only

Two exact original-source crops were supplied to the built-in `image_gen` background-extraction tool:

- Left input: original source [130,0,450,880), 320 × 880.
- Right input: original source [1240,0,1560,880), 320 × 880.

The resulting generated RGB is **discarded entirely**. Only generated alpha is retained, registered to the original input coordinate system. Runtime RGB comes directly from the approved mockup. The five profile/repair output files were decoded and their complete RGB channels compared with their exact original-source crops; every channel value matched, including hidden RGB in transparent pixels. The two shaft outputs were additionally checked as eight pixel-identical RGBA repetitions of the exact original RGB top band.

Generated source IDs:

- Left: `exec-2e0fc09c-6c73-423e-bcc3-554a47962098`, 757 × 2078.
- Right: `exec-2d74fd73-a441-45ab-b4ed-b43519ea878f`, 756 × 2080.

The runtime importer samples only the generated alpha channel; no generated color, texture, lighting, stone block, base, or ornament enters the output.

The active stone-family sidecars use the named atlas `story-boundaries-stone`; other border families use separate pages to avoid eager uploads of unrelated art. This atlas assignment is independent of the preserved extraction sources.

## Registration

[registration.json](registration.json) records a SIFT/RANSAC similarity fit using original pillar interior features. The generated masks were first measured in the input canvas coordinate system (320 × 880). The right result had an approximately 8-pixel horizontal translation, so direct canvas scaling alone was insufficient.

| Side | Good matches | Inliers | Median residual | P95 residual |
|---|---:|---:|---:|---:|
| Left | 143 | 135 | 0.459 source px | 1.469 source px |
| Right | 142 | 139 | 0.479 source px | 1.179 source px |

The fit uses source texture features only; backgrounds and foreground props are excluded from feature registration. Alpha is bilinearly sampled at the registered coordinates; original RGB is never resampled or transformed.

## Reproduce

From the engine project directory:

```sh
swift docs/story-room-boundaries/art-v5/crop-inputs.swift
swift tools/art/import-room-boundaries-v5.swift
swift docs/story-room-boundaries/art-v5/preview-masks.swift
```

The committed registration measurements are sufficient for the importer. To independently repeat feature fitting, use a Python virtual environment with `opencv-python-headless==5.0.0.93`, `numpy==2.0.2`, and `pillow==11.3.0`, then run `measure-registration.py`. That script reads images and writes measurement JSON; it never changes image pixels.

The preview script composites runtime alpha onto neutral gray for inspection only. Those preview images are not runtime assets; their backgrounds are deliberately opaque for QA. Some image viewers display hidden RGB when inspecting a straight-alpha PNG, so these flattened QA previews are useful.

## Runtime contract

[import.json](import.json) records natural dimensions, original source rectangles, runtime destination rectangles, operations, and SHA-256 hashes. Every runtime piece is rendered at one common uniform scale using global design anchors left x=387, right x=1285, and floor y=777. There is no left/right mirroring and no safe-core x=380/1295 placement offset.

| Sprite | Original crop | Size | Destination in original source coordinates |
|---|---|---|---|
| column-left-upper-stone-v5 | [130,0,450,678) | 320 × 678 | Same |
| column-left-lower-stone-v5 | [210,678,450,855) | 240 × 177 | Same |
| column-right-stone-v5 | [1240,0,1560,855) | 320 × 855 | Same |
| moulding-repair-left-stone-v5 | [210,678,286,736) | 76 × 58 | [144,678,220,736) |
| foot-repair-left-stone-v5 | [210,736,286,855) | 76 × 119 | [144,736,220,855) |
| shaft-left-stone-v5 | virtual[130,0,450,336), band[130,0,450,42), repeatY8 | 320 × 336 | [130,-336,450,0) |
| shaft-right-stone-v5 | virtual[1240,0,1560,336), band[1240,0,1560,42), repeatY8 | 320 × 336 | [1240,-336,1560,0) |

The last two pieces reuse visible original stone RGB, translated outward at the same uniform scale to cover stone hidden by the original crate. Their alpha is sampled from the registered generated LEFT mask at the **destination** source coordinates, not the RGB source coordinates. This preserves the complete natural shoulder/step contour instead of introducing rectangular patch edges. This is disclosed reconstruction by reuse, not a claim that the original image revealed the occluded geometry. No RGB painting, manual alpha painting, or nonuniform stretching occurs. The lower original profile overlays the last ten destination pixels, covering the repair crop’s extra rightmost floor-junction colors.

## Occlusion and full-profile QA

The image generator reconstructed hidden stone in its extraction RGB even though the prompt prohibited it. That generated RGB is ignored, but its alpha covered the original crate occlusion. The final upper-left original RGB crop therefore stops at source y=678; the lower original profile starts at x=210 from y=678 through855. The two translated visible-stone repair pieces fill the hidden outer-left area, with tool-generated destination alpha restoring the curved and stepped edges. This removes the original crate without painting new pixels or chopping off the full molding.

The final repair frames extend to destination x=144, leaving 2 source pixels of transparent clearance outside the molding’s alpha>=128 extent and3 outside the foot’s extent. This retains the shoulder tip at x=146,y=727, which would have been clipped by the earlier x=147 repair frame. Full upper-left and right frames have31/51 and37/38 source pixels of horizontal clear space at alpha>=128 respectively. Frame top/bottom touches are intentional where contiguous pieces meet or the pillar continues above the canvas.

The manifest includes actual per-asset `alphaBounds128`, `alphaClearance128`, source-space scanlines at body rows200/400/600 and molding landmarks, and composited point samples. Alpha threshold128 uses an inclusive `>=` comparison. Original inner cornice-return samples are retained: left(398,150)alpha191 and right(1278,150)alpha247. Continuous body-cue samples at leftx375 and rightx1297 for **every** source row0through777 have minimum alpha252 on both sides, so there are no vertical transparency holes in the blocking planes.

`left-assembled-preview.png` is a mechanical original-coordinate composition of all four left pieces over neutral gray. It was visually inspected for full shoulders, moldings, base shape, seams, crate remnants and pale edge artifacts. No crate fragment, lower-left notch, or white edge was visible in that asset QA. Actual engine capture inspection is recorded separately in the independent quality review.

All seven final runtime RGB images were rechecked against their source crops or repeated original source band: every RGB channel is pixel-identical. Total runtime size is 1,545,138 PNG bytes and 3,046,128 RGBA bytes, before atlas padding.

No manual alpha polygon, alpha key, generated texture, or silent aspect distortion is used.

## Exact prompt

Both calls set `transparent_background: true`; each added a final sentence naming the corresponding side and prohibiting mirroring.

Use case: background-extraction. Edit target: this TIGHT original lighthouse pillar crop. This is a precise segmentation task, not illustration. Keep the EXACT INPUT CANVAS, EXACT object location, EXACT geometric proportions and scale, EXACT block seams, texture and lighting. Do NOT recenter, resize, elongate, crop, reconstruct or redesign the pillar. Remove surrounding background to genuine alpha transparency. Retain the ENTIRE visible stone pillar silhouette, including ALL projecting upper cornice edges, middle/lower molding ledges and the plain wide foot. Keep generous existing empty margin so no architectural protrusion is cut off by image edges. Top remains cut at original canvas top because pillar continues upward. IMPORTANT: output alpha will be used as a MASK on the ORIGINAL input RGB, so shape/canvas registration must match the input pixel-for-pixel (or uniformly upscale the entire same canvas if output resolution requires it). Do not remove part of a molding just because it protrudes. No added architecture, ornament or newly painted stone. No text, no labels, no flat replacement texture. Mask out foreground/background objects that are not the pillar: chain, crates, sky, floor, characters, HUD, and detached gameplay platforms. Do not invent hidden stone behind occluders: occluded regions should be transparent because another existing layer will handle them. Preserve original partly occluded silhouette, with all visible pillar pixels kept in their ORIGINAL source positions. Original input canvas is320×880, ratio4:11; preserve this canvas aspect exactly and keep all object landmarks aligned.


## Full-alpha portrait shaft extensions

The native preview revealed a width step where the previous narrow opaque V4 extension met the full V5 profile at the top of the screen. The V5 shaft extensions now preserve the complete transparent input width on both sides. Each uses original source rows0–41, before the upper cornice, together with the same registered alpha sampled at those original source coordinates. That42-row RGBA band is copied eight times into320×336; there is no resampling and no new generation.

The manifest records virtual crop extent336, actual42-row `sourceBandRect`, `repeatY:8`, and an initial `destinationSourceRect` immediately above original y=0. The runtime helper repeats these taller sprites above the original frame, avoiding hundreds of tiny quads on tall views. `continuousShaftCueAlpha` verifies every row-336through-1 at leftx375/rightx1297 has minimum alpha252. The existing five profile/repair asset pixels are unchanged by this extension pass.
