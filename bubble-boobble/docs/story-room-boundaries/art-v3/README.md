# Lighthouse extraction candidate — third pass

This is a **preview candidate**, not approved production art. Created 28 October 2026 with a single built-in `image_gen` background-extraction edit of the original approved lighthouse mockup.

## Limitation requiring review

The extraction preserves the restrained plain limestone/base style more closely than the separate first- and second-pass modules, but **the image model changed the pillar proportions**. The approved reference pillar is approximately 248 × 855 pixels (width/height ~0.290); this candidate's retained coordinate frame is 380 × 1950 (~0.195). This discrepancy was reported to the coordinator before any integration decision. The importer does not hide it through nonuniform scaling.

No claim of pixel-identical extraction or visual approval is made. The user requested that no merge occur until they approve a real engine preview.

## Import

```sh
swift tools/art/import-room-boundaries-v3.swift
```

Runtime candidates are `column-stone-v3.png` (187 × 960) and `shaft-stone-v3.png` (187 × 256). Both use the same source x coordinate frame, [196,576), from `column-extraction.png`. The full column source y range is [16,1966); the shaft is [500,1020). Scaling is uniform, apart from under 0.1% integer-pixel rounding. The shaft's left alpha contour remains in the same coordinate frame as the full pillar.

The importer performs only rectangular crop and CoreGraphics high-quality downsample. It preserves alpha and does not paint or repair the shape. [import.json](import.json) records source/output hashes and sizes. The source master ID is `exec-3fe133dc-1d0f-4bbd-9d76-5581f09552f8`.

At logical height 820, uniform rendering of the full candidate gives width 159.73. The source's rightmost base projection was cropped at the shaft's right edge so the image bounds may be anchored to collision. There are no separately composited corbels, bases or collars.

## Exact extraction prompt

`transparent_background: true`

Use case: background-extraction. Edit target: the supplied approved lighthouse game mockup. Extract ONLY the EXACT LEFT FOREGROUND LIMESTONE PILLAR as a transparent cutout asset. It is the warm golden stone structure around original image x150..398, from the top crop at y0 to its plain stepped foot at y855. Preserve the original painted stones, their large block scale, original lighting, warm pale golden left/front face, darker narrow right INNER face, the simple thin collar near its foot, and the restrained rectangular base. Preserve original geometric proportions, texture, seams and silhouette faithfully. Remove all scenery, sky, windows, lanterns, chain, background, floor, characters, HUD, and all horizontal gameplay platforms. Where the bottom gameplay platform crosses in front, remove that platform and restore ONLY the plain stone pillar behind it, consistently with adjacent stone. Do not add new ornaments, corbels, arches, new collars, elaborate pedestal, foot carvings, decoration, new style or extra imagery. This is faithful cutout extraction, NOT a redesign. The pillar shaft continues offscreen at top; keep a flat cut at top, no capital. The RIGHT inner face is straight vertical and ends at the same right x through the shaft (base may protrude on LEFT only); no projections extending right into gameplay. Retain the same width:height ratio as the ORIGINAL pillar, approximately 0.29:1, not a squat monument and not a skinny stack. Output one isolated tall full pillar only centered on genuine alpha transparency with small empty margins, filling almost the full output height. Critical: keep the simple architectural appearance of the reference. Transparent background, no text.

