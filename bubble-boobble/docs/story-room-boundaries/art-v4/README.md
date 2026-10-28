# Exact approved lighthouse pixel slices — fourth preview pass

This pass uses the actual pixels of the original approved lighthouse mockup, `approved-lighthouse-mockup.png` (1672 × 941). There is **no new image generation or reinterpretation**, no resampling, no alpha painting or keying, and no replacement texture. Left and right pieces are taken separately, preserving the original asymmetric lighting.

These remain preview assets. The user requires approval of the actual engine composition before any merge.

## Reproduce and verify

```sh
swift tools/art/import-room-boundaries-v4.swift
```

The importer directly exports `CGImage.cropping` results without drawing into another canvas. [import.json](import.json) records source/output SHA-256 hashes, source canvas dimensions, half-open pixel boxes, natural runtime sizes and byte counts. Each decoded RGB output was compared with the corresponding decoded source crop; all selected pixels matched exactly.

Runtime sprites live in `assets/cartoon/reconstruction/environment/boundaries/`, use the existing `cartoon-reconstruction` atlas, linear sampling, compression none and trim false.

| Sprite | Source rectangle [left, top, right, bottom) | Natural size |
|---|---|---|
| core-left-stone-v4 | [184,112,380,695) | 196 × 583 |
| head-left-stone-v4 | [205,0,380,112) | 175 × 112 |
| cornice-left-stone-v4 | [184,44,380,112) | 196 × 68 |
| junction-left-stone-v4 | [210,695,380,855) | 170 × 160 |
| plinth-left-upper-stone-v4 | [184,684,380,695) | 196 × 11 |
| plinth-left-lower-stone-v4 | [210,700,380,736) | 170 × 36 |
| foot-left-stone-v4 | [210,736,283,854) | 73 × 118 |
| core-right-stone-v4 | [1295,112,1486,855) | 191 × 743 |
| head-right-stone-v4 | [1295,0,1486,112) | 191 × 112 |
| cornice-right-stone-v4 | [1295,44,1486,112) | 191 × 68 |
| plinth-right-stone-v4 | [1295,684,1490,736) | 195 × 52 |
| foot-right-stone-v4 | [1396,736,1490,854) | 94 × 118 |
| shaft-left-stone-v4 | [205,240,380,504) | 175 × 264 |
| shaft-right-stone-v4 | [1295,240,1486,504) | 191 × 264 |
| floor-stone-v4 | [387,777,1285,854) | 898 × 77 |
| fascia-stone-v4 | [387,803,1285,854) | 898 × 51 |

## Registration and known limits

Use one uniform source-to-render scale for every piece. Place pieces from their source rectangles, rather than independently stretching images to guessed wall widths. Design inner-face anchors are left x=387 and right x=1285. The source walking-floor anchor is y=777; the cap underside is approximately y=801–803; the foundation ends at y=854–855.

The painting has slight perspective: inner faces vary around left x=384–391 and right x=1281–1290. Rectangular common-core inner edges are x=380 and x=1295 to avoid importing slivers of scenery. These are cropped interior rectangular pieces, **not complete isolated pillar silhouettes**. Some outer stone margins are deliberately excluded; molding/foot pieces restore selected architectural overhangs using their registered positions.

The original static walking-floor cap and foundation occlude the lower dark pillar faces. The coordinator explicitly authorized preserving this **reference column plus floor-junction** imagery rather than inventing hidden geometry. The core pieces therefore contain the original floor/foundation junction from y≈778 onward.

**Foreground occlusion excluded:** the original foreground crate covers the left pillar near x=184–210 below y≈700. The coordinator chose to exclude that crate rather than import a floating fragment. The final left core therefore stops at y=695 (last included row 694); the lower registered junction starts at x=210. The molding is split into an unoccluded upper row and a narrower lower row, and only the exposed foot front at x=210–283 is retained. This deliberately trims the occluded outer-left geometry; no hidden stone is reconstructed or painted. The obsolete crate-containing full lower-left molding candidate was removed.

Above the full piece, narrow-screen extension sprites use a clean middle-shaft crop from the same approved artwork. No base or molding is independently redesigned, and the right side is never mirrored from the left.

No claim of visual approval or exact whole-screen equality is made: the engine composition still needs comparison with the original mockup and user approval.


The sixteen runtime pieces, including the retained fascia-only alternative, occupy 1073820 PNG bytes and 2401516 bytes if budgeted as uncompressed RGBA, before atlas padding. The copied approved source remains documentation outside the runtime asset tree.

The final full-floor sprite combines the approved cap and corbel/foundation into one exact registered crop. The lighthouse renderer should use this instead of the generic floor cap/underside and separate fascia quad; drawing both would cover the original corbel detail. The fascia-only crop remains preserved as an alternative, not an additional layer. No actors or feet occur below y=777 in this source crop.

A later pixel inspection of the lower-left notch found the crate edge starts affecting x=184 around source row 695, earlier than the initial approximate y=700 estimate. The main clean core was extended from its previous y=679 end through row 694; the narrower registered junction now begins at y=695. Both are still exact source crops. No other art pixels were changed in this adjustment.

The upper-left plinth crop was also trimmed to end before source row 695, matching the clean core. Its final rectangle is [184,684,380,695), 196 × 11 pixels. This removes the remaining antialiased crate-edge rows from the source asset; no pixels were painted or masked.
