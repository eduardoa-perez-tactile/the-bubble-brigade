# Full-profile lighthouse alpha candidates — fifth preview pass

The user reported that the opaque fourth-pass slices cut off the stone columns. This pass keeps full transparent profile frames, including projecting outer moldings and inner cornice returns.

**Preview status:** no visual approval or merge is implied. The right profile is clean; the left upper profile still exposes a small original foreground-crate fragment near its bottom outer edge, described below.

## Original pixels, generated alpha only

Two exact original-source crops were supplied to the built-in `image_gen` background-extraction tool:

- Left input: original source [130,0,450,880), 320 × 880.
- Right input: original source [1240,0,1560,880), 320 × 880.

The resulting generated RGB is **discarded entirely**. Only generated alpha is retained, registered to the original input coordinate system. Runtime RGB comes directly from the approved mockup. All five output files were decoded and their complete RGB channels compared with their exact original-source crops; every channel value matched, including hidden RGB in transparent pixels.

Generated source IDs:

- Left: `exec-2e0fc09c-6c73-423e-bcc3-554a47962098`, 757 × 2078.
- Right: `exec-2d74fd73-a441-45ab-b4ed-b43519ea878f`, 756 × 2080.

The runtime importer samples only the generated alpha channel; no generated color, texture, lighting, stone block, base, or ornament enters the output.

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
| column-left-upper-stone-v5 | [130,0,450,695) | 320 × 695 | Same |
| column-left-lower-stone-v5 | [210,695,450,855) | 240 × 160 | Same |
| column-right-stone-v5 | [1240,0,1560,855) | 320 × 855 | Same |
| moulding-repair-left-stone-v5 | [210,695,283,736) | 73 × 41 | [158,695,231,736) |
| foot-repair-left-stone-v5 | [210,736,283,854) | 73 × 118 | [176,736,249,854) |

The last two pieces reuse visible original stone as opaque crops, translated outward at the same scale to cover stone hidden by the original crate. This is disclosed reconstruction by reuse, not a claim that the original image revealed the occluded geometry. No RGB painting or nonuniform stretching occurs.

## Remaining occlusion issue

The image generator reconstructed hidden stone in its extraction RGB even though the prompt prohibited it. That generated RGB is ignored, but the resulting mask is still opaque over the original crate occlusion. Splitting the lower left profile at x=210 excludes most of this prop. However, the expanded outer molding starts protruding around x=147–170 before source y=695; the original crate is already visible there around y=684–695. A small brown foreground fragment therefore remains at the lower-left corner of the upper profile. This was reported before engine presentation. A further source-geometry clip/repair or a separately generated occluder mask is required before describing the complete left profile as crate-free.

No manual alpha polygon, alpha key, generated texture, or silent aspect distortion is used.

## Exact prompt

Both calls set `transparent_background: true`; each added a final sentence naming the corresponding side and prohibiting mirroring.

Use case: background-extraction. Edit target: this TIGHT original lighthouse pillar crop. This is a precise segmentation task, not illustration. Keep the EXACT INPUT CANVAS, EXACT object location, EXACT geometric proportions and scale, EXACT block seams, texture and lighting. Do NOT recenter, resize, elongate, crop, reconstruct or redesign the pillar. Remove surrounding background to genuine alpha transparency. Retain the ENTIRE visible stone pillar silhouette, including ALL projecting upper cornice edges, middle/lower molding ledges and the plain wide foot. Keep generous existing empty margin so no architectural protrusion is cut off by image edges. Top remains cut at original canvas top because pillar continues upward. IMPORTANT: output alpha will be used as a MASK on the ORIGINAL input RGB, so shape/canvas registration must match the input pixel-for-pixel (or uniformly upscale the entire same canvas if output resolution requires it). Do not remove part of a molding just because it protrudes. No added architecture, ornament or newly painted stone. No text, no labels, no flat replacement texture. Mask out foreground/background objects that are not the pillar: chain, crates, sky, floor, characters, HUD, and detached gameplay platforms. Do not invent hidden stone behind occluders: occluded regions should be transparent because another existing layer will handle them. Preserve original partly occluded silhouette, with all visible pillar pixels kept in their ORIGINAL source positions. Original input canvas is320×880, ratio4:11; preserve this canvas aspect exactly and keep all object landmarks aligned.

