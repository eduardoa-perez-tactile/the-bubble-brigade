# Story room architecture — second art pass

Created 28 October 2026 with built-in `image_gen`, following the user-requested closer match to the original lighthouse, pump-station and tugboat concepts. This adds broad architectural bases, collars and iridescent bubble-film sheen. The first-pass kit and source evidence remain unchanged.

## Import and runtime assets

Run from the engine project directory:

```sh
swift tools/art/import-room-boundaries-v2.swift
```

The importer performs only CoreGraphics rectangular cropping and high-quality downsampling, preserving alpha. It does not paint, key, recolor or remove source art. [import.json](import.json) records source/output SHA-256 hashes, half-open crop rectangles, dimensions and bytes. It writes nine new runtime PNGs in `assets/cartoon/reconstruction/environment/boundaries/`:

| Sprites | Size | Purpose |
|---|---|---|
| `base-{stone,timber,pipe,vegetation}-v2` | 192 × 224 | Broad layered plinth/corbel or machinery buttress at the bottom of each wall. |
| `collar-{stone,timber,pipe,vegetation}-v2` | 192 × 64 | Architectural molding, flange or clamp across the shaft. |
| `bubble-sheen-v2` | 96 × 512 | Straight luminous right edge with outward-curving translucent soap-film highlights. |

Left-wall sprites have their inner collision face at the right image edge and are mirrored for the right wall. Bases and collars are layers on top of the continuous opaque shaft, whose edge remains the collision cue. The membrane's straight right edge has alpha 251–253/255; curved highlights stay to its left, outside gameplay. The source of the curved highlights is genuine-alpha image generation, rather than an opaque colored panel.

These nine images total 607,330 PNG bytes and 1,081,344 RGBA bytes (1.031 MiB), before atlas padding. Sidecars use the existing `cartoon-reconstruction` named atlas with linear sampling, compression none and trim false. The two source masters are documentation, outside the runtime asset tree.

## Generation provenance

Both calls used `transparent_background: true`; the supplied original mockups were style references, not edit targets. Generated masters:

- `architecture-sheet.png`: `exec-3276cdd0-c67e-4bf8-a1f9-72b8e8b2d088`
- `bubble-source.png`: `exec-941bbf3b-63a4-43b6-b217-62bb434085a8`

### Architecture prompt

Use case: stylized-concept. Asset type: 2D fantasy platform game modular architectural boundary art sprite sheet. Input references are STYLE REFERENCES ONLY: match the massive masonry and chunky copper structures shown. Create ONE sprite sheet with EXACTLY EIGHT separated sprites on genuine transparent background: FOUR chunky pillar BASES in the TOP row, FOUR matching broad horizontal pillar COLLARS in the BOTTOM row. Four evenly spaced columns; left to right materials STONE, TIMBER, COPPER PIPE, VEGETATION. Every top-row base has width:height about 6:7, all same size. Every bottom-row collar has width:height about 3:1, same width as corresponding base. Leave large transparent gaps between all sprites, no touching. Bases: heavy short rectangular lower architectural block, not an entire column. STONE is golden lighthouse limestone with broad stepped plinth, layered cornice, dark recessed joints, deeply beveled corners, carved small corbels, no ornament icons. TIMBER is thick warm oak lower post housing with dark iron straps, brass bolts and broad squared foot. COPPER PIPE is a chunky mechanical brass/copper pipe foot housing with inset circular vent, big valve, bolted panels, worn teal patina and layered broad pedestal. VEGETATION is a mossy stone and gnarled trunk lower buttress with leafy vine clusters, bark and sturdy square stone foot. Matching bottom-row COLLARS: stone layered stepped molding; oak and iron clamp band; large riveted brass flange; mossy stone wrap with vine. Style is highly finished painterly fantasy game environment, thick dark outlines, warm lit LEFT front/outer face with deeply shaded RIGHT side/inner face; strong readable structural mass at small scale. Each base/collar must have STRAIGHT vertical rightmost bounding edge, extending full height on base and collar: it is a solid inner face aligned to an invisible wall. No protrusions, loose branches or valves beyond the straight right face; put rich features on the front/left. Objects are asymmetric left-wall modules, will be mirrored for right. Front orthographic 2D view with restrained depth bevel, not isometric, no receding ground. Transparent backgrounds genuinely alpha. No text, labels, numbers, grid lines, characters, platform layout, scenery or cast ground shadows. Landscape sheet 1536x1024 with 4 columns and 2 rows.

### Bubble prompt

Use case: stylized-concept. Asset type: transparent 2D platform game bubble membrane wall sprite, one isolated tall vertical strip. Style reference is the aqua soap-film barrier in screenshot, not an edit target. Create a narrow tall iridescent bubble-film sheen, width:height about 1:5, centered on genuine transparent background. Its RIGHTMOST boundary is a thin continuous perfectly straight luminous aqua-white vertical edge from top to bottom. All other art lies to the LEFT of this straight edge: broad subtle cyan translucent soap-film with four delicate curved crescent highlights and soft iridescent lavender, pale pink and aqua reflection arcs bending outward left. The boundary itself stays straight to match collision geometry; only interior sheen curves. Moderate soft brightness, magical soapy translucency, not lightning, not a laser, not smoke. Fade the outside LEFT edge smoothly to transparency; center mostly transparent so underlying ocean remains visible. Rich polished painterly glints like a giant soap bubble, no little floating round bubbles, no particle trail. No opaque panel/background, no ground, emitter, characters, text, labels or scenery. Continuous strip intended to be vertically stretched in game. Portrait 512x1536 canvas with narrow membrane occupying center, art fully inside canvas.

