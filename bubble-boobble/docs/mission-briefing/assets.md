# Mission briefing art provenance

30 October 2026. The Story Mode mission briefing implements the approved concept in
[approved-mockup.png](approved-mockup.png). The images below were prepared with the
built-in ImageGen tool from that approved concept; they are new assets and do not
replace the existing gameplay backgrounds.

| Asset | Source and runtime treatment |
| --- | --- |
| `assets/adventure/briefing/tugboat.png` | Illustration-only extraction of the concept’s left postcard. Landscape 1611 × 976 source; 2048 maximum imported size and 1024 on phone-low. Only the Tugboat Tussle briefing uses it. |
| `assets/adventure/briefing/paper-panel.png` | Cream paper panel extracted from the concept and prepared with transparent rounded corners and a thin teal frame. 1254 × 1254 source; 72-pixel nine-slice borders, 768 maximum imported size and 384 on phone-low. |
| `assets/adventure/briefing/coin.png` | Isolated anchor coin on transparent background, 1254 × 1254 source. Imported at 256 maximum into the `mission-briefing` atlas. |
| `assets/adventure/briefing/acts.png` | Code-native stacked-sheet silhouette matching the concept, 128 × 128 transparent raster export. Editable SVG source: [acts.svg](source-icons/acts.svg). |
| `assets/adventure/briefing/enemies.png` | Code-native skull silhouette matching the concept, 128 × 128 transparent raster export. Editable SVG source: [enemies.svg](source-icons/enemies.svg). |

The icons use the same `mission-briefing` atlas and uncompressed texture settings as
the coin. Illustration and paper panel use `atlas = "none"`, ASTC 6×6 compression on mobile,
and explicit phone-low resolution overrides. No existing raster image was edited
with a scripting library. The icon PNGs are fresh antialiased renders of native
vector geometry. The paper/card borders, labels, badges and buttons remain live UI.

## ImageGen prompts

Input for all three requests: the approved mockup in this directory. Built-in mode,
no CLI/API fallback. `transparent_background` was false for tugboat and paper and
true for coin.

### Tugboat

> Use case: precise-object-edit. Input image is approved game UI mockup. Extract ONLY the large framed tugboat illustration at left of card into a standalone landscape 1.65:1 image asset. Precisely preserve this original illustration's composition, boat, harbor architecture, sea, sunlight, colors, detail, objects, camera and painterly style. Fill whole output edge-to-edge with the illustration content that was inside the left picture (roughly x=190..1001, y=254..744 in reference), no border, no parchment, no UI, no text, no new or changed objects. This is production asset extraction, not reinterpretation. Source illustration must match the approved mockup as closely as possible. Output a clean rectangular landscape picture.

### Paper

> Use case: precise-object-edit. Input image is approved game UI mockup. Extract the plain softly textured cream parchment material from the central card as a standalone opaque landscape texture. Fill the entire output with only clean empty cream paper matching source card. Subtle organic fine paper fibers and faint natural gold-cream tonal variation, almost flat, warmly lit neutral #f5ebcc overall, no yellow/brown heavy vignette. No borders, no writing, no typography, no objects, no ornament, no creases, no UI. Preserve exact original paper colors and subtle texture. This is production material asset.

### Coin

> Use case: background-extraction. Input image is approved game UI mockup. Extract ONLY its small gold anchor coin shown next to '10 coins', a front-facing round embossed brass-gold coin with anchor symbol. Reproduce source coin's exact design/colors/style: warm golden brass, thin dark gold outline, raised concentric ring border, centered embossed anchor, softly painted bevel highlights upper left. Transparent background, centered isolated asset with only small transparent margin. No text, no extra items, no environment, no shadow outside coin, no glow. Square asset, full round face like reference.

### Rounded panel

`assets/adventure/briefing/paper-panel.png` is a 1254 × 1254 transparent rounded
paper panel generated from the generated plain paper intermediate described above, in built-in ImageGen mode. Its `.gmeta`
provides 72-source-pixel nine-slice borders. A slice scale near 0.28–0.3 gives an
approximately 18-pixel corner radius and thin teal frame without relying on rounded
image clipping. The live UI uses this panel at `sliceScale = 0.28`. Its runtime size limits are
768 / phone-low 384 with ASTC 6×6.

> Use case: precise-object-edit. Input image is clean subtle cream paper texture for game UI. Produce a production 9-slice UI panel using exactly this paper texture/color. Output square 1024 by 1024 if possible. One cream paper rounded rectangle fills entire image, touching x0 and y0 and right/bottom image edges at their straight centers. Rounded corners radius 28 pixels only. Corners OUTSIDE rounded rectangle genuinely transparent alpha, no outside margins. Add a thin uniform 3-pixel sea-teal outline (#285b59), following round corners and all four edges. Inside retain original subtly textured pale cream material, no heavy vignette, no gradients, no ornaments, no writing, no shadows, no extra border/margins. It is a flat straight-on scalable UI panel asset, not a photographed sheet. Straight edges should sit at image boundaries. The entire content area is empty cream parchment. Preserve source color and subtle texture; change only rounded transparent corners and thin teal edge.

The `back-arrow.png` glyph is a native transparent teal chevron (64 × 96), with
editable source [back-arrow.svg](source-icons/back-arrow.svg). It uses the same small
UI atlas and texture settings as the act/enemy icons. Keeping the arrow as an image
also preserves “Back to map” as the button’s accessible text label.

The `forward-arrow.png` glyph is a native transparent cream chevron (64 × 96),
with editable source [forward-arrow.svg](source-icons/forward-arrow.svg), in the same
small UI atlas. The primary action’s name therefore remains its live text label.

The hero illustration keeps its full 1611 × 976 source on default devices and
imports at 805 × 488 on phone-low (the importer halves until below the configured
2048 / 1024 limits). The first phone-low engine capture showed visible softness
when a 402 × 244 hero filled the large desktop postcard; the higher phone-low limit
retains fidelity while the artwork remains compressed and scoped to this episode.

## Texture sizing estimate

Computed from source dimensions and the importer’s documented halving to `max_size`,
with ASTC 6×6 block storage for the hero/panel and RGBA8 for the small UI sprites:

| Device | Hero dimensions | New image texel payload | RGBA8 fallback payload |
| --- | --- | --- | --- |
| Default | 1611 × 976 | 1.102 MiB | 7.762 MiB |
| phone-low | 805 × 488 | 0.477 MiB | 2.137 MiB |

These totals cover the seven new image inputs (hero, panel, coin, two summary icons,
two arrows). Atlas page padding and mipmaps are excluded. These are sizing
estimates, not measured resident memory, physical GPU timing, or thermal results.
