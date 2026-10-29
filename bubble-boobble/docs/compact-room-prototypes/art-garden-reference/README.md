# Dewdrop Steps — greenhouse stone frame

New compact-room art proposal for story level 6. The source preview is a generated transparent asset composition, not an engine screenshot. Approval and gameplay verification depend on the coordinator’s actual engine captures.

The entire U-shaped frame was authored together so full left/right piers, capital returns, stepped feet and floor junctions share material scale and light. Sides are separately painted, never mirrored. Visible limestone and bronze greenhouse ribs carry the structure; ivy and roots are concentrated on the left, with a quieter right pier. No repeating vine helix.

## Source and reproduction

Built-in imagegen was used; no API fallback. [PROMPTS.md](PROMPTS.md) records generation IDs, reference roles and prompts. `source-master.png` is the preserved final generated RGBA master. Its SHA-256 is `5efdfc54d747d06f48b1ab15dcc3d6b0b2da185ad20eed243a0105254374c100`.

Run from `bubble-boobble/`:

```sh
swift tools/art/import-compact-room-frames.swift
```

The importer only slices source-coordinate rectangles and repeats the first 32 rows eight times for plain shaft extension above source y0. It never paints, keys or regenerates alpha, never resizes a profile, and never overwrites pre-existing sidecar settings. Full silhouette padding is retained. `source-gray-preview.png` is an asset QA composite on neutral gray.

## Geometry

The measured source canvas is 1672×941. Coordinates are top-left, rectangles are half-open. Source geometry is authoritative; requested prompt anchors were not forced onto generated art.

- Left inner body plane: 310 source px.
- Right inner body plane: 1363 source px.
- Walkable floor: source y777.
- Canonical inner width: 960 world units; apply one uniform source-to-world scale to all pieces.
- Decorative shoulder returns may overhang the body plane behind actors.
- Full-floor sprite replaces the generic floor presentation. These fixed 960-world prototypes use only the full floor; optional end/center exports are preserved outside runtime in `.cache/compact-room-unused-floor-parts/`.

| Asset | Source crop | Size |
| --- | --- | --- |
| `profile-left-garden-reference` | `[0, 0, 350, 891]` | 350×891 |
| `profile-right-garden-reference` | `[1320, 0, 1672, 891]` | 352×891 |
| `shaft-left-garden-reference` | `[0, 0, 350, 256]` | 350×256 |
| `shaft-right-garden-reference` | `[1320, 0, 1672, 256]` | 352×256 |
| `floor-garden-reference` | `[310, 777, 1363, 891]` | 1053×114 |

The manifest records destination rectangles, source bands/repeat counts, per-PNG SHA-256/bytes, actual alpha≥128 bounds, transparent clearance, scanline bounds and solid-pixel counts. Profile and floor crops decode exactly to the generated master RGBA. Every stored shaft band is identical to the other seven, and its alpha is source-exact. Premultiplied/unpremultiplied PNG serialization changes semi-transparent shaft RGB by at most one level per channel for Parcel and two levels for Garden; there is no geometric resampling or visible seam. No percentage fidelity claim is made against the approved lighthouse: this is a new material design.

## Runtime footprint

Five runtime PNGs total 1619591 bytes compressed and 3700944 bytes decoded RGBA before atlas padding. Source masters/previews remain under docs and are not runtime art. All new sidecars use the isolated `compact-room-garden` atlas, linear filtering, no compression and `trim=false`. The coordinator owns episode-scoped loading, draw-call/memory measurement and actual screen-extreme captures.

## Floor-join crop proof

Profile crops intentionally overlap the same generated floor. The visible painted cap begins slightly above the walkable registration line: source y772 on both sides versus floorFeet777. Consequently the inner crop edge is opaque for those cap rows, including a few rows above the gameplay floor anchor. This is a floor junction, not a cropped column shoulder. The manifest records the actual first/last inner-edge solid source rows, truthful `alphaBoundsAboveFloor128`/`alphaClearanceAboveFloor128`, and separate `alphaBoundsAboveFloorJoin128`/`alphaClearanceAboveFloorJoin128` for all rows before the first floor-edge contact. The latter confirms transparent clearance around the complete architectural silhouette above the floor join. Threshold is alpha≥128; coordinates in bounds are local half-open PNG pixels. No pixels were changed for this proof.
