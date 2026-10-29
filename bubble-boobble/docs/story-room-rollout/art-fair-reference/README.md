# Fair district: complete painted timber frame

New border proposal for fair levels 11–15. `source-master.png` is a generated transparent sprite composition, **not an actual engine capture**. No merge until the user has seen all levels; the coordinator owns engine captures, gameplay checks, PR and review.

The five fair backgrounds were inspected before design: warm tea hall, balloon workshop, windmill, electrical pavilion and sunset carousel. The frame uses substantial honey/chestnut timber, deep inner returns, muted red inset panels, small teal bevel accents and aged copper/brass joinery. The two sides are separately painted, with different grain and light, rather than mirrored. A single upper shoulder and lower plinth replace the old stacked strap pattern. The cream limestone walking cap matches the existing platform caps.

## Provenance

Built-in imagegen only, generation `exec-45faae6f-0269-4c90-aa49-0c55188b1f96`. [PROMPT.md](PROMPT.md) preserves the full prompt and reference roles. The approved Parcel frame supplies material quality, while `assets/adventure/fair-1.png` and `fair-2.png` supply palette and workshop vocabulary. The remaining three fair backgrounds were inspected for theme compatibility. The final generated master is preserved without subsequent generative edits, keyed alpha, manual painting or nonuniform resampling.

Master SHA-256: `1a7c7e0dd62a9c01982ccfbf0ec539ff5e0c5b296e55e1990ed2ccd62a971cf7`.

## Geometry and reproduction

Run from `bubble-boobble/`:

```sh
swift tools/art/import-fair-room-frame.swift
```

The measured source canvas is 1672×941. Coordinates are top-left and rectangles half-open. Main left/right inner body planes are source x344/x1333, walkable floor is source y750, and the canonical inner width is 960 world units. All pieces share one uniform source-to-world scale. Shoulder returns may overhang into the room behind actors. Profile bottoms at905 retain even the faint foot alpha through902 and two transparent rows; alpha≥128 ends at894. Exterior solid margins are27px left and25px right on the full source.

| Asset | Source crop | Runtime size |
| --- | --- | --- |
| `profile-left-fair-reference` | `[0, 0, 384, 905]` | 384×905 |
| `profile-right-fair-reference` | `[1288, 0, 1672, 905]` | 384×905 |
| `shaft-left-fair-reference` | `[0, 0, 384, 256]` | 384×256 |
| `shaft-right-fair-reference` | `[1288, 0, 1672, 256]` | 384×256 |
| `floor-fair-reference` | `[344, 750, 1333, 905]` | 989×155 |

The profiles and floor decode to exactly the same RGBA pixels as their master crops. Plain shafts repeat the first32source rows eight times; every stored band is identical, and alpha is source-exact. CoreGraphics premultiplied/unpremultiplied PNG serialization changes semi-transparent source RGB by at most6 levels on the left and7 on the right, concentrated at low alpha. This is quantization, not geometric resampling or new texture painting. The manifest records this accurately rather than claiming source-RGBA identity for shafts.

`source-gray-preview.png` composites the original full composition on neutral gray for source QA. Both full shoulders, inner returns, feet and floor joins are continuous. There is no detached ornament, clipped exterior foliage, repeated collar or floor seam. Above the actual floor join at source y749, horizontal alpha≥128 clearances are40/19px for the left crop and24/37px for the right. Inner crop-edge contact begins749 and ends890 on both sides; this is the same-source floor cap/fascia crossing the profile crop, not a cropped column. The painted cap begins one source pixel above the physical walkable registration line. Manifests provide above-floor and above-floor-join bounds/clearances plus first/last edge-contact rows.

## Runtime footprint

Five runtime PNGs, 1542795 compressed bytes and 4179772 decoded RGBA bytes before atlas padding. Only these exported files ship as art; masters, prompt and QA composite stay under docs. All five sidecars use the isolated `compact-room-fair` atlas with linear filtering, no compression and `trim=false`. No existing art or old archived evidence was overwritten. Per-PNG hashes, dimensions, alpha bounds, scanlines and bytes are recorded in `import.json`.

## Theme reuse notes

The existing approved oak frame remains suitable for Sailcloth and the post office. The greenhouse stone frame fits the stone terraces, ruins and floral pavilion of garden3/4/5. Garden2 is an oak-tree library, so the greenhouse piers create a modest architectural material contrast; flag this for actual engine review rather than claim it is a literal source match. No additional garden art was generated. New fair art is a proposal: source quality inspection is not user approval or a numeric95% fidelity score.
