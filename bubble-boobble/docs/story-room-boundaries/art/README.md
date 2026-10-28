# Story room boundary art

Created 28 October 2026 with the built-in `image_gen` tool, using the user-approved lighthouse, pump station, and tugboat boundary mockups as visual references. These files are new art; the archived migration evidence is untouched. No API/CLI fallback was used.

The three generated RGBA masters are preserved here for reproducible import. They are documentation sources outside `assets/`, so they do not ship as runtime textures. The generated master IDs are `exec-859b3ef1-bab2-4b2e-97a4-57cc0109a91a` (walls), `exec-4ec69ccc-21bf-42b8-aded-256305b64c7c` (foundations), and `exec-e4bf27a7-d4f5-449f-8374-fb04b064af3c` (emitter).

Run from the engine project directory:

```sh
swift tools/art/import-room-boundaries.swift
```

The importer performs rectangular extraction and high-quality downsampling with CoreGraphics, preserving alpha. It does not paint, recolor, key a background, or synthesize new art. Half-open crop rectangles, source/output SHA-256 hashes, dimensions, and file sizes are recorded in [import.json](import.json). Sidecars use the existing `cartoon-reconstruction` atlas, linear sampling, no compression, and no trimming.

Runtime images are in `assets/cartoon/reconstruction/environment/boundaries/`:

| Images | Source size | Intended use |
|---|---|---|
| `wall-stone`, `wall-timber`, `wall-pipe`, `wall-vegetation` | 96 × 512 | Left wall with lit outer face and dark right inner face; mirror for the right wall. The cropped right edge is solid throughout its height. |
| `foundation-stone`, `foundation-timber`, `foundation-pipe`, `foundation-vegetation` | 256 × 48 | Repeatable fascia beneath the existing platform cap. |
| `emitter-bubble` | 64 × 96 | Brass-and-glass anchor for the exact-position procedural membrane edge. |

The nine runtime PNGs occupy 625,014 bytes; uncompressed RGBA pixels occupy 1,007,616 bytes (0.961 MiB), before atlas padding. The wall crop alpha is at least 247/255 everywhere, including the inner edge. The emitter retains true background transparency. The membrane is rendered in code so its blocking edge agrees exactly with the rectangular collision boundary rather than inheriting a curve from the concept image.

## Generation prompts

All three calls set `transparent_background: true`.

### Wall sheet

> Use case: stylized-concept. Asset type: production 2D platform game modular boundary sprite sheet, transparent background. References are STYLE REFERENCES ONLY, not edit targets. Create FOUR isolated tall vertical boundary wall segments in a single row, evenly spaced with generous fully transparent gaps, all same height and width, perfectly straight sides. Each wall has width:height ratio 1:5. Left to right: 1 warm golden limestone masonry blocks lighthouse pillar; 2 honey brown heavy timber beam with dark iron brackets; 3 copper brass pipe housing with teal patina, rivets and one slim pipe; 4 dense green hedge tightly wrapped around a sturdy gnarled tree trunk, no loose branches. These are long midsection segments continuing out of frame above and below in game, NOT freestanding columns with decorative capitals; no caps or feet. Front orthographic with subtle 2D side-face bevel: lit broad outer face on left and a narrower DARK SOLID inner face along RIGHT edge. Each wall silhouette must have completely straight vertical right edge, no protrusions or gaps. Detailed painterly warm fantasy environment art like reference masonry/pipes, dark crisp edges readable at small game size. Entire wall silhouette opaque, background genuinely transparent. No floor, scene, characters, HUD, text, labels, shadows on ground or detached marks. Requested sheet portrait 1024x1536; four tall separated sprites.

### Foundation sheet

> Use case: stylized-concept. Asset type: production 2D platform game foundation fascia sprite sheet on genuine transparent background. References are STYLE REFERENCES ONLY. Create FOUR separate long horizontal rectangular foundation fascia strips stacked vertically with generous transparent gaps. Identical size, straight flat top and bottom, front orthographic view. Each strip width:height=7:1. Top to bottom: 1 warm golden limestone masonry blocks with dark recessed seam and small stone corbels; 2 honey brown timber structural beam with dark iron bands and brass bolts; 3 copper brass riveted mechanical panel with teal patina, small circular inset vents; 4 dark earthy mossy stone retaining wall with lush green moss along the lower seam. Each must be a continuous opaque rectangular strip designed to sit UNDER an existing platform top. No sloping walkable surface, no top cap, no endcaps or ornate feet; textures should be visually repeatable horizontally. Match warm painterly fantasy reference and crisp dark game art outlines. No scenery, characters, HUD, labels, text or loose objects. Fully transparent outside the four rectangular sprites. Sheet landscape 1536x1024.

### Bubble emitter

> Use case: stylized-concept. Asset type: one production 2D platform game sprite on a genuinely transparent background. Reference is STYLE reference only. Draw exactly one small brass and glass bubble-barrier emitter post, front orthographic 2D sprite. Same friendly painterly nautical fantasy art as the emitter in the screenshot: squat layered round golden brass base, short cylindrical plinth, small round glass chamber containing a soft aqua light, protective brass collar and cap. The glass chamber must be mostly translucent. Wide stable base, overall width:height approximately 2:3. Isolated centered sprite with a little transparent margin. No energy beam above it, no long trails, no ground, no scenery, no characters, no text, no labels, no watermark. Crisp dark contour and soft warm highlights, readable at 40 pixels tall.
