# Pump-station reference boundary art

This family follows the approved pump-station mockup, preserved as [approved-reference.png](approved-reference.png), at 1672 × 941. It keeps separate left/right pipe bundles, large valves, riveted plates, vent housings, stepped feet and deep floor fascia. It never mirrors one side to manufacture the other.

The coordinator evaluates approximately 95/100 **visual similarity of the borders** in actual engine captures. This is not a claim of 95% whole-scene SSIM, unchanged RGB pixels, or pixel-identical reconstructed hidden geometry.

## Coordinate contract

[import.json](import.json) contains natural image dimensions, original pixel crops, destination rectangles, roles, alpha bounds/clearance, source-space scanlines, SHA-256 hashes and repair statistics.

- Original canvas: 1672 × 941.
- Floor/design anchors: x=344 and x=1327; walking floor y=777.
- Column body anchors: x=435 and x=1237.
- Prototype inner world width: 960.
- Art scale: `layout.scale × 960 / (1327 − 344)`.
- Each body anchors to its corresponding actual collision face using its own body anchor. This adapts the reference's decorative columns, which originally overlap the mockup's playable floor, without making the machinery 25% wider.
- Full alpha profiles retain their natural padding, protruding fittings and complete bases. Right lighting is authored separately.

The full floor crop is [344,777,1327,895). Adapted floors use original end pieces [344,777,562,895) and [1111,777,1327,895), with a clean center repeat [566,777,786,895). Ends join beneath their corresponding column bodies; longer rooms repeat the center instead of stretching valves or plates sideways. The full prototype floor remains a preserved alternative.

Each shaft extension is eight identical copies of the original top band [155,0,475,48) on the left or [1195,0,1515,48) on the right, with the registered alpha repeated alongside RGB. The resulting 320 × 384 images avoid narrow rectangular extensions or hundreds of tiny quads.

Independent read-only alpha checks show continuous painted body coverage for every original row 0 through 777 at x=415 on the left (minimum alpha 252) and x=1260 on the right (minimum alpha 250). These interior cue planes differ from decorative edge anchors because the pipes and fittings have varying outlines; a sprite bounding box is not a collision plane.

## Original RGB and bounded repairs

The first extraction supplies generated **alpha only** over original RGB. A second, focused inpainting pass removes the short stone side-platform ledges and continues the metal plates behind them. It preserves the bottom floor junction.

Original foreground posts, the player and HUD cover parts of the reference bases. Their hidden metal cannot be recovered as exact original pixels. Those areas use registered generated foreground color with locally feathered RGB weights, rather than hard rectangular inserts. The weight masks change RGB blending only; they do not hand-paint a new collision silhouette.

| Profile | Solid pixels | Exact original solid RGB | Whole-profile exact fraction | All changed RGB pixels | Pixels outside declared repairs | Exact outside repairs |
|---|---:|---:|---:|---:|---:|---:|
| Left | 182,587 | 144,745 | 79.27% | 49,868 | 231,986 | 231,986 |
| Right | 187,470 | 171,249 | 91.35% | 22,326 | 261,033 | 261,033 |

The strict unchanged-pixel fraction counts even a one-channel, one-level feather adjustment as changed. It is reported honestly rather than relabeled as a visual similarity score. **RGB outside the declared repair masks and inpaint rectangles is 100% exact original RGB.** Floors and shaft RGB are exact original crops/repeats.

Repair provenance is directly testable:

- `left-rgb-repair-weights.png` uses original source frame [155,0,475,900).
- `right-rgb-repair-weights.png` uses source frame [1195,0,1515,900).
- Side-platform inpaint rectangles are [368,635,460,712) on the left and [1215,635,1305,712) on the right, with ten-pixel perimeter blending.
- Foreground base seeds use original/generated RGB difference greater than 120 and maximum original channel below 160 in the foreground base region. Player/HUD color seeds are limited to their documented source areas in the importer.
- The seed core is retained; radius-2 dilation and two radius-3 box blurs feather the RGB boundary. This avoids flat rectangular material seams.
- The manifest records changed counts, exact outside-mask counts and fractions, mask frame, policy, and the separate inpaint registration file.

The initial gray QA caught a green player petal, stone side ledges, a HUD edge pixel and hard repair seams. The focused inpaint/feather pass removed those. Final gray composites are [assembled-preview.png](assembled-preview.png) and the individual profile previews. The actual engine capture remains the visual acceptance evidence.

## Generation and registration provenance

Built-in `image_gen`, with genuine transparency; no API/CLI fallback:

| Output | Generated source ID |
|---|---|
| Initial left alpha | exec-7b2c9191-39ac-4824-b20a-d29759fca060 |
| Initial right alpha | exec-6215ad56-79a6-49e5-a300-95410537157e |
| Focused left ledge inpaint | exec-f7c73a5b-bf60-466c-b98f-291653163d77 |
| Focused right ledge inpaint | exec-b37ba228-fdc9-40ec-91ae-f78a93163b69 |

[registration.json](registration.json) fits the original pipe interior to the initial extraction: 474/467 inliers, P95 residual 1.67/1.95 source pixels. [clean-registration.json](clean-registration.json) fits the focused edits independently: 387/374 inliers, P95 residual 1.86/1.96 source pixels. Generated canvas scale/translation is corrected before alpha or repair color sampling.

## Reproduce

From the engine project directory, with the recorded masters already present:

```sh
swift tools/art/crop-reference-boundary-inputs.swift
python tools/art/measure-reference-boundary-registration.py
python tools/art/measure-pump-clean-registration.py
python tools/art/measure-boat-film-curves.py
swift tools/art/import-boundary-references.swift
swift tools/art/preview-boundary-references.swift
```

The measurement scripts require OpenCV 5.0.0.93, NumPy 2.0.2 and Pillow 11.3.0 in an isolated Python environment. The importer can use the committed registration JSON without rerunning measurements. It performs deterministic source sampling, alpha registration, bounded repair blending and export. Sources and QA images live outside the runtime asset tree.

The active named atlas is `story-boundaries-pipe`, separated from stone, bubble, timber and vegetation pages so unrelated families are not eagerly uploaded together. Sidecars remain the authority; source import does not overwrite their atlas assignments.

Eight current runtime images occupy 2,023,254 PNG bytes and 4,054,584 uncompressed RGBA bytes before atlas padding. The coordinator may separately prune the unused full-floor alternative after renderer/test references are adjusted.

### Extraction prompt

Use case: background-extraction. This TIGHT ORIGINAL game mockup crop is the edit target. Segmentation, not redesign. Keep EXACT INPUT CANVAS320x900 and the object in its EXACT source position/scale; if output resolution changes, uniformly scale the ENTIRE SAME CANVAS, no recentering or stretching. Extract the ENTIRE tall copper/brass boundary machinery column on genuine transparency: all bundled pipes from the clipped top, all riveted teal vertical plates, projecting fittings, the large valve, broad lower valve/vent housing and full stepped base/feet. Keep FULL outer silhouette with all protrusions, not an interior rectangle. Preserve original asymmetric lighting, patina, front/side face proportions, seams and exact feature positions. No new ornament, no new design. Remove tanks/water/architecture background, actors/player/enemies, HUD/text, foreground black post/rope/props, and free platforms extending into the room. Retain platform/floor junction ONLY where it crosses within the column's own physical silhouette; remove their free extension. If the small foreground black post occludes a base corner, complete ONLY the hidden metal in that small occluded region matching adjacent original metal; do not change other visible column texture. We will use alpha over original RGB for all unoccluded metal, so shape/canvas registration must match original. All surrounding pixels genuinely transparent; no matte or background shadow. Pillar continues offscreen above at original top, no new cap. No text, labels, detached particles or floating ornaments.

Each side's call added a sentence prohibiting mirroring.

### Focused ledge-edit prompt

Precise small inpainting edit of this already extracted transparent copper pipe column. Keep EXACT CANVAS, pixel scale, silhouette position and all other painted machinery unchanged. Remove ONLY the SHORT CREAM STONE SIDE-PLATFORM LEDGE attached near 72% of image height (around y650 of original900-coordinate canvas), including its stone underside/corbel. Restore the teal riveted vertical plate / copper housing behind that short stone ledge, continuing the same straight machinery contour visible above and below. Where the ledge projects outside the continuous column silhouette, make it transparent. Do NOT remove the bottom floor junction near86% height (y777 original coordinate). Do not change any other stone at bottom. Keep original broad valve housing, large valve, circular vent, stepped brass foot, all small pipes, patina, rivets, original lighting/scale. No new objects or ornament. Genuine transparent outside, preserve all edge margins. Only the short SIDE ledge is removed; do NOT redesign or recompose the column. Also keep the restored hidden base as one coherent existing metal body, no flat colored rectangle. Output same aspect and same registered layout.
